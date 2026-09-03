export class STTService {
  recognition: any;
  isListeningFlag: boolean = false;
  restartTimer: any = null;
  
  onPartialTranscript?: (text: string) => void;
  onFinalTranscript?: (text: string) => void;
  onSpeechStart?: () => void;
  onSpeechEnd?: () => void;
  onError?: (error: any) => void;

  constructor() {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';
      this.recognition.maxAlternatives = 1;
      
      this.recognition.onstart = () => {
        this.isListeningFlag = true;
      };

      this.recognition.onspeechstart = () => {
        if (this.onSpeechStart) this.onSpeechStart();
      };

      this.recognition.onspeechend = () => {
        if (this.onSpeechEnd) this.onSpeechEnd();
      };
      
      this.recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const trans = event.results[i][0]?.transcript || '';
          if (event.results[i].isFinal) {
            finalTranscript += trans;
          } else {
            interimTranscript += trans;
          }
        }
        
        // As soon as ANY partial speech is recognized, fire speech start and partial transcript
        if (interimTranscript) {
          if (this.onSpeechStart) this.onSpeechStart();
          if (this.onPartialTranscript) this.onPartialTranscript(interimTranscript);
        }

        if (finalTranscript && this.onFinalTranscript) {
          this.onFinalTranscript(finalTranscript.trim());
        }
      };
      
      this.recognition.onerror = (event: any) => {
        // 'no-speech' is normal when user is listening silently
        if (event.error !== 'no-speech') {
          console.warn("Speech recognition notice:", event.error);
        }
        if (event.error === 'not-allowed') {
          alert('Microphone access was blocked. Please click the camera/mic icon in your browser URL bar and allow microphone access.');
        }
        if (this.onError) this.onError(event.error);
      };
      
      this.recognition.onend = () => {
        // Continuous auto-restart when listening is enabled
        if (this.isListeningFlag) {
          clearTimeout(this.restartTimer);
          this.restartTimer = setTimeout(() => {
            if (this.isListeningFlag) {
              try {
                this.recognition.start();
              } catch (e) {
                // Ignore if already active
              }
            }
          }, 100);
        } else {
          if (this.onSpeechEnd) this.onSpeechEnd();
        }
      };
    }
  }

  start() {
    this.isListeningFlag = true;
    if (this.recognition) {
      try {
        this.recognition.start();
      } catch(e: any) {
        // Recognition might already be running
      }
    }
  }

  stop() {
    this.isListeningFlag = false;
    clearTimeout(this.restartTimer);
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (e) {
        // ignore
      }
    }
  }

  isListening(): boolean {
    return this.isListeningFlag;
  }
}
