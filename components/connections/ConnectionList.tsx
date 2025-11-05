'use client'

import { ConnectionCard } from './ConnectionCard'
import { useSelectionStore } from '@/store/useSelectionStore'
import type { ProfileRecord } from '@/types/aperture'

interface ConnectionListProps {
  connections: ProfileRecord[]
}

export function ConnectionList({ connections }: ConnectionListProps) {
  const { selectedIds, selectAll } = useSelectionStore()

  const allIds = connections.map(c => c.id)
  const allSelected = allIds.length > 0 && allIds.every(id => selectedIds.has(id))

  return (
    <div className="space-y-4">
      {/* Select All Button */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-400">
          {selectedIds.size} of {connections.length} selected
        </p>
        <button
          onClick={() => selectAll(allIds)}
          className="btn-glass text-sm px-4 py-2"
        >
          {allSelected ? 'Deselect All' : 'Select All'}
        </button>
      </div>

      {/* Connection Cards */}
      <div className="space-y-3">
        {connections.map((connection) => (
          <ConnectionCard key={connection.id} connection={connection} />
        ))}
      </div>
    </div>
  )
}
