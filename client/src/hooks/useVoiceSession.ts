import { useEffect, useRef, useCallback } from 'react';
import { socketService } from '../services/socketService';
import { AudioQueue } from '../services/audioQueue';
import { STTService } from '../services/sttService';
import { BargeInDetector } from '../services/bargeInDetector';
import { useSessionStore } from '../store/sessionStore';
import { useSettingsStore } from '../store/settingsStore';

export function useVoiceSession() {
  const store = useSessionStore();
  const settings = useSettingsStore();

  const audioQueueRef = useRef(new AudioQueue());
  const sttServiceRef = useRef(new STTService());
  const bargeInDetectorRef = useRef(new BargeInDetector());
  const hasInitializedRef = useRef(false);

  // Helper to reliably speak via browser speech synthesis with a pleasant female voice
  const speakText = useCallback((text: string) => {
    if (!('speechSynthesis' in window)) return;
    
    try {
      // Cancel any pending speech first
      window.speechSynthesis.cancel();
      
      // Small delay after cancel to let Chrome clear its internal queue
      setTimeout(() => {
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.0;
        utterance.pitch = 1.15;
        utterance.lang = 'en-US';

        // Pick a female English voice
        const voices = window.speechSynthesis.getVoices();
        if (voices && voices.length > 0) {
          const femaleVoice = voices.find(v => 
            (v.lang.startsWith('en') || v.lang.includes('US')) && 
            (v.name.toLowerCase().includes('zira') || 
             v.name.toLowerCase().includes('jenny') || 
             v.name.toLowerCase().includes('samantha') || 
             v.name.toLowerCase().includes('victoria') || 
             v.name.toLowerCase().includes('female') ||
             v.name.toLowerCase().includes('aria') ||
             v.name.toLowerCase().includes('karen'))
          ) || voices.find(v => v.lang.startsWith('en')) || voices[0];
          
          if (femaleVoice) {
            utterance.voice = femaleVoice;
          }
        }

        // Keep reference to prevent garbage collection (Chrome bug)
        (window as any).__voiceOpsUtterance = utterance;

        utterance.onstart = () => {
          useSessionStore.getState().setSessionState('SPEAKING');
          bargeInDetectorRef.current.setAIPlaying(true);
        };

        utterance.onend = () => {
          bargeInDetectorRef.current.setAIPlaying(false);
          const state = useSessionStore.getState().sessionState;
          if (state === 'SPEAKING') {
            useSessionStore.getState().setSessionState('IDLE');
          }
        };

        utterance.onerror = (e) => {
          // 'interrupted' is expected when we call cancel()
          if (e.error !== 'interrupted') {
            console.warn('Speech synthesis warning:', e.error);
          }
          bargeInDetectorRef.current.setAIPlaying(false);
          const state = useSessionStore.getState().sessionState;
          if (state === 'SPEAKING') {
            useSessionStore.getState().setSessionState('IDLE');
          }
        };

        window.speechSynthesis.speak(utterance);
        audioQueueRef.current.playNotificationBeep(600, 0.08);
      }, 50);
    } catch (e) {
      console.error('Speech synthesis error:', e);
    }
  }, []);

  const interrupt = useCallback(() => {
    const interruptTimestamp = Date.now();
    
    // 1. Stop ALL local audio immediately
    audioQueueRef.current.stop();
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    bargeInDetectorRef.current.setAIPlaying(false);
    
    // Play quick audible cancellation click
    audioQueueRef.current.playNotificationBeep(220, 0.05);

    const curGen = useSessionStore.getState().currentGenerationId;
    
    // 2. Log the barge-in event
    useSessionStore.getState().addEvent({ 
      id: Math.random().toString(), 
      timestamp: interruptTimestamp, 
      type: 'USER_BARGE_IN', 
      category: 'user',
      generationId: curGen
    });
    
    // 3. Mark active assistant turns as INTERRUPTED
    const turns = useSessionStore.getState().conversationTurns;
    if (turns.length > 0) {
      const lastTurn = turns[turns.length - 1];
      if (lastTurn.role === 'VOICEOPS' && lastTurn.status !== 'INTERRUPTED') {
        useSessionStore.getState().updateTurn(lastTurn.id, { status: 'INTERRUPTED' });
      }
    }

    // 4. Tell the server to interrupt (server will increment its own generation)
    socketService.emit('assistant:interrupt', { 
      generationId: curGen,
      timestamp: interruptTimestamp 
    });

    // 5. Set state to INTERRUPTED briefly, then auto-recover to IDLE
    useSessionStore.getState().setSessionState('INTERRUPTED');
    useSessionStore.getState().incrementGeneration();
    
    // Auto-recover from INTERRUPTED to IDLE after 1.5s
    setTimeout(() => {
      const state = useSessionStore.getState().sessionState;
      if (state === 'INTERRUPTED') {
        useSessionStore.getState().setSessionState('IDLE');
      }
    }, 1500);
  }, []);

  useEffect(() => {
    if (hasInitializedRef.current) return;
    hasInitializedRef.current = true;

    // Preload available browser voices
    if ('speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
      };
    }

    socketService.connect();
    
    socketService.on('connect', () => {
      useSessionStore.getState().setConnected(true);
      const sid = useSessionStore.getState().sessionId || 'session-' + Date.now();
      if (!useSessionStore.getState().sessionId) {
        useSessionStore.setState({ sessionId: sid });
      }
      socketService.emit('session:start', { 
        sessionId: sid,
        voice: useSettingsStore.getState().selectedVoice 
      });
    });

    socketService.on('disconnect', () => {
      useSessionStore.getState().setConnected(false);
    });

    // Handle server state changes
    socketService.on('session:state', (data: { state: any, generationId?: number }) => {
      if (data.state) {
        // Don't let server push us back to SPEAKING if we just interrupted
        const curState = useSessionStore.getState().sessionState;
        if (curState === 'INTERRUPTED' && data.state === 'SPEAKING') {
          return; // Ignore stale server state
        }
        useSessionStore.getState().setSessionState(data.state);
      }
      // Sync generation from server if provided
      if (data.generationId && data.generationId > useSessionStore.getState().currentGenerationId) {
        useSessionStore.setState({ currentGenerationId: data.generationId });
      }
    });

    // Handle audio chunks from Rime TTS
    socketService.on('tts:audio', (data: any) => {
      const genId = data.generationId;
      const rawAudio = data.audioData || data.audio;
      const curGen = useSessionStore.getState().currentGenerationId;
      const curState = useSessionStore.getState().sessionState;
      
      // Reject audio if generation is stale or we're in interrupted state
      if (rawAudio && genId === curGen && curState !== 'INTERRUPTED') {
        audioQueueRef.current.enqueue({
          generationId: genId,
          sequenceNumber: data.sequenceNumber || 0,
          audioData: rawAudio,
          turnId: data.turnId,
          sessionId: data.sessionId
        });
      }
    });

    socketService.on('tts:cancel', (data: { generationId: number }) => {
      audioQueueRef.current.cancelGeneration(data.generationId);
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      bargeInDetectorRef.current.setAIPlaying(false);
    });

    // Tool events
    socketService.on('tool:start', (data: { toolName: string, input: string, generationId: number, turnId: string }) => {
      useSessionStore.getState().addToolExecution({
        id: Math.random().toString(),
        toolName: data.toolName,
        status: 'RUNNING',
        input: data.input,
        startTime: Date.now(),
        generationId: data.generationId
      });
      useSessionStore.getState().addEvent({
        id: Math.random().toString(),
        timestamp: Date.now(),
        type: 'TOOL_STARTED',
        category: 'tool',
        generationId: data.generationId,
        metadata: { toolName: data.toolName }
      });
    });

    socketService.on('tool:complete', (data: { toolName: string, result: any, generationId: number, turnId: string }) => {
      const toolExec = useSessionStore.getState().toolExecutions.find(t => t.generationId === data.generationId && t.toolName === data.toolName);
      if (toolExec) {
        useSessionStore.getState().updateToolExecution(toolExec.id, {
          status: 'COMPLETE',
          result: data.result,
          endTime: Date.now()
        });
      }
      useSessionStore.getState().addEvent({
        id: Math.random().toString(),
        timestamp: Date.now(),
        type: 'TOOL_COMPLETED',
        category: 'tool',
        generationId: data.generationId,
        metadata: { toolName: data.toolName }
      });
    });

    socketService.on('tool:stale-result', (data: { toolName?: string, generationId: number, turnId: string }) => {
      const toolExec = useSessionStore.getState().toolExecutions.find(t => t.generationId === data.generationId);
      if (toolExec) {
        useSessionStore.getState().updateToolExecution(toolExec.id, {
          status: 'CANCELLED',
          endTime: Date.now()
        });
      }
      useSessionStore.getState().addEvent({
        id: Math.random().toString(),
        timestamp: Date.now(),
        type: 'STALE_RESULT_REJECTED',
        category: 'tool',
        generationId: data.generationId,
        metadata: { toolName: data.toolName, explanation: 'Tool result arrived after user interruption' }
      });
    });

    // Assistant response completion
    socketService.on('assistant:response-complete', (data: { turnId: string, text: string, spokenText?: string, generationId: number, equipment?: any, task?: string }) => {
      const curGen = useSessionStore.getState().currentGenerationId;
      const curState = useSessionStore.getState().sessionState;
      
      // Reject stale responses
      if (data.generationId < curGen || curState === 'INTERRUPTED') {
        return;
      }

      useSessionStore.getState().addTurn({
        id: data.turnId || Math.random().toString(),
        role: 'VOICEOPS',
        text: data.text,
        timestamp: Date.now(),
        status: 'COMPLETE',
        generationId: data.generationId
      });

      if (data.equipment) {
        useSessionStore.getState().setActiveEquipment(data.equipment);
      }
      if (data.task) {
        useSessionStore.getState().setCurrentTask(data.task);
      }

      // Speak response aloud with the female voice
      speakText(data.spokenText || data.text);
    });

    // Metrics updates
    socketService.on('metric:update', (data: { latest?: any, aggregates?: any }) => {
      if (data.latest) {
        useSessionStore.getState().updateMetrics(data.latest);
      }
    });

    // Web Audio Queue lifecycle (for Rime binary stream)
    audioQueueRef.current.onPlaybackStart = () => {
      const curGen = useSessionStore.getState().currentGenerationId;
      useSessionStore.getState().setSessionState('SPEAKING');
      bargeInDetectorRef.current.setAIPlaying(true);
      useSessionStore.getState().addEvent({
        id: Math.random().toString(),
        timestamp: Date.now(),
        type: 'RIME_PLAYBACK_STARTED',
        category: 'rime',
        generationId: curGen
      });
    };
    
    audioQueueRef.current.onPlaybackEnd = () => {
      const curGen = useSessionStore.getState().currentGenerationId;
      bargeInDetectorRef.current.setAIPlaying(false);
      if (useSessionStore.getState().sessionState === 'SPEAKING') {
        useSessionStore.getState().setSessionState('IDLE');
      }
      useSessionStore.getState().addEvent({
        id: Math.random().toString(),
        timestamp: Date.now(),
        type: 'AUDIO_STOPPED',
        category: 'rime',
        generationId: curGen
      });
    };

    // STT callbacks
    sttServiceRef.current.onSpeechStart = () => {
      socketService.emit('voice:speech-start');
    };

    sttServiceRef.current.onSpeechEnd = () => {
      socketService.emit('voice:speech-end');
    };

    // Real barge-in detected from voice
    bargeInDetectorRef.current.onBargeIn((ts) => {
      interrupt();
      const latency = Date.now() - ts;
      useSessionStore.getState().updateMetrics({ interruptionLatencyMs: latency });
    });
    
    sttServiceRef.current.onFinalTranscript = (text) => {
      useSessionStore.getState().setPartialTranscript('');
      if (!text || text.trim().length === 0) return;

      // If AI is speaking and user speaks, trigger barge-in first
      if (bargeInDetectorRef.current.isAIPlaying()) {
        bargeInDetectorRef.current.triggerBargeInIfPlaying(text);
        return; // The barge-in handler will fire interrupt, don't also send transcript
      }
      
      const newGenId = useSessionStore.getState().currentGenerationId + 1;
      useSessionStore.getState().incrementGeneration();
      
      useSessionStore.getState().addTurn({ 
        id: Math.random().toString(), 
        role: 'USER', 
        text, 
        timestamp: Date.now(), 
        status: 'COMPLETE', 
        generationId: newGenId 
      });
      
      useSessionStore.getState().addEvent({
        id: Math.random().toString(),
        timestamp: Date.now(),
        type: 'STT_FINAL',
        category: 'user',
        generationId: newGenId,
        metadata: { text }
      });

      socketService.emit('transcript:final', { text, generationId: newGenId });
      useSessionStore.getState().setSessionState('PROCESSING');
    };
    
    sttServiceRef.current.onPartialTranscript = (text) => {
      useSessionStore.getState().setPartialTranscript(text);
      
      if (bargeInDetectorRef.current.isAIPlaying()) {
        bargeInDetectorRef.current.triggerBargeInIfPlaying(text);
      }
      
      socketService.emit('transcript:partial', { text });
    };

    return () => {
      // Keep persistent
    };
  }, [interrupt, speakText]);

  const startSession = () => {
    audioQueueRef.current.initContext();
    useSessionStore.getState().reset();
    socketService.connect();
    sttServiceRef.current.start();
    useSessionStore.getState().setSessionState('LISTENING');
    socketService.emit('session:start', { voice: useSettingsStore.getState().selectedVoice });
  };

  const endSession = () => {
    audioQueueRef.current.stop();
    sttServiceRef.current.stop();
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    bargeInDetectorRef.current.setAIPlaying(false);
    socketService.emit('session:end');
    useSessionStore.getState().setSessionState('IDLE');
  };

  const startListening = () => {
    audioQueueRef.current.initContext();
    useSessionStore.getState().setSessionState('LISTENING');
    sttServiceRef.current.start();
  };

  const stopListening = () => {
    sttServiceRef.current.stop();
    useSessionStore.getState().setSessionState('IDLE');
  };

  // Send textual instruction directly (for demo / testing without mic)
  const sendInstruction = (text: string) => {
    audioQueueRef.current.initContext();
    
    // If currently speaking, interrupt first
    const curState = useSessionStore.getState().sessionState;
    if (curState === 'SPEAKING' || curState === 'TOOL_RUNNING' || curState === 'PROCESSING') {
      interrupt();
      // Small delay to let interruption propagate before sending new instruction
      setTimeout(() => {
        _sendInstructionInternal(text);
      }, 200);
    } else {
      _sendInstructionInternal(text);
    }
  };

  const _sendInstructionInternal = (text: string) => {
    const newGenId = useSessionStore.getState().currentGenerationId + 1;
    useSessionStore.getState().incrementGeneration();
    
    useSessionStore.getState().addTurn({ 
      id: Math.random().toString(), 
      role: 'USER', 
      text, 
      timestamp: Date.now(), 
      status: 'COMPLETE', 
      generationId: newGenId 
    });

    useSessionStore.getState().addEvent({
      id: Math.random().toString(),
      timestamp: Date.now(),
      type: 'USER_INSTRUCTION_SENT',
      category: 'user',
      generationId: newGenId,
      metadata: { text }
    });

    socketService.emit('transcript:final', { text, generationId: newGenId });
    useSessionStore.getState().setSessionState('PROCESSING');
  };

  return {
    startSession,
    endSession,
    startListening,
    stopListening,
    interrupt,
    sendInstruction,
    isListening: store.sessionState === 'LISTENING',
    sessionState: store.sessionState
  };
}
