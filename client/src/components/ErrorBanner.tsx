import React, { useEffect } from 'react';
import { AlertCircle, X, Info, AlertTriangle } from 'lucide-react';

interface Props {
  message: string;
  type: 'error' | 'warning' | 'info';
  onDismiss: () => void;
}

export function ErrorBanner({ message, type, onDismiss }: Props) {
  useEffect(() => {
    if (type === 'warning' || type === 'info') {
      const t = setTimeout(onDismiss, 10000);
      return () => clearTimeout(t);
    }
  }, [type, onDismiss]);

  const styles = {
    error: 'bg-voiceops-red/20 border-voiceops-red text-red-200',
    warning: 'bg-voiceops-amber/20 border-voiceops-amber text-amber-200',
    info: 'bg-voiceops-blue/20 border-voiceops-blue text-blue-200'
  };

  const icons = {
    error: <AlertCircle />,
    warning: <AlertTriangle />,
    info: <Info />
  };

  return (
    <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg backdrop-blur-md animate-[slideDown_0.3s_ease-out] ${styles[type]}`}>
      {icons[type]}
      <span className="text-sm font-medium">{message}</span>
      <button onClick={onDismiss} className="ml-4 hover:opacity-70"><X size={16} /></button>
    </div>
  );
}
