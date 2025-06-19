import { useEffect, useState } from 'react';
import { Stethoscope } from 'lucide-react';

interface StartupAnimationProps {
  onComplete: () => void;
  appName?: string;
  customLogo?: React.ReactNode;
  duration?: number;
}

export function StartupAnimation({ 
  onComplete, 
  appName = "Arinote",
  customLogo,
  duration = 1400 
}: StartupAnimationProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFadeOut(true);
      setTimeout(() => {
        setIsVisible(false);
        onComplete();
      }, 600);
    }, duration - 600);

    return () => clearTimeout(timer);
  }, [onComplete, duration]);

  if (!isVisible) return null;

  const DefaultLogo = () => (
    <img src="/AriNote_Logo_Transparent.png" alt="AriNote logo" style={{ width: 48, height: 48, objectFit: 'contain', display: 'block' }} />
  );

  return (
    <div className={`startup-animation ${fadeOut ? 'startup-fade-out' : ''}`}>
      <div className="startup-logo-container">
        <div className="startup-logo-wrapper">
          {customLogo || <DefaultLogo />}
        </div>
        <div className="startup-app-title" style={{ fontFamily: 'Inter, Manrope, Arial, sans-serif', fontWeight: 600, color: '#2D3748', fontSize: '2rem', letterSpacing: '-0.01em', marginTop: '1rem' }}>
          {appName}
        </div>
      </div>
      
      {/* Floating Particles */}
      <div className="startup-particles">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="startup-particle"
            style={{
              top: `${20 + Math.random() * 60}%`,
              left: `${10 + Math.random() * 80}%`,
              animationDelay: `${i * 0.3}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
}