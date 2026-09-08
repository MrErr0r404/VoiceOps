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
      window.speechSynthesis.cancel();
      
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

        (window as any).__voiceOpsUtterance = utterance;

        utterance.onstart = () => {
          useSessionStore.getState().setSessionState('SPEAKING');
          // Pass spoken text so bargeInDetector can filter out speaker echo
          bargeInDetectorRef.current.setAIPlaying(true, text);
        };

        utterance.onend = () => {
          bargeInDetectorRef.current.setAIPlaying(false);
          const state = useSessionStore.getState().sessionState;
          if (state === 'SPEAKING') {
            useSessionStore.getState().setSessionState('IDLE');
          }
        };

        utterance.onerror = (e) => {
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
    
    // Stop local audio playback immediately
    audioQueueRef.current.stop();
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    bargeInDetectorRef.current.setAIPlaying(false);
    
    audioQueueRef.current.playNotificationBeep(220, 0.05);

    const curGen = useSessionStore.getState().currentGenerationId;
    
    useSessionStore.getState().addEvent({ 
      id: Math.random().toString(), 
      timestamp: interruptTimestamp, 
      type: 'USER_BARGE_IN', 
      category: 'user',
      generationId: curGen
    });
    
    const turns = useSessionStore.getState().conversationTurns;
    if (turns.length > 0) {
      const lastTurn = turns[turns.length - 1];
      if (lastTurn.role === 'VOICEOPS' && lastTurn.status !== 'INTERRUPTED') {
        useSessionStore.getState().updateTurn(lastTurn.id, { status: 'INTERRUPTED' });
      }
    }

    socketService.emit('assistant:interrupt', { 
      generationId: curGen,
      timestamp: interruptTimestamp 
    });

    useSessionStore.getState().setSessionState('INTERRUPTED');
    useSessionStore.getState().incrementGeneration();
    
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

    socketService.on('session:state', (data: { state: any, generationId?: number }) => {
      if (data.state) {
        const curState = useSessionStore.getState().sessionState;
        if (curState === 'INTERRUPTED' && data.state === 'SPEAKING') {
          return;
        }
        useSessionStore.getState().setSessionState(data.state);
        
        // Auto-recover from ERROR to IDLE after 2 seconds
        if (data.state === 'ERROR') {
          setTimeout(() => {
            if (useSessionStore.getState().sessionState === 'ERROR') {
              useSessionStore.getState().setSessionState('IDLE');
            }
          }, 2000);
        }
      }
      if (data.generationId && data.generationId > useSessionStore.getState().currentGenerationId) {
        useSessionStore.setState({ currentGenerationId: data.generationId });
      }
    });

    socketService.on('tts:audio', (data: any) => {
      const genId = data.generationId;
      const rawAudio = data.audioData || data.audio;
      const curGen = useSessionStore.getState().currentGenerationId;
      const curState = useSessionStore.getState().sessionState;
      
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

    socketService.on('assistant:response-complete', (data: { turnId: string, text: string, spokenText?: string, generationId: number, equipment?: any, task?: string }) => {
      const curGen = useSessionStore.getState().currentGenerationId;
      const curState = useSessionStore.getState().sessionState;
      
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

      speakText(data.spokenText || data.text);
    });

    socketService.on('metric:update', (data: { latest?: any, aggregates?: any }) => {
      if (data.latest) {
        useSessionStore.getState().updateMetrics(data.latest);
      }
    });

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

    sttServiceRef.current.onSpeechStart = () => {
      socketService.emit('voice:speech-start');
    };

    sttServiceRef.current.onSpeechEnd = () => {
      socketService.emit('voice:speech-end');
    };

    bargeInDetectorRef.current.onBargeIn((ts) => {
      interrupt();
      const latency = Date.now() - ts;
      useSessionStore.getState().updateMetrics({ interruptionLatencyMs: latency });
    });
    
    sttServiceRef.current.onFinalTranscript = (text) => {
      useSessionStore.getState().setPartialTranscript('');
      if (!text || text.trim().length === 0) return;

      // If AI is currently playing, check for interrupt intent first
      if (bargeInDetectorRef.current.isAIPlaying()) {
        const clean = text.toLowerCase();
        const interruptKeywords = ['stop', 'wait', 'hold', 'cancel', 'no', 'halt', 'pause', 'actually'];
        const isInterrupt = interruptKeywords.some(w => clean.includes(w));
        
        if (isInterrupt) {
          bargeInDetectorRef.current.triggerBargeInIfPlaying(text);
          return;
        } else {
          // It's just speaker audio echo picked up by microphone, ignore!
          return;
        }
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

  const sendInstruction = (text: string) => {
    audioQueueRef.current.initContext();
    
    const curState = useSessionStore.getState().sessionState;
    if (curState === 'SPEAKING' || curState === 'TOOL_RUNNING' || curState === 'PROCESSING') {
      interrupt();
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
