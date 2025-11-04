'use client'

import { useState, useEffect, useRef } from 'react'
import { Mic, MicOff, Volume2 } from 'lucide-react'

interface VoiceAgentProps {
  onTranscript: (transcript: string) => void
  prompt?: string
  autoStart?: boolean
}

export function VoiceAgent({ onTranscript, prompt, autoStart = false }: VoiceAgentProps) {
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [error, setError] = useState('')
  const recognitionRef = useRef<any>(null)

  useEffect(() => {
    // Initialize Web Speech API
    if (typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
      recognitionRef.current = new SpeechRecognition()
      recognitionRef.current.continuous = true
      recognitionRef.current.interimResults = true

      recognitionRef.current.onresult = (event: any) => {
        let interimTranscript = ''
        let finalTranscript = ''

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' '
          } else {
            interimTranscript += transcript
          }
        }

        if (finalTranscript) {
          setTranscript(prev => prev + finalTranscript)
          onTranscript(finalTranscript.trim())
        } else {
          setTranscript(interimTranscript)
        }
      }

      recognitionRef.current.onerror = (event: any) => {
        setError(`Speech recognition error: ${event.error}`)
        setIsListening(false)
      }

      recognitionRef.current.onend = () => {
        setIsListening(false)
      }
    } else {
      setError('Speech recognition not supported in this browser')
    }

    if (autoStart) {
      startListening()
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
    }
  }, [])

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      setError('')
      setTranscript('')
      recognitionRef.current.start()
      setIsListening(true)
    }
  }

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
    }
  }

  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      setIsSpeaking(true)
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.onend = () => setIsSpeaking(false)
      window.speechSynthesis.speak(utterance)
    }
  }

  useEffect(() => {
    if (prompt && autoStart) {
      speak(prompt)
    }
  }, [prompt, autoStart])

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Animated Sphere */}
      <div
        className={`relative w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center transition-all duration-300 ${
          isListening ? 'pulse-glow scale-110' : isSpeaking ? 'animate-pulse' : ''
        }`}
      >
        {isSpeaking ? (
          <Volume2 className="w-12 h-12 text-white" />
        ) : isListening ? (
          <Mic className="w-12 h-12 text-white animate-pulse" />
        ) : (
          <MicOff className="w-12 h-12 text-white opacity-50" />
        )}
      </div>

      {/* Controls */}
      <div className="flex gap-4">
        {!isListening ? (
          <button
            onClick={startListening}
            className="btn-primary flex items-center gap-2"
            disabled={!!error}
          >
            <Mic className="w-5 h-5" />
            Start Speaking
          </button>
        ) : (
          <button
            onClick={stopListening}
            className="btn-secondary flex items-center gap-2"
          >
            <MicOff className="w-5 h-5" />
            Stop
          </button>
        )}
      </div>

      {/* Transcript Display */}
      {transcript && (
        <div className="w-full max-w-md p-4 card">
          <p className="text-sm text-navy-300 mb-1">Transcript:</p>
          <p className="text-white">{transcript}</p>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="w-full max-w-md p-4 bg-red-900/20 border border-red-700 rounded-lg">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}
    </div>
  )
}
