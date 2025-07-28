'use client';

import { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface FullScreenColorProps {
  color: string;
  brightness: number;
  onExit: () => void;
}

export function FullScreenColor({ color, brightness, onExit }: FullScreenColorProps) {
  const [showControls, setShowControls] = useState(true);

  // Hide controls after 3 seconds of inactivity
  useEffect(() => {
    if (!showControls) return;

    const timer = setTimeout(() => {
      setShowControls(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, [showControls]);

  // Show controls on mouse move or touch
  const handleInteraction = useCallback(() => {
    setShowControls(true);
  }, []);

  // Handle keyboard shortcuts with functional updates
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onExit();
          break;
        case 'c':
        case 'C':
          setShowControls(prev => !prev);
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onExit]);

  return (
    <div
      className="fixed inset-0 w-screen h-screen transition-all duration-500"
      style={{ 
        backgroundColor: color,
        filter: `brightness(${brightness}%)`
      }}
      onMouseMove={handleInteraction}
      onTouchStart={handleInteraction}
      onTouchMove={handleInteraction}
    >
      {/* Controls Overlay */}
      {showControls && (
        <div className="absolute top-4 right-4 flex gap-2 z-50">
          <Button
            variant="outline"
            size="sm"
            className="bg-black/50 border-white/20 text-white hover:bg-black/70 backdrop-blur-sm"
            onClick={onExit}
            title="Exit Full Screen (Esc)"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Color Info (only visible when controls are shown) */}
      {showControls && (
        <div className="absolute bottom-4 left-4 bg-black/50 backdrop-blur-sm border border-white/20 rounded-lg p-3 text-white">
          <div className="text-sm font-mono">
            <div>Color: {color.toUpperCase()}</div>
            <div>Brightness: {brightness}%</div>
          </div>
        </div>
      )}

      {/* Instructions (only visible when controls are shown) */}
      {showControls && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black/50 backdrop-blur-sm border border-white/20 rounded-lg p-4 text-white text-center max-w-md">
          <div className="text-sm space-y-2">
            <div><strong>Keyboard Shortcuts:</strong></div>
            <div>• <kbd className="px-2 py-1 bg-white/20 rounded text-xs">Esc</kbd> - Exit full screen</div>
            <div>• <kbd className="px-2 py-1 bg-white/20 rounded text-xs">C</kbd> - Toggle controls</div>
          </div>
        </div>
      )}

      {/* Touch-friendly exit button for mobile */}
      <div className="absolute bottom-4 right-4 md:hidden">
        <Button
          size="lg"
          className="bg-black/50 border-white/20 text-white hover:bg-black/70 backdrop-blur-sm rounded-full w-12 h-12 p-0"
          onClick={onExit}
        >
          <X className="w-6 h-6" />
        </Button>
      </div>
    </div>
  );
} 