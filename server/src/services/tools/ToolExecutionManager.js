const tools = require('./toolRegistry');
const GenerationManager = require('../voice/GenerationManager');
const EventLogger = require('../../utils/EventLogger');
const { v4: uuidv4 } = require('uuid');

class ToolExecutionManager {
  constructor() {
    this.executions = new Map();
  }

  async executeTool(sessionId, turnId, generationId, toolName, toolInput, delayMs = 1000) {
    if (!this.executions.has(sessionId)) {
      this.executions.set(sessionId, new Map());
    }
    const sessionExecs = this.executions.get(sessionId);
    const executionId = uuidv4();
    const controller = new AbortController();
    
    sessionExecs.set(executionId, { controller, generationId, toolName, status: 'running' });
    EventLogger.logEvent(sessionId, 'TOOL_EXECUTION_STARTED', { executionId, turnId, generationId, toolName, toolInput });

    try {
      if (!tools[toolName]) throw new Error(`Tool ${toolName} not found`);
      const result = await tools[toolName](toolInput, { abortSignal: controller.signal, delayMs });
      
      // Generation fence check
      if (!GenerationManager.isCurrentGeneration(sessionId, generationId)) {
        EventLogger.logEvent(sessionId, 'STALE_RESULT_REJECTED', { executionId, turnId, generationId, toolName });
        sessionExecs.get(executionId).status = 'fenced';
        return null;
      }
      
      sessionExecs.get(executionId).status = 'complete';
      EventLogger.logEvent(sessionId, 'TOOL_EXECUTION_COMPLETED', { executionId, turnId, generationId, toolName });
      return result;
    } catch (err) {
      if (err.message === 'AbortError') {
        sessionExecs.get(executionId).status = 'cancelled';
        EventLogger.logEvent(sessionId, 'TOOL_EXECUTION_CANCELLED', { executionId, turnId, generationId, toolName });
        return null;
      }
      sessionExecs.get(executionId).status = 'error';
      EventLogger.logError(sessionId, err, { executionId, turnId, generationId, toolName });
      throw err;
    }
  }

  cancelAllForGeneration(sessionId, generationId) {
    if (!this.executions.has(sessionId)) return;
    const sessionExecs = this.executions.get(sessionId);
    for (const [executionId, exec] of sessionExecs.entries()) {
      if (exec.generationId === generationId && exec.status === 'running') {
        exec.controller.abort();
      }
    }
  }

  getActiveExecutions(sessionId) {
    if (!this.executions.has(sessionId)) return [];
    return Array.from(this.executions.get(sessionId).values()).filter(e => e.status === 'running');
  }

  getExecutionHistory(sessionId) {
    if (!this.executions.has(sessionId)) return [];
    return Array.from(this.executions.get(sessionId).values());
  }
}

module.exports = new ToolExecutionManager();
