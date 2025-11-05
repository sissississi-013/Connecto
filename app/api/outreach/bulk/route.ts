import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { memvergeService } from '@/lib/memverge/client'
import { generateOutreach } from '@/lib/ai/outreachGenerator'
import { cometService } from '@/lib/comet/client'
import type { ProfileRecord } from '@/types/aperture'

/**
 * Generate bulk outreach for tagged connections
 * POST /api/outreach/bulk
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { tags, message } = await request.json()

    if (!tags || !Array.isArray(tags)) {
      return NextResponse.json({ error: 'Tags array required' }, { status: 400 })
    }

    // Get user profile
    const userProfile = await memvergeService.getUserProfile(session.user.email)
    if (!userProfile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }

    // Get connections with specified tags
    const connections = await memvergeService.getUserConnections(
      userProfile.id,
      { tags }
    )

    if (connections.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No connections found with specified tags',
        count: 0
      })
    }

    // Convert to ProfileRecords for outreach generation
    const profiles: ProfileRecord[] = connections.map(conn => ({
      id: conn.id,
      name: conn.name,
      title: conn.role,
      company: conn.company,
      location: conn.location,
      education: conn.education,
      tags: conn.tags,
      createdAt: conn.createdAt,
    }))

    // Generate outreach messages
    const { messages: outreachMessages } = await generateOutreach({
      userProfile: userProfile as any,
      contacts: profiles,
      tone: userProfile.preferences?.outreachTone || 'professional',
      calendarLink: userProfile.preferences?.calendlyLink,
    })

    // Create Comet experiment for this bulk campaign
    const experimentKey = await cometService.createExperiment({
      name: `bulk_campaign_${tags.join('_')}_${Date.now()}`,
      parameters: {
        tone: userProfile.preferences?.outreachTone || 'professional',
        personalizationLevel: 'high',
        userId: userProfile.id,
      },
    })

    // Save messages to MemVerge
    for (const msg of outreachMessages) {
      await memvergeService.addMessageToConnection(
        userProfile.id,
        msg.contactId,
        {
          type: 'email',
          subject: msg.subject,
          content: msg.body,
        }
      )
    }

    // Log to Comet
    await cometService.logMetric(experimentKey, 'messages_sent', outreachMessages.length)

    return NextResponse.json({
      success: true,
      count: outreachMessages.length,
      experimentKey,
      messages: outreachMessages,
    })
  } catch (error) {
    console.error('Error generating bulk outreach:', error)
    return NextResponse.json(
      { error: 'Failed to generate bulk outreach' },
      { status: 500 }
    )
  }
}
