import axios from 'axios'
import type { Connection, ApertureDataQuery, ApertureDataEntity } from '@/types'

/**
 * ApertureData Integration for Profile Database and Complex Queries
 *
 * ApertureData provides a unified database for managing multi-modal data
 * with powerful query capabilities. We use it to store scraped connection
 * profiles and run complex searches across multiple dimensions.
 */
class ApertureDataClient {
  private host: string
  private port: number
  private username: string
  private password: string
  private baseUrl: string
  private cache: Map<string, any>

  constructor() {
    this.host = process.env.APERTUREDATA_HOST || 'localhost'
    this.port = parseInt(process.env.APERTUREDATA_PORT || '55555')
    this.username = process.env.APERTUREDATA_USERNAME || 'admin'
    this.password = process.env.APERTUREDATA_PASSWORD || 'admin'
    this.baseUrl = `http://${this.host}:${this.port}`
    this.cache = new Map()
  }

  private getAuthHeaders() {
    const auth = Buffer.from(`${this.username}:${this.password}`).toString('base64')
    return {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json',
    }
  }

  /**
   * Initialize the database schema for profiles
   */
  async initializeSchema(): Promise<void> {
    try {
      // Create Profile entity class
      const schemaQuery = {
        AddEntity: {
          class: 'Profile',
          properties: {
            name: 'string',
            role: 'string',
            company: 'string',
            location: 'string',
            education: 'string[]',
            industry: 'string',
            linkedinUrl: 'string',
            email: 'string',
            phone: 'string',
            skills: 'string[]',
            mutualConnections: 'integer',
            profileSummary: 'text',
            createdAt: 'datetime',
            updatedAt: 'datetime',
          },
          indexes: ['name', 'company', 'role', 'industry', 'location'],
        },
      }

      await axios.post(
        `${this.baseUrl}/api/schema`,
        schemaQuery,
        { headers: this.getAuthHeaders() }
      )

      console.log('ApertureData: Schema initialized successfully')
    } catch (error) {
      console.log('ApertureData: Schema may already exist or demo mode active')
    }
  }

