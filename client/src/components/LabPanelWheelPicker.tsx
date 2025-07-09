import React, { useState, useRef, useEffect } from 'react';
import { 
  FlaskConical, 
  Droplets, 
  Activity, 
  Heart, 
  Clock,
  ChevronUp,
  ChevronDown
} from 'lucide-react';

interface PanelType {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
}

const LAB_PANELS: PanelType[] = [
  {
    id: 'bmp',
    name: 'Basic Metabolic Panel',
    icon: <FlaskConical className="h-5 w-5" />,
    color: 'bg-blue-50 border-blue-200 text-blue-700'
  },
  {
    id: 'cbc',
    name: 'CBC with Differential',
    icon: <Droplets className="h-5 w-5" />,
    color: 'bg-red-50 border-red-200 text-red-700'
  },
  {
    id: 'lft',
    name: 'Liver Function Tests',
    icon: <Activity className="h-5 w-5" />,
    color: 'bg-amber-50 border-amber-200 text-amber-700'
  },
  {
    id: 'lipids',
    name: 'Lipid Panel',
    icon: <Heart className="h-5 w-5" />,
    color: 'bg-emerald-50 border-emerald-200 text-emerald-700'
  },
  {
    id: 'thyroid',
    name: 'Thyroid Panel',
    icon: <Activity className="h-5 w-5" />,
    color: 'bg-indigo-50 border-indigo-200 text-indigo-700'
  },
  {
    id: 'cardiac',
    name: 'Cardiac Markers',
    icon: <Heart className="h-5 w-5" />,
    color: 'bg-rose-50 border-rose-200 text-rose-700'
  },
  {
    id: 'inflammatory',
    name: 'Inflammatory Markers',
    icon: <Activity className="h-5 w-5" />,
    color: 'bg-orange-50 border-orange-200 text-orange-700'
  },
  {
    id: 'diabetic',
    name: 'Diabetic Panel',
    icon: <FlaskConical className="h-5 w-5" />,
    color: 'bg-cyan-50 border-cyan-200 text-cyan-700'
  },
  {
    id: 'coagulation',
    name: 'Coagulation Studies',
    icon: <Clock className="h-5 w-5" />,
    color: 'bg-purple-50 border-purple-200 text-purple-700'
  }
];

interface LabPanelWheelPickerProps {
  selectedPanel: string;
  onPanelSelect: (panelId: string) => void;
  className?: string;
}

export function LabPanelWheelPicker({ selectedPanel, onPanelSelect, className = '' }: LabPanelWheelPickerProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [scrollOffset, setScrollOffset] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const wheelRef = useRef<HTMLDivElement>(null);
  
  const selectedIndex = LAB_PANELS.findIndex(panel => panel.id === selectedPanel);
  
  useEffect(() => {
    if (selectedIndex >= 0) {
      const itemHeight = 60; // Height of each wheel item
      const offset = selectedIndex * itemHeight;
      setScrollOffset(offset);
    }
  }, [selectedIndex]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setStartY(e.clientY);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    
    const deltaY = e.clientY - startY;
    const newOffset = Math.max(0, Math.min(scrollOffset - deltaY, (LAB_PANELS.length - 1) * 60));
    setScrollOffset(newOffset);
  };

  const handleMouseUp = () => {
    if (!isDragging) return;
    
    setIsDragging(false);
    // Snap to nearest item
    const itemHeight = 60;
    const nearestIndex = Math.round(scrollOffset / itemHeight);
    const snappedOffset = nearestIndex * itemHeight;
    setScrollOffset(snappedOffset);
    
    if (nearestIndex >= 0 && nearestIndex < LAB_PANELS.length) {
      onPanelSelect(LAB_PANELS[nearestIndex].id);
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const itemHeight = 60;
    const delta = e.deltaY > 0 ? itemHeight : -itemHeight;
    const newOffset = Math.max(0, Math.min(scrollOffset + delta, (LAB_PANELS.length - 1) * itemHeight));
    setScrollOffset(newOffset);
    
    // Snap to nearest item
    const nearestIndex = Math.round(newOffset / itemHeight);
    if (nearestIndex >= 0 && nearestIndex < LAB_PANELS.length) {
      onPanelSelect(LAB_PANELS[nearestIndex].id);
    }
  };

  const scrollUp = () => {
    const currentIndex = Math.round(scrollOffset / 60);
    if (currentIndex > 0) {
      const newIndex = currentIndex - 1;
      setScrollOffset(newIndex * 60);
      onPanelSelect(LAB_PANELS[newIndex].id);
    }
  };

  const scrollDown = () => {
    const currentIndex = Math.round(scrollOffset / 60);
    if (currentIndex < LAB_PANELS.length - 1) {
      const newIndex = currentIndex + 1;
      setScrollOffset(newIndex * 60);
      onPanelSelect(LAB_PANELS[newIndex].id);
    }
  };

  return (
    <div className={`flex flex-col ${className}`}>
      {/* Scroll Up Button */}
      <button
        onClick={scrollUp}
        className="flex items-center justify-center h-8 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors rounded-t-lg border border-gray-300 dark:border-gray-600"
        disabled={Math.round(scrollOffset / 60) === 0}
      >
        <ChevronUp className="h-4 w-4 text-gray-600 dark:text-gray-400" />
      </button>

      {/* Wheel Container */}
      <div
        ref={containerRef}
        className="relative h-[180px] w-16 bg-white dark:bg-gray-900 border-x border-gray-300 dark:border-gray-600 overflow-hidden select-none"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        {/* Selection Indicator */}
        <div className="absolute top-[60px] left-0 right-0 h-[60px] bg-blue-100 dark:bg-blue-900/30 border-y-2 border-blue-500 dark:border-blue-400 pointer-events-none z-10" />
        
        {/* Wheel Items */}
        <div
          ref={wheelRef}
          className="absolute w-full transition-transform duration-200 ease-out"
          style={{
            transform: `translateY(-${scrollOffset}px)`,
            cursor: isDragging ? 'grabbing' : 'grab'
          }}
        >
          {LAB_PANELS.map((panel, index) => {
            const isSelected = panel.id === selectedPanel;
            const distanceFromCenter = Math.abs((scrollOffset / 60) - index);
            const opacity = Math.max(0.3, 1 - (distanceFromCenter * 0.3));
            const scale = Math.max(0.8, 1 - (distanceFromCenter * 0.1));
            
            return (
              <div
                key={panel.id}
                className={`h-[60px] flex flex-col items-center justify-center p-2 border-b border-gray-200 dark:border-gray-700 transition-all duration-200 ${
                  isSelected 
                    ? 'bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-semibold' 
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
                style={{
                  opacity,
                  transform: `scale(${scale})`
                }}
                onClick={() => onPanelSelect(panel.id)}
              >
                <div className="flex items-center justify-center mb-1">
                  {panel.icon}
                </div>
                <div className="text-xs text-center leading-tight font-medium">
                  {panel.name.split(' ').slice(0, 2).join(' ')}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Scroll Down Button */}
      <button
        onClick={scrollDown}
        className="flex items-center justify-center h-8 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors rounded-b-lg border border-gray-300 dark:border-gray-600"
        disabled={Math.round(scrollOffset / 60) === LAB_PANELS.length - 1}
      >
        <ChevronDown className="h-4 w-4 text-gray-600 dark:text-gray-400" />
      </button>
    </div>
  );
}