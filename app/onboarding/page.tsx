'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { VoiceAgent } from '@/components/voice/VoiceAgent'
import { ResumeUpload } from '@/components/onboarding/ResumeUpload'
import { Loader2, ArrowRight } from 'lucide-react'

const ONBOARDING_QUESTIONS = [
  'What are your career goals?',
  'What is your current role?',
  'Which industries are you interested in?',
  'Do you have any preferences for your connections?',
]

export default function OnboardingPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [step, setStep] = useState<'upload' | 'interview' | 'complete'>('upload')
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<string[]>([])
  const [isProcessing, setIsProcessing] = useState(false)

  const handleResumeUpload = async (file: File) => {
    setResumeFile(file)
  }

  const startInterview = () => {
    setStep('interview')
  }

  const handleTranscript = (transcript: string) => {
    // Add answer to the list
    const newAnswers = [...answers]
    newAnswers[currentQuestion] = (newAnswers[currentQuestion] || '') + transcript

    setAnswers(newAnswers)
  }

  const handleNextQuestion = () => {
    if (currentQuestion < ONBOARDING_QUESTIONS.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
    } else {
      completeOnboarding()
    }
  }

  const completeOnboarding = async () => {
    setIsProcessing(true)

    try {
      // Upload resume
      const formData = new FormData()
      if (resumeFile) {
        formData.append('resume', resumeFile)
      }
      formData.append('answers', JSON.stringify({
        careerGoals: answers[0] || '',
        currentRole: answers[1] || '',
        targetIndustries: answers[2]?.split(',').map(s => s.trim()) || [],
        preferences: { other: answers[3] || '' },
      }))

      const response = await fetch('/api/onboarding/complete', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        setStep('complete')
        setTimeout(() => {
          router.push('/dashboard')
        }, 2000)
      } else {
        alert('Failed to complete onboarding')
      }
    } catch (error) {
      console.error('Error completing onboarding:', error)
      alert('Failed to complete onboarding')
    } finally {
      setIsProcessing(false)
    }
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-navy-950">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-navy-950 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-3xl space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold gradient-text">Welcome to CONNECTO</h1>
          <p className="text-navy-300">Let's get you set up</p>
        </div>

        {/* Progress Indicator */}
        <div className="flex items-center justify-center gap-2">
          <div className={`w-3 h-3 rounded-full ${step === 'upload' ? 'bg-blue-500' : 'bg-navy-600'}`} />
          <div className={`w-12 h-1 ${step !== 'upload' ? 'bg-blue-500' : 'bg-navy-600'}`} />
          <div className={`w-3 h-3 rounded-full ${step === 'interview' ? 'bg-blue-500' : 'bg-navy-600'}`} />
          <div className={`w-12 h-1 ${step === 'complete' ? 'bg-blue-500' : 'bg-navy-600'}`} />
          <div className={`w-3 h-3 rounded-full ${step === 'complete' ? 'bg-blue-500' : 'bg-navy-600'}`} />
        </div>

        {/* Content */}
        {step === 'upload' && (
          <div className="space-y-8 flex flex-col items-center">
            <div className="text-center">
              <h2 className="text-2xl font-semibold text-white mb-2">
                Upload Your Resume
              </h2>
              <p className="text-navy-400">
                We'll use this to personalize your networking experience
              </p>
            </div>

            <ResumeUpload
              onUpload={handleResumeUpload}
              onRemove={() => setResumeFile(null)}
              uploadedFile={resumeFile ? { name: resumeFile.name, size: resumeFile.size } : null}
            />

            <button
              onClick={startInterview}
              disabled={!resumeFile}
              className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue to Interview
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {step === 'interview' && (
          <div className="space-y-8 flex flex-col items-center">
            <div className="text-center">
              <h2 className="text-2xl font-semibold text-white mb-2">
                Quick Interview
              </h2>
              <p className="text-navy-400">
                Question {currentQuestion + 1} of {ONBOARDING_QUESTIONS.length}
              </p>
            </div>

            <div className="card text-center">
              <p className="text-xl text-white">{ONBOARDING_QUESTIONS[currentQuestion]}</p>
            </div>

            <VoiceAgent
              onTranscript={handleTranscript}
              prompt={currentQuestion === 0 ? ONBOARDING_QUESTIONS[0] : undefined}
              autoStart={currentQuestion === 0}
            />

            {answers[currentQuestion] && (
              <button
                onClick={handleNextQuestion}
                disabled={isProcessing}
                className="btn-primary flex items-center gap-2"
              >
                {currentQuestion < ONBOARDING_QUESTIONS.length - 1 ? (
                  <>
                    Next Question
                    <ArrowRight className="w-5 h-5" />
                  </>
                ) : (
                  <>
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      'Complete Onboarding'
                    )}
                  </>
                )}
              </button>
            )}
          </div>
        )}

        {step === 'complete' && (
          <div className="space-y-8 flex flex-col items-center text-center">
            <div className="w-24 h-24 rounded-full bg-green-500/20 flex items-center justify-center">
              <svg
                className="w-12 h-12 text-green-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>

            <div>
              <h2 className="text-3xl font-bold text-white mb-2">
                You're all set!
              </h2>
              <p className="text-navy-400">
                Redirecting to your dashboard...
              </p>
            </div>

            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        )}
      </div>
    </div>
  )
}
