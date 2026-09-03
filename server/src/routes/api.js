const express = require('express');
const router = express.Router();
const Equipment = require('../models/Equipment');
const VoiceSession = require('../models/VoiceSession');
const MetricsService = require('../services/MetricsService');
const EventLogger = require('../utils/EventLogger');
const config = require('../config');

router.get('/health', (req, res) => {
  res.json({ status: 'ok', rimeAvailable: !!config.rime.apiKey });
});

router.get('/equipment', async (req, res) => {
  const eq = await Equipment.find({});
  res.json(eq);
});

router.get('/equipment/:id', async (req, res) => {
  const eq = await Equipment.findOne({ equipmentId: req.params.id });
  if (!eq) return res.status(404).json({ error: 'Not found' });
  res.json(eq);
});

router.get('/sessions', async (req, res) => {
  const sessions = await VoiceSession.find({});
  res.json(sessions);
});

router.get('/sessions/:id', async (req, res) => {
  const session = await VoiceSession.findOne({ sessionId: req.params.id });
  if (!session) return res.status(404).json({ error: 'Not found' });
  res.json(session);
});

router.get('/sessions/:id/events', (req, res) => {
  res.json(EventLogger.getSessionEvents(req.params.id));
});

router.get('/sessions/:id/metrics', (req, res) => {
  res.json(MetricsService.getSessionMetrics(req.params.id));
});

router.get('/config/rime', (req, res) => {
  const { apiKey, ...safeConfig } = config.rime;
  res.json(safeConfig);
});

router.put('/settings/tool-delay', (req, res) => {
  const { delayMs } = req.body;
  if (typeof delayMs === 'number') {
    config.simulatedToolDelayMs = delayMs;
    res.json({ success: true, delayMs });
  } else {
    res.status(400).json({ error: 'Invalid delayMs' });
  }
});

module.exports = router;
