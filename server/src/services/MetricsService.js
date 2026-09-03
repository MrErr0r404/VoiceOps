const VoiceMetric = require('../models/VoiceMetric');

class MetricsService {
  constructor() {
    this.metrics = new Map();
  }

  getOrCreateSession(sessionId) {
    if (!this.metrics.has(sessionId)) {
      this.metrics.set(sessionId, {
        metrics: [],
        timers: new Map(),
        aggregates: {
          totalInterruptions: 0,
          successfulInterruptions: 0,
          staleResultsBlocked: 0,
          toolExecutionsStarted: 0,
          toolExecutionsCancelled: 0
        }
      });
    }
    return this.metrics.get(sessionId);
  }

  startTimer(sessionId, turnId, metric) {
    const session = this.getOrCreateSession(sessionId);
    const key = `${turnId}:${metric}`;
    session.timers.set(key, Date.now());
  }

  endTimer(sessionId, turnId, metric) {
    const session = this.getOrCreateSession(sessionId);
    const key = `${turnId}:${metric}`;
    const startTime = session.timers.get(key);
    if (!startTime) return null;
    const duration = Date.now() - startTime;
    session.timers.delete(key);
    
    let turnMetrics = session.metrics.find(m => m.turnId === turnId);
    if (!turnMetrics) {
      turnMetrics = { turnId, sessionId, timestamp: new Date() };
      session.metrics.push(turnMetrics);
    }
    turnMetrics[metric] = duration;
    return duration;
  }

  recordInterruptionLatency(sessionId, turnId, latencyMs) {
    const session = this.getOrCreateSession(sessionId);
    session.aggregates.totalInterruptions++;
    session.aggregates.successfulInterruptions++;
    
    let turnMetrics = session.metrics.find(m => m.turnId === turnId);
    if (!turnMetrics) {
      turnMetrics = { turnId, sessionId, timestamp: new Date() };
      session.metrics.push(turnMetrics);
    }
    turnMetrics.interruptionLatency = latencyMs;
  }

  recordStaleRejection(sessionId, turnId) {
    const session = this.getOrCreateSession(sessionId);
    session.aggregates.staleResultsBlocked++;
    let turnMetrics = session.metrics.find(m => m.turnId === turnId);
    if (!turnMetrics) {
      turnMetrics = { turnId, sessionId, timestamp: new Date() };
      session.metrics.push(turnMetrics);
    }
    turnMetrics.staleResultRejected = true;
  }

  getSessionMetrics(sessionId) {
    return this.getOrCreateSession(sessionId);
  }

  getLatestMetrics(sessionId) {
    const session = this.getOrCreateSession(sessionId);
    return session.metrics[session.metrics.length - 1];
  }

  async persistMetrics(sessionId) {
    const session = this.getOrCreateSession(sessionId);
    if (session.metrics.length > 0) {
      await VoiceMetric.insertMany(session.metrics.map(m => ({ ...m, sessionId })));
    }
  }
}

module.exports = new MetricsService();
