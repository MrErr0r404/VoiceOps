const config = require('../../config');
const axios = require('axios');
const Equipment = require('../../models/Equipment');

class DemoProvider {
  async generateResponse(messages, options = {}) {
    const lastUserMsg = messages.filter(m => m.role === 'user').pop();
    const content = (lastUserMsg ? lastUserMsg.content : '').toLowerCase();

    // Quick reasoning delay to simulate natural LLM latency
    await new Promise((resolve, reject) => {
      const t = setTimeout(resolve, 350);
      if (options.abortSignal) {
        options.abortSignal.addEventListener('abort', () => {
          clearTimeout(t);
          reject(new Error('AbortError'));
        });
      }
    });

    if (options.abortSignal?.aborted) {
      throw new Error('AbortError');
    }

    // Check for Belt 7 (interrupt scenario or direct query)
    if (content.includes('belt 7') || content.includes('cb-007') || (content.includes('7') && content.includes('safety'))) {
      return {
        text: "Conveyor Belt 7 safety inspection loaded. Confirm lockout-tagout on breaker 7. Verify emergency stops operate freely, and inspect guard rails. Gloves and safety glasses required.",
        spokenText: "Conveyor Seven safety inspection loaded. Confirm lock out tag out on breaker seven. Verify emergency stops operate freely, and inspect guard rails. Gloves and safety glasses required.",
        toolsCalled: [
          { name: 'getSafetyProcedure', input: { equipmentId: 'CB-007' } }
        ],
        activeEquipmentId: 'CB-007',
        task: 'Safety Inspection on Conveyor Belt 7'
      };
    }

    // Check for Belt 4 (initial long-running scenario)
    if (content.includes('belt 4') || content.includes('cb-004') || content.includes('conveyor 4') || content.includes('conveyor belt 4')) {
      return {
        text: "Accessing maintenance procedure and inspection checklist for Conveyor Belt 4. Checking motor vibration logs and drive chain tension.",
        spokenText: "Accessing maintenance procedure and inspection checklist for Conveyor Belt Four. Checking motor vibration logs and drive chain tension.",
        toolsCalled: [
          { name: 'getInspectionChecklist', input: { equipmentId: 'CB-004' } }
        ],
        activeEquipmentId: 'CB-004',
        task: 'Maintenance Procedure & Inspection on Conveyor Belt 4'
      };
    }

    // Check for Belt 1
    if (content.includes('belt 1') || content.includes('cb-001') || content.includes('conveyor 1')) {
      return {
        text: "Conveyor Belt 1 operational status confirmed. Rollers recently serviced in Zone A. No open faults detected.",
        spokenText: "Conveyor Belt One operational status confirmed. Rollers recently serviced in Zone A. No open faults detected.",
        toolsCalled: [
          { name: 'getEquipment', input: { equipmentId: 'CB-001' } }
        ],
        activeEquipmentId: 'CB-001',
        task: 'Status Check on Conveyor Belt 1'
      };
    }

    // Cooling Pump 3
    if (content.includes('pump') || content.includes('pmp-003') || content.includes('cooling pump')) {
      return {
        text: "Cooling Pump 3 inspection checklist retrieved. Verify mechanical seal for leakage, then measure secondary coolant flow rate.",
        spokenText: "Cooling Pump Three inspection checklist retrieved. Verify mechanical seal for leakage, then measure secondary coolant flow rate.",
        toolsCalled: [
          { name: 'getInspectionChecklist', input: { equipmentId: 'PMP-003' } }
        ],
        activeEquipmentId: 'PMP-003',
        task: 'Inspection on Cooling Pump 3'
      };
    }

    // HVAC 12
    if (content.includes('hvac') || content.includes('air handler') || content.includes('hvac-012')) {
      return {
        text: "Air Handler 12 status is scheduled maintenance. Disconnect roof breaker before inspecting fan assembly. Fall protection harness mandatory.",
        spokenText: "Air Handler Twelve status is scheduled maintenance. Disconnect roof breaker before inspecting fan assembly. Fall protection harness mandatory.",
        toolsCalled: [
          { name: 'getSafetyProcedure', input: { equipmentId: 'HVAC-012' } }
        ],
        activeEquipmentId: 'HVAC-012',
        task: 'Maintenance on Air Handler 12'
      };
    }

    // General fallback operations response
    return {
      text: "VoiceOps standing by. Specify target equipment such as Conveyor Belt 4, Conveyor Belt 7, or Cooling Pump 3 for procedures and checklist guidance.",
      spokenText: "VoiceOps standing by. Specify target equipment such as Conveyor Belt Four, Conveyor Belt Seven, or Cooling Pump Three for guidance.",
      toolsCalled: [],
      activeEquipmentId: null,
      task: 'Awaiting instruction'
    };
  }
}

class OpenAIProvider {
  async generateResponse(messages, options = {}) {
    if (options.abortSignal?.aborted) throw new Error('AbortError');
    const systemPrompt = {
      role: 'system',
      content: 'You are VoiceOps, a voice-first operations assistant for industrial field technicians. Respond in short, clear sentences optimized for spoken delivery. State critical safety info first. Pronounce IDs carefully. Keep answers concise.'
    };
    const reqMessages = [systemPrompt, ...messages];

    try {
      const res = await axios.post('https://api.openai.com/v1/chat/completions', {
        model: config.llm.model || 'gpt-4o-mini',
        messages: reqMessages,
        temperature: 0.2
      }, {
        headers: {
          'Authorization': `Bearer ${config.llm.apiKey}`,
          'Content-Type': 'application/json'
        },
        signal: options.abortSignal
      });

      const responseText = res.data.choices[0]?.message?.content || "No response generated.";
      
      return {
        text: responseText,
        spokenText: responseText,
        toolsCalled: []
      };
    } catch (err) {
      if (axios.isCancel(err) || err.name === 'CanceledError') throw new Error('AbortError');
      throw err;
    }
  }
}

class LLMService {
  constructor() {
    this.provider = (config.llm.provider === 'openai' && config.llm.apiKey) 
      ? new OpenAIProvider() 
      : new DemoProvider();
    this.abortControllers = new Map();
  }

  async generateResponse(sessionId, messages, requestId) {
    const controller = new AbortController();
    this.abortControllers.set(requestId, controller);
    try {
      const response = await this.provider.generateResponse(messages, { abortSignal: controller.signal });
      return response;
    } finally {
      this.abortControllers.delete(requestId);
    }
  }

  abort(requestId) {
    if (this.abortControllers.has(requestId)) {
      this.abortControllers.get(requestId).abort();
      this.abortControllers.delete(requestId);
    }
  }
}

module.exports = new LLMService();
