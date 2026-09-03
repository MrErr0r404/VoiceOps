const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/voiceops',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  rime: {
    apiKey: process.env.RIME_API_KEY || '',
    model: process.env.RIME_MODEL || 'mist',
    speaker: process.env.RIME_SPEAKER || 'amber', // Amber (natural female voice)
    language: process.env.RIME_LANGUAGE || 'en',
    endpoint: process.env.RIME_ENDPOINT || 'https://users.rime.ai/v1/rime-tts',
    audioFormat: process.env.RIME_AUDIO_FORMAT || 'mp3',
    sampleRate: parseInt(process.env.RIME_SAMPLE_RATE || '22050', 10),
  },
  stt: {
    provider: process.env.STT_PROVIDER || 'browser',
    apiKey: process.env.STT_API_KEY || '',
  },
  llm: {
    provider: process.env.LLM_PROVIDER || 'demo',
    apiKey: process.env.LLM_API_KEY || '',
    model: process.env.LLM_MODEL || 'gpt-4o-mini',
  },
  simulatedToolDelayMs: parseInt(process.env.SIMULATED_TOOL_DELAY_MS || '5000', 10),
  demoMode: process.env.DEMO_MODE !== 'false',
  nodeEnv: process.env.NODE_ENV || 'development',
};

module.exports = config;
