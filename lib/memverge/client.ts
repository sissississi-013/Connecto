import axios from 'axios'
import type { UserProfile, Connection, MemVergeMemory, MemVergeQueryOptions } from '@/types'

/**
 * MemVerge Integration for Persistent User Memory and CRM
 *
 * MemVerge provides memory-centric computing with persistent memory capabilities.
 * This client manages user profiles, connection history, and relationship data.
 */
class MemVergeClient {
  private apiUrl: string
  private apiKey: string
  private cache: Map<string, any>

  constructor() {
    this.apiUrl = process.env.MEMVERGE_API_URL || 'https://api.memverge.io'
    this.apiKey = process.env.MEMVERGE_API_KEY || ''
    this.cache = new Map()
  }

  private getHeaders() {
    return {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
    }
  }

  // User Profile Management
  async createUserProfile(profile: UserProfile): Promise<UserProfile> {
    try {
      const memory: MemVergeMemory = {
        key: `user:${profile.email}`,
        value: profile,
        metadata: {
          userId: profile.id,
          type: 'user_profile',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      }

      const response = await axios.post(
        `${this.apiUrl}/v1/memory/set`,
        memory,
        { headers: this.getHeaders() }
      )

      this.cache.set(`user:${profile.email}`, profile)
      return response.data.value
    } catch (error) {
      console.error('MemVerge: Error creating user profile:', error)
      // Fallback to in-memory storage for demo
      this.cache.set(`user:${profile.email}`, profile)
      return profile
    }
  }

  async getUserProfile(email: string): Promise<UserProfile | null> {
    try {
      // Check cache first
      if (this.cache.has(`user:${email}`)) {
        return this.cache.get(`user:${email}`)
      }

      const response = await axios.get(
        `${this.apiUrl}/v1/memory/get?key=user:${email}`,
        { headers: this.getHeaders() }
      )

      const profile = response.data.value
      this.cache.set(`user:${email}`, profile)
      return profile
    } catch (error) {
      // Check cache as fallback
      return this.cache.get(`user:${email}`) || null
    }
  }

  async updateUserProfile(email: string, updates: Partial<UserProfile>): Promise<UserProfile> {
    try {
      const existing = await this.getUserProfile(email)
      if (!existing) {
        throw new Error('User profile not found')
      }

      const updated = {
        ...existing,
        ...updates,
        updatedAt: new Date().toISOString(),
      }

      await this.createUserProfile(updated)
      return updated
    } catch (error) {
      console.error('MemVerge: Error updating user profile:', error)
      throw error
    }
  }

  // Connection Management (CRM)
  async saveConnection(connection: Connection): Promise<Connection> {
    try {
      const memory: MemVergeMemory = {
        key: `connection:${connection.userId}:${connection.id}`,
        value: connection,
        metadata: {
          userId: connection.userId,
          type: 'connection',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      }

      await axios.post(
        `${this.apiUrl}/v1/memory/set`,
        memory,
        { headers: this.getHeaders() }
      )

      // Also update user's connection index
      await this.addConnectionToIndex(connection.userId, connection.id)

      this.cache.set(`connection:${connection.userId}:${connection.id}`, connection)
      return connection
    } catch (error) {
      console.error('MemVerge: Error saving connection:', error)
      this.cache.set(`connection:${connection.userId}:${connection.id}`, connection)
      return connection
    }
  }

  async getConnection(userId: string, connectionId: string): Promise<Connection | null> {
    try {
      const cacheKey = `connection:${userId}:${connectionId}`
      if (this.cache.has(cacheKey)) {
        return this.cache.get(cacheKey)
      }

      const response = await axios.get(
        `${this.apiUrl}/v1/memory/get?key=${cacheKey}`,
        { headers: this.getHeaders() }
      )

      const connection = response.data.value
      this.cache.set(cacheKey, connection)
      return connection
    } catch (error) {
      return this.cache.get(`connection:${userId}:${connectionId}`) || null
    }
  }

  async getUserConnections(userId: string, filters?: { tags?: string[], status?: string }): Promise<Connection[]> {
    try {
      const indexKey = `connection_index:${userId}`
      let connectionIds: string[] = this.cache.get(indexKey) || []

      if (connectionIds.length === 0) {
        const response = await axios.get(
          `${this.apiUrl}/v1/memory/get?key=${indexKey}`,
          { headers: this.getHeaders() }
        )
        connectionIds = response.data.value || []
      }

      // Fetch all connections
      const connections = await Promise.all(
        connectionIds.map(id => this.getConnection(userId, id))
      )

      let filtered = connections.filter(c => c !== null) as Connection[]

      // Apply filters
      if (filters?.tags && filters.tags.length > 0) {
        filtered = filtered.filter(c =>
          filters.tags!.some(tag => c.tags.includes(tag))
        )
      }

      if (filters?.status) {
        filtered = filtered.filter(c => c.status === filters.status)
      }

      return filtered
    } catch (error) {
      console.error('MemVerge: Error fetching user connections:', error)
      return []
    }
  }

  private async addConnectionToIndex(userId: string, connectionId: string): Promise<void> {
    try {
      const indexKey = `connection_index:${userId}`
      let connectionIds: string[] = this.cache.get(indexKey) || []

      if (connectionIds.length === 0) {
        try {
          const response = await axios.get(
            `${this.apiUrl}/v1/memory/get?key=${indexKey}`,
            { headers: this.getHeaders() }
          )
          connectionIds = response.data.value || []
        } catch {
          connectionIds = []
        }
      }

      if (!connectionIds.includes(connectionId)) {
        connectionIds.push(connectionId)

        const memory: MemVergeMemory = {
          key: indexKey,
          value: connectionIds,
          metadata: {
            userId,
            type: 'connection_index',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        }

        await axios.post(
          `${this.apiUrl}/v1/memory/set`,
          memory,
          { headers: this.getHeaders() }
        )

        this.cache.set(indexKey, connectionIds)
      }
    } catch (error) {
      console.error('MemVerge: Error updating connection index:', error)
    }
  }

  async updateConnection(userId: string, connectionId: string, updates: Partial<Connection>): Promise<Connection> {
    const existing = await this.getConnection(userId, connectionId)
    if (!existing) {
      throw new Error('Connection not found')
    }

    const updated = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    }

    return this.saveConnection(updated)
  }

  // Conversation History
  async addMessageToConnection(
    userId: string,
    connectionId: string,
    message: {
      type: 'email' | 'linkedin' | 'note'
      content: string
      subject?: string
    }
  ): Promise<Connection> {
    const connection = await this.getConnection(userId, connectionId)
    if (!connection) {
      throw new Error('Connection not found')
    }

    const newMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...message,
      sentAt: new Date().toISOString(),
    }

    connection.conversationHistory.push(newMessage)
    connection.lastContactedAt = new Date().toISOString()
    connection.updatedAt = new Date().toISOString()

    return this.saveConnection(connection)
  }

  // Query by tags (for group operations)
  async queryConnectionsByTags(userId: string, tags: string[]): Promise<Connection[]> {
    return this.getUserConnections(userId, { tags })
  }

  // Clear cache (useful for testing)
  clearCache(): void {
    this.cache.clear()
  }
}

export const memvergeService = new MemVergeClient()
