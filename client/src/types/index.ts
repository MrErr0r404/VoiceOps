export type SessionStateType = 'IDLE' | 'LISTENING' | 'PROCESSING' | 'TOOL_RUNNING' | 'SPEAKING' | 'INTERRUPTED' | 'ERROR';

export type TurnRole = 'USER' | 'VOICEOPS';
export type TurnStatus = 'COMPLETE' | 'INTERRUPTED' | 'SUPERSEDED' | 'ERROR';
export type ToolStatus = 'RUNNING' | 'COMPLETE' | 'CANCELLED' | 'FENCED' | 'ERROR';

export interface ConversationTurnData {
  id: string;
  role: TurnRole;
  text: string;
  timestamp: number;
  status: TurnStatus;
  generationId: number;
  toolExecutions?: string[];
}

export interface ToolExecutionData {
  id: string;
  toolName: string;
  status: ToolStatus;
  input: string;
  result?: any;
  error?: string;
  startTime: number;
  endTime?: number;
  generationId: number;
}

export interface VoiceMetricData {
  interruptionLatencyMs?: number;
  responseLatencyMs?: number;
  sttLatencyMs?: number;
  llmLatencyMs?: number;
  rimeLatencyMs?: number;
  rimeFirstAudioMs?: number;
  timestamp: number;
}

export interface SessionEventData {
  id: string;
  timestamp: number;
  type: string;
  category: 'user' | 'generation' | 'tool' | 'rime' | 'error' | 'system';
  generationId?: number;
  metadata?: any;
}

export interface EquipmentData {
  id?: string;
  equipmentId?: string;
  name: string;
  location: string;
  status: string;
  type?: string;
  safetyProcedure?: any;
  inspectionChecklist?: any;
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
  audioData?: ArrayBuffer | string;
  audio?: ArrayBuffer | string;
  turnId?: string;
  sessionId?: string;
}

export interface StressTestResult {
  passed: boolean;
  criteria: {
    audioStopped: boolean;
    oldGenerationInvalidated: boolean;
    newGenerationStarted: boolean;
    oldToolResultRejected: boolean;
    correctEquipmentActive: boolean;
  };
}
