const GenerationManager = require('../services/voice/GenerationManager');

describe('GenerationManager', () => {
  it('should initialize with generation 1', () => {
    expect(GenerationManager.getCurrentGeneration('s1')).toBe(1);
  });
  
  it('should increment correctly', () => {
    expect(GenerationManager.incrementGeneration('s1')).toBe(2);
    expect(GenerationManager.getCurrentGeneration('s1')).toBe(2);
  });
  
  it('isCurrentGeneration checks correctly', () => {
    GenerationManager.incrementGeneration('s2');
    const gen = GenerationManager.getCurrentGeneration('s2');
    expect(GenerationManager.isCurrentGeneration('s2', gen)).toBe(true);
    expect(GenerationManager.isCurrentGeneration('s2', gen - 1)).toBe(false);
  });

  it('keeps sessions independent', () => {
    GenerationManager.incrementGeneration('sa');
    GenerationManager.incrementGeneration('sa');
    expect(GenerationManager.getCurrentGeneration('sa')).toBe(3);
    expect(GenerationManager.getCurrentGeneration('sb')).toBe(1);
  });
});
