const ToolExecutionManager = require('../services/tools/ToolExecutionManager');
const GenerationManager = require('../services/voice/GenerationManager');
const EventLogger = require('../utils/EventLogger');

jest.mock('../services/tools/toolRegistry', () => ({
  getInspectionChecklist: async (input, { abortSignal, delayMs }) => {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => resolve({ checklist: 'checklist-1' }), delayMs);
      if (abortSignal) {
        abortSignal.addEventListener('abort', () => {
          clearTimeout(timer);
          reject(new Error('AbortError'));
        });
      }
    });
  },
  getSafetyProcedure: async (input, { abortSignal, delayMs }) => {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => resolve({ safety: 'safety-1' }), delayMs);
      if (abortSignal) {
        abortSignal.addEventListener('abort', () => {
          clearTimeout(timer);
          reject(new Error('AbortError'));
        });
      }
    });
  }
}));

describe('Interruption Acceptance Test', () => {
  it('handles interruption and fences old tool results', async () => {
    const sid = 'int-session';
    const gen1 = GenerationManager.getCurrentGeneration(sid);
    expect(gen1).toBe(1);

    // 1. Start old tool
    const p1 = ToolExecutionManager.executeTool(sid, 't1', gen1, 'getInspectionChecklist', { equipmentId: 'CB-004' }, 50);

    // 2. Simulate interruption
    const gen2 = GenerationManager.incrementGeneration(sid);
    ToolExecutionManager.cancelAllForGeneration(sid, gen1);

    // 3. Start new tool
    const p2 = ToolExecutionManager.executeTool(sid, 't2', gen2, 'getSafetyProcedure', { equipmentId: 'CB-007' }, 10);

    const [r1, r2] = await Promise.all([p1, p2]);

    // 4. Verify outcomes
    expect(r1).toBeNull(); // fenced or cancelled
    expect(r2).toEqual({ safety: 'safety-1' });
    expect(GenerationManager.getCurrentGeneration(sid)).toBe(2);
    
    const events = EventLogger.getSessionEvents(sid);
    const cancelEvents = events.filter(e => e.event === 'TOOL_EXECUTION_CANCELLED' || e.event === 'STALE_RESULT_REJECTED');
    expect(cancelEvents.length).toBeGreaterThan(0);
  });
});
