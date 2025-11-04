'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Loader2, Tag, Mail, Calendar, TrendingUp } from 'lucide-react'

interface Connection {
  id: string
  name: string
  role: string
  company: string
  tags: string[]
  status: string
  lastContactedAt?: string
  conversationHistory: any[]
}

export default function CRMPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [connections, setConnections] = useState<Connection[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filterTag, setFilterTag] = useState<string>('')
  const [cometMetrics, setCometMetrics] = useState<any>(null)

  useEffect(() => {
    if (status === 'authenticated') {
      loadConnections()
      loadCometMetrics()
    }
  }, [status])

  const loadConnections = async () => {
    setIsLoading(true)

    try {
      const response = await fetch('/api/crm/connections')
      if (response.ok) {
        const data = await response.json()
        setConnections(data.connections || [])
      }
    } catch (error) {
      console.error('Error loading connections:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadCometMetrics = async () => {
    try {
      const response = await fetch('/api/comet/metrics')
      if (response.ok) {
        const data = await response.json()
        setCometMetrics(data.metrics)
      }
    } catch (error) {
      console.error('Error loading Comet metrics:', error)
    }
  }

  const allTags = Array.from(new Set(connections.flatMap(c => c.tags)))

  const filteredConnections = filterTag
    ? connections.filter(c => c.tags.includes(filterTag))
    : connections

  if (status === 'loading' || isLoading) {
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

  return (
    <div className="min-h-screen bg-navy-950">
      {/* Header */}
      <header className="border-b border-navy-700 bg-navy-900/50 backdrop-blur sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <h1 className="text-2xl font-bold text-white">Connection Management</h1>
          <p className="text-sm text-navy-400">
            {connections.length} total connections
          </p>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Comet ML Dashboard Preview */}
        {cometMetrics && (
          <div className="mb-8 card">
            <div className="flex items-center gap-3 mb-4">
              <TrendingUp className="w-6 h-6 text-blue-500" />
              <h2 className="text-xl font-semibold text-white">Outreach Performance (Comet ML)</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-navy-800 rounded-lg">
                <p className="text-sm text-navy-400 mb-1">Messages Sent</p>
                <p className="text-2xl font-bold text-white">{cometMetrics.messagesSent || 0}</p>
              </div>
              <div className="p-4 bg-navy-800 rounded-lg">
                <p className="text-sm text-navy-400 mb-1">Replies Received</p>
                <p className="text-2xl font-bold text-white">{cometMetrics.repliesReceived || 0}</p>
              </div>
              <div className="p-4 bg-navy-800 rounded-lg">
                <p className="text-sm text-navy-400 mb-1">Reply Rate</p>
                <p className="text-2xl font-bold text-green-500">
                  {cometMetrics.replyRate || 0}%
                </p>
              </div>
            </div>

            <a
              href={cometMetrics.dashboardUrl || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-block text-sm text-blue-400 hover:text-blue-300 transition-colors"
            >
              View Full Dashboard in Comet ML →
            </a>
          </div>
        )}

        {/* Tag Filter */}
        {allTags.length > 0 && (
          <div className="mb-6 flex flex-wrap gap-2">
            <button
              onClick={() => setFilterTag('')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                !filterTag
                  ? 'bg-blue-500 text-white'
                  : 'bg-navy-800 text-navy-300 hover:bg-navy-700'
              }`}
            >
              All
            </button>
            {allTags.map(tag => (
              <button
                key={tag}
                onClick={() => setFilterTag(tag)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  filterTag === tag
                    ? 'bg-blue-500 text-white'
                    : 'bg-navy-800 text-navy-300 hover:bg-navy-700'
                }`}
              >
                #{tag}
              </button>
            ))}
          </div>
        )}

        {/* Connections List */}
        {filteredConnections.length === 0 ? (
          <div className="text-center py-16 card">
            <p className="text-navy-300 text-lg mb-4">No connections yet</p>
            <button
              onClick={() => router.push('/dashboard')}
              className="btn-primary"
            >
              Find Connections
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredConnections.map(connection => (
              <div key={connection.id} className="card hover:bg-navy-800/50 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-lg font-semibold text-white">{connection.name}</h3>
                    <p className="text-navy-300">{connection.role}</p>
                    <p className="text-sm text-navy-400">{connection.company}</p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      connection.status === 'connected'
                        ? 'bg-green-500/20 text-green-400'
                        : connection.status === 'contacted'
                        ? 'bg-blue-500/20 text-blue-400'
                        : 'bg-navy-700 text-navy-300'
                    }`}
                  >
                    {connection.status}
                  </span>
                </div>

                {connection.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {connection.tags.map(tag => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 text-xs text-blue-400 bg-blue-500/10 px-2 py-1 rounded"
                      >
                        <Tag className="w-3 h-3" />
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-4 text-sm text-navy-400">
                  <span className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    {connection.conversationHistory.length} messages
                  </span>
                  {connection.lastContactedAt && (
                    <span className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Last: {new Date(connection.lastContactedAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
