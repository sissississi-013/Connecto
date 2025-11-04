'use client'

import { useSession, signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Loader2 } from 'lucide-react'

export default function Home() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      // Check if user has completed onboarding
      fetch('/api/user/profile')
        .then(res => res.json())
        .then(data => {
          if (data.onboardingCompleted) {
            router.push('/dashboard')
          } else {
            router.push('/onboarding')
          }
        })
        .catch(() => {
          router.push('/onboarding')
        })
    }
  }, [status, session, router])

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-navy-950">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-navy-950">
        <div className="text-center space-y-8 max-w-2xl px-6">
          {/* Logo/Title */}
          <div className="space-y-4">
            <h1 className="text-6xl font-bold gradient-text">CONNECTO</h1>
            <p className="text-2xl text-navy-300">AI-Powered Networking Agent</p>
          </div>

          {/* Description */}
          <p className="text-lg text-navy-400 max-w-xl mx-auto">
            Automate the process of finding, contacting, and managing professional connections.
            Let AI handle your networking while you focus on building relationships.
          </p>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left mt-8">
            <div className="card">
              <h3 className="text-lg font-semibold text-blue-400 mb-2">Voice-Powered</h3>
              <p className="text-sm text-navy-400">Conversational AI onboarding powered by Telnyx</p>
            </div>
            <div className="card">
              <h3 className="text-lg font-semibold text-blue-400 mb-2">Smart Memory</h3>
              <p className="text-sm text-navy-400">Persistent CRM powered by MemVerge</p>
            </div>
            <div className="card">
              <h3 className="text-lg font-semibold text-blue-400 mb-2">Advanced Search</h3>
              <p className="text-sm text-navy-400">Complex queries with ApertureData</p>
            </div>
            <div className="card">
              <h3 className="text-lg font-semibold text-blue-400 mb-2">Optimized Outreach</h3>
              <p className="text-sm text-navy-400">Tracked and improved with Comet ML</p>
            </div>
          </div>

          {/* Sign In Button */}
          <button
            onClick={() => signIn('google', { callbackUrl: '/onboarding' })}
            className="btn-primary text-lg px-8 py-4 mt-8 flex items-center gap-3 mx-auto"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Sign in with Google
          </button>

          {/* Footer */}
          <p className="text-sm text-navy-500 mt-8">
            Powered by Telnyx, MemVerge, ApertureData, and Comet ML
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-navy-950">
      <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
    </div>
  )
}