  /**
   * Store a scraped profile in ApertureData
   */
  async storeProfile(profile: Partial<Connection>): Promise<string> {
    try {
      const entity: ApertureDataEntity = {
        _id: profile.id || `profile_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        _properties: {
          name: profile.name,
          role: profile.role,
          company: profile.company,
          location: profile.location || '',
          education: profile.education || [],
          industry: this.extractIndustry(profile.company || ''),
          linkedinUrl: profile.linkedinUrl || '',
          email: profile.email || '',
          phone: profile.phone || '',
          skills: [],
          mutualConnections: profile.mutualConnections || 0,
          profileSummary: `${profile.role} at ${profile.company}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      }

      const query = {
        AddEntity: {
          class: 'Profile',
          properties: entity._properties,
          _id: entity._id,
        },
      }

      await axios.post(
        `${this.baseUrl}/api/query`,
        query,
        { headers: this.getAuthHeaders() }
      )

      // Cache the profile
      this.cache.set(entity._id, entity)

      return entity._id
    } catch (error) {
      console.error('ApertureData: Error storing profile:', error)
      // Fallback to cache for demo
      const id = profile.id || `profile_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      this.cache.set(id, profile)
      return id
    }
  }

  /**
   * Store multiple profiles at once
   */
  async storeBulkProfiles(profiles: Partial<Connection>[]): Promise<string[]> {
    const ids = await Promise.all(profiles.map(p => this.storeProfile(p)))
    return ids
  }

  /**
   * Complex query to find matching profiles
   */
  async queryProfiles(criteria: {
    industry?: string[]
    role?: string[]
    company?: string[]
    location?: string[]
    education?: string[]
    keywords?: string[]
    limit?: number
  }): Promise<ApertureDataEntity[]> {
    try {
      // Build query filter
      const constraints: any[] = []

      if (criteria.industry && criteria.industry.length > 0) {
        constraints.push({
          _properties: {
            industry: { _in: criteria.industry },
          },
        })
      }

      if (criteria.role && criteria.role.length > 0) {
        constraints.push({
          _properties: {
            role: { _contains_any: criteria.role },
          },
        })
      }

      if (criteria.company && criteria.company.length > 0) {
        constraints.push({
          _properties: {
            company: { _in: criteria.company },
          },
        })
      }

      if (criteria.location && criteria.location.length > 0) {
        constraints.push({
          _properties: {
            location: { _contains_any: criteria.location },
          },
        })
      }

      if (criteria.education && criteria.education.length > 0) {
        constraints.push({
          _properties: {
            education: { _contains_any: criteria.education },
          },
        })
      }

      const query = {
        FindEntity: {
          class: 'Profile',
          constraints: constraints.length > 0 ? { _and: constraints } : {},
          results: {
            all_properties: true,
            limit: criteria.limit || 50,
          },
        },
      }

      const response = await axios.post(
        `${this.baseUrl}/api/query`,
        query,
        { headers: this.getAuthHeaders() }
      )

      return response.data.entities || []
    } catch (error) {
      console.error('ApertureData: Error querying profiles:', error)
      // Fallback to cache search for demo
      return this.searchCacheProfiles(criteria)
    }
  }

  /**
   * Advanced semantic search using keywords
   */
  async semanticSearch(keywords: string[], limit: number = 20): Promise<ApertureDataEntity[]> {
    try {
      const query = {
        FindEntity: {
          class: 'Profile',
          constraints: {
            _or: keywords.map(keyword => ({
              _properties: {
                profileSummary: { _contains: keyword },
              },
            })),
          },
          results: {
            all_properties: true,
            limit,
          },
        },
      }

      const response = await axios.post(
        `${this.baseUrl}/api/query`,
        query,
        { headers: this.getAuthHeaders() }
      )

      return response.data.entities || []
    } catch (error) {
      console.error('ApertureData: Error in semantic search:', error)
      return []
    }
  }

  /**
   * Get profile by ID
   */
  async getProfile(id: string): Promise<ApertureDataEntity | null> {
    try {
      if (this.cache.has(id)) {
        return this.cache.get(id)
      }

      const query = {
        FindEntity: {
          class: 'Profile',
          constraints: {
            _id: { _eq: id },
          },
          results: {
            all_properties: true,
          },
        },
      }

      const response = await axios.post(
        `${this.baseUrl}/api/query`,
        query,
        { headers: this.getAuthHeaders() }
      )

      const profile = response.data.entities?.[0] || null
      if (profile) {
        this.cache.set(id, profile)
      }
      return profile
    } catch (error) {
      return this.cache.get(id) || null
    }
  }

  /**
   * Convert ApertureData entity to Connection object
   */
  entityToConnection(entity: ApertureDataEntity, userId: string): Connection {
    const props = entity._properties
    return {
      id: entity._id,
      userId,
      name: props.name || '',
      role: props.role || '',
      company: props.company || '',
      location: props.location,
      education: props.education || [],
      mutualConnections: props.mutualConnections || 0,
      linkedinUrl: props.linkedinUrl,
      email: props.email,
      phone: props.phone,
      tags: [],
      status: 'pending',
      conversationHistory: [],
      createdAt: props.createdAt || new Date().toISOString(),
      updatedAt: props.updatedAt || new Date().toISOString(),
    }
  }

  // Helper methods
  private extractIndustry(company: string): string {
    // Simple industry extraction logic (in production, use a proper mapping)
    const industryMap: { [key: string]: string } = {
      'google': 'Technology',
      'facebook': 'Technology',
      'meta': 'Technology',
      'apple': 'Technology',
      'microsoft': 'Technology',
      'goldman': 'Finance',
      'morgan': 'Finance',
      'mckinsey': 'Consulting',
      'bcg': 'Consulting',
      'bain': 'Consulting',
    }

    const lowerCompany = company.toLowerCase()
    for (const [key, industry] of Object.entries(industryMap)) {
      if (lowerCompany.includes(key)) {
        return industry
      }
    }

    return 'Other'
  }

  private searchCacheProfiles(criteria: any): ApertureDataEntity[] {
    const results: ApertureDataEntity[] = []

    for (const [id, profile] of this.cache.entries()) {
      let matches = true

      if (criteria.company && criteria.company.length > 0) {
        matches = matches && criteria.company.includes(profile.company)
      }

      if (criteria.location && criteria.location.length > 0) {
        matches = matches && criteria.location.some((loc: string) =>
          profile.location?.includes(loc)
        )
      }

      if (matches) {
        results.push({
          _id: id,
          _properties: profile,
        })
      }
    }

    return results.slice(0, criteria.limit || 50)
  }

  clearCache(): void {
    this.cache.clear()
  }
}

export const apertureDataService = new ApertureDataClient()
