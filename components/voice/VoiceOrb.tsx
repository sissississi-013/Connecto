'use client'

import { useEffect, useRef } from 'react'
import { Mic } from 'lucide-react'

interface VoiceOrbProps {
  isActive: boolean
  onTranscript: (transcript: string) => void
  onActiveChange: (active: boolean) => void
  disabled?: boolean
}

export function VoiceOrb({ isActive, onTranscript, onActiveChange, disabled }: VoiceOrbProps) {
  const recognitionRef = useRef<any>(null)

  useEffect(() => {
    // Initialize Web Speech API
    if (typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
      recognitionRef.current = new SpeechRecognition()
      recognitionRef.current.continuous = true
      recognitionRef.current.interimResults = true

      recognitionRef.current.onresult = (event: any) => {
        let finalTranscript = ''

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' '
          }
        }

        if (finalTranscript) {
          onTranscript(finalTranscript.trim())
        }
      }

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error)
        onActiveChange(false)
      }

      recognitionRef.current.onend = () => {
        onActiveChange(false)
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
    }
  }, [onTranscript, onActiveChange])

  const toggleVoice = () => {
    if (!recognitionRef.current) {
      alert('Voice input not supported in this browser')
      return
    }

    if (isActive) {
      recognitionRef.current.stop()
      onActiveChange(false)
    } else {
      recognitionRef.current.start()
      onActiveChange(true)
    }
  }

  return (
    <div className="relative flex-shrink-0">
      {/* Pulsing rings when active */}
      {isActive && (
        <>
          <div className="absolute inset-0 bg-blue-500 rounded-full pulse-ring opacity-75" />
          <div
            className="absolute inset-0 bg-blue-500 rounded-full pulse-ring opacity-50"
            style={{ animationDelay: '0.5s' }}
          />
        </>
      )}

      {/* Main Sphere */}
      <button
        onClick={toggleVoice}
        disabled={disabled}
        className={`
          relative w-12 h-12 rounded-full flex items-center justify-center
          transition-all duration-300 overflow-hidden
          ${isActive
            ? 'bg-gradient-to-br from-blue-500 to-cyan-400 pulse-sphere'
            : 'bg-white/10 hover:bg-white/20'
          }
          disabled:opacity-50 disabled:cursor-not-allowed
        `}
      >
        {/* Gradient overlay */}
        <div className={`
          absolute inset-0 bg-gradient-to-br from-white/30 to-transparent
          ${isActive ? 'opacity-100' : 'opacity-0'}
          transition-opacity duration-300
        `} />

        {/* Icon */}
        <Mic className={`
          w-5 h-5 relative z-10
          ${isActive ? 'text-white' : 'text-gray-300'}
          transition-colors duration-300
        `} />
      </button>
    </div>
  )
}
