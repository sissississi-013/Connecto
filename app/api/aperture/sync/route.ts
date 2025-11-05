import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { apertureDataService } from '@/lib/aperturedata/client'
import type { ProfileRecord } from '@/types/aperture'

/**
 * Sync scraped profiles to ApertureData
 * POST /api/aperture/sync
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { profiles } = await request.json() as { profiles: ProfileRecord[] }

    if (!profiles || !Array.isArray(profiles)) {
      return NextResponse.json({ error: 'Invalid profiles array' }, { status: 400 })
    }

    // Store profiles in ApertureData
    const ids = await Promise.all(
      profiles.map(profile => apertureDataService.storeProfile(profile))
    )

    return NextResponse.json({
      success: true,
      profileIds: ids,
      count: ids.length,
    })
  } catch (error) {
    console.error('Error syncing profiles:', error)
    return NextResponse.json(
      { error: 'Failed to sync profiles' },
      { status: 500 }
    )
  }
}

/**
 * Get demo data for seeding
 * GET /api/aperture/sync/demo
 */
export async function GET(request: NextRequest) {
  // Return hackathon host demo data
  const demoProfiles: ProfileRecord[] = [
    {
      id: 'host_001',
      name: 'Sarah Chen',
      title: 'Senior Developer Advocate',
      company: 'Telnyx',
      location: 'San Francisco, CA',
      education: ['Stanford University'],
      tags: ['hackathon', 'host', 'sponsor'],
      mutualConnections: 3,
      sourceUrl: 'https://linkedin.com/in/sarahchen',
      industry: 'Technology',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'host_002',
      name: 'Michael Rodriguez',
      title: 'Head of Product',
      company: 'MemVerge',
      location: 'San Jose, CA',
      education: ['UC Berkeley', 'Stanford GSB'],
      tags: ['hackathon', 'host', 'sponsor'],
      mutualConnections: 5,
      sourceUrl: 'https://linkedin.com/in/mrodriguez',
      industry: 'Technology',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'host_003',
      name: 'Emily Watson',
      title: 'Solutions Architect',
      company: 'ApertureData',
      location: 'Palo Alto, CA',
      education: ['MIT'],
      tags: ['hackathon', 'host', 'sponsor'],
      mutualConnections: 2,
      sourceUrl: 'https://linkedin.com/in/emilywatson',
      industry: 'Technology',
      createdAt: new Date().toISOString(),
    },
  ]

  return NextResponse.json({ profiles: demoProfiles })
}
