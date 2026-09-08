import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Mic, Wrench, History, FlaskConical, Settings, Menu, X } from 'lucide-react';

export function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    { to: '/', icon: <Mic />, label: 'Live Assistant' },
    { to: '/operations', icon: <Wrench />, label: 'Operations' },
    { to: '/history', icon: <History />, label: 'History' },
    { to: '/evidence', icon: <FlaskConical />, label: 'Evidence Lab' },
    { to: '/settings', icon: <Settings />, label: 'Settings' }
  ];

  return (
    <>
      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-voiceops-card border-b border-white/5 flex items-center justify-between px-4 py-3">
        <div className="font-bold text-lg text-gray-100 flex items-center gap-2">
          <Mic className="text-voiceops-emerald w-5 h-5" /> VoiceOps
        </div>
        <button 
          onClick={() => setMobileOpen(!mobileOpen)} 
          className="p-2 rounded-lg bg-white/5 text-gray-300 hover:bg-white/10"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile slide-out nav */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)}>
          <div 
            className="w-64 h-full bg-voiceops-card border-r border-white/5 flex flex-col pt-16"
            onClick={(e) => e.stopPropagation()}
          >
            <nav className="flex-1 px-4 space-y-2 pt-4">
              {navItems.map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive ? 'bg-voiceops-emerald/10 text-voiceops-emerald' : 'text-gray-400 hover:text-gray-100 hover:bg-white/5'
                    }`
                  }
                >
                  {item.icon}
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="w-64 h-screen bg-voiceops-card border-r border-white/5 flex-col hidden md:flex">
        <div className="p-6 font-bold text-2xl text-gray-100 flex items-center gap-2">
          <Mic className="text-voiceops-emerald" /> VoiceOps
        </div>
        <nav className="flex-1 px-4 space-y-2">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive ? 'bg-voiceops-emerald/10 text-voiceops-emerald' : 'text-gray-400 hover:text-gray-100 hover:bg-white/5'
                }`
              }
            >
              {item.icon}
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </>
  );
}
