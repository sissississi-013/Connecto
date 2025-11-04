import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { cometService } from '@/lib/comet/client'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // For demo purposes, return mock metrics
    // In production, aggregate metrics from Comet ML experiments
    const mockMetrics = {
      messagesSent: 12,
      repliesReceived: 5,
      replyRate: 41.7,
      averageResponseTime: 48,
      dashboardUrl: `https://www.comet.ml/${process.env.COMET_WORKSPACE}/${process.env.COMET_PROJECT_NAME}`,
    }

    return NextResponse.json({ metrics: mockMetrics })
  } catch (error) {
    console.error('Error fetching Comet metrics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch metrics' },
      { status: 500 }
    )
  }
}
