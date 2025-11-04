import axios from 'axios'
import type { CometExperiment, OutreachMessage } from '@/types'

/**
 * Comet ML Integration for LLM Operations Monitoring
 *
 * Comet ML provides experiment tracking, model monitoring, and performance optimization.
 * We use it to:
 * 1. Track all generated outreach messages
 * 2. Log personalization parameters
 * 3. Monitor reply rates and effectiveness
 * 4. A/B test different message tones and templates
 * 5. Optimize the outreach agent over time
 */
class CometClient {
  private apiKey: string
  private projectName: string
  private workspace: string
  private baseUrl: string
  private experiments: Map<string, any>

  constructor() {
    this.apiKey = process.env.COMET_API_KEY || ''
    this.projectName = process.env.COMET_PROJECT_NAME || 'connecto'
    this.workspace = process.env.COMET_WORKSPACE || 'default'
    this.baseUrl = 'https://www.comet.ml/api/rest/v2'
    this.experiments = new Map()
  }

  private getHeaders() {
    return {
      'Authorization': `${this.apiKey}`,
      'Content-Type': 'application/json',
    }
  }

  /**
   * Create a new experiment for tracking outreach performance
   */
  async createExperiment(options: {
    name: string
    parameters: {
      tone: string
      template?: string
      personalizationLevel: string
      userId: string
    }
  }): Promise<string> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/write/experiment/create`,
        {
          projectName: this.projectName,
          workspaceName: this.workspace,
          experimentName: options.name,
        },
        { headers: this.getHeaders() }
      )

      const experimentKey = response.data.experimentKey

      // Log parameters
      await this.logParameters(experimentKey, options.parameters)

      // Cache experiment
      this.experiments.set(experimentKey, {
        key: experimentKey,
        name: options.name,
        parameters: options.parameters,
        createdAt: new Date().toISOString(),
      })

      return experimentKey
    } catch (error) {
      console.error('Comet: Error creating experiment:', error)
      // Create local experiment for demo
      const experimentKey = `exp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      this.experiments.set(experimentKey, {
        key: experimentKey,
        name: options.name,
        parameters: options.parameters,
        createdAt: new Date().toISOString(),
      })
      return experimentKey
    }
  }

  /**
   * Log parameters for an experiment
   */
  async logParameters(experimentKey: string, parameters: { [key: string]: any }): Promise<void> {
    try {
      await axios.post(
        `${this.baseUrl}/write/experiment/parameter`,
        {
          experimentKey,
          parameters: Object.entries(parameters).map(([name, value]) => ({
            parameterName: name,
            parameterValue: String(value),
          })),
        },
        { headers: this.getHeaders() }
      )
    } catch (error) {
      console.error('Comet: Error logging parameters:', error)
    }
  }

  /**
   * Log a metric (e.g., reply rate, response time)
   */
  async logMetric(
    experimentKey: string,
    metricName: string,
    value: number,
    step?: number
  ): Promise<void> {
    try {
      await axios.post(
        `${this.baseUrl}/write/experiment/metric`,
        {
          experimentKey,
          metricName,
          metricValue: value,
          step: step || 0,
          timestamp: Date.now(),
        },
        { headers: this.getHeaders() }
      )

      // Update local cache
      const exp = this.experiments.get(experimentKey)
      if (exp) {
        exp.metrics = exp.metrics || {}
        exp.metrics[metricName] = value
        this.experiments.set(experimentKey, exp)
      }
    } catch (error) {
      console.error('Comet: Error logging metric:', error)
    }
  }

  /**
   * Track an outreach message
   */
  async trackOutreachMessage(message: OutreachMessage): Promise<string> {
    try {
      // Create or get experiment for this user/tone combination
      const experimentName = `outreach_${message.userId}_${message.tone}`
      let experimentKey = message.cometExperimentId

      if (!experimentKey) {
        experimentKey = await this.createExperiment({
          name: experimentName,
          parameters: {
            tone: message.tone,
            template: message.template || 'default',
            personalizationLevel: Object.keys(message.personalizationTokens).length > 3 ? 'high' : 'medium',
            userId: message.userId,
          },
        })
      }

      // Log the message as an asset
      await this.logAsset(experimentKey, {
        name: `message_${message.id}`,
        type: 'outreach_message',
        metadata: {
          messageId: message.id,
          connectionId: message.connectionId,
          type: message.type,
          subject: message.subject,
          contentLength: message.content.length,
          personalizationTokens: JSON.stringify(message.personalizationTokens),
          status: message.status,
          createdAt: message.createdAt,
        },
      })

      // Log initial metrics
      await this.logMetric(experimentKey, 'messages_sent', 1)

      return experimentKey
    } catch (error) {
      console.error('Comet: Error tracking outreach message:', error)
      return ''
    }
  }

  /**
   * Update metrics when a reply is received
   */
  async trackReply(
    experimentKey: string,
    messageId: string,
    responseTime: number
  ): Promise<void> {
    try {
      // Log reply received
      await this.logMetric(experimentKey, 'replies_received', 1)
      await this.logMetric(experimentKey, 'response_time_hours', responseTime)

      // Calculate and log reply rate
      const exp = this.experiments.get(experimentKey)
      if (exp) {
        const sent = exp.metrics?.messages_sent || 1
        const replies = (exp.metrics?.replies_received || 0) + 1
        const replyRate = (replies / sent) * 100

        await this.logMetric(experimentKey, 'reply_rate_percent', replyRate)
      }

      // Log event
      await this.logEvent(experimentKey, {
        name: 'reply_received',
        metadata: {
          messageId,
          responseTime,
        },
      })
    } catch (error) {
      console.error('Comet: Error tracking reply:', error)
    }
  }

  /**
   * Log an asset (file, text, or metadata)
   */
  async logAsset(
    experimentKey: string,
    asset: {
      name: string
      type: string
      metadata: { [key: string]: any }
    }
  ): Promise<void> {
    try {
      await axios.post(
        `${this.baseUrl}/write/experiment/log-other`,
        {
          experimentKey,
          logOtherData: JSON.stringify(asset),
        },
        { headers: this.getHeaders() }
      )
    } catch (error) {
      console.error('Comet: Error logging asset:', error)
    }
  }

  /**
   * Log an event
   */
  async logEvent(
    experimentKey: string,
    event: {
      name: string
      metadata?: { [key: string]: any }
    }
  ): Promise<void> {
    try {
      await axios.post(
        `${this.baseUrl}/write/experiment/log-other`,
        {
          experimentKey,
          logOtherData: JSON.stringify({
            type: 'event',
            name: event.name,
            timestamp: new Date().toISOString(),
            ...event.metadata,
          }),
        },
        { headers: this.getHeaders() }
      )
    } catch (error) {
      console.error('Comet: Error logging event:', error)
    }
  }

  /**
   * End an experiment
   */
  async endExperiment(experimentKey: string): Promise<void> {
    try {
      await axios.post(
        `${this.baseUrl}/write/experiment/end`,
        { experimentKey },
        { headers: this.getHeaders() }
      )
    } catch (error) {
      console.error('Comet: Error ending experiment:', error)
    }
  }

  /**
   * Get experiment metrics (for dashboard display)
   */
  async getExperimentMetrics(experimentKey: string): Promise<CometExperiment | null> {
    try {
      // First check cache
      const cached = this.experiments.get(experimentKey)
      if (cached) {
        return {
          experimentKey,
          projectName: this.projectName,
          workspace: this.workspace,
          parameters: cached.parameters || {},
          metrics: cached.metrics || {
            messagesSent: 0,
            repliesReceived: 0,
            replyRate: 0,
          },
        }
      }

      const response = await axios.get(
        `${this.baseUrl}/experiment/metadata`,
        {
          headers: this.getHeaders(),
          params: {
            experimentKey,
          },
        }
      )

      const data = response.data

      return {
        experimentKey,
        projectName: this.projectName,
        workspace: this.workspace,
        parameters: data.parameters || {},
        metrics: {
          messagesSent: data.metrics?.messages_sent || 0,
          repliesReceived: data.metrics?.replies_received || 0,
          replyRate: data.metrics?.reply_rate_percent || 0,
          averageResponseTime: data.metrics?.response_time_hours,
        },
      }
    } catch (error) {
      console.error('Comet: Error fetching experiment metrics:', error)
      return null
    }
  }

  /**
   * Compare multiple experiments (A/B testing)
   */
  async compareExperiments(experimentKeys: string[]): Promise<{
    experiments: CometExperiment[]
    winner?: string
  }> {
    try {
      const experiments = await Promise.all(
        experimentKeys.map(key => this.getExperimentMetrics(key))
      )

      const validExperiments = experiments.filter(exp => exp !== null) as CometExperiment[]

      // Find the winner (highest reply rate)
      let winner: string | undefined
      let highestReplyRate = 0

      validExperiments.forEach(exp => {
        if (exp.metrics.replyRate > highestReplyRate) {
          highestReplyRate = exp.metrics.replyRate
          winner = exp.experimentKey
        }
      })

      return {
        experiments: validExperiments,
        winner,
      }
    } catch (error) {
      console.error('Comet: Error comparing experiments:', error)
      return { experiments: [] }
    }
  }

  /**
   * Get dashboard URL for viewing experiment in Comet UI
   */
  getDashboardUrl(experimentKey: string): string {
    return `https://www.comet.ml/${this.workspace}/${this.projectName}/${experimentKey}`
  }

  /**
   * Clear local cache
   */
  clearCache(): void {
    this.experiments.clear()
  }
}

export const cometService = new CometClient()
