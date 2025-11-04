import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { memvergeService } from '@/lib/memverge/client'
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const resumeFile = formData.get('resume') as File | null
    const answersStr = formData.get('answers') as string
    const answers = JSON.parse(answersStr)

    let resumeContent = ''

    // Store PDF resume metadata (full parsing can be added with proper PDF library)
    if (resumeFile) {
      // For demo purposes, store file metadata
      // In production, integrate with proper PDF parsing service
      resumeContent = `Resume uploaded: ${resumeFile.name} (${resumeFile.size} bytes)`
    }

    // Update user profile in MemVerge
    const updates = {
      onboardingCompleted: true,
      resume: resumeFile ? {
        fileName: resumeFile.name,
        content: resumeContent,
        uploadedAt: new Date().toISOString(),
      } : undefined,
      interview: {
        careerGoals: answers.careerGoals || '',
        currentRole: answers.currentRole || '',
        targetIndustries: answers.targetIndustries || [],
        preferences: answers.preferences || {},
        completedAt: new Date().toISOString(),
      },
    }

    const updatedProfile = await memvergeService.updateUserProfile(
      session.user.email,
      updates
    )

    return NextResponse.json({
      success: true,
      profile: updatedProfile,
    })
  } catch (error) {
    console.error('Error completing onboarding:', error)
    return NextResponse.json(
      { error: 'Failed to complete onboarding' },
      { status: 500 }
    )
  }
}
