export interface UserProfile {
  id: string
  email: string
  name: string
  image?: string
  onboardingCompleted: boolean
  resume?: {
    fileName: string
    content: string
    uploadedAt: string
  }
  interview?: {
    careerGoals: string
    currentRole: string
    targetIndustries: string[]
    preferences: {
      [key: string]: any
    }
    completedAt: string
  }
  preferences: {
    outreachTone?: string
    customTemplate?: string
    calendlyLink?: string
    googleCalendarEnabled?: boolean
  }
  createdAt: string
  updatedAt: string
}

export interface Connection {
  id: string
  userId: string
  name: string
  role: string
  company: string
  location?: string
  education?: string[]
  mutualConnections?: number
  linkedinUrl?: string
  email?: string
  phone?: string
  aiReview?: string
  tags: string[]
  status: 'pending' | 'contacted' | 'connected' | 'declined'
  conversationHistory: Message[]
  lastContactedAt?: string
  createdAt: string
  updatedAt: string
}

export interface Message {
  id: string
  type: 'email' | 'linkedin' | 'note'
  content: string
  subject?: string
  sentAt: string
  replyReceived?: boolean
  replyContent?: string
  replyReceivedAt?: string
}

export interface SearchRequest {
  id: string
  userId: string
  query: string
  criteria: {
    industry?: string[]
    role?: string[]
    company?: string[]
    location?: string[]
    education?: string[]
    keywords?: string[]
  }
  results: string[] // Connection IDs
  createdAt: string
}

export interface OutreachMessage {
  id: string
  userId: string
  connectionId: string
  type: 'email' | 'linkedin'
  subject?: string
  content: string
  personalizationTokens: {
    [key: string]: string
  }
  template?: string
  tone: string
  status: 'draft' | 'sent' | 'replied' | 'failed'
  sentAt?: string
  replyAt?: string
  cometExperimentId?: string
  createdAt: string
}

export interface VoiceSession {
  id: string
  userId: string
  type: 'onboarding' | 'request'
  transcript: string
  audioUrl?: string
  duration: number
  createdAt: string
}

export interface CometExperiment {
  experimentKey: string
  projectName: string
  workspace: string
  parameters: {
    tone: string
    template?: string
    personalizationLevel: string
  }
  metrics: {
    messagesSent: number
    repliesReceived: number
    replyRate: number
    averageResponseTime?: number
  }
}

// Telnyx types
export interface TelnyxCallOptions {
  to: string
  from: string
  connectionId: string
}

export interface TelnyxTranscription {
  text: string
  confidence: number
  words: Array<{
    word: string
    startTime: number
    endTime: number
    confidence: number
  }>
}

// ApertureData types
export interface ApertureDataQuery {
  collection: string
  filter: {
    [key: string]: any
  }
  sort?: {
    [key: string]: 1 | -1
  }
  limit?: number
  offset?: number
}

export interface ApertureDataEntity {
  _id: string
  _properties: {
    [key: string]: any
  }
  _connections?: Array<{
    ref: string
    class: string
  }>
}

// MemVerge types
export interface MemVergeMemory {
  key: string
  value: any
  metadata: {
    userId: string
    type: string
    createdAt: string
    updatedAt: string
    expiresAt?: string
  }
}

export interface MemVergeQueryOptions {
  userId: string
  type?: string
  tags?: string[]
  limit?: number
  offset?: number
}
