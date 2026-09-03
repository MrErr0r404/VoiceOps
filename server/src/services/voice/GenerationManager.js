const EventLogger = require('../../utils/EventLogger');

class GenerationManager {
  constructor() {
    this.sessions = new Map();
  }

  getOrCreateSession(sessionId) {
    if (!this.sessions.has(sessionId)) {
      this.sessions.set(sessionId, { current: 1, history: [] });
    }
    return this.sessions.get(sessionId);
  }

  getCurrentGeneration(sessionId) {
    return this.getOrCreateSession(sessionId).current;
  }

  incrementGeneration(sessionId) {
    const session = this.getOrCreateSession(sessionId);
    session.history.push(session.current);
    session.current++;
    return session.current;
  }

  isCurrentGeneration(sessionId, generationId) {
    return this.getCurrentGeneration(sessionId) === generationId;
  }

  invalidateGeneration(sessionId, oldGenId) {
    EventLogger.logEvent(sessionId, 'GENERATION_INVALIDATED', { oldGenId, newGenId: this.getCurrentGeneration(sessionId) });
  }

  getGenerationHistory(sessionId) {
    return this.getOrCreateSession(sessionId).history;
  }
}

module.exports = new GenerationManager();
