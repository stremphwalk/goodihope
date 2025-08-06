// @ts-nocheck
/**
 * DictationPopup Component
 * Beautiful circular microphone popup with gradient colors and waveform animation
 * Appears at cursor position during global dictation
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Mic, MicOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TRANSCRIPTION_STATES } from '@/hooks/useSonioxTranscription';

interface DictationPopupProps {
  isVisible: boolean;
  position: { x: number; y: number };
  transcriptionState: string;
  isRecording: boolean;
  volume: number;
  confidence?: number;
  currentTranscript?: string;
  onClose?: () => void;
  className?: string;
}

export function DictationPopup({
  isVisible,
  position,
  transcriptionState,
  isRecording,
  volume = 0,
  confidence = 0,
  currentTranscript = '',
  onClose,
  className
}: DictationPopupProps) {
  const popupRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const waveformData = useRef<number[]>(new Array(32).fill(0));
  
  // Animation state
  const [pulseScale, setPulseScale] = useState(1);
  const [waveformActive, setWaveformActive] = useState(false);

  // Waveform animation
  useEffect(() => {
    if (!isRecording || !canvasRef.current) {
      setWaveformActive(false);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      return;
    }

    setWaveformActive(true);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const animate = () => {
      // Simulate waveform data based on volume with smoother animation
      const normalizedVolume = Math.min(volume / 100, 1);
      
      // Shift existing data
      waveformData.current.shift();
      
      // Add new data point with improved randomness and smoothing
      const baseValue = normalizedVolume * 0.9;
      const randomFactor = (Math.random() - 0.5) * 0.3;
      const newValue = Math.max(0, Math.min(1, baseValue + randomFactor));
      waveformData.current.push(newValue);

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw circular waveform
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const baseRadius = 15;
      
      waveformData.current.forEach((value, index) => {
        const angle = (index / waveformData.current.length) * Math.PI * 2;
        const radius = baseRadius + (value * 8);
        
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;
        
        // Create radial gradient for each point
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, 3);
        gradient.addColorStop(0, `rgba(255, 255, 255, ${0.9 * value})`);
        gradient.addColorStop(1, `rgba(255, 255, 255, ${0.3 * value})`);
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, 1.5, 0, Math.PI * 2);
        ctx.fill();
      });

      if (isRecording) {
        animationFrameRef.current = requestAnimationFrame(animate);
      }
    };

    animate();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isRecording, volume]);

  // Pulse animation when recording
  useEffect(() => {
    if (!isRecording) {
      setPulseScale(1);
      return;
    }

    const interval = setInterval(() => {
      setPulseScale(prev => prev === 1 ? 1.05 : 1);
    }, 1200);

    return () => clearInterval(interval);
  }, [isRecording]);

  // Get popup style based on state
  const getPopupStyle = useMemo(() => {
    switch (transcriptionState) {
      case TRANSCRIPTION_STATES.CONNECTING:
        return {
          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.85) 0%, rgba(30, 64, 175, 0.85) 100%)',
          boxShadow: '0 4px 16px rgba(59, 130, 246, 0.25)',
          border: '1px solid rgba(59, 130, 246, 0.3)'
        };
      case TRANSCRIPTION_STATES.LISTENING:
        return {
          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.85) 0%, rgba(30, 64, 175, 0.85) 100%)',
          boxShadow: '0 4px 16px rgba(59, 130, 246, 0.3)',
          border: '1px solid rgba(59, 130, 246, 0.4)',
          animation: 'subtle-pulse 2s ease-in-out infinite'
        };
      case TRANSCRIPTION_STATES.PROCESSING:
        return {
          background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.85) 0%, rgba(217, 119, 6, 0.85) 100%)',
          boxShadow: '0 4px 16px rgba(245, 158, 11, 0.25)',
          border: '1px solid rgba(245, 158, 11, 0.3)'
        };
      case TRANSCRIPTION_STATES.SUCCESS:
        return {
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.85) 0%, rgba(5, 150, 105, 0.85) 100%)',
          boxShadow: '0 4px 16px rgba(16, 185, 129, 0.25)',
          border: '1px solid rgba(16, 185, 129, 0.3)'
        };
      case TRANSCRIPTION_STATES.ERROR:
        return {
          background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.85) 0%, rgba(185, 28, 28, 0.85) 100%)',
          boxShadow: '0 4px 16px rgba(239, 68, 68, 0.25)',
          border: '1px solid rgba(239, 68, 68, 0.3)'
        };
      default:
        return {
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.85) 0%, rgba(139, 92, 246, 0.85) 100%)',
          boxShadow: '0 4px 16px rgba(99, 102, 241, 0.25)',
          border: '1px solid rgba(99, 102, 241, 0.3)'
        };
    }
  }, [transcriptionState]);

  // Get icon based on state
  const getIcon = () => {
    if (transcriptionState === TRANSCRIPTION_STATES.ERROR) {
      return <MicOff className="w-5 h-5 text-white" />;
    }
    return <Mic className="w-5 h-5 text-white" />;
  };

  if (!isVisible) return null;

  return (
    <>
      <style>
        {`
          @keyframes dictation-popup-entrance {
            0% {
              opacity: 0;
              transform: scale(0.5);
            }
            100% {
              opacity: 1;
              transform: scale(1);
            }
          }
          
          @keyframes subtle-pulse {
            0%, 100% {
              transform: scale(1);
              opacity: 0.85;
            }
            50% {
              transform: scale(1.02);
              opacity: 0.95;
            }
          }
          
          .dictation-popup {
            animation: dictation-popup-entrance 0.2s ease-out;
          }
        `}
      </style>
      
      <div
        ref={popupRef}
        className={cn(
          'fixed z-[9999] dictation-popup',
          className
        )}
        style={{
          left: `${position.x - 30}px`,
          top: `${position.y - 30}px`,
          pointerEvents: 'none'
        }}
      >
        {/* Main circular popup */}
        <div
          className="relative w-12 h-12 rounded-full flex items-center justify-center backdrop-blur-sm"
          style={{
            ...getPopupStyle,
            transform: `scale(${pulseScale})`,
            transition: 'transform 0.1s ease-out'
          }}
        >
          {/* Microphone icon */}
          <div className="relative z-10">
            {getIcon()}
          </div>
          
          {/* Waveform visualization */}
          {waveformActive && (
            <div className="absolute inset-0 rounded-full overflow-hidden">
              <canvas
                ref={canvasRef}
                width="48"
                height="48"
                className="w-full h-full opacity-20"
              />
            </div>
          )}
          
          {/* Outer glow ring for recording */}
          {isRecording && (
            <div 
              className="absolute inset-0 rounded-full animate-ping"
              style={{
                background: 'radial-gradient(circle, rgba(59, 130, 246, 0.2) 0%, transparent 60%)',
                transform: 'scale(1.3)'
              }}
            />
          )}
        </div>
        
        {/* Confidence indicator */}
        {confidence > 0 && (
          <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2">
            <div className="bg-black/50 text-white text-xs px-1.5 py-0.5 rounded-full backdrop-blur-sm border border-white/10">
              {Math.round(confidence * 100)}%
            </div>
          </div>
        )}
        
        {/* Current transcript preview */}
        {currentTranscript && currentTranscript.length > 0 && (
          <div 
            className="absolute top-16 left-1/2 transform -translate-x-1/2 max-w-xs"
            style={{ pointerEvents: 'none' }}
          >
            <div className="bg-white/90 text-gray-700 text-xs px-2 py-1 rounded-md shadow-sm backdrop-blur-sm border border-white/30">
              <div className="truncate">
                {currentTranscript.length > 40 
                  ? `${currentTranscript.substring(0, 40)}...` 
                  : currentTranscript
                }
              </div>
            </div>
          </div>
        )}
        
        {/* State indicator text */}
        <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
          <div className="bg-black/50 text-white text-xs px-2 py-0.5 rounded-full backdrop-blur-sm border border-white/10">
            {transcriptionState === TRANSCRIPTION_STATES.CONNECTING && 'Connecting...'}
            {transcriptionState === TRANSCRIPTION_STATES.LISTENING && 'Listening...'}
            {transcriptionState === TRANSCRIPTION_STATES.PROCESSING && 'Processing...'}
            {transcriptionState === TRANSCRIPTION_STATES.SUCCESS && 'Done'}
            {transcriptionState === TRANSCRIPTION_STATES.ERROR && 'Error'}
            {transcriptionState === TRANSCRIPTION_STATES.IDLE && 'Ready'}
          </div>
        </div>
      </div>
    </>
  );
}

export default DictationPopup;