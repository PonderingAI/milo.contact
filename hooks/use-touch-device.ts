"use client"

import { useState, useEffect } from 'react'

/**
 * Hook to detect if the device has touch capabilities
 * Returns true if the device supports touch, false otherwise
 * This is more comprehensive than screen size detection as it detects actual touch capability
 */
export function useTouchDevice() {
  const [isTouchDevice, setIsTouchDevice] = useState<boolean | undefined>(undefined)

  useEffect(() => {
    const checkTouchDevice = () => {
      // Check if we're in a browser environment
      if (typeof window === 'undefined') {
        return false
      }

      // Multiple checks for better detection across different browsers and devices
      const hasTouchStart = 'ontouchstart' in window
      const hasMaxTouchPoints = navigator.maxTouchPoints > 0
      const hasMsMaxTouchPoints = (navigator as any).msMaxTouchPoints > 0
      
      // Safe check for matchMedia
      let hasTouch = false
      if (window.matchMedia) {
        try {
          hasTouch = window.matchMedia('(pointer: coarse)').matches
        } catch (e) {
          // matchMedia may not be available in some environments
          hasTouch = false
        }
      }

      // Device is considered touch-capable if any of these conditions are true
      return hasTouchStart || hasMaxTouchPoints || hasMsMaxTouchPoints || hasTouch
    }

    setIsTouchDevice(checkTouchDevice())
  }, [])

  return !!isTouchDevice
}