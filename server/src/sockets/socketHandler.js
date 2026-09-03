const EVENTS = require('./events');
const VoiceSessionManager = require('../services/voice/VoiceSessionManager');
const EventLogger = require('../utils/EventLogger');

module.exports = (io) => {
  io.on('connection', (socket) => {
    EventLogger.logEvent('global', 'SOCKET_CONNECTED', { socketId: socket.id });

    socket.on(EVENTS.CLIENT.SESSION_START, ({ sessionId } = {}) => {
      const sid = sessionId || socket.id;
      socket.sessionId = sid;
      VoiceSessionManager.startSession(socket.id, sid, socket);
    });

    socket.on(EVENTS.CLIENT.SESSION_END, () => {
      if (socket.sessionId) VoiceSessionManager.endSession(socket.sessionId);
    });

    socket.on(EVENTS.CLIENT.SPEECH_START, () => {
      if (socket.sessionId) VoiceSessionManager.handleSpeechStart(socket.sessionId, socket);
    });

    socket.on(EVENTS.CLIENT.SPEECH_END, () => {
      if (socket.sessionId) VoiceSessionManager.handleSpeechEnd(socket.sessionId, socket);
    });

    socket.on(EVENTS.CLIENT.TRANSCRIPT_PARTIAL, ({ text } = {}) => {
      if (socket.sessionId && text) {
        socket.emit('transcript:partial', { text });
      }
    });

    socket.on(EVENTS.CLIENT.TRANSCRIPT_FINAL, ({ text, generationId } = {}) => {
      if (socket.sessionId && text) {
        VoiceSessionManager.handleFinalTranscript(socket.sessionId, text, generationId, socket, io);
      }
    });

    // Also support user:speech alias from client if sent
    socket.on('user:speech', ({ text, generationId } = {}) => {
      if (socket.sessionId && text) {
        VoiceSessionManager.handleFinalTranscript(socket.sessionId, text, generationId, socket, io);
      }
    });

    socket.on(EVENTS.CLIENT.INTERRUPT, () => {
      if (socket.sessionId) {
        VoiceSessionManager.handleInterruption(socket.sessionId, socket, io);
      }
    });

    socket.on(EVENTS.CLIENT.INJECT_DELAY, ({ delayMs } = {}) => {
      if (socket.sessionId && typeof delayMs === 'number') {
        VoiceSessionManager.updateToolDelay(socket.sessionId, delayMs);
      }
    });

    socket.on('disconnect', () => {
      EventLogger.logEvent('global', 'SOCKET_DISCONNECTED', { socketId: socket.id });
      if (socket.sessionId) VoiceSessionManager.endSession(socket.sessionId);
    });
  });
};
