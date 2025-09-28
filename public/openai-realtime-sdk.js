/**
 * OpenAI Realtime Speech-to-Speech SDK
 * 
 * A lightweight, reusable module for integrating OpenAI's Realtime API
 * into any web application with minimal latency.
 */

class OpenAIRealtimeClient {
  constructor(options = {}) {
    this.serverUrl = options.serverUrl || 'http://localhost:3001';
    this.wsUrl = options.wsUrl || 'ws://localhost:3001/ws';
    this.onUserTranscript = options.onUserTranscript || (() => {});
    this.onAssistantTranscript = options.onAssistantTranscript || (() => {});
    this.onAssistantAudio = options.onAssistantAudio || (() => {});
    this.onAssistantResponseStart = options.onAssistantResponseStart || (() => {});
    this.onConnectionChange = options.onConnectionChange || (() => {});
    this.onSessionStarted = options.onSessionStarted || (() => {});
    this.onError = options.onError || console.error;
    this.mode = options.mode || 'form_creation';
    this.questions = options.questions || [];
    
    // Internal state
    this.ws = null;
    this.audioContext = null;
    this.mediaStream = null;
    this.source = null;
    this.processor = null;
    this.playbackContext = null;
    this.nextPlaybackTime = 0;
    this.activeAudioSources = new Set();
    this.currentResponseId = null;
    this.sessionId = null;
    this.isConnected = false;
    this.isRecording = false;
    this.autoStartRecording = options.autoStartRecording !== undefined ? options.autoStartRecording : true;
    this.autoRecordingInProgress = false;
    this.isAssistantSpeaking = false;

    // Audio settings
    this.sampleRate = 24000;
    this.bufferSize = 4096;

    // Bind methods
    this.connect = this.connect.bind(this);
    this.disconnect = this.disconnect.bind(this);
    this.startRecording = this.startRecording.bind(this);
    this.stopRecording = this.stopRecording.bind(this);
    this.stopAssistantPlayback = this.stopAssistantPlayback.bind(this);
  }

