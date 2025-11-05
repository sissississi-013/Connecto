import type { ProfileFilters } from '@/types/aperture'
import type { UserProfile } from '@/types/memverge'

/**
 * Analyzes user request and converts to structured search criteria
 * Uses OpenAI to interpret intent
 */
export async function analyzeRequest(
  prompt: string,
  userProfile: UserProfile
): Promise<ProfileFilters> {
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY || ''

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are analyzing a networking request. Extract search criteria and return as JSON with fields: industries, locations, education, seniority, keywords.

User context:
- Name: ${userProfile.profile.name}
- Role: ${userProfile.profile.role || 'Not specified'}
- Education: ${userProfile.profile.resume?.text?.match(/University|College|School/gi)?.join(', ') || 'Not specified'}
- Goals: ${userProfile.profile.goals?.join(', ') || 'Not specified'}

When user mentions "alumni" or "school", infer their education from the context.`,
          },
          {
            role: 'user',
            content: `Analyze this request: "${prompt}"`,
          },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3,
        max_tokens: 300,
      }),
    })

    if (!response.ok) {
      throw new Error('OpenAI API error')
    }

    const data = await response.json()
    const analysis = JSON.parse(data.choices[0].message.content)

    return {
      industries: analysis.industries || [],
      locations: analysis.locations || [],
      education: analysis.education || [],
      seniority: analysis.seniority || [],
      keywords: analysis.keywords || [],
    }
  } catch (error) {
    console.error('Error analyzing request:', error)

    // Fallback: simple keyword extraction
    return {
      keywords: prompt.split(' ').filter(w => w.length > 3),
    }
  }
}

/**
 * Build ApertureData SQL query from filters
 */
export function buildApertureQuery(filters: ProfileFilters): string {
  const conditions: string[] = []

  if (filters.industries && filters.industries.length > 0) {
    conditions.push(`industry IN (${filters.industries.map(i => `'${i}'`).join(', ')})`)
  }

  if (filters.locations && filters.locations.length > 0) {
    conditions.push(`location IN (${filters.locations.map(l => `'${l}'`).join(', ')})`)
  }

  if (filters.education && filters.education.length > 0) {
    conditions.push(`education && ARRAY[${filters.education.map(e => `'${e}'`).join(', ')}]`)
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

  return `
    SELECT id, name, title, company, location, education, mutualConnections, sourceUrl
    FROM profiles
    ${whereClause}
    LIMIT 25
  `
}
