'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { FullScreenColor } from '@/components/tools/full-screen-color';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Label } from '@/components/ui/label';
import { Maximize2, Copy, Check } from 'lucide-react';

export default function ColorLightPage() {
  const [selectedColor, setSelectedColor] = useState('#ff6b6b');
  const [brightness, setBrightness] = useState(100);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [rgb, setRgb] = useState({ r: 255, g: 107, b: 107 });
  const [hex, setHex] = useState('#ff6b6b');
  const [fullscreenSupported, setFullscreenSupported] = useState(false);
  const [copiedKey, setCopiedKey] = useState<null | 'hex' | 'rgb'>(null);
  const updateSourceRef = useRef<'hex' | 'rgb' | 'canvas' | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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
  const hexToRgb = useCallback((hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
  }, []);

  // Convert RGB to hex
  const rgbToHex = useCallback((r: number, g: number, b: number) => {
    return '#' + [r, g, b].map(x => {
      const hex = x.toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    }).join('');
  }, []);

  // Update RGB when hex changes (only if not updating from RGB or canvas)
  useEffect(() => {
    if (updateSourceRef.current !== 'rgb' && updateSourceRef.current !== 'canvas') {
      const newRgb = hexToRgb(hex);
      setRgb(newRgb);
      setSelectedColor(hex);
    }
    // Reset the source after processing
    updateSourceRef.current = null;
  }, [hex, hexToRgb]);

  // Update hex when RGB changes (only if not updating from hex)
  useEffect(() => {
    if (updateSourceRef.current !== 'hex') {
      const newHex = rgbToHex(rgb.r, rgb.g, rgb.b);
      setHex(newHex);
      setSelectedColor(newHex);
    }
    // Reset the source after processing
    updateSourceRef.current = null;
  }, [rgb, rgbToHex]);

  // Handle hex input
  const handleHexChange = (value: string) => {
    if (value.match(/^#[0-9A-Fa-f]{6}$/)) {
      updateSourceRef.current = 'hex';
      setHex(value);
    }
  };

  // Handle RGB input
  const handleRgbChange = (value: string, channel: 'r' | 'g' | 'b') => {
    const num = parseInt(value);
    if (!isNaN(num) && num >= 0 && num <= 255) {
      updateSourceRef.current = 'rgb';
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
    updateSourceRef.current = 'canvas';
    setRgb(newRgb);
  };

  // Draw color wheel on canvas
  const drawColorWheel = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Make canvas responsive to container size
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const size = Math.max(Math.min(rect.width, rect.height) - 40, 100); // Minimum size of 100px
    
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

  // Initial draw and resize handling
  useEffect(() => {
    drawColorWheel();

    const handleResize = () => {
      drawColorWheel();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [drawColorWheel]);

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

  // Handle exit from fullscreen
  const handleExitFullscreen = useCallback(() => {
    exitFullscreen();
    setIsFullScreen(false);
  }, []);

  // Copy helpers
  const copyToClipboard = useCallback(async (text: string, key: 'hex' | 'rgb') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 1200);
    } catch (e) {
      // no-op
    }
  }, []);

  if (isFullScreen) {
    return (
      <FullScreenColor 
        color={selectedColor} 
        brightness={brightness}
        onExit={handleExitFullscreen}
      />
    );
  }

  return (
    <div
      className="relative h-screen w-screen overflow-hidden transition-all duration-500"
      style={{
        backgroundColor: selectedColor,
        filter: `brightness(${brightness}%)`
      }}
    >
      {/* Decorative backgrounds */}
      <div className="pointer-events-none absolute inset-0 opacity-40 mix-blend-screen" aria-hidden>
        <div className="absolute -top-32 -left-24 h-96 w-96 rounded-full bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.45),transparent_60%)] blur-2xl" />
        <div className="absolute -bottom-40 -right-32 h-[28rem] w-[28rem] rounded-full bg-[conic-gradient(from_180deg_at_50%_50%,rgba(255,255,255,0.35),transparent_60%)] blur-3xl animate-pulse" />
      </div>

      {/* Header */}
      <header className="absolute inset-x-0 top-0 z-50">
        <div className="mx-auto flex max-w-6xl items-start justify-between gap-4 px-6 py-6">
          <div>
            <h1 className="font-serif text-2xl md:text-3xl font-bold tracking-tight drop-shadow-[0_1px_8px_rgba(0,0,0,0.35)]">Color Light</h1>
            <p className="mt-1 text-xs md:text-sm text-white/70">From artist to artist — turn your screen into a soft light, pick with precision, and perform full screen.</p>
          </div>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <Button
                    onClick={toggleFullScreen}
                    size="sm"
                    className="bg-black/30 backdrop-blur-sm border-white/20 text-white hover:bg-black/50 transition-all duration-300"
                    disabled={!fullscreenSupported}
                  >
                    <Maximize2 className="h-4 w-4" />
                    <span className="sr-only">Toggle full screen</span>
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent>Full screen for uninterrupted light</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </header>

      {/* Main Content */}
      <div className="relative z-10 flex h-full">
        {/* Left controls */}
        <div className="flex h-full w-full flex-col items-center justify-center gap-8 p-6 md:w-5/12 md:p-10">
          {/* Glass card */}
          <div className="w-full max-w-sm rounded-2xl border border-white/15 bg-black/30 p-6 backdrop-blur-md shadow-[0_10px_40px_rgba(0,0,0,0.35)]">
            <div className="mb-6 flex items-center justify-between">
              <div className="text-sm text-white/70">Brightness</div>
              <div className="text-xs text-white/60">{brightness}%</div>
            </div>

            <div className="mx-auto mb-8 h-64 w-8 overflow-hidden rounded-full border border-white/15 bg-black/20">
              <div
                className="absolute h-64 w-8 rounded-full"
                style={{
                  background: `linear-gradient(to top, ${selectedColor} 0%, ${selectedColor} 50%, #000000 100%)`
                }}
              />
              <div className="relative h-full">
                <Slider
                  orientation="vertical"
                  value={[brightness]}
                  onValueChange={(value) => setBrightness(value[0])}
                  max={200}
                  min={10}
                  step={1}
                  className="h-full [&>span]:bg-white [&>span]:w-1 [&>span]:rounded-none"
                />
              </div>
            </div>

            {/* Color swatch */}
            <div className="mb-6 rounded-xl border border-white/15 bg-white/10 p-3">
              <div className="flex items-center gap-3">
                <div
                  className="h-10 w-10 flex-shrink-0 rounded-lg border border-white/20 shadow-inner"
                  style={{ backgroundColor: hex }}
                />
                <div className="text-xs text-white/70">Live preview</div>
              </div>
            </div>

            {/* Inputs */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-white/80">HEX</Label>
                <div className="flex items-center gap-2">
                  <Input
                    value={hex}
                    onChange={(e) => handleHexChange(e.target.value)}
                    className="font-mono text-sm text-white placeholder:text-white/50 bg-black/30 border-white/20"
                    placeholder="#000000"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="border-white/20 bg-black/30 text-white hover:bg-black/50"
                    onClick={() => copyToClipboard(hex.toUpperCase(), 'hex')}
                    aria-label="Copy HEX"
                  >
                    {copiedKey === 'hex' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-white/80">RGB</Label>
                <div className="flex items-center gap-2">
                  <div className="flex gap-2">
                    <Input
                      value={rgb.r}
                      onChange={(e) => handleRgbChange(e.target.value, 'r')}
                      className="w-16 font-mono text-sm text-white placeholder:text-white/50 bg-black/30 border-white/20"
                      placeholder="R"
                    />
                    <Input
                      value={rgb.g}
                      onChange={(e) => handleRgbChange(e.target.value, 'g')}
                      className="w-16 font-mono text-sm text-white placeholder:text-white/50 bg-black/30 border-white/20"
                      placeholder="G"
                    />
                    <Input
                      value={rgb.b}
                      onChange={(e) => handleRgbChange(e.target.value, 'b')}
                      className="w-16 font-mono text-sm text-white placeholder:text-white/50 bg-black/30 border-white/20"
                      placeholder="B"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="border-white/20 bg-black/30 text-white hover:bg-black/50"
                    onClick={() => copyToClipboard(`rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`, 'rgb')}
                    aria-label="Copy RGB"
                  >
                    {copiedKey === 'rgb' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Helper */}
          <p className="text-center text-xs text-white/70">Tip: Press Esc to exit full screen. C to toggle controls.</p>
        </div>

        {/* Right - Color wheel */}
        <div ref={containerRef} className="flex h-full w-full items-center justify-center p-6 md:w-7/12 md:p-16">
          <div className="relative">
            <div className="pointer-events-none absolute inset-0 -m-6 rounded-full bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.35),transparent_60%)] blur-2xl" aria-hidden />
            <div className="relative rounded-full border border-white/20 bg-white/5 p-4 shadow-[0_20px_60px_rgba(0,0,0,0.45)] backdrop-blur-md">
              <canvas
                ref={canvasRef}
                className="rounded-full cursor-crosshair border border-white/20 shadow-2xl"
                onClick={handleCanvasClick}
              />
            </div>
            <div className="mt-4 text-center text-xs text-white/70">Tap anywhere on the wheel to sample a color</div>
          </div>
        </div>
      </div>
    </div>
  );
}
