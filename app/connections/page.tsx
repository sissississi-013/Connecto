'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2, ArrowLeft, Send } from 'lucide-react'
import { ConnectionList } from '@/components/connections/ConnectionList'
import { useSelectionStore } from '@/store/useSelectionStore'
import type { ProfileRecord } from '@/types/aperture'

function ConnectionsContent() {
  const { data: session } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const searchId = searchParams.get('searchId')

  const [isLoading, setIsLoading] = useState(true)
  const [results, setResults] = useState<ProfileRecord[]>([])
  const [isGeneratingOutreach, setIsGeneratingOutreach] = useState(false)

  const { selectedIds, clearSelection } = useSelectionStore()

  useEffect(() => {
    loadResults()
  }, [searchId])

  const loadResults = async () => {
    setIsLoading(true)

    try {
      // Load demo data for now
      const response = await fetch('/api/aperture/sync/demo')
      const data = await response.json()

      // Generate insights for each profile
      const profilesWithInsights = data.profiles.map((profile: ProfileRecord) => ({
        ...profile,
        insight: generateMockInsight(profile),
      }))

      setResults(profilesWithInsights)
    } catch (error) {
      console.error('Error loading connections:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const generateMockInsight = (profile: ProfileRecord): string => {
    const insights = [
      `${profile.title} at ${profile.company} - Strong background in ${profile.industry}. Could provide valuable insights.`,
      `Great connection for networking. ${profile.education?.join(' and ')} alumnus with extensive industry experience.`,
      `Key player in the ${profile.industry} space. ${profile.mutualConnections} mutual connections suggest strong relevance.`,
    ]
    return insights[Math.floor(Math.random() * insights.length)]
  }

  const handleGenerateOutreach = async () => {
    if (selectedIds.size === 0) return

    setIsGeneratingOutreach(true)

    try {
      const response = await fetch('/api/outreach/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          connectionIds: Array.from(selectedIds),
        }),
      })

      if (response.ok) {
        const data = await response.json()
        clearSelection()
        alert(`Generated ${data.messages?.length || 0} personalized outreach messages!`)
        router.push('/crm')
      } else {
        alert('Failed to generate outreach messages')
      }
    } catch (error) {
      console.error('Error generating outreach:', error)
      alert('Failed to generate outreach messages')
    } finally {
      setIsGeneratingOutreach(false)
    }
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0A192F]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0A192F] flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-blue-500 mb-4" />
        <p className="text-gray-400">Finding connections...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0A192F]">
      {/* Header */}
      <header className="border-b border-white/10 backdrop-blur-xl bg-white/5 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-white">Connection Results</h1>
              <p className="text-sm text-gray-400">
                {results.length} connections found • {selectedIds.size} selected
              </p>
            </div>
          </div>

          <button
            onClick={handleGenerateOutreach}
            disabled={selectedIds.size === 0 || isGeneratingOutreach}
            className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGeneratingOutreach ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                Connect ({selectedIds.size})
              </>
            )}
          </button>
        </div>
      </header>

      {/* Results */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        {results.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-400 text-lg">No connections found</p>
            <button
              onClick={() => router.push('/dashboard')}
              className="btn-primary mt-4"
            >
              Try Another Search
            </button>
          </div>
        ) : (
          <ConnectionList connections={results} />
        )}
      </main>
    </div>
  )
}

export default function ConnectionsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-[#0A192F]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    }>
      <ConnectionsContent />
    </Suspense>
  )
}
