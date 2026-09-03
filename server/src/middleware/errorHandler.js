const EventLogger = require('../utils/EventLogger');

module.exports = (err, req, res, next) => {
  EventLogger.logError(req.body?.sessionId || 'global', err, { path: req.path, method: req.method });
  
  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: 'Validation Error', details: err.message });
  }
  if (err.name === 'CastError') {
    return res.status(400).json({ error: 'Invalid ID format' });
  }
  if (err.code === 11000) {
    return res.status(400).json({ error: 'Duplicate Key Error' });
  }
  
  res.status(500).json({ error: 'Internal Server Error' });
};
