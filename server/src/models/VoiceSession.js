const mongoose = require('mongoose');

const VoiceSessionSchema = new mongoose.Schema({
  sessionId: { type: String, unique: true, required: true },
  startedAt: { type: Date, default: Date.now },
  endedAt: { type: Date },
  selectedVoice: { type: String },
  model: { type: String },
  language: { type: String },
  status: { type: String, enum: ['active', 'ended'], default: 'active' },
  events: { type: Array, default: [] }
});

module.exports = mongoose.model('VoiceSession', VoiceSessionSchema);
