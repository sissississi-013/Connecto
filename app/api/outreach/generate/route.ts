import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { memvergeService } from '@/lib/memverge/client'
import { apertureDataService } from '@/lib/aperturedata/client'
import { cometService } from '@/lib/comet/client'
import { generateOutreachMessage } from '@/lib/ai/llm'
import type { OutreachMessage } from '@/types'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { connectionIds } = await request.json()

    // Get user profile
    const userProfile = await memvergeService.getUserProfile(session.user.email)
    if (!userProfile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }

    // Default tone (can be customized)
    const tone = userProfile.preferences?.outreachTone || 'professional'

    // Generate messages for each connection
    const messages: OutreachMessage[] = []

    for (const connectionId of connectionIds) {
      // Get connection profile from ApertureData
      const entity = await apertureDataService.getProfile(connectionId)

      if (!entity) {
        console.warn(`Connection ${connectionId} not found`)
        continue
      }

      // Generate personalized message
      const { subject, content } = await generateOutreachMessage({
        recipientProfile: {
          name: entity._properties.name,
          role: entity._properties.role,
          company: entity._properties.company,
          education: entity._properties.education,
        },
        senderProfile: {
          name: userProfile.name,
          currentRole: userProfile.interview?.currentRole,
          resume: userProfile.resume?.content,
          preferences: userProfile.preferences,
        },
        tone,
        context: `Reaching out for networking purposes based on mutual interests and background.`,
        type: 'email',
      })

      // Extract personalization tokens
      const personalizationTokens: { [key: string]: string } = {
        recipientName: entity._properties.name,
        recipientRole: entity._properties.role,
        recipientCompany: entity._properties.company,
        senderName: userProfile.name,
        tone,
      }

      // Create message object
      const message: OutreachMessage = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: userProfile.id,
        connectionId,
        type: 'email',
        subject,
        content,
        personalizationTokens,
        tone,
        status: 'draft',
        createdAt: new Date().toISOString(),
      }

      // Track with Comet ML
      const experimentKey = await cometService.trackOutreachMessage(message)
      message.cometExperimentId = experimentKey

      messages.push(message)

      // Save connection to MemVerge CRM
      await memvergeService.saveConnection({
        id: connectionId,
        userId: userProfile.id,
        name: entity._properties.name,
        role: entity._properties.role,
        company: entity._properties.company,
        location: entity._properties.location,
        education: entity._properties.education,
        mutualConnections: entity._properties.mutualConnections,
        linkedinUrl: entity._properties.linkedinUrl,
        email: entity._properties.email,
        tags: [],
        status: 'pending',
        conversationHistory: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
    }

    return NextResponse.json({
      success: true,
      messageIds: messages.map(m => m.id),
      messages,
    })
  } catch (error) {
    console.error('Error generating outreach:', error)
    return NextResponse.json(
      { error: 'Failed to generate outreach messages' },
      { status: 500 }
    )
  }
}

// Get generated messages
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const messageIds = searchParams.get('ids')?.split(',') || []

    // In production, fetch from database
    // For demo, return mock data based on IDs
    const messages = messageIds.map(id => ({
      id,
      // Mock data - in production, fetch real messages
      subject: 'Introduction and Networking Opportunity',
      content: 'Mock content...',
      status: 'draft',
    }))

    return NextResponse.json({ messages })
  } catch (error) {
    console.error('Error fetching messages:', error)
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    )
  }
}
