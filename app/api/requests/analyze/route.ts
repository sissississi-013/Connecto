import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { memvergeService } from '@/lib/memverge/client'
import { analyzeRequest } from '@/lib/ai/requestAnalyzer'

/**
 * Analyze user request and convert to structured search criteria
 * POST /api/requests/analyze
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { prompt } = await request.json()

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt required' }, { status: 400 })
    }

    // Fetch user profile from MemVerge
    const userProfile = await memvergeService.getUserProfile(session.user.email)

    if (!userProfile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }

    // Analyze request with LLM
    const analysis = await analyzeRequest(prompt, userProfile as any)

    // Store latest filters in preferences for future suggestions
    await memvergeService.updateUserProfile(session.user.email, {
      preferences: {
        ...userProfile.preferences,
        lastSearchFilters: analysis,
      },
    })

    return NextResponse.json({
      success: true,
      analysis,
      filters: analysis,
    })
  } catch (error) {
    console.error('Error analyzing request:', error)
    return NextResponse.json(
      { error: 'Failed to analyze request' },
      { status: 500 }
    )
  }
}
