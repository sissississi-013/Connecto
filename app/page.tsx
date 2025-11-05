'use client'

import { useSession, signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect } from 'react'
import { Loader2, FileText, ShieldCheck, Sparkles, Waves } from 'lucide-react'

import { UnifiedChatInput } from '@/components/ui/UnifiedChatInput'

const featureHighlights = [
  {
    icon: Waves,
    title: 'Unified conversations',
    description: 'Seamlessly move between typed prompts and Telnyx-powered voice capture without switching interfaces.',
  },
  {
    icon: FileText,
    title: 'Context-rich outreach',
    description: 'Attach resumes or briefs so every introduction has the right supporting detail instantly.',
  },
  {
    icon: ShieldCheck,
    title: 'Trusted follow-through',
    description: 'OpenAI-aligned agents craft precise, secure connections and keep you updated in real time.',
  },
]

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

  const handlePromptSubmit = useCallback(async (value: string) => {
    await new Promise(resolve => setTimeout(resolve, 400))
    return `Consider it done. I\'ll reach out to ${value} and circle back with the next steps.`
  }, [])

  const handleResumeUpload = useCallback(async (file: File) => {
    console.info('Uploaded resume', file.name)
  }, [])

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0A192F]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return (
      <div className="relative min-h-screen overflow-hidden bg-[#0A192F] text-gray-100">
        <div className="pointer-events-none absolute inset-0 bg-navy-gradient opacity-80" />
        <div className="pointer-events-none absolute right-[-12rem] top-1/2 h-[32rem] w-[32rem] -translate-y-1/2 rounded-full bg-blue-500/10 blur-3xl" />

        <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-16 px-6 pb-16 pt-12 md:px-10 lg:px-12">
          <header className="flex flex-col gap-12 pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/20 bg-white/5 text-lg font-semibold text-gray-100">
                  C
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.4em] text-gray-500">Connecto</p>
                  <p className="text-sm text-gray-400">AI networking, evolved</p>
                </div>
              </div>

              <button
                onClick={() => signIn('google', { callbackUrl: '/onboarding' })}
                className="hidden rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-[#071426] transition hover:bg-accent-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 sm:inline-flex"
              >
                Sign in with Google
              </button>
            </div>

            <div className="max-w-3xl space-y-6">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.3em] text-gray-400">
                <Sparkles className="h-3.5 w-3.5 text-blue-300" />
                Real-time intros
              </span>
              <h1 className="text-4xl font-semibold leading-tight md:text-5xl">
                Precision connections, powered by an intelligent voice-first agent.
              </h1>
              <p className="text-lg text-gray-400 md:text-xl">
                Guide your networking with a single prompt. CONNECTO listens, understands, and crafts the right outreach—whether you type, speak, or share supporting documents.
              </p>
              <button
                onClick={() => signIn('google', { callbackUrl: '/onboarding' })}
                className="inline-flex w-full items-center justify-center rounded-lg bg-accent px-4 py-3 text-sm font-semibold text-[#071426] transition hover:bg-accent-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 sm:hidden"
              >
                Sign in with Google
              </button>
            </div>
          </header>

          <main className="flex flex-col gap-16">
            <div className="flex flex-col items-start gap-6">
              <UnifiedChatInput onSubmit={handlePromptSubmit} onUpload={handleResumeUpload} />
              <p className="text-sm text-gray-500">
                Voice recognition uses Telnyx to capture your intent and surface actionable intros instantly.
              </p>
            </div>

            <section className="grid gap-6 md:grid-cols-3">
              {featureHighlights.map(feature => (
                <div
                  key={feature.title}
                  className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-[#112240]/70 p-6 backdrop-blur"
                >
                  <feature.icon className="h-6 w-6 text-blue-300" />
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-gray-100">{feature.title}</h3>
                    <p className="text-sm leading-relaxed text-gray-400">{feature.description}</p>
                  </div>
                </div>
              ))}
            </section>
          </main>

          <footer className="mt-auto border-t border-white/5 pt-6 text-sm text-gray-500">
            <p>
              Powered by Telnyx, MemVerge, ApertureData, and Comet ML—securely orchestrated through OpenAI intelligence.
            </p>
          </footer>
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
