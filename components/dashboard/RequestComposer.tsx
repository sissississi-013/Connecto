'use client'

import { useState } from 'react'
import { Send, Loader2 } from 'lucide-react'
import { VoiceOrb } from '../voice/VoiceOrb'

interface RequestComposerProps {
  onSubmit: (prompt: string) => Promise<void>
  isProcessing?: boolean
}

export function RequestComposer({ onSubmit, isProcessing = false }: RequestComposerProps) {
  const [prompt, setPrompt] = useState('')
  const [isVoiceActive, setIsVoiceActive] = useState(false)

  const handleSubmit = async () => {
    if (prompt.trim() && !isProcessing) {
      await onSubmit(prompt.trim())
      setPrompt('')
    }
  }

  const handleVoiceTranscript = (transcript: string) => {
    // Append voice transcript to prompt
    setPrompt(prev => prev + ' ' + transcript)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className="w-full space-y-4">
      {/* Glass Container */}
      <div className="glass rounded-2xl p-1.5 shadow-2xl">
        <div className="flex items-center gap-3 p-3">
          {/* Voice Orb */}
          <VoiceOrb
            isActive={isVoiceActive}
            onTranscript={handleVoiceTranscript}
            onActiveChange={setIsVoiceActive}
            disabled={isProcessing}
          />

          {/* Text Input */}
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask to connect with..."
            disabled={isProcessing}
            className="
              flex-1 bg-transparent border-none outline-none
              text-gray-100 placeholder-gray-500
              text-base
              disabled:opacity-50
            "
          />

          {/* Send Button */}
          <button
            onClick={handleSubmit}
            disabled={!prompt.trim() || isProcessing}
            className="
              p-2.5 rounded-lg
              bg-blue-500 hover:bg-blue-600
              disabled:bg-white/5 disabled:opacity-50
              transition-all duration-200
              disabled:cursor-not-allowed
              shadow-lg hover:shadow-blue-500/50
            "
          >
            {isProcessing ? (
              <Loader2 className="w-5 h-5 text-white animate-spin" />
            ) : (
              <Send className="w-5 h-5 text-white" />
            )}
          </button>
        </div>
      </div>

      {/* Status */}
      {isVoiceActive && (
        <div className="text-center">
          <p className="text-sm text-gray-400 flex items-center justify-center gap-2">
            <span className="inline-block w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
            Listening...
          </p>
        </div>
      )}
    </div>
  )
}
