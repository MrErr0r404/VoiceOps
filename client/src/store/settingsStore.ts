import { create } from 'zustand';

interface SettingsStore {
  simulatedToolDelayMs: number;
  demoMode: boolean;
  handsFreeModeEnabled: boolean;
  pushToTalkEnabled: boolean;
  selectedVoice: string;
  showEventTimeline: boolean;
  showMetrics: boolean;
  
  setSimulatedToolDelay: (ms: number) => void;
  setDemoMode: (enabled: boolean) => void;
  setHandsFreeMode: (enabled: boolean) => void;
  setPushToTalk: (enabled: boolean) => void;
  setSelectedVoice: (voice: string) => void;
  setShowEventTimeline: (show: boolean) => void;
  setShowMetrics: (show: boolean) => void;
}

export const useSettingsStore = create<SettingsStore>((set) => ({
  simulatedToolDelayMs: 5000,
  demoMode: true,
  handsFreeModeEnabled: true,
  pushToTalkEnabled: false,
  selectedVoice: 'amber', // Default female voice
  showEventTimeline: true,
  showMetrics: true,

  setSimulatedToolDelay: (ms) => set({ simulatedToolDelayMs: ms }),
  setDemoMode: (enabled) => set({ demoMode: enabled }),
  setHandsFreeMode: (enabled) => set({ handsFreeModeEnabled: enabled, pushToTalkEnabled: !enabled }),
  setPushToTalk: (enabled) => set({ pushToTalkEnabled: enabled, handsFreeModeEnabled: !enabled }),
  setSelectedVoice: (voice) => set({ selectedVoice: voice }),
  setShowEventTimeline: (show) => set({ showEventTimeline: show }),
  setShowMetrics: (show) => set({ showMetrics: show })
}));
