const GenerationManager = require('./GenerationManager');
const ToolExecutionManager = require('../tools/ToolExecutionManager');
const LLMService = require('../llm/LLMService');
const STTService = require('../stt/STTService');
const RimeService = require('../rime/RimeService');
const InterruptionManager = require('./InterruptionManager');
const MetricsService = require('../MetricsService');
const EventLogger = require('../../utils/EventLogger');
const Equipment = require('../../models/Equipment');
const EVENTS = require('../../sockets/events');
const { v4: uuidv4 } = require('uuid');
const config = require('../../config');

class VoiceSessionManager {
  constructor() {
    this.sessions = new Map();
  }

  getSession(sessionId) {
    if (!this.sessions.has(sessionId)) {
      this.sessions.set(sessionId, {
        state: 'IDLE',
        currentGenerationId: GenerationManager.getCurrentGeneration(sessionId),
        socketId: null,
        activeTurnId: null,
        activeRequestId: null,
        toolDelayMs: config.simulatedToolDelayMs,
        activeEquipment: null,
        currentTask: null
      });
    }
    return this.sessions.get(sessionId);
  }

  startSession(socketId, sessionId, socket) {
    const session = this.getSession(sessionId);
    session.socketId = socketId;
    session.state = 'IDLE';
    EventLogger.logEvent(sessionId, 'SESSION_STARTED', { socketId, generationId: session.currentGenerationId });
    if (socket) {
      socket.emit(EVENTS.SERVER.SESSION_STATE, { state: 'IDLE', generationId: session.currentGenerationId });
    }
  }

  endSession(sessionId) {
    EventLogger.logEvent(sessionId, 'SESSION_ENDED');
    MetricsService.persistMetrics(sessionId);
    this.sessions.delete(sessionId);
  }

  handleSpeechStart(sessionId, socket) {
    const session = this.getSession(sessionId);
    if (session.state === 'SPEAKING' || session.state === 'TOOL_RUNNING') {
      EventLogger.logEvent(sessionId, 'USER_SPEECH_DURING_ACTIVE_TURN', { 
        previousState: session.state, 
        generationId: session.currentGenerationId 
      });
    }
    session.state = 'LISTENING';
    if (socket) {
      socket.emit(EVENTS.SERVER.SESSION_STATE, { state: 'LISTENING', generationId: session.currentGenerationId });
    }
  }

  handleSpeechEnd(sessionId, socket) {
    // Awaiting final transcript
  }

