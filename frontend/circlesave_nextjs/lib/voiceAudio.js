/**
 * Prospera Voice Agent - Audio Utilities
 * Handles PCM audio conversion, downsampling, playback queue,
 * and WebSocket management for Gemini Native Audio.
 */

/**
 * Downsample audio from browser sample rate (e.g. 44.1kHz/48kHz) to 16kHz for Gemini.
 * Uses averaging (low-pass filter) for better quality than sample dropping.
 */
export function downsampleBuffer(buffer, inputSampleRate, outputSampleRate = 16000) {
  if (inputSampleRate === outputSampleRate) return buffer;

  const ratio = inputSampleRate / outputSampleRate;
  const newLength = Math.round(buffer.length / ratio);
  const result = new Float32Array(newLength);

  for (let i = 0; i < newLength; i++) {
    const start = Math.round(i * ratio);
    const end = Math.round((i + 1) * ratio);
    let accum = 0;
    let count = 0;
    for (let j = start; j < end && j < buffer.length; j++) {
      accum += buffer[j];
      count++;
    }
    result[i] = count > 0 ? accum / count : 0;
  }

  return result;
}

/**
 * Convert Float32 audio samples to 16-bit PCM encoded as Base64.
 * This is the format Gemini expects for audio input.
 */
export function floatTo16BitPCM(float32Array) {
  const buffer = new ArrayBuffer(float32Array.length * 2);
  const view = new DataView(buffer);

  for (let i = 0; i < float32Array.length; i++) {
    const s = Math.max(-1, Math.min(1, float32Array[i]));
    view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }

  // Convert to Base64 in chunks to avoid call-stack overflow
  let binary = "";
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i += 1024) {
    binary += String.fromCharCode.apply(
      null,
      bytes.subarray(i, Math.min(i + 1024, bytes.byteLength))
    );
  }
  return btoa(binary);
}

/**
 * Decode Base64 PCM audio from Gemini into an AudioBuffer for playback.
 * Gemini sends 24kHz mono PCM.
 */
export function base64ToAudioBuffer(base64, audioContext) {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  const frameCount = bytes.length / 2;
  const buffer = audioContext.createBuffer(1, frameCount, 24000); // Gemini outputs 24kHz
  const channelData = buffer.getChannelData(0);
  const view = new DataView(bytes.buffer);

  for (let i = 0; i < frameCount; i++) {
    channelData[i] = view.getInt16(i * 2, true) / 32768.0;
  }

  return buffer;
}

/**
 * AudioQueue - Manages sequential audio chunk playback.
 * Prevents choppy audio by scheduling chunks back-to-back.
 */
export class AudioQueue {
  constructor(audioContext) {
    this.ctx = audioContext;
    this.nextStartTime = 0;
  }

  addToQueue(buffer) {
    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(this.ctx.destination);

    // If we've fallen behind, reset to now
    if (this.nextStartTime < this.ctx.currentTime) {
      this.nextStartTime = this.ctx.currentTime;
    }

    source.start(this.nextStartTime);
    this.nextStartTime += buffer.duration;
  }

  reset() {
    this.nextStartTime = 0;
  }
}

/**
 * VoiceWebSocket - Manages WebSocket connection to the Prospera voice backend.
 */
export class VoiceWebSocket {
  constructor(url) {
    this.url = url;
    this.ws = null;
    this.isConnected = false;
    this.onMessage = null;
    this.onClose = null;
    this.onError = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 3;
  }

  async connect() {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
          this.isConnected = true;
          this.reconnectAttempts = 0;
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (this.onMessage) this.onMessage(data);
          } catch {
            // Ignore non-JSON messages
          }
        };

        this.ws.onerror = (err) => {
          if (this.onError) this.onError(err);
          if (!this.isConnected) reject(err);
        };

        this.ws.onclose = () => {
          this.isConnected = false;
          if (this.onClose) this.onClose();
        };
      } catch (err) {
        reject(err);
      }
    });
  }

  send(data) {
    if (this.isConnected && this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
      return true;
    }
    return false;
  }

  close() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
      this.isConnected = false;
    }
  }
}
