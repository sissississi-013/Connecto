import axios from 'axios'
import type { TelnyxTranscription, VoiceSession } from '@/types'

/**
 * Telnyx Integration for Voice AI
 *
 * Telnyx provides real-time voice communication and transcription services.
 * We use it for:
 * 1. Conversational onboarding interviews
 * 2. Voice-based connection requests
 * 3. Real-time transcription
 */
class TelnyxClient {
  private apiKey: string
  private connectionId: string
  private baseUrl: string

  constructor() {
    this.apiKey = process.env.TELNYX_API_KEY || ''
    this.connectionId = process.env.TELNYX_CONNECTION_ID || ''
    this.baseUrl = 'https://api.telnyx.com/v2'
  }

  private getHeaders() {
    return {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
    }
  }

  /**
   * Start a voice session with transcription
   */
  async startVoiceSession(options: {
    userId: string
    type: 'onboarding' | 'request'
    prompt?: string
  }): Promise<{ sessionId: string; token: string }> {
    try {
      // Create a new call session
      const response = await axios.post(
        `${this.baseUrl}/calls`,
        {
          connection_id: this.connectionId,
          to: 'sip:conference@telnyx.com',
          from: '+1234567890', // Your Telnyx number
          stream_url: `wss://api.telnyx.com/v2/calls/stream`,
          stream_track: 'both',
          client_state: Buffer.from(JSON.stringify({
            userId: options.userId,
            type: options.type,
            prompt: options.prompt,
          })).toString('base64'),
        },
        { headers: this.getHeaders() }
      )

      const sessionId = response.data.data.call_control_id

      // Generate client token for WebRTC
      const tokenResponse = await axios.post(
        `${this.baseUrl}/telephony_credentials`,
        {
          connection_id: this.connectionId,
          name: `session_${sessionId}`,
          expires_at: new Date(Date.now() + 3600000).toISOString(), // 1 hour
        },
        { headers: this.getHeaders() }
      )

      return {
        sessionId,
        token: tokenResponse.data.data.token,
      }
    } catch (error) {
      console.error('Telnyx: Error starting voice session:', error)
      throw new Error('Failed to start voice session')
    }
  }

  /**
   * Transcribe audio using Telnyx's transcription service
   */
  async transcribeAudio(audioData: Blob | string): Promise<TelnyxTranscription> {
    try {
      let audioUrl: string

      if (typeof audioData === 'string') {
        audioUrl = audioData
      } else {
        // Upload audio to Telnyx storage
        const formData = new FormData()
        formData.append('file', audioData)

        const uploadResponse = await axios.post(
          `${this.baseUrl}/media`,
          formData,
          {
            headers: {
              ...this.getHeaders(),
              'Content-Type': 'multipart/form-data',
            },
          }
        )

        audioUrl = uploadResponse.data.data.url
      }

      // Request transcription
      const transcriptionResponse = await axios.post(
        `${this.baseUrl}/transcriptions`,
        {
          media_url: audioUrl,
          language: 'en',
          model: 'default',
        },
        { headers: this.getHeaders() }
      )

      const data = transcriptionResponse.data.data

      return {
        text: data.text,
        confidence: data.confidence,
        words: data.words || [],
      }
    } catch (error) {
      console.error('Telnyx: Error transcribing audio:', error)
      throw new Error('Failed to transcribe audio')
    }
  }

  /**
   * Process streaming transcription (for real-time use)
   */
  async processStreamTranscription(
    sessionId: string,
    audioChunk: ArrayBuffer
  ): Promise<string> {
    try {
      // Send audio chunk for real-time transcription
      const response = await axios.post(
        `${this.baseUrl}/calls/${sessionId}/stream`,
        {
          audio_data: Buffer.from(audioChunk).toString('base64'),
          encoding: 'linear16',
          sample_rate: 16000,
        },
        { headers: this.getHeaders() }
      )

      return response.data.data.transcript || ''
    } catch (error) {
      console.error('Telnyx: Error processing stream transcription:', error)
      return ''
    }
  }

  /**
   * End voice session
   */
  async endVoiceSession(sessionId: string): Promise<void> {
    try {
      await axios.post(
        `${this.baseUrl}/calls/${sessionId}/actions/hangup`,
        {},
        { headers: this.getHeaders() }
      )
    } catch (error) {
      console.error('Telnyx: Error ending voice session:', error)
    }
  }

  /**
   * Text-to-Speech (for AI responses during conversation)
   */
  async textToSpeech(text: string, voice: string = 'en-US-Standard-A'): Promise<string> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/tts`,
        {
          text,
          voice,
          language: 'en-US',
        },
        { headers: this.getHeaders() }
      )

      return response.data.data.audio_url
    } catch (error) {
      console.error('Telnyx: Error generating speech:', error)
      throw new Error('Failed to generate speech')
    }
  }

  /**
   * Handle Telnyx webhook events
   */
  async handleWebhook(payload: any): Promise<any> {
    const eventType = payload.data?.event_type

    switch (eventType) {
      case 'call.initiated':
        console.log('Telnyx: Call initiated', payload.data.call_control_id)
        break

      case 'call.answered':
        console.log('Telnyx: Call answered', payload.data.call_control_id)
        break

      case 'call.hangup':
        console.log('Telnyx: Call ended', payload.data.call_control_id)
        break

      case 'call.transcription':
        return {
          sessionId: payload.data.call_control_id,
          transcript: payload.data.transcript,
          confidence: payload.data.confidence,
        }

      default:
        console.log('Telnyx: Unknown event type', eventType)
    }

    return null
  }

  /**
   * Get recording from completed session
   */
  async getRecording(recordingId: string): Promise<string> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/recordings/${recordingId}`,
        { headers: this.getHeaders() }
      )

      return response.data.data.download_url
    } catch (error) {
      console.error('Telnyx: Error fetching recording:', error)
      throw new Error('Failed to fetch recording')
    }
  }
}

export const telnyxService = new TelnyxClient()
