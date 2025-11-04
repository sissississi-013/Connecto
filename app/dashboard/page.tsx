'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { UnifiedChatInput } from '@/components/ui/UnifiedChatInput'
import { Loader2, Sparkles, Users, TrendingUp, Zap } from 'lucide-react'
import { signOut } from 'next-auth/react'

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isProcessing, setIsProcessing] = useState(false)

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0A192F]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    )
  }

  if (!session) {
    router.push('/')
    return null
  }

  const handleSubmitRequest = async (text: string) => {
    setIsProcessing(true)

    try {
      const response = await fetch('/api/connections/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: text }),
      })

      const data = await response.json()

      if (response.ok) {
        router.push(`/connections?searchId=${data.searchId}`)
      } else {
        alert('Failed to process request')
      }
    } catch (error) {
      console.error('Error submitting request:', error)
      alert('Failed to process request')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleFileUpload = (file: File) => {
    console.log('File uploaded:', file.name)
    // Handle resume upload if needed
  }

  const exampleQueries = [
    {
      icon: Sparkles,
      text: "Connect me with gametech VCs in the Bay Area",
      color: "from-purple-500 to-pink-500"
    },
    {
      icon: Users,
      text: "Find healthcare consultants who went to UC Berkeley",
      color: "from-blue-500 to-cyan-500"
    },
    {
      icon: TrendingUp,
      text: "Connect me with AI researchers at top tech companies",
      color: "from-green-500 to-emerald-500"
    },
    {
      icon: Zap,
      text: "Find startup founders in fintech",
      color: "from-orange-500 to-red-500"
    },
  ]

  return (
    <div className="min-h-screen bg-[#0A192F] relative overflow-hidden">
      {/* Ambient background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-white/10 backdrop-blur-xl bg-white/5">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center">
              <span className="text-white font-bold text-xl">C</span>
            </div>
            <h1 className="text-2xl font-semibold gradient-text">CONNECTO</h1>
          </div>

          <nav className="flex items-center gap-2">
            <button
              onClick={() => router.push('/dashboard')}
              className="px-4 py-2 rounded-lg bg-white/10 text-gray-100 border border-white/20 font-medium"
            >
              Dashboard
            </button>
            <button
              onClick={() => router.push('/connections')}
              className="px-4 py-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-gray-100 transition-all font-medium"
            >
              Connections
            </button>
            <button
              onClick={() => router.push('/crm')}
              className="px-4 py-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-gray-100 transition-all font-medium"
            >
              CRM
            </button>

            {/* User menu */}
            <div className="ml-4 pl-4 border-l border-white/10 flex items-center gap-3">
              {session.user?.image && (
                <img
                  src={session.user.image}
                  alt={session.user.name || ''}
                  className="w-8 h-8 rounded-full ring-2 ring-white/20"
                />
              )}
              <button
                onClick={() => signOut()}
                className="text-sm text-gray-400 hover:text-gray-100 transition-colors"
              >
                Sign Out
              </button>
            </div>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-80px)] px-6 py-12">
        <div className="w-full max-w-5xl space-y-12">
          {/* Hero Section */}
          <div className="text-center space-y-4 mb-8">
            <h2 className="text-5xl md:text-6xl font-bold text-gray-100 tracking-tight">
              Your AI Networking
              <span className="gradient-text"> Agent</span>
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Automate connections, personalize outreach, and grow your network intelligently
            </p>
          </div>

          {/* Unified Chat Input */}
          <div className="relative">
            {/* Glow effect behind input */}
            <div className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-full scale-110 opacity-30" />

            <UnifiedChatInput
              onSubmit={handleSubmitRequest}
              onFileUpload={handleFileUpload}
              placeholder="Ask to connect with..."
              isProcessing={isProcessing}
            />
          </div>

          {/* Example Queries */}
          <div className="space-y-4">
            <p className="text-sm text-gray-500 text-center">Try asking:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {exampleQueries.map((example, i) => (
                <button
                  key={i}
                  onClick={() => handleSubmitRequest(example.text)}
                  disabled={isProcessing}
                  className="glass-card p-4 text-left hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed group"
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg bg-gradient-to-br ${example.color} shrink-0`}>
                      <example.icon className="w-5 h-5 text-white" />
                    </div>
                    <p className="text-sm text-gray-300 group-hover:text-gray-100 transition-colors">
                      {example.text}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Features Section */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-8">
            {[
              {
                title: "Voice AI",
                description: "Powered by Telnyx",
                icon: "🎙️"
              },
              {
                title: "Smart Memory",
                description: "MemVerge CRM",
                icon: "💾"
              },
              {
                title: "Advanced Search",
                description: "ApertureData",
                icon: "🔍"
              },
              {
                title: "LLM Tracking",
                description: "Comet ML",
                icon: "📊"
              }
            ].map((feature, i) => (
              <div key={i} className="glass-card p-4 text-center">
                <div className="text-3xl mb-2">{feature.icon}</div>
                <h3 className="text-sm font-semibold text-gray-200 mb-1">{feature.title}</h3>
                <p className="text-xs text-gray-500">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
