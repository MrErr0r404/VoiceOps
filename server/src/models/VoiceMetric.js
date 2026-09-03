const mongoose = require('mongoose');

const VoiceMetricSchema = new mongoose.Schema({
  sessionId: { type: String, required: true },
  turnId: { type: String },
  generationId: { type: Number },
  sttLatency: { type: Number },
  llmLatency: { type: Number },
  rimeLatency: { type: Number },
  playbackLatency: { type: Number },
  totalResponseLatency: { type: Number },
  interruptionLatency: { type: Number },
  staleResultRejected: { type: Boolean, default: false },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('VoiceMetric', VoiceMetricSchema);
