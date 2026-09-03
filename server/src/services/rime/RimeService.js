const axios = require('axios');
const config = require('../../config');
const EventLogger = require('../../utils/EventLogger');
const GenerationManager = require('../voice/GenerationManager');

class RimeService {
  isAvailable() {
    return !!config.rime.apiKey;
  }

  getConfig() {
    return {
      model: config.rime.model,
      speaker: config.rime.speaker,
      language: config.rime.language,
      endpoint: config.rime.endpoint,
      audioFormat: config.rime.audioFormat,
      transport: 'http'
    };
  }

  async synthesize(text, options = {}) {
    if (!this.isAvailable()) throw new Error('RIME API Key not configured');
    try {
      const response = await axios.post(config.rime.endpoint, {
        text,
        speaker: config.rime.speaker,
        modelId: config.rime.model,
        lang: config.rime.language,
        audioFormat: config.rime.audioFormat,
        samplingRate: config.rime.sampleRate
      }, {
        headers: {
          'Authorization': `Bearer ${config.rime.apiKey}`,
          'Content-Type': 'application/json'
        },
        responseType: 'arraybuffer',
        signal: options.abortSignal
      });
      return response.data;
    } catch (error) {
      if (axios.isCancel(error)) {
        throw new Error('AbortError');
      }
      throw error;
    }
  }

  async synthesizeChunked(text, generationId, sessionId, turnId, onChunk) {
    // Basic sentence splitting for chunking
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    let sequenceNumber = 0;

    for (const sentence of sentences) {
      if (!GenerationManager.isCurrentGeneration(sessionId, generationId)) {
        EventLogger.logEvent(sessionId, 'SYNTHESIS_ABORTED_STALE_GENERATION', { generationId, turnId });
        return;
      }
      try {
        const audioData = await this.synthesize(sentence.trim());
        if (!GenerationManager.isCurrentGeneration(sessionId, generationId)) return;
        
        onChunk({
          generationId,
          sequenceNumber: sequenceNumber++,
          audioData,
          turnId,
          sessionId
        });
      } catch (err) {
        if (err.message !== 'AbortError') {
          EventLogger.logError(sessionId, err, { generationId, turnId, event: 'SYNTHESIS_ERROR' });
        }
      }
    }
  }
}

module.exports = new RimeService();
