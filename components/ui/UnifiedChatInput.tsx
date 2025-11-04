'use client'

import { useState, useRef, useEffect } from 'react'
import { Mic, Paperclip, Send, Loader2 } from 'lucide-react'

interface UnifiedChatInputProps {
  onSubmit: (text: string) => void
  onVoiceStart?: () => void
  onVoiceEnd?: () => void
  onFileUpload?: (file: File) => void
  placeholder?: string
  isProcessing?: boolean
}

export function UnifiedChatInput({
  onSubmit,
  onVoiceStart,
  onVoiceEnd,
  onFileUpload,
  placeholder = "Ask to connect with...",
  isProcessing = false,
}: UnifiedChatInputProps) {
  const [input, setInput] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const recognitionRef = useRef<any>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

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
          setInput(prev => prev + finalTranscript)
        }
      }

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error)
        setIsListening(false)
        setIsSpeaking(false)
      }

      recognitionRef.current.onend = () => {
        setIsListening(false)
        setIsSpeaking(false)
        onVoiceEnd?.()
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
    }
  }, [onVoiceEnd])

  const toggleVoice = () => {
    if (!recognitionRef.current) {
      alert('Voice input not supported in this browser')
      return
    }

    if (isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
      setIsSpeaking(false)
      onVoiceEnd?.()
    } else {
      recognitionRef.current.start()
      setIsListening(true)
      setIsSpeaking(true)
      onVoiceStart?.()
    }
  }

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault()
    if (input.trim() && !isProcessing) {
      onSubmit(input.trim())
      setInput('')
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const handleFileClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && onFileUpload) {
      onFileUpload(file)
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Glass Container */}
      <div className="glass rounded-2xl p-1.5 shadow-2xl">
        <div className="flex items-center gap-3 p-3">
          {/* Left: Voice Sphere */}
          <div className="relative flex-shrink-0">
            {/* Pulsing rings when active */}
            {(isListening || isSpeaking) && (
              <>
                <div className="absolute inset-0 bg-blue-500 rounded-full pulse-ring opacity-75" />
                <div className="absolute inset-0 bg-blue-500 rounded-full pulse-ring opacity-50" style={{ animationDelay: '0.5s' }} />
              </>
            )}

            {/* Main Sphere */}
            <button
              onClick={toggleVoice}
              disabled={isProcessing}
              className={`
                relative w-12 h-12 rounded-full flex items-center justify-center
                transition-all duration-300 overflow-hidden
                ${isListening || isSpeaking
                  ? 'bg-gradient-to-br from-blue-500 to-cyan-400 pulse-sphere'
                  : 'bg-white/10 hover:bg-white/20'
                }
                disabled:opacity-50 disabled:cursor-not-allowed
              `}
            >
              {/* Gradient overlay for depth */}
              <div className={`
                absolute inset-0 bg-gradient-to-br from-white/30 to-transparent
                ${isListening || isSpeaking ? 'opacity-100' : 'opacity-0'}
                transition-opacity duration-300
              `} />

              {/* Icon */}
              <Mic className={`
                w-5 h-5 relative z-10
                ${isListening || isSpeaking ? 'text-white' : 'text-gray-300'}
                transition-colors duration-300
              `} />
            </button>
          </div>

          {/* Center: Text Input */}
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            disabled={isProcessing}
            className="
              flex-1 bg-transparent border-none outline-none
              text-gray-100 placeholder-gray-500
              text-base
              disabled:opacity-50
            "
          />

          {/* Right: Action Icons */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Paperclip - File Upload */}
            <button
              onClick={handleFileClick}
              disabled={isProcessing}
              className="
                p-2.5 rounded-lg
                bg-white/5 hover:bg-white/10
                border border-white/10 hover:border-white/20
                transition-all duration-200
                disabled:opacity-50 disabled:cursor-not-allowed
              "
            >
              <Paperclip className="w-5 h-5 text-gray-300" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              className="hidden"
            />

            {/* Send Button */}
            <button
              onClick={() => handleSubmit()}
              disabled={!input.trim() || isProcessing}
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
      </div>

      {/* Status indicator */}
      {isListening && (
        <div className="mt-3 text-center">
          <p className="text-sm text-gray-400 flex items-center justify-center gap-2">
            <span className="inline-block w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
            Listening...
          </p>
        </div>
      )}
    </div>
  )
}
