const ToolExecutionManager = require('../services/tools/ToolExecutionManager');
const GenerationManager = require('../services/voice/GenerationManager');

jest.mock('../services/tools/toolRegistry', () => ({
  getEquipment: async (input, { abortSignal, delayMs }) => {
    return new Promise((resolve, reject) => {
      if (abortSignal?.aborted) return reject(new Error('AbortError'));
      const timer = setTimeout(() => resolve({ id: input.equipmentId }), delayMs);
      if (abortSignal) {
        abortSignal.addEventListener('abort', () => {
          clearTimeout(timer);
          reject(new Error('AbortError'));
        });
      }
    });
  }
}));

describe('ToolExecutionManager', () => {
  it('should return result if generation is valid', async () => {
    const genId = GenerationManager.getCurrentGeneration('test-session-1');
    const result = await ToolExecutionManager.executeTool('test-session-1', 't1', genId, 'getEquipment', { equipmentId: '123' }, 10);
    expect(result).toEqual({ id: '123' });
  });

  it('should return null if generation is stale', async () => {
    const genId = GenerationManager.getCurrentGeneration('test-session-2');
    
    const p = ToolExecutionManager.executeTool('test-session-2', 't2', genId, 'getEquipment', { equipmentId: '123' }, 50);
    
    GenerationManager.incrementGeneration('test-session-2'); // make it stale
    
    const result = await p;
    expect(result).toBeNull(); // fenced
  });

  it('cancelAllForGeneration should abort active tools', async () => {
    const genId = GenerationManager.getCurrentGeneration('test-session-3');
    
    const p = ToolExecutionManager.executeTool('test-session-3', 't3', genId, 'getEquipment', { equipmentId: '123' }, 100);
    
    ToolExecutionManager.cancelAllForGeneration('test-session-3', genId);
    
    const result = await p;
    expect(result).toBeNull(); // cancelled
  });
});
