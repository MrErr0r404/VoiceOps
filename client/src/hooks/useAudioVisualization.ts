import { useEffect, useRef, useState } from 'react';

export function useAudioVisualization() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [analyserNode, setAnalyserNode] = useState<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number>();

  useEffect(() => {
    if (analyserNode && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const bufferLength = analyserNode.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const draw = () => {
        animationFrameRef.current = requestAnimationFrame(draw);
        analyserNode.getByteFrequencyData(dataArray);

        ctx.fillStyle = '#0a0a0f'; // Matches bg-voiceops-dark
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const barWidth = (canvas.width / bufferLength) * 2.5;
        let barHeight;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          barHeight = dataArray[i] / 2;
          ctx.fillStyle = `rgb(16, 185, 129)`; // Matches voiceops-emerald
          ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
          x += barWidth + 1;
        }
      };

      draw();
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [analyserNode]);

  const startVisualization = (analyser: AnalyserNode) => setAnalyserNode(analyser);
  const stopVisualization = () => setAnalyserNode(null);

  return { canvasRef, analyserNode, startVisualization, stopVisualization };
}
