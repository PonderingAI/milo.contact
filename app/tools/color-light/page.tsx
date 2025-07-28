'use client';

import { useState, useEffect } from 'react';
import { ColorPicker } from '@/components/tools/color-picker';
import { FullScreenColor } from '@/components/tools/full-screen-color';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Monitor, Palette, Maximize2 } from 'lucide-react';

export default function ColorLightPage() {
  const [selectedColor, setSelectedColor] = useState('#ff6b6b');
  const [brightness, setBrightness] = useState(100);
  const [isFullScreen, setIsFullScreen] = useState(false);

  // Handle fullscreen toggle
  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullScreen(true);
    } else {
      document.exitFullscreen();
      setIsFullScreen(false);
    }
  };

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  if (isFullScreen) {
    return (
      <FullScreenColor 
        color={selectedColor} 
        brightness={brightness}
        onExit={() => {
          document.exitFullscreen();
          setIsFullScreen(false);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-white flex items-center justify-center gap-3">
            <Monitor className="w-8 h-8 text-purple-400" />
            Color Light Tool
          </h1>
          <p className="text-purple-200 text-lg">
            Film lighting color monitor for professional production
          </p>
        </div>

        {/* Main Tool Card */}
        <Card className="bg-black/20 backdrop-blur-sm border-purple-500/30">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Palette className="w-5 h-5 text-purple-400" />
              Color Selection
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <ColorPicker
              selectedColor={selectedColor}
              brightness={brightness}
              onColorChange={setSelectedColor}
              onBrightnessChange={setBrightness}
            />
            
            {/* Full Screen Button */}
            <div className="flex justify-center pt-4">
              <Button
                onClick={toggleFullScreen}
                size="lg"
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-4 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-3"
              >
                <Maximize2 className="w-6 h-6" />
                Enter Full Screen Mode
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card className="bg-black/10 backdrop-blur-sm border-purple-500/20">
          <CardContent className="pt-6">
            <div className="text-purple-200 space-y-2 text-sm">
              <p><strong>How to use:</strong></p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Select your desired color using the color picker</li>
                <li>Adjust brightness to match your lighting needs</li>
                <li>Click "Enter Full Screen Mode" to use as a light source</li>
                <li>Touch-friendly interface for mobile devices</li>
                <li>Perfect for film and photography lighting</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 