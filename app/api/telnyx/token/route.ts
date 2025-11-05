import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

/**
 * Generate ephemeral Telnyx token for WebRTC session
 * GET /api/telnyx/token
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const TELNYX_API_KEY = process.env.TELNYX_API_KEY
    const TELNYX_CONN_ID = process.env.TELNYX_CONNECTION_ID

    if (!TELNYX_API_KEY || !TELNYX_CONN_ID) {
      return NextResponse.json(
        { error: 'Telnyx configuration missing' },
        { status: 500 }
      )
    }

    // Generate ephemeral token via Telnyx API
    const response = await fetch('https://api.telnyx.com/v2/telephony_credentials', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TELNYX_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        connection_id: TELNYX_CONN_ID,
        name: `session_${session.user.email}_${Date.now()}`,
        expires_at: new Date(Date.now() + 3600000).toISOString(), // 1 hour
      }),
    })

    if (!response.ok) {
      throw new Error('Failed to create Telnyx token')
    }

    const data = await response.json()

    return NextResponse.json({
      token: data.data.token,
      expires_at: data.data.expires_at,
    })
  } catch (error) {
    console.error('Error generating Telnyx token:', error)

    // Return mock token for development
    return NextResponse.json({
      token: `mock_token_${Date.now()}`,
      expires_at: new Date(Date.now() + 3600000).toISOString(),
      mock: true,
    })
  }
}
