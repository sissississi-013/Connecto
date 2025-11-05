import type { ProfileRecord } from '@/types/aperture'
import type { UserProfile } from '@/types/memverge'

interface OutreachArgs {
  userProfile: UserProfile
  contacts: ProfileRecord[]
  tone: string
  calendarLink?: string
  template?: string
}

interface OutreachResult {
  messages: Array<{
    contactId: string
    subject: string
    body: string
  }>
}

/**
 * Generate personalized outreach messages
 */
export async function generateOutreach(args: OutreachArgs): Promise<OutreachResult> {
  const { userProfile, contacts, tone, calendarLink, template } = args
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY || ''

  const messages = await Promise.all(
    contacts.map(async (contact) => {
      try {
        const prompt = buildOutreachPrompt({
          userProfile,
          contact,
          tone,
          calendarLink,
          template,
        })

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4',
            messages: [
              { role: 'system', content: prompt.system },
              { role: 'user', content: prompt.user },
            ],
            temperature: 0.8,
            max_tokens: 300,
          }),
        })

        if (!response.ok) {
          throw new Error('OpenAI API error')
        }

        const data = await response.json()
        const generated = data.choices[0].message.content.trim()

        // Parse subject and body
        const lines = generated.split('\n')
        const subject = lines[0].replace(/^Subject:\s*/i, '').trim()
        const body = lines.slice(lines[1] === '' ? 2 : 1).join('\n').trim()

        return {
          contactId: contact.id,
          subject,
          body,
        }
      } catch (error) {
        console.error(`Error generating outreach for ${contact.id}:`, error)
        return {
          contactId: contact.id,
          subject: `Introduction from ${userProfile.profile.name}`,
          body: `Hi ${contact.name},\n\nI came across your profile and would love to connect!`,
        }
      }
    })
  )

  return { messages }
}

function buildOutreachPrompt(args: {
  userProfile: UserProfile
  contact: ProfileRecord
  tone: string
  calendarLink?: string
  template?: string
}) {
  const { userProfile, contact, tone, calendarLink, template } = args

  const systemPrompt = template
    ? `You are drafting an email. Follow this template style: ${template}`
    : `You are an expert at crafting professional networking messages. Write in a ${tone} tone.`

  const userPrompt = `Write an email from ${userProfile.profile.name} to ${contact.name}.

Sender:
- Name: ${userProfile.profile.name}
- Role: ${userProfile.profile.role}
- Background: ${userProfile.profile.resume?.text?.substring(0, 300) || 'Not provided'}
- Goals: ${userProfile.profile.goals?.join(', ')}

Recipient:
- Name: ${contact.name}
- Title: ${contact.title}
- Company: ${contact.company}
- Education: ${contact.education?.join(', ')}

Requirements:
- Be personalized and reference specific details
- Keep under 150 words
- ${tone === 'student-like' ? 'Sound humble and eager to learn' : 'Be professional and confident'}
${calendarLink ? `- Include this calendar link: ${calendarLink}` : ''}
- Do not use generic templates
- Format: Subject line on first line, blank line, then body
`

  return {
    system: systemPrompt,
    user: userPrompt,
  }
}
