'use client';

import { useState, useEffect, useRef } from 'react';
import { FullScreenColor } from '@/components/tools/full-screen-color';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Maximize2 } from 'lucide-react';

export default function ColorLightPage() {
  const [selectedColor, setSelectedColor] = useState('#ff6b6b');
  const [brightness, setBrightness] = useState(100);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [rgb, setRgb] = useState({ r: 255, g: 107, b: 107 });
  const [hex, setHex] = useState('#ff6b6b');
  const [fullscreenSupported, setFullscreenSupported] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Check for fullscreen API support
  useEffect(() => {
    const checkFullscreenSupport = () => {
      const doc = document as any;
      const isSupported = !!(
        doc.fullscreenEnabled ||
        doc.webkitFullscreenEnabled ||
        doc.mozFullScreenEnabled ||
        doc.msFullscreenEnabled
      );
      setFullscreenSupported(isSupported);
    };

    checkFullscreenSupport();
  }, []);

  // Get fullscreen element with vendor prefixes
  const getFullscreenElement = () => {
    const doc = document as any;
    return (
      doc.fullscreenElement ||
      doc.webkitFullscreenElement ||
      doc.mozFullScreenElement ||
      doc.msFullscreenElement
    );
  };

  // Request fullscreen with vendor prefixes
  const requestFullscreen = (element: HTMLElement) => {
    const el = element as any;
    
    if (el.requestFullscreen) {
      return el.requestFullscreen();
    } else if (el.webkitRequestFullscreen) {
      return el.webkitRequestFullscreen();
    } else if (el.mozRequestFullScreen) {
      return el.mozRequestFullScreen();
    } else if (el.msRequestFullscreen) {
      return el.msRequestFullscreen();
    }
    
    // Fallback: just set the state to true for older browsers
    setIsFullScreen(true);
    return Promise.resolve();
  };

  // Exit fullscreen with vendor prefixes
  const exitFullscreen = () => {
    const doc = document as any;
    
    if (doc.exitFullscreen) {
      return doc.exitFullscreen();
    } else if (doc.webkitExitFullscreen) {
      return doc.webkitExitFullscreen();
    } else if (doc.mozCancelFullScreen) {
      return doc.mozCancelFullScreen();
    } else if (doc.msExitFullscreen) {
      return doc.msExitFullscreen();
    }
    
    // Fallback: just set the state to false for older browsers
    setIsFullScreen(false);
    return Promise.resolve();
  };

  // Convert hex to RGB
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
  };

  // Convert RGB to hex
  const rgbToHex = (r: number, g: number, b: number) => {
    return '#' + [r, g, b].map(x => {
      const hex = x.toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    }).join('');
  };

  // Update RGB when hex changes
  useEffect(() => {
    setRgb(hexToRgb(hex));
  }, [hex]);

  // Update hex when RGB changes
  useEffect(() => {
    setHex(rgbToHex(rgb.r, rgb.g, rgb.b));
  }, [rgb]);

  // Update parent when color changes
  useEffect(() => {
    setSelectedColor(hex);
  }, [hex]);

  // Handle hex input
  const handleHexChange = (value: string) => {
    if (value.match(/^#[0-9A-Fa-f]{6}$/)) {
      setHex(value);
    }
  };

  // Handle RGB input
  const handleRgbChange = (value: string, channel: 'r' | 'g' | 'b') => {
    const num = parseInt(value);
    if (!isNaN(num) && num >= 0 && num <= 255) {
      setRgb(prev => ({ ...prev, [channel]: num }));
    }
  };

  // Handle canvas click for color picking
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const imageData = ctx.getImageData(x, y, 1, 1).data;
    const newRgb = { r: imageData[0], g: imageData[1], b: imageData[2] };
    setRgb(newRgb);
  };

  // Draw color wheel on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Make canvas responsive to container size
    const container = canvas.parentElement;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const size = Math.min(rect.width, rect.height) - 40; // Leave some padding
    
    canvas.width = size;
    canvas.height = size;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;

    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size / 2 - 10;

    // Clear canvas
    ctx.clearRect(0, 0, size, size);

    // Draw color wheel
    for (let angle = 0; angle < 360; angle += 0.5) {
      for (let r = 0; r < radius; r += 1) {
        const hue = angle;
        const saturation = (r / radius) * 100;
        const lightness = 50;
        
        ctx.beginPath();
        ctx.arc(centerX, centerY, r, (angle - 0.5) * Math.PI / 180, angle * Math.PI / 180);
        ctx.strokeStyle = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }
  }, []);

  // Handle fullscreen toggle
  const toggleFullScreen = async () => {
    try {
      if (!getFullscreenElement()) {
        await requestFullscreen(document.documentElement);
        setIsFullScreen(true);
      } else {
        await exitFullscreen();
        setIsFullScreen(false);
      }
    } catch (error) {
      console.warn('Fullscreen API not supported or failed:', error);
      // Fallback: toggle state manually for older browsers
      setIsFullScreen(!isFullScreen);
    }
  };

  // Listen for fullscreen changes with vendor prefixes
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFullscreen = !!getFullscreenElement();
      setIsFullScreen(isFullscreen);
    };

    const doc = document as any;
    
    // Add listeners for all vendor prefixes
    const events = [
      'fullscreenchange',
      'webkitfullscreenchange',
      'mozfullscreenchange',
      'MSFullscreenChange'
    ];

    events.forEach(event => {
      doc.addEventListener(event, handleFullscreenChange);
    });

    return () => {
      events.forEach(event => {
        doc.removeEventListener(event, handleFullscreenChange);
      });
    };
  }, []);

  if (isFullScreen) {
    return (
      <FullScreenColor 
        color={selectedColor} 
        brightness={brightness}
        onExit={() => {
          exitFullscreen();
          setIsFullScreen(false);
        }}
      />
    );
  }

  return (
    <div 
      className="h-screen w-screen overflow-hidden transition-all duration-300"
      style={{ 
        backgroundColor: selectedColor,
        filter: `brightness(${brightness}%)`
      }}
    >
      {/* Full Screen Button */}
      <div className="absolute top-4 right-4 z-50">
        <Button
          onClick={toggleFullScreen}
          size="sm"
          className="bg-black/30 backdrop-blur-sm border-white/20 text-white hover:bg-black/50 transition-all duration-300"
          disabled={!fullscreenSupported}
          title={fullscreenSupported ? "Enter Full Screen" : "Full Screen Not Supported"}
        >
          <Maximize2 className="w-4 h-4" />
        </Button>
      </div>

      {/* Main Content */}
      <div className="h-full flex">
        {/* Left Side - Brightness Slider */}
        <div className="w-1/3 h-full flex flex-col justify-center items-center space-y-8 p-8">
          {/* Vertical Brightness Slider */}
          <div className="flex flex-col items-center space-y-4">
            <div className="text-white text-sm font-mono">Brightness</div>
            <div className="h-64 w-8 relative">
              <Slider
                orientation="vertical"
                value={[brightness]}
                onValueChange={(value) => setBrightness(value[0])}
                max={200}
                min={10}
                step={1}
                className="h-full [&>span]:bg-white"
              />
            </div>
            <div className="text-white text-sm font-mono">{brightness}%</div>
          </div>

          {/* Input Fields */}
          <div className="flex flex-col space-y-2 w-full max-w-xs">
            <Input
              value={hex}
              onChange={(e) => handleHexChange(e.target.value)}
              className="bg-black/30 border-white/20 text-white placeholder:text-white/50 text-sm font-mono"
              placeholder="#000000"
            />
            <div className="flex space-x-2">
              <Input
                value={rgb.r}
                onChange={(e) => handleRgbChange(e.target.value, 'r')}
                className="bg-black/30 border-white/20 text-white placeholder:text-white/50 text-sm font-mono w-16"
                placeholder="R"
              />
              <Input
                value={rgb.g}
                onChange={(e) => handleRgbChange(e.target.value, 'g')}
                className="bg-black/30 border-white/20 text-white placeholder:text-white/50 text-sm font-mono w-16"
                placeholder="G"
              />
              <Input
                value={rgb.b}
                onChange={(e) => handleRgbChange(e.target.value, 'b')}
                className="bg-black/30 border-white/20 text-white placeholder:text-white/50 text-sm font-mono w-16"
                placeholder="B"
              />
            </div>
          </div>
        </div>

        {/* Right Side - Color Wheel */}
        <div className="w-2/3 h-full flex items-center justify-center p-8">
          <canvas
            ref={canvasRef}
            className="rounded-full cursor-crosshair border-2 border-white/20 shadow-lg"
            onClick={handleCanvasClick}
          />
        </div>
      </div>
    </div>
  );
} 