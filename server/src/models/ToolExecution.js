const mongoose = require('mongoose');

const ToolExecutionSchema = new mongoose.Schema({
  executionId: { type: String, unique: true, required: true },
  turnId: { type: String, required: true },
  sessionId: { type: String, required: true },
  type: { type: String, required: true },
  input: { type: mongoose.Schema.Types.Mixed },
  status: { type: String, enum: ['pending', 'running', 'complete', 'cancelled', 'fenced', 'error'], default: 'pending' },
  startedAt: { type: Date },
  completedAt: { type: Date },
  cancelledAt: { type: Date },
  result: { type: mongoose.Schema.Types.Mixed },
  generationId: { type: Number }
});

module.exports = mongoose.model('ToolExecution', ToolExecutionSchema);
