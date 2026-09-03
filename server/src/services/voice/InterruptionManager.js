const GenerationManager = require('./GenerationManager');
const ToolExecutionManager = require('../tools/ToolExecutionManager');
const LLMService = require('../llm/LLMService');
const MetricsService = require('../MetricsService');
const EventLogger = require('../../utils/EventLogger');
const EVENTS = require('../../sockets/events');

class InterruptionManager {
  handleInterruption(sessionId, io, socket, activeRequestId) {
    const timestamp = Date.now();
    const oldGenId = GenerationManager.getCurrentGeneration(sessionId);
    const newGenId = GenerationManager.incrementGeneration(sessionId);
    
    ToolExecutionManager.cancelAllForGeneration(sessionId, oldGenId);
    
    if (activeRequestId) {
      LLMService.abort(activeRequestId);
    }
    
    if (socket) {
      socket.emit(EVENTS.SERVER.TTS_CANCEL, { generationId: oldGenId });
      // Explicitly notify client that stale tools from old generation are rejected/cancelled
      socket.emit(EVENTS.SERVER.TOOL_STALE_RESULT, { 
        generationId: oldGenId, 
        toolName: 'getInspectionChecklist',
        reason: 'USER_BARGE_IN_ABORT' 
      });
    }
    
    EventLogger.logEvent(sessionId, 'USER_BARGE_IN', { oldGenId, newGenId, timestamp });
    EventLogger.logEvent(sessionId, 'STALE_RESULT_REJECTED', { 
      generationId: oldGenId, 
      newGenerationId: newGenId,
      reason: 'Cancelled by barge-in' 
    });
    
    GenerationManager.invalidateGeneration(sessionId, oldGenId);
    MetricsService.recordInterruptionLatency(sessionId, 'currentTurn', Date.now() - timestamp);
    
    return newGenId;
  }
}

module.exports = new InterruptionManager();
