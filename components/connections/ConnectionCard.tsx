'use client'

import { useSelectionStore } from '@/store/useSelectionStore'
import * as Checkbox from '@radix-ui/react-checkbox'
import { CheckCircle, MapPin, GraduationCap, Users } from 'lucide-react'
import type { ProfileRecord } from '@/types/aperture'

interface ConnectionCardProps {
  connection: ProfileRecord
}

export function ConnectionCard({ connection }: ConnectionCardProps) {
  const { isSelected, toggleSelection } = useSelectionStore()
  const selected = isSelected(connection.id)

  return (
    <div
      className={`
        glass-card p-5 transition-all cursor-pointer
        ${selected ? 'ring-2 ring-blue-500' : ''}
      `}
      onClick={() => toggleSelection(connection.id)}
    >
      <div className="flex gap-4">
        {/* Checkbox */}
        <Checkbox.Root
          checked={selected}
          onCheckedChange={() => toggleSelection(connection.id)}
          onClick={(e) => e.stopPropagation()}
          className="w-6 h-6 rounded border-2 border-white/20 bg-white/5 flex items-center justify-center data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500 flex-shrink-0 mt-1"
        >
          <Checkbox.Indicator>
            <CheckCircle className="w-4 h-4 text-white" />
          </Checkbox.Indicator>
        </Checkbox.Root>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="mb-3">
            <h3 className="text-lg font-semibold text-gray-100">{connection.name}</h3>
            <p className="text-gray-300">{connection.title}</p>
            <p className="text-sm text-gray-400">{connection.company}</p>
          </div>

          {/* Meta Info */}
          <div className="flex flex-wrap gap-3 mb-3 text-sm">
            {connection.location && (
              <span className="flex items-center gap-1 text-gray-400">
                <MapPin className="w-3.5 h-3.5" />
                {connection.location}
              </span>
            )}
            {connection.education && connection.education.length > 0 && (
              <span className="flex items-center gap-1 text-gray-400">
                <GraduationCap className="w-3.5 h-3.5" />
                {connection.education.join(', ')}
              </span>
            )}
            {connection.mutualConnections && connection.mutualConnections > 0 && (
              <span className="flex items-center gap-1 text-blue-400">
                <Users className="w-3.5 h-3.5" />
                {connection.mutualConnections} mutual
              </span>
            )}
          </div>

          {/* AI Insight */}
          {connection.insight && (
            <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <p className="text-sm text-blue-300">
                <span className="font-semibold">AI Insight:</span> {connection.insight}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
