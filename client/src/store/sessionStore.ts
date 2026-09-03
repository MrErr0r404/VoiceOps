import { create } from 'zustand';
import {
  SessionStateType, ConversationTurnData, EquipmentData,
  SessionEventData, VoiceMetricData, ToolExecutionData, RimeConfig
} from '../types';

interface SessionStore {
  sessionId: string | null;
  sessionState: SessionStateType;
  currentGenerationId: number;
  conversationTurns: ConversationTurnData[];
  activeEquipment: EquipmentData | null;
  currentTask: string | null;
  events: SessionEventData[];
  metrics: {
    latest: VoiceMetricData | null;
    history: VoiceMetricData[];
    aggregates: {
      totalInterruptions: number;
      successfulInterruptions: number;
      staleResultsBlocked: number;
      toolExecutionsStarted: number;
      toolExecutionsCancelled: number;
    }
  };
  toolExecutions: ToolExecutionData[];
  partialTranscript: string;
  isConnected: boolean;
  rimeConfig: RimeConfig | null;
  error: string | null;

  setSessionState: (state: SessionStateType) => void;
  addTurn: (turn: ConversationTurnData) => void;
  updateTurn: (id: string, updates: Partial<ConversationTurnData>) => void;
  addEvent: (event: SessionEventData) => void;
  updateMetrics: (metrics: Partial<VoiceMetricData>) => void;
  setPartialTranscript: (text: string) => void;
  setConnected: (connected: boolean) => void;
  setError: (error: string | null) => void;
  setRimeConfig: (config: RimeConfig | null) => void;
  setActiveEquipment: (equipment: EquipmentData | null) => void;
  setCurrentTask: (task: string | null) => void;
  addToolExecution: (execution: ToolExecutionData) => void;
  updateToolExecution: (id: string, updates: Partial<ToolExecutionData>) => void;
  incrementGeneration: () => void;
  reset: () => void;
}

export const useSessionStore = create<SessionStore>((set) => ({
  sessionId: null,
  sessionState: 'IDLE',
  currentGenerationId: 0,
  conversationTurns: [],
  activeEquipment: null,
  currentTask: null,
  events: [],
  metrics: {
    latest: null,
    history: [],
    aggregates: {
      totalInterruptions: 0,
      successfulInterruptions: 0,
      staleResultsBlocked: 0,
      toolExecutionsStarted: 0,
      toolExecutionsCancelled: 0
    }
  },
  toolExecutions: [],
  partialTranscript: '',
  isConnected: false,
  rimeConfig: null,
  error: null,

  setSessionState: (state) => set({ sessionState: state }),
  addTurn: (turn) => set((state) => ({ conversationTurns: [...state.conversationTurns, turn] })),
  updateTurn: (id, updates) => set((state) => ({
    conversationTurns: state.conversationTurns.map(t => t.id === id ? { ...t, ...updates } : t)
  })),
  addEvent: (event) => set((state) => ({ events: [...state.events, event] })),
  updateMetrics: (newMetrics) => set((state) => {
    const latest = { ...state.metrics.latest, ...newMetrics, timestamp: Date.now() };
    return {
      metrics: {
        ...state.metrics,
        latest,
        history: [...state.metrics.history, latest]
      }
    };
  }),
  setPartialTranscript: (text) => set({ partialTranscript: text }),
  setConnected: (connected) => set({ isConnected: connected }),
  setError: (error) => set({ error }),
  setRimeConfig: (config) => set({ rimeConfig: config }),
  setActiveEquipment: (equipment) => set({ activeEquipment: equipment }),
  setCurrentTask: (task) => set({ currentTask: task }),
  addToolExecution: (execution) => set((state) => {
    state.metrics.aggregates.toolExecutionsStarted++;
    return { toolExecutions: [...state.toolExecutions, execution] };
  }),
  updateToolExecution: (id, updates) => set((state) => {
    const updated = state.toolExecutions.map(e => e.id === id ? { ...e, ...updates } : e);
    if (updates.status === 'CANCELLED') state.metrics.aggregates.toolExecutionsCancelled++;
    return { toolExecutions: updated };
  }),
  incrementGeneration: () => set((state) => ({ currentGenerationId: state.currentGenerationId + 1 })),
  reset: () => set({
    sessionId: null, sessionState: 'IDLE', currentGenerationId: 0, conversationTurns: [],
    activeEquipment: null, currentTask: null, events: [], metrics: { latest: null, history: [], aggregates: { totalInterruptions: 0, successfulInterruptions: 0, staleResultsBlocked: 0, toolExecutionsStarted: 0, toolExecutionsCancelled: 0 } },
    toolExecutions: [], partialTranscript: '', error: null
  })
}));
