'use client'

import { useSession, signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Loader2, Sparkles, Zap, Shield, BarChart3 } from 'lucide-react'

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
      <div className="flex items-center justify-center min-h-screen bg-[#0A192F]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen bg-[#0A192F] relative overflow-hidden">
        {/* Ambient background effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 py-12">
          <div className="text-center space-y-12 max-w-5xl mx-auto">
            {/* Logo/Title */}
            <div className="space-y-6">
              <div className="inline-block p-4 glass rounded-3xl mb-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center">
                  <span className="text-white font-bold text-3xl">C</span>
                </div>
              </div>

              <h1 className="text-6xl md:text-7xl font-bold tracking-tight">
                <span className="gradient-text">CONNECTO</span>
              </h1>
              <p className="text-2xl md:text-3xl text-gray-400 font-light">
                AI-Powered Networking Agent
              </p>
            </div>

            {/* Description */}
            <p className="text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
              Automate the process of finding, contacting, and managing professional connections.
              Let AI handle your networking while you focus on building relationships.
            </p>

            {/* Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
              {[
                {
                  icon: Sparkles,
                  title: "Voice-Powered",
                  description: "Conversational AI with Telnyx",
                  gradient: "from-purple-500 to-pink-500"
                },
                {
                  icon: Shield,
                  title: "Smart Memory",
                  description: "Persistent CRM with MemVerge",
                  gradient: "from-blue-500 to-cyan-500"
                },
                {
                  icon: Zap,
                  title: "Advanced Search",
                  description: "Complex queries via ApertureData",
                  gradient: "from-green-500 to-emerald-500"
                },
                {
                  icon: BarChart3,
                  title: "Optimized Outreach",
                  description: "Tracked with Comet ML",
                  gradient: "from-orange-500 to-red-500"
                }
              ].map((feature, i) => (
                <div key={i} className="glass-card p-6">
                  <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${feature.gradient} mb-4`}>
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-100 mb-2">{feature.title}</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">{feature.description}</p>
                </div>
              ))}
            </div>

            {/* CTA Button */}
            <div className="pt-8">
              <button
                onClick={() => signIn('google', { callbackUrl: '/onboarding' })}
                className="group relative inline-flex items-center gap-3 px-8 py-4 text-lg font-medium"
              >
                {/* Glass background */}
                <div className="absolute inset-0 glass rounded-2xl transition-all group-hover:scale-105" />

                {/* Button content */}
                <div className="relative flex items-center gap-3">
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
                  <span className="text-gray-100">Sign in with Google</span>
                </div>

                {/* Glow effect */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/20 to-cyan-500/20 opacity-0 group-hover:opacity-100 transition-opacity blur-xl" />
              </button>
            </div>

            {/* Footer */}
            <div className="pt-12">
              <p className="text-sm text-gray-500">
                Powered by <span className="text-gray-400">Telnyx</span>, <span className="text-gray-400">MemVerge</span>, <span className="text-gray-400">ApertureData</span>, and <span className="text-gray-400">Comet ML</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#0A192F]">
      <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
    </div>
  )
}
