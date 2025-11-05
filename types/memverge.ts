// MemVerge User Profile Schema
export interface UserProfile {
  userId: string
  profile: {
    name: string
    email: string
    image?: string
    role?: string
    goals?: string[]
    resume?: {
      text: string
      fileName: string
      uploadedAt: string
    }
    preferences: {
      tone?: string
      calendarLink?: string
      customTemplate?: string
    }
  }
  connections: ConnectionRecord[]
  onboardingCompleted: boolean
  createdAt: string
  updatedAt: string
}

export interface ConnectionRecord {
  id: string
  source: string
  tags: string[]
  notes?: string
  messages: MessageRecord[]
  lastContactedAt?: string
  profileData: {
    name: string
    title: string
    company: string
  }
}

export interface MessageRecord {
  id: string
  type: 'outreach' | 'follow-up' | 'note'
  body: string
  subject?: string
  cometExperiment?: string
  sentAt: string
  replied?: boolean
  repliedAt?: string
}

export interface ProfileInput {
  userId: string
  resume?: any
  transcript?: string
  preferences?: any
}
