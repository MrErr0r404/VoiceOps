// ============================================
// VoiceOps — Shared Type Definitions
// ============================================

// --- Session States ---
export const SessionState = {
  IDLE: 'IDLE',
  LISTENING: 'LISTENING',
  PROCESSING: 'PROCESSING',
  TOOL_RUNNING: 'TOOL_RUNNING',
  SPEAKING: 'SPEAKING',
  INTERRUPTED: 'INTERRUPTED',
  ERROR: 'ERROR',
} as const;

export type SessionStateType = typeof SessionState[keyof typeof SessionState];

// --- Turn Roles ---
export const TurnRole = {
  USER: 'user',
  ASSISTANT: 'assistant',
  SYSTEM: 'system',
} as const;

export type TurnRoleType = typeof TurnRole[keyof typeof TurnRole];

// --- Turn Status ---
export const TurnStatus = {
  ACTIVE: 'active',
  COMPLETE: 'complete',
  INTERRUPTED: 'interrupted',
  SUPERSEDED: 'superseded',
  ERROR: 'error',
} as const;

export type TurnStatusType = typeof TurnStatus[keyof typeof TurnStatus];

// --- Tool Execution Status ---
export const ToolStatus = {
  PENDING: 'pending',
  RUNNING: 'running',
  COMPLETE: 'complete',
  CANCELLED: 'cancelled',
  FENCED: 'fenced',
  ERROR: 'error',
} as const;

export type ToolStatusType = typeof ToolStatus[keyof typeof ToolStatus];

// --- Socket Events: Client → Server ---
export const ClientEvents = {
  SESSION_START: 'session:start',
  SESSION_END: 'session:end',
  VOICE_SPEECH_START: 'voice:speech-start',
  VOICE_SPEECH_END: 'voice:speech-end',
  TRANSCRIPT_PARTIAL: 'transcript:partial',
  TRANSCRIPT_FINAL: 'transcript:final',
  ASSISTANT_INTERRUPT: 'assistant:interrupt',
  AUDIO_PLAYBACK_START: 'audio:playback-start',
  AUDIO_PLAYBACK_STOP: 'audio:playback-stop',
  TOOL_CANCEL: 'tool:cancel',
  TEST_INJECT_DELAY: 'test:inject-delay',
  SETTINGS_UPDATE: 'settings:update',
} as const;

// --- Socket Events: Server → Client ---
export const ServerEvents = {
  ASSISTANT_THINKING: 'assistant:thinking',
  ASSISTANT_TEXT_DELTA: 'assistant:text-delta',
  ASSISTANT_RESPONSE_COMPLETE: 'assistant:response-complete',
  TTS_START: 'tts:start',
  TTS_AUDIO: 'tts:audio',
  TTS_END: 'tts:end',
  TTS_CANCEL: 'tts:cancel',
  TOOL_START: 'tool:start',
  TOOL_COMPLETE: 'tool:complete',
  TOOL_CANCELLED: 'tool:cancelled',
  TOOL_STALE_RESULT: 'tool:stale-result',
  METRIC_UPDATE: 'metric:update',
  SESSION_EVENT: 'session:event',
  SESSION_STATE: 'session:state',
  ERROR: 'error',
} as const;

// --- Event Types for Timeline ---
export const EventType = {
  USER_SPEECH_START: 'USER_SPEECH_START',
  USER_SPEECH_END: 'USER_SPEECH_END',
  STT_PARTIAL: 'STT_PARTIAL',
  STT_FINAL: 'STT_FINAL',
  GENERATION_STARTED: 'GENERATION_STARTED',
  GENERATION_INVALIDATED: 'GENERATION_INVALIDATED',
  LLM_REQUEST_STARTED: 'LLM_REQUEST_STARTED',
  LLM_RESPONSE_COMPLETE: 'LLM_RESPONSE_COMPLETE',
  LLM_REQUEST_ABORTED: 'LLM_REQUEST_ABORTED',
  TOOL_STARTED: 'TOOL_STARTED',
  TOOL_COMPLETED: 'TOOL_COMPLETED',
  TOOL_CANCELLED: 'TOOL_CANCELLED',
  TOOL_RESULT_RECEIVED: 'TOOL_RESULT_RECEIVED',
  STALE_RESULT_REJECTED: 'STALE_RESULT_REJECTED',
  RIME_REQUEST_STARTED: 'RIME_REQUEST_STARTED',
  RIME_AUDIO_RECEIVED: 'RIME_AUDIO_RECEIVED',
  RIME_REQUEST_ABORTED: 'RIME_REQUEST_ABORTED',
  RIME_PLAYBACK_STARTED: 'RIME_PLAYBACK_STARTED',
  AUDIO_STOPPED: 'AUDIO_STOPPED',
  USER_BARGE_IN: 'USER_BARGE_IN',
  SESSION_STARTED: 'SESSION_STARTED',
  SESSION_ENDED: 'SESSION_ENDED',
  ERROR_OCCURRED: 'ERROR_OCCURRED',
} as const;

export type EventTypeType = typeof EventType[keyof typeof EventType];

// --- Data Interfaces ---
export interface ConversationTurnData {
  turnId: string;
  sessionId: string;
  role: TurnRoleType;
  transcript: string;
  displayText?: string;
  spokenText?: string;
  status: TurnStatusType;
  generationId: number;
  createdAt: string;
  supersededBy?: string;
  toolExecutions?: ToolExecutionData[];
}

export interface ToolExecutionData {
  executionId: string;
  turnId: string;
  type: string;
  input: Record<string, unknown>;
  status: ToolStatusType;
  startedAt: string;
  completedAt?: string;
  cancelledAt?: string;
  result?: unknown;
  generationId: number;
}

export interface VoiceMetricData {
  sessionId: string;
  turnId: string;
  generationId: number;
  sttLatency?: number;
  llmLatency?: number;
  rimeLatency?: number;
  playbackLatency?: number;
  totalResponseLatency?: number;
  interruptionLatency?: number;
  staleResultRejected?: boolean;
  timestamp: string;
}

export interface SessionEventData {
  timestamp: string;
  sessionId: string;
  turnId?: string;
  generationId?: number;
  event: EventTypeType;
  metadata?: Record<string, unknown>;
}

export interface EquipmentData {
  equipmentId: string;
  name: string;
  location: string;
  status: string;
  type: string;
}

export interface RimeConfig {
  model: string;
  speaker: string;
  language: string;
  endpoint: string;
  audioFormat: string;
  transport: string;
}

export interface AudioChunk {
  generationId: number;
  sequenceNumber: number;
  audioData: ArrayBuffer | string;
  turnId: string;
  sessionId: string;
}

export interface StressTestResult {
  interruptionLatencyMs: number;
  oldToolResultReceived: boolean;
  oldToolResultRejected: boolean;
  oldAudioStopped: boolean;
  currentGeneration: number;
  expectedEquipment: string;
  actualEquipment: string;
  passed: boolean;
  events: SessionEventData[];
}
