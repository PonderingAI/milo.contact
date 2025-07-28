'use client';

import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Copy, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

interface ColorPickerProps {
  selectedColor: string;
  brightness: number;
  onColorChange: (color: string) => void;
  onBrightnessChange: (brightness: number) => void;
}

export function ColorPicker({ 
  selectedColor, 
  brightness, 
  onColorChange, 
  onBrightnessChange 
}: ColorPickerProps) {
  const [rgb, setRgb] = useState({ r: 255, g: 107, b: 107 });
  const [hex, setHex] = useState('#ff6b6b');
  const [showColorInfo, setShowColorInfo] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);

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
    onColorChange(hex);
  }, [hex, onColorChange]);

  // Handle RGB slider changes
  const handleRgbChange = (value: number[], index: number) => {
    const newRgb = { ...rgb };
    if (index === 0) newRgb.r = value[0];
    if (index === 1) newRgb.g = value[0];
    if (index === 2) newRgb.b = value[0];
    setRgb(newRgb);
  };

  // Handle hex input
  const handleHexChange = (value: string) => {
    if (value.match(/^#[0-9A-Fa-f]{6}$/)) {
      setHex(value);
    }
  };

  // Copy color to clipboard
  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${type} copied to clipboard!`);
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

    const size = 200;
    canvas.width = size;
    canvas.height = size;
    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size / 2 - 10;

    // Draw color wheel
    for (let angle = 0; angle < 360; angle += 1) {
      for (let r = 0; r < radius; r += 1) {
        const hue = angle;
        const saturation = (r / radius) * 100;
        const lightness = 50;
        
        ctx.beginPath();
        ctx.arc(centerX, centerY, r, (angle - 1) * Math.PI / 180, angle * Math.PI / 180);
        ctx.strokeStyle = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }
  }, []);

  return (
    <div className="space-y-6">
      {/* Large Color Preview */}
      <div className="relative">
        <div 
          className="w-full h-64 rounded-2xl shadow-2xl transition-all duration-300 cursor-pointer hover:scale-[1.02]"
          style={{ 
            backgroundColor: hex,
            filter: `brightness(${brightness}%)`
          }}
          onClick={() => setShowColorInfo(!showColorInfo)}
        />
        
        {/* Color Info Overlay */}
        {showColorInfo && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Card className="bg-black/70 backdrop-blur-sm border-white/20">
              <CardContent className="p-4 text-white text-center space-y-2">
                <div className="text-2xl font-bold">{hex.toUpperCase()}</div>
                <div className="text-sm opacity-80">
                  RGB({rgb.r}, {rgb.g}, {rgb.b})
                </div>
                <div className="text-sm opacity-80">
                  Brightness: {brightness}%
                </div>
              </CardContent>
            </Card>
          </div>
        )}
        
        {/* Toggle Info Button */}
        <Button
          variant="outline"
          size="sm"
          className="absolute top-2 right-2 bg-black/50 border-white/20 text-white hover:bg-black/70"
          onClick={() => setShowColorInfo(!showColorInfo)}
        >
          {showColorInfo ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </Button>
      </div>

      {/* Color Wheel Canvas */}
      <div className="flex justify-center">
        <div className="relative">
          <canvas
            ref={canvasRef}
            className="rounded-full cursor-crosshair border-2 border-white/20 shadow-lg"
            onClick={handleCanvasClick}
            style={{ width: '200px', height: '200px' }}
          />
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-4 h-4 bg-white rounded-full shadow-lg"></div>
          </div>
        </div>
      </div>

      {/* RGB Sliders */}
      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label className="text-white font-semibold">Red</Label>
            <div className="flex items-center gap-2">
              <span className="text-white text-sm">{rgb.r}</span>
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/10"
                onClick={() => copyToClipboard(rgb.r.toString(), 'Red value')}
              >
                <Copy className="w-3 h-3" />
              </Button>
            </div>
          </div>
          <Slider
            value={[rgb.r]}
            onValueChange={(value) => handleRgbChange(value, 0)}
            max={255}
            step={1}
            className="[&>span]:bg-red-500"
          />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label className="text-white font-semibold">Green</Label>
            <div className="flex items-center gap-2">
              <span className="text-white text-sm">{rgb.g}</span>
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/10"
                onClick={() => copyToClipboard(rgb.g.toString(), 'Green value')}
              >
                <Copy className="w-3 h-3" />
              </Button>
            </div>
          </div>
          <Slider
            value={[rgb.g]}
            onValueChange={(value) => handleRgbChange(value, 1)}
            max={255}
            step={1}
            className="[&>span]:bg-green-500"
          />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label className="text-white font-semibold">Blue</Label>
            <div className="flex items-center gap-2">
              <span className="text-white text-sm">{rgb.b}</span>
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/10"
                onClick={() => copyToClipboard(rgb.b.toString(), 'Blue value')}
              >
                <Copy className="w-3 h-3" />
              </Button>
            </div>
          </div>
          <Slider
            value={[rgb.b]}
            onValueChange={(value) => handleRgbChange(value, 2)}
            max={255}
            step={1}
            className="[&>span]:bg-blue-500"
          />
        </div>
      </div>

      {/* Hex Input */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <Label className="text-white font-semibold">Hex Color</Label>
          <Button
            variant="ghost"
            size="sm"
            className="text-white hover:bg-white/10"
            onClick={() => copyToClipboard(hex.toUpperCase(), 'Hex color')}
          >
            <Copy className="w-3 h-3" />
          </Button>
        </div>
        <Input
          value={hex}
          onChange={(e) => handleHexChange(e.target.value)}
          className="bg-black/20 border-white/20 text-white placeholder:text-white/50"
          placeholder="#000000"
        />
      </div>

      {/* Brightness Slider */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <Label className="text-white font-semibold">Brightness</Label>
          <span className="text-white text-sm">{brightness}%</span>
        </div>
        <Slider
          value={[brightness]}
          onValueChange={(value) => onBrightnessChange(value[0])}
          max={200}
          min={10}
          step={1}
          className="[&>span]:bg-yellow-500"
        />
      </div>

      {/* Quick Color Presets */}
      <div className="space-y-2">
        <Label className="text-white font-semibold">Quick Colors</Label>
        <div className="grid grid-cols-6 gap-2">
          {[
            '#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff',
            '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7', '#dda0dd'
          ].map((color) => (
            <button
              key={color}
              className="w-12 h-12 rounded-lg border-2 border-white/20 hover:border-white/50 transition-all duration-200 hover:scale-110"
              style={{ backgroundColor: color }}
              onClick={() => setHex(color)}
            />
          ))}
        </div>
      </div>
    </div>
  );
} 