/**
 * Test to verify that the video background styling fixes work correctly
 * This test validates the fix for issue #64 - Vimeo video border and white flash issues
 */

import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock the project data module
jest.mock('../lib/project-data', () => ({
  extractVideoInfo: jest.fn()
}));

// Import the VideoBackground component
import VideoBackground from '../components/video-background';
const { extractVideoInfo } = require('../lib/project-data');

describe('Video Background Styling Fix for Issue #64', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock successful video extraction
    extractVideoInfo.mockReturnValue({
      platform: 'vimeo',
      id: '123456789'
    });
  });

  test('VideoBackground iframe should have proper styling to prevent borders', () => {
    const { container } = render(
      <VideoBackground videoUrl="https://vimeo.com/123456789" />
    );

    // Find the iframe element
    const iframe = container.querySelector('iframe');
    expect(iframe).toBeInTheDocument();

    // Check that the iframe has the correct styling to prevent borders
    const style = iframe.style;
    
    // Should use cover instead of contain to fill the entire area
    expect(style.objectFit).toBe('cover');
    
    // Should have transparent background to prevent white flash
    expect(style.backgroundColor).toBe('transparent');
    
    // Should have responsive dimensions to ensure coverage
    expect(style.width).toBe('177.77vh');
    expect(style.height).toBe('56.25vw');
    expect(style.minWidth).toBe('100%');
    expect(style.minHeight).toBe('100%');
    
    // Should be centered
    expect(style.top).toBe('50%');
    expect(style.left).toBe('50%');
    expect(style.transform).toBe('translate(-50%, -50%)');
  });

  test('VideoBackground container should have black background', () => {
    const { container } = render(
      <VideoBackground videoUrl="https://vimeo.com/123456789" />
    );

    // Find the main container
    const videoContainer = container.firstChild;
    expect(videoContainer).toHaveClass('bg-black');
  });

  test('VideoBackground should show fallback image until video loads', () => {
    const { container } = render(
      <VideoBackground 
        videoUrl="https://vimeo.com/123456789" 
        fallbackImage="/test-fallback.jpg"
      />
    );

    // Should have fallback image element
    const fallbackDiv = container.querySelector('[style*="background-image"]');
    expect(fallbackDiv).toBeInTheDocument();
    expect(fallbackDiv.style.backgroundImage).toContain('/test-fallback.jpg');
  });

  test('VideoBackground should handle Vimeo URLs with proper embed parameters', () => {
    const { container } = render(
      <VideoBackground videoUrl="https://vimeo.com/123456789" />
    );

    const iframe = container.querySelector('iframe');
    expect(iframe).toBeInTheDocument();
    
    // Check that the src contains proper Vimeo embed parameters for background video
    const src = iframe.src;
    expect(src).toContain('player.vimeo.com/video/123456789');
    expect(src).toContain('background=1');
    expect(src).toContain('autoplay=1');
    expect(src).toContain('loop=1');
    expect(src).toContain('muted=1');
  });
});