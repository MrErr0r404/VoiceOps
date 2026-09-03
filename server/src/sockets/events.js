const EVENTS = {
  CLIENT: {
    SESSION_START: 'session:start',
    SESSION_END: 'session:end',
    SPEECH_START: 'voice:speech-start',
    SPEECH_END: 'voice:speech-end',
    TRANSCRIPT_PARTIAL: 'transcript:partial',
    TRANSCRIPT_FINAL: 'transcript:final',
    INTERRUPT: 'assistant:interrupt',
    INJECT_DELAY: 'test:inject-delay',
    SETTINGS_UPDATE: 'settings:update'
  },
  SERVER: {
    SESSION_STATE: 'session:state',
    ASSISTANT_THINKING: 'assistant:thinking',
    ASSISTANT_TEXT_DELTA: 'assistant:text-delta',
    ASSISTANT_RESPONSE_COMPLETE: 'assistant:response-complete',
    TTS_START: 'tts:start',
    TTS_AUDIO: 'tts:audio',
    TTS_END: 'tts:end',
    TTS_CANCEL: 'tts:cancel',
    TOOL_START: 'tool:start',
    TOOL_COMPLETE: 'tool:complete',
    TOOL_CANCELLED: 'tool:cancelled',
    TOOL_STALE_RESULT: 'tool:stale-result',
    METRIC_UPDATE: 'metric:update',
    SESSION_EVENT: 'session:event',
    ERROR: 'error'
  }
};

module.exports = EVENTS;
