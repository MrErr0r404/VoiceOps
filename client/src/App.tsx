import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { LiveAssistant } from './pages/LiveAssistant';
import { Operations } from './pages/Operations';
import { SessionHistory } from './pages/SessionHistory';
import { EvidenceLab } from './pages/EvidenceLab';
import { Settings } from './pages/Settings';
import { ErrorBanner } from './components/ErrorBanner';
import { ConnectionIndicator } from './components/ConnectionIndicator';
import { useSessionStore } from './store/sessionStore';

function App() {
  const { error, setError } = useSessionStore();

  return (
    <BrowserRouter>
      {/* On mobile, use min-h-screen with full vertical scrolling; on desktop (md:) use fixed viewport */}
      <div className="flex flex-col md:flex-row min-h-screen md:h-screen bg-voiceops-dark text-gray-100 font-sans md:overflow-hidden">
        <Sidebar />
        
        <main className="flex-1 flex flex-col relative min-h-screen md:h-full">
          {error && (
            <ErrorBanner 
              message={error} 
              type="error" 
              onDismiss={() => setError(null)} 
            />
          )}

          <div className="absolute top-3 right-3 md:top-4 md:right-4 z-10">
            <ConnectionIndicator />
          </div>

          <div className="flex-1 w-full overflow-y-auto md:overflow-hidden">
            <Routes>
              <Route path="/" element={<LiveAssistant />} />
              <Route path="/operations" element={<Operations />} />
              <Route path="/history" element={<SessionHistory />} />
              <Route path="/evidence" element={<EvidenceLab />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </div>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
