export class BargeInDetector {
  private aiPlaying: boolean = false;
  private lastBargeInTime: number = 0;
  private debounceMs: number = 500;
  private bargeInCallback?: (timestamp: number) => void;
  private currentSpokenText: string = '';

  setAIPlaying(playing: boolean, spokenText: string = '') {
    this.aiPlaying = playing;
    this.currentSpokenText = spokenText.toLowerCase();
  }

  isAIPlaying(): boolean {
    return this.aiPlaying;
  }

  onBargeIn(callback: (timestamp: number) => void) {
    this.bargeInCallback = callback;
  }

  triggerBargeInIfPlaying(detectedText: string) {
    if (!this.aiPlaying) return;

    const clean = (detectedText || '').trim().toLowerCase();
    if (clean.length === 0) return;

    // Strict intentional interrupt keywords to prevent acoustic echo from phone speaker
    const fastInterruptWords = [
      'stop', 'wait', 'hold', 'cancel', 'no', 'halt', 
      'pause', 'actually', 'shut up', 'quiet'
    ];
    
    // Check if user explicitly spoke an interrupt keyword
    const words = clean.split(/\s+/);
    const hasInterruptKeyword = words.some(w => fastInterruptWords.includes(w)) ||
      fastInterruptWords.some(w => clean === w || clean.startsWith(w + ' ') || clean.endsWith(' ' + w));

    // CRITICAL: Prevent self-interruption from phone speaker audio feedback.
    // If the microphone transcript is just echoing the AI's own speech, DO NOT interrupt!
    if (this.currentSpokenText && this.currentSpokenText.includes(clean)) {
      return;
    }

    // Only interrupt on explicit user keywords when audio is actively playing
    if (hasInterruptKeyword) {
      const now = Date.now();
      if (now - this.lastBargeInTime > this.debounceMs) {
        this.lastBargeInTime = now;
        this.aiPlaying = false; // Disarm immediately
        if (this.bargeInCallback) {
          this.bargeInCallback(now);
        }
      }
    }
  }
}