  async handleFinalTranscript(sessionId, text, clientGenId, socket, io) {
    const session = this.getSession(sessionId);
    session.state = 'PROCESSING';
    
    const turnId = uuidv4();
    session.activeTurnId = turnId;
    
    // Sync or increment generation
    const genId = clientGenId || GenerationManager.incrementGeneration(sessionId);
    session.currentGenerationId = genId;
    
    EventLogger.logEvent(sessionId, 'GENERATION_STARTED', { turnId, generationId: genId });
    EventLogger.logEvent(sessionId, 'STT_FINAL', { turnId, generationId: genId, text });
    
    socket.emit(EVENTS.SERVER.SESSION_STATE, { state: 'PROCESSING', generationId: genId });
    
    MetricsService.startTimer(sessionId, turnId, 'totalResponseLatency');
    MetricsService.startTimer(sessionId, turnId, 'llmLatency');
    
    session.activeRequestId = uuidv4();
    
    try {
      // 1. LLM Generation
      socket.emit(EVENTS.SERVER.ASSISTANT_THINKING, { generationId: genId, turnId });
      
      const response = await LLMService.generateResponse(sessionId, [{ role: 'user', content: text }], session.activeRequestId);
      
      MetricsService.endTimer(sessionId, turnId, 'llmLatency');
      
      // Generation validity check after LLM
      if (session.currentGenerationId !== genId) {
        MetricsService.recordStaleRejection(sessionId, turnId);
        EventLogger.logEvent(sessionId, 'STALE_RESULT_REJECTED', { 
          turnId, 
          generationId: genId, 
          stage: 'post-llm',
          currentGeneration: session.currentGenerationId
        });
        socket.emit(EVENTS.SERVER.TOOL_STALE_RESULT, { generationId: genId, turnId });
        return;
      }

      // Update task & active equipment if present in response
      if (response.activeEquipmentId) {
        session.currentTask = response.task;
        try {
          const eq = await Equipment.findOne({ equipmentId: response.activeEquipmentId }).lean();
          if (eq) {
            session.activeEquipment = eq;
          }
        } catch (e) {
          // Fallback if db offline
          session.activeEquipment = {
            id: response.activeEquipmentId,
            equipmentId: response.activeEquipmentId,
            name: response.activeEquipmentId === 'CB-007' ? 'Conveyor Belt 7' : (response.activeEquipmentId === 'CB-004' ? 'Conveyor Belt 4' : (response.activeEquipmentId === 'CB-001' ? 'Conveyor Belt 1' : 'Cooling Pump 3')),
            location: response.activeEquipmentId === 'CB-001' ? 'Zone A' : (response.activeEquipmentId === 'CB-007' ? 'Zone C' : 'Zone B'),
            status: 'operational'
          };
        }
      }

      // 2. Tools Execution
      if (response.toolsCalled && response.toolsCalled.length > 0) {
        session.state = 'TOOL_RUNNING';
        socket.emit(EVENTS.SERVER.SESSION_STATE, { state: 'TOOL_RUNNING', generationId: genId });
        
        for (const tool of response.toolsCalled) {
          socket.emit(EVENTS.SERVER.TOOL_START, {
            toolName: tool.name,
            input: JSON.stringify(tool.input),
            generationId: genId,
            turnId
          });

          MetricsService.getOrCreateSession(sessionId).aggregates.toolExecutionsStarted++;
          
          const toolResult = await ToolExecutionManager.executeTool(
            sessionId, 
            turnId, 
            genId, 
            tool.name, 
            tool.input, 
            session.toolDelayMs
          );

          if (session.currentGenerationId !== genId) {
            MetricsService.recordStaleRejection(sessionId, turnId);
            EventLogger.logEvent(sessionId, 'STALE_RESULT_REJECTED', { 
              turnId, 
              generationId: genId, 
              toolName: tool.name,
              stage: 'post-tool',
              currentGeneration: session.currentGenerationId
            });
            socket.emit(EVENTS.SERVER.TOOL_STALE_RESULT, { 
              toolName: tool.name, 
              generationId: genId, 
              turnId 
            });
            return;
          }

          socket.emit(EVENTS.SERVER.TOOL_COMPLETE, {
            toolName: tool.name,
            result: toolResult,
            generationId: genId,
            turnId
          });
        }
      }

      // 3. Response Completion & Audio Playback
      session.state = 'SPEAKING';
      socket.emit(EVENTS.SERVER.SESSION_STATE, { state: 'SPEAKING', generationId: genId });
      
      const textToSpeak = response.spokenText || response.text;
      
      socket.emit(EVENTS.SERVER.ASSISTANT_RESPONSE_COMPLETE, {
        turnId,
        text: response.text,
        spokenText: textToSpeak,
        generationId: genId,
        equipment: session.activeEquipment,
        task: session.currentTask
      });

      EventLogger.logEvent(sessionId, 'RIME_REQUEST_STARTED', { generationId: genId, turnId });
      MetricsService.startTimer(sessionId, turnId, 'rimeLatency');

      // Synthesize via Rime if key present, else client browser speech synthesis will deliver audible speech
      if (RimeService.isAvailable()) {
        await RimeService.synthesizeChunked(textToSpeak, genId, sessionId, turnId, (chunk) => {
          if (session.currentGenerationId !== genId) return;
          MetricsService.endTimer(sessionId, turnId, 'rimeLatency');
          socket.emit(EVENTS.SERVER.TTS_AUDIO, {
            audio: chunk.audioData,
            audioData: chunk.audioData,
            generationId: chunk.generationId,
            sequenceNumber: chunk.sequenceNumber,
            turnId: chunk.turnId,
            sessionId: chunk.sessionId
          });
        });
      }

      if (session.currentGenerationId === genId) {
        session.state = 'IDLE';
        socket.emit(EVENTS.SERVER.SESSION_STATE, { state: 'IDLE', generationId: genId });
        MetricsService.endTimer(sessionId, turnId, 'totalResponseLatency');
        
        const latest = MetricsService.getLatestMetrics(sessionId);
        const agg = MetricsService.getSessionMetrics(sessionId).aggregates;
        socket.emit(EVENTS.SERVER.METRIC_UPDATE, {
          latest: {
            interruptionLatencyMs: latest?.interruptionLatency,
            responseLatencyMs: latest?.totalResponseLatency,
            rimeLatencyMs: latest?.rimeLatency,
            timestamp: Date.now()
          },
          aggregates: agg
        });
      }
      
    } catch (err) {
      if (err.message === 'AbortError' || err.name === 'AbortError') {
        EventLogger.logEvent(sessionId, 'OPERATION_ABORTED_BY_INTERRUPTION', { genId, turnId });
      } else {
        EventLogger.logError(sessionId, err, { genId, turnId });
        session.state = 'ERROR';
        socket.emit(EVENTS.SERVER.SESSION_STATE, { state: 'ERROR', generationId: genId, error: err.message });
      }
    }
  }

  handleInterruption(sessionId, socket, io) {
    const session = this.getSession(sessionId);
    session.state = 'INTERRUPTED';
    const oldGen = session.currentGenerationId;
    const newGenId = InterruptionManager.handleInterruption(sessionId, io, socket, session.activeRequestId);
    session.currentGenerationId = newGenId;

    socket.emit(EVENTS.SERVER.SESSION_STATE, { state: 'INTERRUPTED', generationId: newGenId, oldGenerationId: oldGen });
    
    // Broadcast metric update to client
    const agg = MetricsService.getSessionMetrics(sessionId).aggregates;
    const latest = MetricsService.getLatestMetrics(sessionId);
    socket.emit(EVENTS.SERVER.METRIC_UPDATE, {
      latest: {
        interruptionLatencyMs: latest?.interruptionLatency,
        timestamp: Date.now()
      },
      aggregates: agg
    });
  }

  getSessionState(sessionId) {
    return this.getSession(sessionId).state;
  }

  getSessionEvents(sessionId) {
    return EventLogger.getSessionEvents(sessionId);
  }

  updateToolDelay(sessionId, delayMs) {
    const session = this.getSession(sessionId);
    session.toolDelayMs = delayMs;
    EventLogger.logEvent(sessionId, 'TOOL_DELAY_UPDATED', { delayMs });
  }
}

module.exports = new VoiceSessionManager();
