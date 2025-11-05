'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Loader2, Mic, MicOff, Paperclip, Send } from 'lucide-react'

export interface UnifiedChatInputProps {
  placeholder?: string
  initialValue?: string
  onSubmit?: (message: string) => Promise<string | void> | string | void
  onUpload?: (file: File) => Promise<void> | void
}

type SpeechRecognitionConstructor = new () => SpeechRecognition

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor
    webkitSpeechRecognition?: SpeechRecognitionConstructor
  }
}

export function UnifiedChatInput({
  placeholder = 'Ask to connect with...',
  initialValue = '',
  onSubmit,
  onUpload,
}: UnifiedChatInputProps) {
  const [message, setMessage] = useState(initialValue)
  const [uploadName, setUploadName] = useState<string | null>(null)
  const [isListening, setIsListening] = useState(false)
  const [isAgentSpeaking, setIsAgentSpeaking] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [voiceError, setVoiceError] = useState<string | null>(null)
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const textAreaRef = useRef<HTMLTextAreaElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const baseVoiceTextRef = useRef(initialValue.trim())

  const hasMessage = message.trim().length > 0
  const isSphereActive = isListening || isAgentSpeaking

  useEffect(() => {
    if (textAreaRef.current) {
      textAreaRef.current.style.height = 'auto'
      textAreaRef.current.style.height = `${textAreaRef.current.scrollHeight}px`
    }
  }, [message])

  const attachSpeechRecognition = useCallback(() => {
    if (typeof window === 'undefined') return null

    const speechRecognitionCtor =
      (window.SpeechRecognition as SpeechRecognitionConstructor | undefined) ??
      window.webkitSpeechRecognition

    if (!speechRecognitionCtor) {
      setVoiceError('Voice capture requires a browser with Speech Recognition support.')
      return null
    }

    const recognition = new speechRecognitionCtor()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'

    recognition.onresult = event => {
      let interimTranscript = ''
      let finalTranscript = ''

      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i]
        const transcript = result[0]?.transcript ?? ''
        if (result.isFinal) {
          finalTranscript += transcript
        } else {
          interimTranscript += transcript
        }
      }

      if (finalTranscript.trim()) {
        const appended = baseVoiceTextRef.current
          ? `${baseVoiceTextRef.current.trim()} ${finalTranscript.trim()}`.trim()
          : finalTranscript.trim()

        baseVoiceTextRef.current = appended
        setMessage(appended)
        return
      }

      if (interimTranscript.trim()) {
        const composed = baseVoiceTextRef.current
          ? `${baseVoiceTextRef.current.trim()} ${interimTranscript.trim()}`.trim()
          : interimTranscript.trim()
        setMessage(composed)
      }
    }

    recognition.onerror = event => {
      setVoiceError(`Voice input error: ${event.error}`)
      setIsListening(false)
    }

    recognition.onend = () => {
      setIsListening(false)
      setMessage(baseVoiceTextRef.current)
    }

    return recognition
  }, [])

  useEffect(() => {
    recognitionRef.current = attachSpeechRecognition()
    return () => {
      recognitionRef.current?.stop()
    }
  }, [attachSpeechRecognition])

  const startListening = useCallback(() => {
    if (!recognitionRef.current) {
      recognitionRef.current = attachSpeechRecognition()
    }

    if (!recognitionRef.current) {
      return
    }

    setVoiceError(null)
    baseVoiceTextRef.current = message.trim()
    recognitionRef.current.start()
    setIsListening(true)
  }, [attachSpeechRecognition, message])

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop()
    setIsListening(false)
    setMessage(baseVoiceTextRef.current)
  }, [])

  useEffect(() => {
    if (!isListening) {
      baseVoiceTextRef.current = message
    }
  }, [isListening, message])

  const speakAgentResponse = useCallback((text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return
    }

    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    setIsAgentSpeaking(true)

    utterance.onend = () => setIsAgentSpeaking(false)
    utterance.onerror = () => setIsAgentSpeaking(false)

    window.speechSynthesis.speak(utterance)
  }, [])

  const handleSubmit = useCallback(async () => {
    const value = message.trim()
    if (!value) {
      return
    }

    setIsSubmitting(true)
    try {
      const response = await onSubmit?.(value)
      const fallback = 'Understood. I\'ll reach out and keep you posted.'
      const spokenText = typeof response === 'string' && response.trim() ? response : fallback

      speakAgentResponse(spokenText)
    } finally {
      setIsSubmitting(false)
      setMessage('')
      baseVoiceTextRef.current = ''
    }
  }, [message, onSubmit, speakAgentResponse])

  const handleFormSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    handleSubmit()
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      handleSubmit()
    }
  }

  const handleMicClick = () => {
    if (isListening) {
      stopListening()
    } else {
      startListening()
    }
  }

  const handleFileSelection = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (file.type !== 'application/pdf') {
      setVoiceError('Please upload PDF resumes only.')
      return
    }

    setVoiceError(null)
    setUploadName(file.name)
    await onUpload?.(file)
    event.target.value = ''
  }

  const statusMessage = useMemo(() => {
    if (voiceError) return voiceError
    if (isListening) return 'Telnyx agent is listening…'
    if (isAgentSpeaking) return 'Agent is responding…'
    if (isSubmitting) return 'Sending your request…'
    if (uploadName) return `Attached: ${uploadName}`
    return 'Type, speak, or attach a resume to begin.'
  }, [isAgentSpeaking, isListening, isSubmitting, uploadName, voiceError])

  return (
    <form
      onSubmit={handleFormSubmit}
      className="w-full max-w-3xl"
    >
      <div className="relative isolate flex w-full items-end gap-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-4 shadow-subtle-ring backdrop-blur">
        <div className="relative flex h-12 w-12 items-center justify-center">
          <span
            className={`absolute h-12 w-12 rounded-full border border-blue-500/30 ${
              isSphereActive ? 'animate-sphere-ring opacity-100' : 'opacity-0'
            } transition-opacity duration-500 ease-out`}
          />
          <span
            className={`sphere-ambient ${
              isSphereActive ? 'opacity-80' : 'opacity-0'
            } transition-opacity duration-500 ease-out`}
          />
          <span
            className={`sphere-core h-10 w-10 ${
              isSphereActive ? 'animate-sphere-pulse' : ''
            } transition-all duration-500 ease-out`}
          >
            <span
              className={`h-2 w-2 rounded-full bg-white/80 ${
                isSphereActive ? 'animate-ping' : ''
              }`}
            />
          </span>
        </div>

        <div className="flex min-h-[3rem] flex-1 flex-col">
          <textarea
            ref={textAreaRef}
            value={message}
            onChange={event => {
              setMessage(event.target.value)
              if (!isListening) {
                baseVoiceTextRef.current = event.target.value
              }
            }}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            rows={1}
            className="w-full resize-none border-0 bg-transparent text-base leading-relaxed text-gray-100 placeholder:text-gray-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 self-center">
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            onChange={handleFileSelection}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="rounded-full p-2 text-gray-400 transition hover:bg-white/10 hover:text-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            aria-label="Upload resume"
          >
            <Paperclip className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={handleMicClick}
            className={`rounded-full p-2 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
              isListening ? 'bg-blue-500/10 text-blue-300' : 'text-gray-400 hover:bg-white/10 hover:text-gray-100'
            }`}
            aria-label={isListening ? 'Stop voice capture' : 'Start voice capture'}
            aria-pressed={isListening}
          >
            {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          </button>
          <button
            type="submit"
            disabled={!hasMessage || isSubmitting}
            className="flex h-11 items-center justify-center rounded-xl bg-accent px-4 text-sm font-semibold text-gray-900 transition hover:bg-accent-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A192F] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <span className="hidden sm:inline">Send</span>
                <Send className="h-5 w-5 sm:ml-2" />
              </>
            )}
          </button>
        </div>
      </div>

      <p className="mt-3 text-sm text-gray-400">{statusMessage}</p>
    </form>
  )
}

export default UnifiedChatInput
