import type { ProfileRecord } from '@/types/aperture'
import type { UserProfile } from '@/types/memverge'

/**
 * Generate AI insight for a connection profile
 */
export async function generateProfileInsight(
  profile: ProfileRecord,
  userProfile: UserProfile
): Promise<string> {
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
            content: 'You generate brief, insightful reviews (1-2 sentences) about why a connection could be valuable.',
          },
          {
            role: 'user',
            content: `User: ${userProfile.profile.name}, ${userProfile.profile.role}
Goals: ${userProfile.profile.goals?.join(', ')}

Connection: ${profile.name}, ${profile.title} at ${profile.company}
Education: ${profile.education?.join(', ')}
Location: ${profile.location}

Generate a concise insight about this connection.`,
          },
        ],
        temperature: 0.7,
        max_tokens: 100,
      }),
    })

    if (!response.ok) {
      throw new Error('OpenAI API error')
    }

    const data = await response.json()
    return data.choices[0].message.content.trim()
  } catch (error) {
    console.error('Error generating insight:', error)
    return `${profile.title} at ${profile.company} - Could be a valuable connection in your network.`
  }
}

/**
 * Batch generate insights for multiple profiles
 */
export async function generateBatchInsights(
  profiles: ProfileRecord[],
  userProfile: UserProfile
): Promise<Map<string, string>> {
  const insights = new Map<string, string>()

  // Generate in parallel with rate limiting
  const batchSize = 5
  for (let i = 0; i < profiles.length; i += batchSize) {
    const batch = profiles.slice(i, i + batchSize)
    const results = await Promise.all(
      batch.map(profile => generateProfileInsight(profile, userProfile))
    )

    batch.forEach((profile, idx) => {
      insights.set(profile.id, results[idx])
    })
  }

  return insights
}