  /**
   * Get session configuration from backend (optional)
   */
  async getSessionConfig() {
    try {
      const response = await fetch(`${this.serverUrl}/api/session/config`);
      if (!response.ok) {
        throw new Error(`Failed to get session config: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      this.onError('Session config error:', error);
      throw error;
    }
  }

  /**
   * Connect to the OpenAI Realtime API
   */
  async connect() {
    try {
      // Disconnect any existing connection first
      if (this.isConnected) {
        console.log('Already connected, disconnecting first...');
        this.disconnect();
        // Wait a bit for cleanup
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      this.onConnectionChange('connecting');
      
      // Create session
      const sessionResponse = await fetch(`${this.serverUrl}/api/session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!sessionResponse.ok) {
        throw new Error(`Failed to create session: ${sessionResponse.status}`);
      }
      
      const sessionData = await sessionResponse.json();
      
      // Connect to WebSocket proxy
      this.ws = new WebSocket(this.wsUrl);
      
      return new Promise((resolve, reject) => {
        this.ws.onopen = () => {
          // Send ephemeral token for authentication with mode and questions
          this.ws.send(JSON.stringify({
            type: 'connect',
            ephemeralToken: sessionData.client_secret.value,
            mode: this.mode,
            questions: this.questions
          }));
        };
        
        this.ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            
            if (message.type === 'connected') {
              this.isConnected = true;
              
              // Use session ID from backend if provided, otherwise generate one
              if (message.session_id) {
                this.sessionId = message.session_id;
              } else if (!this.sessionId) {
                this.sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
              }
              
              this.onConnectionChange('connected');
              this.onSessionStarted(this.sessionId);
              
              // Session is now configured by the backend automatically
              // No need to send session.update from frontend
              
              if (this.autoStartRecording && !this.isRecording && !this.autoRecordingInProgress) {
                this.autoRecordingInProgress = true;
                this.startRecording().catch((error) => {
                  this.onError('Automatic recording error:', error);
                }).finally(() => {
                  this.autoRecordingInProgress = false;
                });
              }
              
              resolve();
            } else if (message.type === 'error') {
              reject(new Error(message.error));
            } else {
              this.handleMessage(message);
            }
          } catch (error) {
            this.onError('Message parsing error:', error);
          }
        };
        
        this.ws.onerror = (error) => {
          this.onError('WebSocket error:', error);
          reject(error);
        };
        
        this.ws.onclose = () => {
          this.isConnected = false;
          this.onConnectionChange('disconnected');
          this.cleanup();
        };
      });
      
    } catch (error) {
      this.onError('Connection error:', error);
      this.onConnectionChange('error');
      throw error;
    }
  }

  /**
   * Disconnect from the API and cleanup resources
   */
  disconnect() {
    this.isConnected = false;
    if (this.ws) {
      this.ws.close();
    }
    this.sessionId = null;
    this.cleanup();
    this.onConnectionChange('disconnected');
  }

  /**
   * Start recording audio from microphone
   */
  async startRecording() {
    if (this.isRecording || !this.isConnected) return;

    this.autoRecordingInProgress = true;
    try {

      // Get microphone access
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: this.sampleRate,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      
      // Create audio context
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)({
        sampleRate: this.sampleRate
      });
      
      // Create audio processing chain
      this.source = this.audioContext.createMediaStreamSource(this.mediaStream);
      this.processor = this.audioContext.createScriptProcessor(this.bufferSize, 1, 1);
      
      this.processor.onaudioprocess = (event) => {
        if (!this.isConnected || !this.isRecording) {
          return;
        }

        const pcm16 = this.float32ToPCM16(event.inputBuffer.getChannelData(0));
        const base64Audio = this.arrayBufferToBase64(pcm16.buffer);
        
        this.sendMessage({
          type: 'input_audio_buffer.append',
          audio: base64Audio
        });
      };
      
      // Connect audio nodes
      this.source.connect(this.processor);
      this.processor.connect(this.audioContext.destination);
      
      // Resume audio context if suspended
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }
      
      this.isRecording = true;
      this.isAssistantSpeaking = this.activeAudioSources.size > 0;
      
    } catch (error) {
      this.onError('Recording error:', error);
      throw error;
    } finally {
      this.autoRecordingInProgress = false;
    }
  }

  /**
   * Stop recording audio
   */
  stopRecording() {
    this.isRecording = false;
    this.cleanupRecording();
  }

  /**
   * Send message to OpenAI
   */
  sendMessage(message) {
    if (this.ws && this.isConnected) {
      this.ws.send(JSON.stringify(message));
    }
  }

  /**
   * Handle messages from OpenAI
   */
  handleMessage(message) {
    switch (message.type) {
      case 'conversation.item.input_audio_transcription.completed':
        if (message.transcript) {
          this.onUserTranscript(message.transcript);
        }
        break;
        
      case 'response.audio.delta':
        if (message.delta) {
          const responseId = message.response_id || message.response?.id;
          this.playAudioDelta(message.delta, responseId);
        }
        break;
      
      case 'response.created':
        this.currentResponseId = message.response?.id || message.response_id || null;
        this.onAssistantResponseStart(message.response || message);
        break;

      case 'response.completed':
      case 'response.canceled':
      case 'response.cancelled':
        this.handleResponseLifecycleEnd(message);
        break;

      case 'response.audio_transcript.delta':
      case 'response.text.delta':
        if (message.delta) {
          this.onAssistantTranscript(message.delta);
        }
        break;

      case 'input_audio_buffer.speech_started':
        this.stopAssistantPlayback();
        break;

      case 'input_audio_buffer.speech_stopped':
        // Optional: could update UI state here
        break;
        
      case 'error':
        this.onError('OpenAI API Error:', message.error);
        break;
    }
  }

  /**
   * Play audio delta with minimal latency
   */
  playAudioDelta(base64Audio, responseId) {
    try {
      const activeResponseId = responseId || this.currentResponseId;
      if (activeResponseId) {
        this.currentResponseId = activeResponseId;
      }

      if (!this.playbackContext) {
        this.playbackContext = new (window.AudioContext || window.webkitAudioContext)({
          sampleRate: this.sampleRate,
          latencyHint: 'interactive'
        });
        this.nextPlaybackTime = this.playbackContext.currentTime;
      }
      if (this.playbackContext.state === 'suspended') {
        this.playbackContext.resume().catch(() => {});
      }
      
      const audioData = atob(base64Audio);
      const audioArray = new Uint8Array(audioData.length);
      for (let i = 0; i < audioData.length; i++) {
        audioArray[i] = audioData.charCodeAt(i);
      }
      
      // Convert PCM16 to AudioBuffer
      const pcm16Array = new Int16Array(audioArray.buffer);
      const audioBuffer = this.playbackContext.createBuffer(1, pcm16Array.length, this.sampleRate);
      const channelData = audioBuffer.getChannelData(0);
      
      // Convert to float32
      for (let i = 0; i < pcm16Array.length; i++) {
        channelData[i] = pcm16Array[i] / 32768.0;
      }
      
      // Play immediately with minimal latency
      const source = this.playbackContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.playbackContext.destination);
      const startTime = Math.max(this.nextPlaybackTime, this.playbackContext.currentTime);
      source.start(startTime);
      this.nextPlaybackTime = startTime + audioBuffer.duration;
      source.__startTime = startTime;
      source.__responseId = activeResponseId;
      this.activeAudioSources.add(source);
      this.isAssistantSpeaking = true;
      source.onended = () => {
        this.activeAudioSources.delete(source);
        delete source.__startTime;
        delete source.__responseId;
        if (this.activeAudioSources.size === 0) {
          this.isAssistantSpeaking = false;
        }
      };

      // Notify callback
      this.onAssistantAudio(audioBuffer);

    } catch (error) {
      this.onError('Audio playback error:', error);
    }
  }

  /**
   * Stop any buffered playback and reset scheduling
   */
  stopAssistantPlayback() {
    if (this.activeAudioSources.size > 0) {
      this.activeAudioSources.forEach((source) => {
        try {
          source.onended = null;
          const targetContext = this.playbackContext;
          const startTime = source.__startTime ?? (targetContext ? targetContext.currentTime : 0);
          const currentTime = targetContext ? targetContext.currentTime : 0;
          const stopTime = Math.max(currentTime, startTime);
          if (typeof source.stop === 'function') {
            source.stop(stopTime);
          }
          if (typeof source.disconnect === 'function') {
            source.disconnect();
          }
        } catch (_) {
          // no-op if already stopped
        }
        delete source.__startTime;
        delete source.__responseId;
      });
      this.activeAudioSources.clear();
    }

    if (this.playbackContext) {
      this.nextPlaybackTime = this.playbackContext.currentTime;
      this.playbackContext.suspend().catch(() => {});
    } else {
      this.nextPlaybackTime = 0;
    }
    this.isAssistantSpeaking = false;
  }

  /**
   * Handle assistant response lifecycle events
   */
  handleResponseLifecycleEnd(message) {
    const responseId = message.response?.id || message.response_id;
    if (responseId && this.currentResponseId === responseId) {
      this.currentResponseId = null;
    }
  }

  /**
   * Convert Float32 to PCM16
   */
  float32ToPCM16(float32Array) {
    const pcm16 = new Int16Array(float32Array.length);
    for (let i = 0; i < float32Array.length; i++) {
      const s = Math.max(-1, Math.min(1, float32Array[i]));
      pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    return pcm16;
  }

  /**
   * Convert ArrayBuffer to Base64
   */
  arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   * Cleanup recording resources
   */
  cleanupRecording() {
    this.isRecording = false;
    if (this.processor) {
      this.processor.disconnect();
      this.processor = null;
    }
    if (this.source) {
      this.source.disconnect();
      this.source = null;
    }
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }

  /**
   * Cleanup all resources
   */
  cleanup() {
    this.cleanupRecording();
    this.stopAssistantPlayback();
    if (this.playbackContext) {
      this.playbackContext.close();
      this.playbackContext = null;
    }
    this.nextPlaybackTime = 0;
    this.activeAudioSources.clear();
    this.currentResponseId = null;
    this.autoRecordingInProgress = false;
    this.isAssistantSpeaking = false;
  }
}

// Export for different module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = OpenAIRealtimeClient;
} else if (typeof window !== 'undefined') {
  window.OpenAIRealtimeClient = OpenAIRealtimeClient;
}

export default OpenAIRealtimeClient;
