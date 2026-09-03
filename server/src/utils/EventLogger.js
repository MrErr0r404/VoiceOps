const winston = require('winston');

class EventLogger {
  constructor() {
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.printf(({ timestamp, level, message, sessionId, turnId, generationId, event, metadata }) => {
              return `[${timestamp}] ${level}: [Session: ${sessionId || 'N/A'}] [Gen: ${generationId || 'N/A'}] Event: ${event || message} ${metadata ? JSON.stringify(metadata) : ''}`;
            })
          )
        })
      ]
    });
    this.events = new Map();
  }

  logEvent(sessionId, event, data = {}) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      sessionId,
      turnId: data.turnId,
      generationId: data.generationId,
      event,
      metadata: data
    };

    if (sessionId) {
      if (!this.events.has(sessionId)) {
        this.events.set(sessionId, []);
      }
      this.events.get(sessionId).push(logEntry);
    }

    this.logger.info(event, logEntry);
  }

  logError(sessionId, error, data = {}) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      sessionId,
      turnId: data.turnId,
      generationId: data.generationId,
      event: 'ERROR',
      metadata: { ...data, error: error.message, stack: error.stack }
    };

    if (sessionId) {
      if (!this.events.has(sessionId)) {
        this.events.set(sessionId, []);
      }
      this.events.get(sessionId).push(logEntry);
    }

    this.logger.error(error.message, logEntry);
  }

  getSessionEvents(sessionId) {
    return this.events.get(sessionId) || [];
  }
}

module.exports = new EventLogger();
