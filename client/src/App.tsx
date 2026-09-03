import React, { useEffect } from 'react';
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
      <div className="flex h-screen bg-voiceops-dark text-gray-100 overflow-hidden font-sans">
        <Sidebar />
        
        <main className="flex-1 flex flex-col relative h-full">
          {error && (
            <ErrorBanner 
              message={error} 
              type="error" 
              onDismiss={() => setError(null)} 
            />
          )}

          <div className="absolute top-4 right-4 z-10">
            <ConnectionIndicator />
          </div>

          <div className="flex-1 h-full overflow-hidden">
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
