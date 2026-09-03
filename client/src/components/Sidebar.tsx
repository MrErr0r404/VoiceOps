import React from 'react';
import { NavLink } from 'react-router-dom';
import { Mic, Wrench, History, FlaskConical, Settings } from 'lucide-react';

export function Sidebar() {
  const navItems = [
    { to: '/', icon: <Mic />, label: 'Live Assistant' },
    { to: '/operations', icon: <Wrench />, label: 'Operations' },
    { to: '/history', icon: <History />, label: 'History' },
    { to: '/evidence', icon: <FlaskConical />, label: 'Evidence Lab' },
    { to: '/settings', icon: <Settings />, label: 'Settings' }
  ];

  return (
    <div className="w-64 h-screen bg-voiceops-card border-r border-white/5 flex flex-col hidden md:flex">
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
  );
}
