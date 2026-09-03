import React from 'react';
import { useAudioVisualization } from '../hooks/useAudioVisualization';

export function AudioWaveform({ isActive, analyserNode }: { isActive: boolean, analyserNode?: AnalyserNode | null }) {
  const { canvasRef, startVisualization, stopVisualization } = useAudioVisualization();

  React.useEffect(() => {
    if (isActive && analyserNode) {
      startVisualization(analyserNode);
    } else {
      stopVisualization();
    }
  }, [isActive, analyserNode, startVisualization, stopVisualization]);

  return (
    <canvas ref={canvasRef} width={400} height={100} className="w-full max-w-md mx-auto opacity-80 rounded-xl bg-voiceops-card" />
  );
}
