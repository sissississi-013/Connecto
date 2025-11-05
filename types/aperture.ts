// ApertureData Profile Schema
export interface ProfileRecord {
  id: string
  name: string
  title: string
  company: string
  location?: string
  education?: string[]
  tags: string[]
  mutualConnections?: number
  sourceUrl?: string
  industry?: string
  insight?: string
  createdAt: string
}

export interface ProfileFilters {
  industries?: string[]
  locations?: string[]
  education?: string[]
  seniority?: string[]
  keywords?: string[]
}

export interface ApertureQueryResult {
  profiles: ProfileRecord[]
  total: number
  page: number
}
