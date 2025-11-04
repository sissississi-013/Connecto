'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2, CheckCircle, ArrowLeft, Send } from 'lucide-react'
import * as Checkbox from '@radix-ui/react-checkbox'

interface Connection {
  id: string
  name: string
  role: string
  company: string
  location?: string
  education?: string[]
  mutualConnections?: number
  linkedinUrl?: string
  aiReview?: string
}

function ConnectionsContent() {
  const { data: session } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const searchId = searchParams.get('searchId')

  const [isLoading, setIsLoading] = useState(true)
  const [results, setResults] = useState<Connection[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isGeneratingOutreach, setIsGeneratingOutreach] = useState(false)

  useEffect(() => {
    if (!searchId) {
      // No search ID, show empty state
      setIsLoading(false)
      return
    }

    // In a real app, fetch search results by ID
    // For demo, we'll use mock data
    loadMockResults()
  }, [searchId])

  const loadMockResults = async () => {
    setIsLoading(true)

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500))

    const mockResults: Connection[] = [
      {
        id: 'conn_1',
        name: 'Sarah Chen',
        role: 'Senior Investment Analyst',
        company: 'Andreessen Horowitz',
        location: 'Bay Area, CA',
        education: ['Stanford University', 'MBA'],
        mutualConnections: 5,
        linkedinUrl: 'https://linkedin.com/in/sarahchen',
        aiReview: 'Strong background in gametech investments. Could provide valuable insights into fundraising and market trends.',
      },
      {
        id: 'conn_2',
        name: 'Michael Rodriguez',
        role: 'Partner',
        company: 'Galaxy Interactive',
        location: 'San Francisco, CA',
        education: ['UC Berkeley', 'Computer Science'],
        mutualConnections: 3,
        linkedinUrl: 'https://linkedin.com/in/mrodriguez',
        aiReview: 'UC Berkeley alumnus with deep expertise in gaming and interactive media. Great for networking and advice.',
      },
      {
        id: 'conn_3',
        name: 'Emily Watson',
        role: 'Investment Manager',
        company: 'Bitkraft Ventures',
        location: 'Los Angeles, CA',
        education: ['MIT', 'Business'],
        mutualConnections: 2,
        linkedinUrl: 'https://linkedin.com/in/emilywatson',
        aiReview: 'Focuses on early-stage gametech companies. Could be interested in innovative gaming startups.',
      },
    ]

    setResults(mockResults)
    setIsLoading(false)
  }

  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedIds)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedIds(newSelected)
  }

  const selectAll = () => {
    if (selectedIds.size === results.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(results.map(r => r.id)))
    }
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
        router.push(`/outreach?messageIds=${data.messageIds.join(',')}`)
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
      <div className="flex items-center justify-center min-h-screen bg-navy-950">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-navy-950 flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-blue-500 mb-4" />
        <p className="text-navy-300">Finding connections...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-navy-950">
      {/* Header */}
      <header className="border-b border-navy-700 bg-navy-900/50 backdrop-blur sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="text-navy-300 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-white">Connection Results</h1>
              <p className="text-sm text-navy-400">
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
            <p className="text-navy-300 text-lg">No connections found</p>
            <button
              onClick={() => router.push('/dashboard')}
              className="btn-primary mt-4"
            >
              Try Another Search
            </button>
          </div>
        ) : (
          <>
            {/* Select All Button */}
            <div className="mb-6 flex items-center gap-4">
              <button
                onClick={selectAll}
                className="btn-secondary text-sm"
              >
                {selectedIds.size === results.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>

            {/* Connection Cards */}
            <div className="space-y-4">
              {results.map((connection) => (
                <div key={connection.id} className="card hover:bg-navy-800/50 transition-colors">
                  <div className="flex gap-4">
                    {/* Checkbox */}
                    <Checkbox.Root
                      checked={selectedIds.has(connection.id)}
                      onCheckedChange={() => toggleSelection(connection.id)}
                      className="w-6 h-6 rounded border-2 border-navy-600 bg-navy-800 flex items-center justify-center data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500 flex-shrink-0"
                    >
                      <Checkbox.Indicator>
                        <CheckCircle className="w-4 h-4 text-white" />
                      </Checkbox.Indicator>
                    </Checkbox.Root>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div>
                          <h3 className="text-lg font-semibold text-white">{connection.name}</h3>
                          <p className="text-navy-300">{connection.role}</p>
                          <p className="text-sm text-navy-400">{connection.company}</p>
                        </div>
                        {connection.mutualConnections && connection.mutualConnections > 0 && (
                          <span className="text-xs text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full flex-shrink-0">
                            {connection.mutualConnections} mutual
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-2 mb-3">
                        {connection.location && (
                          <span className="text-xs text-navy-400 bg-navy-800 px-2 py-1 rounded">
                            {connection.location}
                          </span>
                        )}
                        {connection.education?.map((edu, i) => (
                          <span key={i} className="text-xs text-navy-400 bg-navy-800 px-2 py-1 rounded">
                            {edu}
                          </span>
                        ))}
                      </div>

                      {connection.aiReview && (
                        <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                          <p className="text-sm text-blue-300">
                            <span className="font-semibold">AI Insight:</span> {connection.aiReview}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  )
}

export default function ConnectionsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-navy-950">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    }>
      <ConnectionsContent />
    </Suspense>
  )
}
