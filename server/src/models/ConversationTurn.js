const mongoose = require('mongoose');

const ConversationTurnSchema = new mongoose.Schema({
  turnId: { type: String, unique: true, required: true },
  sessionId: { type: String, required: true, index: true },
  role: { type: String, enum: ['user', 'assistant', 'system'], required: true },
  transcript: { type: String },
  displayText: { type: String },
  spokenText: { type: String },
  status: { type: String, enum: ['active', 'complete', 'interrupted', 'superseded', 'error'], default: 'active' },
  createdAt: { type: Date, default: Date.now },
  supersededBy: { type: String },
  generationId: { type: Number },
  toolExecutions: { type: Array, default: [] }
});

module.exports = mongoose.model('ConversationTurn', ConversationTurnSchema);
