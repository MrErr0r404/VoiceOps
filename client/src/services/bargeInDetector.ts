export class BargeInDetector {
  private aiPlaying: boolean = false;
  private lastBargeInTime: number = 0;
  private debounceMs: number = 200;
  private bargeInCallback?: (timestamp: number) => void;

  setAIPlaying(playing: boolean) {
    this.aiPlaying = playing;
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

    // Fast-path keywords: instant trigger if user says "stop", "wait", "hold", "cancel", "no"
    const fastInterruptWords = ['stop', 'wait', 'hold', 'cancel', 'no', 'halt', 'check', 'actually'];
    const hasInterruptKeyword = fastInterruptWords.some(w => clean.includes(w));

    // Either a direct command keyword or any distinct user speech (>= 2 chars)
    if (hasInterruptKeyword || clean.length >= 2) {
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
