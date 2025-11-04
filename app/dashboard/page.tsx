'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { VoiceAgent } from '@/components/voice/VoiceAgent'
import { Mic, Send, Loader2, Menu, LogOut } from 'lucide-react'
import { signOut } from 'next-auth/react'

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [inputMode, setInputMode] = useState<'text' | 'voice'>('text')
  const [request, setRequest] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [showSidebar, setShowSidebar] = useState(false)

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-navy-950">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    )
  }

  if (!session) {
    router.push('/')
    return null
  }

  const handleSubmitRequest = async () => {
    if (!request.trim() || isProcessing) return

    setIsProcessing(true)

    try {
      const response = await fetch('/api/connections/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: request }),
      })

      const data = await response.json()

      if (response.ok) {
        // Store search ID and redirect to results
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

  const handleVoiceTranscript = (transcript: string) => {
    setRequest(prev => prev + ' ' + transcript)
  }

  return (
    <div className="flex h-screen bg-navy-950">
      {/* Sidebar */}
      <div
        className={`
          fixed lg:static inset-y-0 left-0 z-50
          w-64 bg-navy-900 border-r border-navy-700
          transform transition-transform duration-200
          ${showSidebar ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="flex flex-col h-full p-4">
          {/* Logo */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold gradient-text">CONNECTO</h2>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-2">
            <button
              onClick={() => router.push('/dashboard')}
              className="w-full text-left px-4 py-2 rounded-lg bg-navy-800 text-white"
            >
              Dashboard
            </button>
            <button
              onClick={() => router.push('/connections')}
              className="w-full text-left px-4 py-2 rounded-lg hover:bg-navy-800 text-navy-300 hover:text-white transition-colors"
            >
              Connections
            </button>
            <button
              onClick={() => router.push('/crm')}
              className="w-full text-left px-4 py-2 rounded-lg hover:bg-navy-800 text-navy-300 hover:text-white transition-colors"
            >
              CRM
            </button>
          </nav>

          {/* User Info */}
          <div className="border-t border-navy-700 pt-4 space-y-2">
            <div className="flex items-center gap-3 px-4 py-2">
              {session.user?.image && (
                <img
                  src={session.user.image}
                  alt={session.user.name || ''}
                  className="w-8 h-8 rounded-full"
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white truncate">{session.user?.name}</p>
                <p className="text-xs text-navy-400 truncate">{session.user?.email}</p>
              </div>
            </div>
            <button
              onClick={() => signOut()}
              className="w-full flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-navy-800 text-navy-400 hover:text-red-400 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="lg:hidden flex items-center gap-4 p-4 border-b border-navy-700">
          <button
            onClick={() => setShowSidebar(!showSidebar)}
            className="text-navy-300 hover:text-white"
          >
            <Menu className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold gradient-text">CONNECTO</h1>
        </header>

        {/* Main Area */}
        <main className="flex-1 flex flex-col items-center justify-center p-6 overflow-auto">
          <div className="w-full max-w-4xl space-y-8">
            {/* Voice Agent (when in voice mode) */}
            {inputMode === 'voice' && (
              <div className="flex justify-center">
                <VoiceAgent
                  onTranscript={handleVoiceTranscript}
                  prompt="How can I help you with networking today?"
                />
              </div>
            )}

            {/* Welcome Message */}
            <div className="text-center space-y-4">
              <h1 className="text-4xl font-bold text-white">
                What would you like to do today?
              </h1>
              <p className="text-navy-400 text-lg">
                Type or speak your networking request
              </p>
            </div>

            {/* Examples */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                'Connect me with gametech VCs in the Bay Area',
                'Find healthcare consultants who went to UC Berkeley',
                'Connect me with the hosts of this hackathon',
                'Find AI researchers at top tech companies',
              ].map((example, i) => (
                <button
                  key={i}
                  onClick={() => setRequest(example)}
                  className="card text-left hover:bg-navy-800 transition-colors"
                >
                  <p className="text-sm text-navy-300">{example}</p>
                </button>
              ))}
            </div>

            {/* Input Area */}
            <div className="card">
              <div className="flex gap-2">
                <button
                  onClick={() => setInputMode(inputMode === 'text' ? 'voice' : 'text')}
                  className={`p-3 rounded-lg transition-colors ${
                    inputMode === 'voice'
                      ? 'bg-blue-500 text-white'
                      : 'bg-navy-800 text-navy-300 hover:text-white'
                  }`}
                >
                  <Mic className="w-5 h-5" />
                </button>

                <input
                  type="text"
                  value={request}
                  onChange={(e) => setRequest(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSubmitRequest()}
                  placeholder="e.g., Connect me with gametech VCs in the Bay Area..."
                  className="flex-1 input-primary"
                  disabled={isProcessing}
                />

                <button
                  onClick={handleSubmitRequest}
                  disabled={!request.trim() || isProcessing}
                  className="btn-primary px-6 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Sponsor Badges */}
            <div className="flex flex-wrap items-center justify-center gap-6 pt-8 text-sm text-navy-500">
              <span>Powered by:</span>
              <span className="text-navy-400">Telnyx</span>
              <span className="text-navy-400">MemVerge</span>
              <span className="text-navy-400">ApertureData</span>
              <span className="text-navy-400">Comet ML</span>
            </div>
          </div>
        </main>
      </div>

      {/* Sidebar Overlay (mobile) */}
      {showSidebar && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setShowSidebar(false)}
        />
      )}
    </div>
  )
}
