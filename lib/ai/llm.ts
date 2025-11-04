import axios from 'axios'

/**
 * LLM Utilities for AI-powered operations
 * Uses OpenAI API for generating insights, reviews, and outreach messages
 */

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || ''
const OPENAI_BASE_URL = 'https://api.openai.com/v1'

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

/**
 * Generate AI review for a connection profile
 */
export async function generateConnectionReview(
  profile: {
    name: string
    role: string
    company: string
    education?: string[]
    location?: string
  },
  userProfile: {
    careerGoals?: string
    currentRole?: string
    targetIndustries?: string[]
  }
): Promise<string> {
  const messages: LLMMessage[] = [
    {
      role: 'system',
      content: `You are an AI networking assistant. Generate a brief, insightful review (1-2 sentences) about why this connection could be valuable for the user's career goals.`,
    },
    {
      role: 'user',
      content: `User Profile:
- Career Goals: ${userProfile.careerGoals || 'Not specified'}
- Current Role: ${userProfile.currentRole || 'Not specified'}
- Target Industries: ${userProfile.targetIndustries?.join(', ') || 'Not specified'}

Connection Profile:
- Name: ${profile.name}
- Role: ${profile.role}
- Company: ${profile.company}
- Education: ${profile.education?.join(', ') || 'Not specified'}
- Location: ${profile.location || 'Not specified'}

Generate a concise insight about this connection.`,
    },
  ]

  try {
    const response = await axios.post(
      `${OPENAI_BASE_URL}/chat/completions`,
      {
        model: 'gpt-4',
        messages,
        temperature: 0.7,
        max_tokens: 100,
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    )

    return response.data.choices[0].message.content.trim()
  } catch (error) {
    console.error('Error generating connection review:', error)
    return `${profile.role} at ${profile.company} - Could be a valuable connection in your network.`
  }
}

/**
 * Generate personalized outreach message
 */
export async function generateOutreachMessage(options: {
  recipientProfile: {
    name: string
    role: string
    company: string
    education?: string[]
  }
  senderProfile: {
    name: string
    currentRole?: string
    resume?: string
    preferences?: {
      outreachTone?: string
      customTemplate?: string
      calendlyLink?: string
    }
  }
  tone: string
  context: string
  type: 'email' | 'linkedin'
}): Promise<{ subject?: string; content: string }> {
  const { recipientProfile, senderProfile, tone, context, type } = options

  const systemPrompt = senderProfile.preferences?.customTemplate
    ? `You are drafting a ${type} message. Follow this template style: ${senderProfile.preferences.customTemplate}`
    : `You are an expert at crafting professional networking messages. Write in a ${tone} tone.`

  const userPrompt = `Write a ${type} ${type === 'email' ? 'with subject line and body' : 'connection request'} from ${senderProfile.name} to ${recipientProfile.name}.

Sender Information:
- Name: ${senderProfile.name}
- Current Role: ${senderProfile.currentRole || 'Not specified'}
${senderProfile.resume ? `- Background: ${senderProfile.resume.substring(0, 500)}` : ''}

Recipient Information:
- Name: ${recipientProfile.name}
- Role: ${recipientProfile.role}
- Company: ${recipientProfile.company}
${recipientProfile.education ? `- Education: ${recipientProfile.education.join(', ')}` : ''}

Context: ${context}

Requirements:
- Be personalized and reference specific details
- ${type === 'email' ? 'Keep under 150 words' : 'Keep under 300 characters'}
- ${tone === 'student-like' ? 'Sound humble and eager to learn' : tone === 'professional' ? 'Sound polished and experienced' : 'Be friendly and approachable'}
${senderProfile.preferences?.calendlyLink ? `- Include this calendar link: ${senderProfile.preferences.calendlyLink}` : ''}
- Do not use generic templates
${type === 'email' ? '- Provide subject line on first line, then blank line, then body' : ''}
`

  const messages: LLMMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ]

  try {
    const response = await axios.post(
      `${OPENAI_BASE_URL}/chat/completions`,
      {
        model: 'gpt-4',
        messages,
        temperature: 0.8,
        max_tokens: type === 'email' ? 300 : 150,
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    )

    const generated = response.data.choices[0].message.content.trim()

    if (type === 'email') {
      const lines = generated.split('\n')
      const subject = lines[0].replace(/^Subject:\s*/i, '').trim()
      const content = lines.slice(lines[1] === '' ? 2 : 1).join('\n').trim()

      return { subject, content }
    }

    return { content: generated }
  } catch (error) {
    console.error('Error generating outreach message:', error)
    return {
      subject: type === 'email' ? `Introduction from ${senderProfile.name}` : undefined,
      content: `Hi ${recipientProfile.name},\n\nI came across your profile and would love to connect!`,
    }
  }
}

/**
 * Analyze user request and extract criteria
 */
export async function analyzeConnectionRequest(
  request: string,
  userProfile: {
    education?: string[]
    currentRole?: string
    preferences?: any
  }
): Promise<{
  industry?: string[]
  role?: string[]
  company?: string[]
  location?: string[]
  education?: string[]
  keywords?: string[]
}> {
  const messages: LLMMessage[] = [
    {
      role: 'system',
      content: `You are analyzing a networking request. Extract search criteria and return as JSON with fields: industry, role, company, location, education, keywords. Use user context to infer unstated preferences (e.g., "alumni" means their school).`,
    },
    {
      role: 'user',
      content: `User Request: "${request}"

User Context:
- Education: ${userProfile.education?.join(', ') || 'Not specified'}
- Current Role: ${userProfile.currentRole || 'Not specified'}

Extract search criteria as JSON.`,
    },
  ]

  try {
    const response = await axios.post(
      `${OPENAI_BASE_URL}/chat/completions`,
      {
        model: 'gpt-4',
        messages,
        temperature: 0.3,
        max_tokens: 200,
        response_format: { type: 'json_object' },
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    )

    return JSON.parse(response.data.choices[0].message.content)
  } catch (error) {
    console.error('Error analyzing request:', error)
    return { keywords: request.split(' ').filter(w => w.length > 3) }
  }
}
