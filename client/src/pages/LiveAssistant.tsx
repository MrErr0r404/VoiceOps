import React, { useState } from 'react';
import { useVoiceSession } from '../hooks/useVoiceSession';
import { ConversationTimeline } from '../components/ConversationTimeline';
import { MicrophoneControls } from '../components/MicrophoneControls';
import { SessionStatus } from '../components/SessionStatus';
import { VoiceOrb } from '../components/VoiceOrb';
import { AudioWaveform } from '../components/AudioWaveform';
import { OperationalContext } from '../components/OperationalContext';
import { MetricsPanel } from '../components/MetricsPanel';
import { EventTimeline } from '../components/EventTimeline';
import { useSettingsStore } from '../store/settingsStore';
import { Send } from 'lucide-react';

export function LiveAssistant() {
  const { endSession, startListening, stopListening, interrupt, isListening, sessionState, sendInstruction } = useVoiceSession();
  const { showEventTimeline, showMetrics } = useSettingsStore();
  const [inputText, setInputText] = useState('');
  const [activeTab, setActiveTab] = useState<'chat' | 'voice' | 'context'>('voice');

  const handleSendText = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    sendInstruction(inputText.trim());
    setInputText('');
  };

  return (
    <div className="flex flex-col min-h-screen md:h-full pt-14 md:pt-0">
      {/* Mobile sticky tab switcher */}
      <div className="flex md:hidden sticky top-14 z-30 border-b border-white/10 bg-voiceops-card/95 backdrop-blur-md">
        <button 
          onClick={() => setActiveTab('chat')}
          className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors ${activeTab === 'chat' ? 'text-voiceops-emerald border-b-2 border-voiceops-emerald bg-white/5' : 'text-gray-400'}`}
        >
          Chat
        </button>
        <button 
          onClick={() => setActiveTab('voice')}
          className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors ${activeTab === 'voice' ? 'text-voiceops-blue border-b-2 border-voiceops-blue bg-white/5' : 'text-gray-400'}`}
        >
          Voice
        </button>
        <button 
          onClick={() => setActiveTab('context')}
          className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors ${activeTab === 'context' ? 'text-voiceops-amber border-b-2 border-voiceops-amber bg-white/5' : 'text-gray-400'}`}
        >
          Context
        </button>
      </div>

      {/* Main Container - allows natural scrolling on phone, flex on desktop */}
      <div className="flex flex-col lg:flex-row flex-1 gap-4 p-3 md:p-4 overflow-y-auto md:overflow-hidden pb-24 md:pb-4">
        
        {/* LEFT: Conversation (Chat tab on mobile) */}
        <div className={`w-full lg:w-1/3 flex flex-col glass-card ${activeTab === 'chat' ? 'flex' : 'hidden'} md:flex lg:h-full min-h-[500px]`}>
          <div className="flex-1 overflow-y-auto max-h-[60vh] md:max-h-none">
            <ConversationTimeline />
          </div>
          
          {/* Quick Text Input */}
          <form onSubmit={handleSendText} className="p-2 px-3 md:px-4 border-t border-white/5 flex gap-2 shrink-0">
            <input 
              type="text" 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Speak or type command (e.g. Check Belt 4)..."
              className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-voiceops-blue"
            />
            <button 
              type="submit" 
              className="p-2 px-3 bg-voiceops-blue hover:bg-blue-600 rounded-lg text-sm font-bold text-white flex items-center gap-1 transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

          <div className="p-3 md:p-4 border-t border-white/5 shrink-0 bg-voiceops-card">
            <MicrophoneControls 
              isListening={isListening} 
              isSpeaking={sessionState === 'SPEAKING'}
              onToggleMic={isListening ? stopListening : startListening}
              onInterrupt={interrupt}
              onEndSession={endSession}
            />
          </div>
        </div>

        {/* CENTER: Voice UI (Voice tab on mobile) */}
        <div className={`w-full lg:w-1/3 flex flex-col items-center justify-start md:justify-center p-4 md:p-8 relative ${activeTab === 'voice' ? 'flex' : 'hidden'} md:flex space-y-4`}>
          
          {/* Status Badge */}
          <div className="w-full flex justify-center pt-2">
            <SessionStatus state={sessionState} />
          </div>
          
          {/* Scaled Voice Orb for mobile */}
          <div className="py-2">
            <VoiceOrb state={sessionState} />
          </div>
          
          {/* Status text */}
          <div className="text-center text-gray-400 text-sm h-10 flex flex-col items-center justify-center px-2">
            {sessionState === 'LISTENING' && <span className="text-voiceops-emerald font-semibold animate-pulse">Listening for voice...</span>}
            {sessionState === 'PROCESSING' && <span className="text-voiceops-blue font-semibold">Reasoning operations...</span>}
            {sessionState === 'SPEAKING' && <span className="text-purple-400 font-semibold">Rime speaking output...</span>}
            {sessionState === 'TOOL_RUNNING' && <span className="text-voiceops-amber font-semibold animate-pulse">Running equipment tool (delayed)...</span>}
            {sessionState === 'INTERRUPTED' && <span className="text-voiceops-red font-bold animate-bounce">INTERRUPTED! Halting stale audio & tools</span>}
            {sessionState === 'IDLE' && <span className="text-gray-400">Ready. Tap microphone or use queries below.</span>}
            {sessionState === 'ERROR' && <span className="text-voiceops-red font-semibold">Ready. Tap microphone to start.</span>}
          </div>

          {/* Audio Waveform */}
          <div className="w-full max-w-xs md:max-w-md">
            <AudioWaveform isActive={sessionState === 'SPEAKING'} />
          </div>

          {/* Quick preset scenario buttons */}
          <div className="flex flex-col gap-2 w-full max-w-xs items-center pt-2">
            <button 
              onClick={() => sendInstruction("Find the maintenance procedure for Conveyor Belt 4 and guide me through the inspection.")}
              className="w-full py-2.5 px-4 bg-white/5 active:bg-white/20 hover:bg-white/10 border border-white/10 rounded-xl text-xs text-gray-200 transition-colors font-medium shadow-sm"
            >
              "Guide inspection for Belt 4"
            </button>
            <button 
              onClick={() => sendInstruction("Stop. Actually check Conveyor Belt 7 instead and only give me the safety inspection.")}
              className="w-full py-2.5 px-4 bg-voiceops-red/10 active:bg-voiceops-red/30 hover:bg-voiceops-red/20 border border-voiceops-red/30 rounded-xl text-xs text-voiceops-red transition-colors font-medium shadow-sm"
            >
              "Stop, switch to Belt 7 safety"
            </button>
            <button 
              onClick={() => sendInstruction("Give me the inspection procedure for Cooling Pump 3.")}
              className="w-full py-2.5 px-4 bg-white/5 active:bg-white/20 hover:bg-white/10 border border-white/10 rounded-xl text-xs text-gray-200 transition-colors font-medium shadow-sm"
            >
              "Cooling Pump 3 checklist"
            </button>
          </div>

          {/* Prominent Floating Controls Bar on mobile - always visible at screen bottom */}
          <div className="w-full max-w-sm pt-4 md:hidden sticky bottom-4 z-20">
            <div className="bg-voiceops-card/95 border border-white/10 backdrop-blur-xl rounded-2xl p-2 shadow-2xl">
              <MicrophoneControls 
                isListening={isListening} 
                isSpeaking={sessionState === 'SPEAKING'}
                onToggleMic={isListening ? stopListening : startListening}
                onInterrupt={interrupt}
                onEndSession={endSession}
              />
            </div>
          </div>
        </div>

        {/* RIGHT: Context & Metrics (Context tab on mobile) */}
        <div className={`w-full lg:w-1/3 flex flex-col gap-4 overflow-y-auto ${activeTab === 'context' ? 'flex' : 'hidden'} md:flex`}>
          <OperationalContext />
          {showMetrics && <MetricsPanel />}
          {showEventTimeline && (
            <div className="mt-auto">
              <h3 className="text-xs font-bold text-gray-500 mb-2 uppercase">Event Timeline</h3>
              <EventTimeline />
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
