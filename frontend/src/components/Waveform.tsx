import { useEffect, useRef, useState } from "react";
import { cn } from "../lib/utils";

interface WaveformProps {
  isListening: boolean;
  className?: string;
  color?: string;
  simulate?: boolean;
}

export function Waveform({ isListening, className, color = "stroke-white", simulate = false }: WaveformProps) {
  const [volumes, setVolumes] = useState<number[]>([0.1, 0.1, 0.1]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const requestRef = useRef<number>(0);

  useEffect(() => {
    let active = true;

    if (isListening) {
      if (simulate) {
        // Run energetic math-based simulation instead of capturing mic
        let time = 0;
        const fallbackAnim = () => {
          if (!active) return;
          time += 0.1;
          setVolumes([
            0.3 + Math.sin(time * 2.5) * 0.2 + Math.sin(time * 5) * 0.1,
            0.3 + Math.cos(time * 3.1) * 0.2 + Math.sin(time * 4) * 0.1,
            0.3 + Math.sin(time * 1.8) * 0.2 + Math.cos(time * 6) * 0.1,
          ]);
          requestRef.current = requestAnimationFrame(fallbackAnim);
        };
        fallbackAnim();
        return;
      }

      navigator.mediaDevices.getUserMedia({ audio: true })
        .then((stream) => {
          if (!active) return;
          streamRef.current = stream;
          const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
          const ctx = new AudioContextClass() as AudioContext;
          audioContextRef.current = ctx;
          
          const analyser = ctx.createAnalyser();
          analyser.fftSize = 256;
          analyserRef.current = analyser;
          
          const source = ctx.createMediaStreamSource(stream);
          source.connect(analyser);

          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          
          const updateVolume = () => {
            if (!active) return;
            analyser.getByteFrequencyData(dataArray);
            
            // Focus on speech frequency bins (lower/mid range) instead of the whole spectrum
            let sum1 = 0, sum2 = 0, sum3 = 0;
            for (let i = 2; i < 15; i++) sum1 += dataArray[i];
            for (let i = 15; i < 30; i++) sum2 += dataArray[i];
            for (let i = 30; i < 50; i++) sum3 += dataArray[i];
            
            // Map to 0-1 range, severely boost amplitude so normal speech is visible
            const avg1 = (sum1 / (13 * 255)) * 4.0; 
            const avg2 = (sum2 / (15 * 255)) * 4.0;
            const avg3 = (sum3 / (20 * 255)) * 4.0;
            
            setVolumes([
              Math.min(1, Math.max(0.15, avg1)),
              Math.min(1, Math.max(0.15, avg2)),
              Math.min(1, Math.max(0.15, avg3)),
            ]);
            
            requestRef.current = requestAnimationFrame(updateVolume);
          };
          updateVolume();
        })
        .catch((err) => {
          console.warn("Microphone access denied or error:", err);
          // Fallback to random subtle animation if mic is blocked
          let time = 0;
          const fallbackAnim = () => {
            if (!active) return;
            time += 0.1;
            setVolumes([
              0.2 + Math.sin(time) * 0.15,
              0.2 + Math.cos(time * 1.5) * 0.15,
              0.2 + Math.sin(time * 0.8) * 0.15,
            ]);
            requestRef.current = requestAnimationFrame(fallbackAnim);
          };
          fallbackAnim();
        });
    } else {
      // Return to idle state
      setVolumes([0.1, 0.1, 0.1]);
    }

    return () => {
      active = false;
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
        audioContextRef.current = null;
      }
    };
  }, [isListening]);

  // Generate smooth paths based on volume
  // Base SVG is 400x100. Center is y=50. Max deviation is 45px up/down.
  const amp1 = volumes[0] * 45;
  const amp2 = volumes[1] * 40;
  const amp3 = volumes[2] * 35;

  return (
    <svg viewBox="0 0 400 100" className={cn("w-full transition-all duration-75", className, color)} fill="none" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      {/* Wave 1 */}
      <path d={`M0,50 Q50,${50 - amp1} 100,50 T200,50 T300,50 T400,50`} className="transition-all duration-100 ease-out" opacity={0.5} />
      {/* Wave 2 */}
      <path d={`M0,50 Q50,${50 + amp2} 100,50 T200,50 T300,50 T400,50`} className="transition-all duration-100 ease-out" opacity={0.8} />
      {/* Wave 3 */}
      <path d={`M0,50 Q50,${50 - amp3} 100,50 T200,50 T300,50 T400,50`} className="transition-all duration-100 ease-out" opacity={0.4} />
    </svg>
  );
}
