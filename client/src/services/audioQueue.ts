import { AudioChunk } from '../types';

export class AudioQueue {
  audioContext: AudioContext | null = null;
  activeGenerationId: number = 0;
  queue: AudioChunk[] = [];
  isPlaying: boolean = false;
  currentSource: AudioBufferSourceNode | null = null;

  onPlaybackStart?: () => void;
  onPlaybackEnd?: () => void;
  onChunkPlayed?: (chunk: AudioChunk) => void;

  constructor() {}

  public initContext() {
    if (!this.audioContext || this.audioContext.state === 'closed') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.audioContext = new AudioCtx();
      }
    }
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
  }

  async decodeAudio(data: ArrayBuffer | string): Promise<AudioBuffer | null> {
    this.initContext();
    if (!this.audioContext) return null;

    let buffer: ArrayBuffer;
    if (typeof data === 'string') {
      const binaryString = window.atob(data);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      buffer = bytes.buffer;
    } else {
      buffer = data.slice(0);
    }

    return await this.audioContext.decodeAudioData(buffer);
  }

  // Fallback audible chime/audio indicator to prove Web Audio playback when no TTS stream is provided
  playNotificationBeep(frequency = 440, duration = 0.2) {
    this.initContext();
    if (!this.audioContext) return;
    try {
      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
      gain.gain.setValueAtTime(0.1, this.audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);
      osc.connect(gain);
      gain.connect(this.audioContext.destination);
      osc.start();
      osc.stop(this.audioContext.currentTime + duration);
    } catch (e) {
      // ignore
    }
  }

  enqueue(chunk: AudioChunk) {
    if (chunk.generationId > this.activeGenerationId) {
      this.activeGenerationId = chunk.generationId;
    }

    if (chunk.generationId !== this.activeGenerationId) {
      return;
    }
    
    this.queue.push(chunk);
    this.queue.sort((a, b) => a.sequenceNumber - b.sequenceNumber);
    
    if (!this.isPlaying) {
      this.play();
    }
  }

  async play() {
    if (this.queue.length === 0 || this.isPlaying) return;
    
    this.isPlaying = true;
    if (this.onPlaybackStart) this.onPlaybackStart();

    while (this.queue.length > 0) {
      const chunk = this.queue.shift();
      if (!chunk || chunk.generationId !== this.activeGenerationId) continue;

      try {
        const rawData = chunk.audioData || chunk.audio;
        if (!rawData) continue;

        const audioBuffer = await this.decodeAudio(rawData);
        if (!audioBuffer || chunk.generationId !== this.activeGenerationId) continue;

        await new Promise<void>((resolve) => {
          if (!this.audioContext) return resolve();
          this.currentSource = this.audioContext.createBufferSource();
          this.currentSource.buffer = audioBuffer;
          this.currentSource.connect(this.audioContext.destination);
          
          this.currentSource.onended = () => {
            if (this.onChunkPlayed) this.onChunkPlayed(chunk);
            resolve();
          };
          
          this.currentSource.start();
        });
      } catch (err) {
        console.warn("Audio playback/decode skipped:", err);
      }
    }

    this.isPlaying = false;
    this.currentSource = null;
    if (this.onPlaybackEnd) this.onPlaybackEnd();
  }

  stop() {
    if (this.currentSource) {
      try {
        this.currentSource.stop();
        this.currentSource.disconnect();
      } catch (e) {
        // Safe ignore
      }
      this.currentSource = null;
    }
    this.queue = [];
    this.isPlaying = false;
  }

  clear() {
    this.queue = [];
  }

  cancelGeneration(generationId: number) {
    this.queue = this.queue.filter(c => c.generationId !== generationId);
    if (this.activeGenerationId === generationId) {
      this.stop();
    }
  }

  setActiveGeneration(generationId: number) {
    this.activeGenerationId = generationId;
    this.cancelGeneration(this.activeGenerationId - 1);
    this.clear();
  }

  dispose() {
    this.stop();
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
    }
  }
}
