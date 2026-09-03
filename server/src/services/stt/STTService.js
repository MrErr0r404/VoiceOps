const EventLogger = require('../../utils/EventLogger');

class STTService {
  constructor() {
    this.transcripts = new Map();
  }

  processPartialTranscript(sessionId, text) {
    EventLogger.logEvent(sessionId, 'STT_PARTIAL', { text });
    return text;
  }

  processFinalTranscript(sessionId, text, generationId) {
    EventLogger.logEvent(sessionId, 'STT_FINAL', { text, generationId });
    return text;
  }
}

module.exports = new STTService();
