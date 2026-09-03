const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const config = require('./config');
const apiRoutes = require('./routes/api');
const errorHandler = require('./middleware/errorHandler');
const socketHandler = require('./sockets/socketHandler');
const EventLogger = require('./utils/EventLogger');

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json());

app.use('/api', apiRoutes);
app.use(errorHandler);

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT']
  }
});

socketHandler(io);

// Graceful MongoDB connection
mongoose.connect(config.mongoUri, { serverSelectionTimeoutMS: 2000 })
  .then(() => {
    EventLogger.logEvent('global', 'MONGODB_CONNECTED', { uri: config.mongoUri });
    console.log('Connected to MongoDB');
  })
  .catch(err => {
    EventLogger.logError('global', err, { event: 'MONGODB_CONNECTION_ERROR' });
    console.warn('MongoDB connection failed or skipped. Running with in-memory fallbacks.');
  });

server.listen(config.port, () => {
  EventLogger.logEvent('global', 'SERVER_STARTED', { 
    port: config.port,
    rimeAvailable: !!config.rime.apiKey,
    llmProvider: config.llm.provider,
    sttProvider: config.stt.provider
  });
  console.log(`VoiceOps Server running on port ${config.port}`);
});

module.exports = { app, server, io };
