"use client"

import { useEffect, useState, useRef } from "react"

export default function CustomCursor() {
  const [position, setPosition] = useState({ x: -100, y: -100 })
  const [currentRotation, setCurrentRotation] = useState(0) // Target rotation from mouse input
  // Removed displayedRotation state: const [displayedRotation, setDisplayedRotation] = useState(0);
  const [isVisible, setIsVisible] = useState(false)
  // Removed isClicking state: const [isClicking, setIsClicking] = useState(false);
  const trailsRef = useRef<{ x: number; y: number; opacity: number; rotation: number }[]>([])
  const requestRef = useRef<number>()
  const lastPositionRef = useRef({ x: -100, y: -100 }) // Ref for last mouse position

  // Initialize trails
  useEffect(() => {
    trailsRef.current = Array(120) // Increased from 20 to 120
      .fill(0)
      .map(() => ({ x: 0, y: 0, opacity: 0, rotation: 0 })) // Add rotation: 0
  }, [])

  useEffect(() => {
    // Initialize lastPositionRef with the initial position
    lastPositionRef.current = position

    const handleMouseMove = (e: MouseEvent) => {
      const newX = e.clientX
      const newY = e.clientY
      const deltaX = newX - lastPositionRef.current.x
      const deltaY = newY - lastPositionRef.current.y

      if (deltaX !== 0 || deltaY !== 0) {
        const angleInRadians = Math.atan2(deltaY, deltaX)
        const angleInDegrees = angleInRadians * (180 / Math.PI)
        setCurrentRotation(angleInDegrees)
      }
      // If no movement, currentRotation remains unchanged.

      setPosition({ x: newX, y: newY })
      setIsVisible(true)
      lastPositionRef.current = { x: newX, y: newY } // Update last position
    }

    // Removed handleMouseDown and handleMouseUp functions
    const handleMouseLeave = () => setIsVisible(false)

    // Animation loop for the trail effect
    const animateTrail = () => {
      // Update trail positions
      const newTrails = [...trailsRef.current]

      // Removed displayedRotation lerping logic
      // Shift all trails one position (operates on the newTrails declared above)
      for (let i = newTrails.length - 1; i > 0; i--) {
        newTrails[i] = {
          x: newTrails[i - 1].x,
          y: newTrails[i - 1].y,
          opacity: Math.max(0, 1 - (i / newTrails.length) * 1.0), // Adjusted opacity fade-out
          rotation: newTrails[i - 1].rotation, // Carry over rotation
        }
      }

      // Add current position to the front
      newTrails[0] = { x: position.x, y: position.y, opacity: 1, rotation: currentRotation } // Use currentRotation for trail point
      trailsRef.current = newTrails

      requestRef.current = requestAnimationFrame(animateTrail)
    }

    window.addEventListener("mousemove", handleMouseMove)
    // Removed mousedown and mouseup event listeners
    window.addEventListener("mouseleave", handleMouseLeave)

    requestRef.current = requestAnimationFrame(animateTrail)

    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      // Removed mousedown and mouseup event listener cleanup
      window.removeEventListener("mouseleave", handleMouseLeave)

      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current)
      }
    }
  }, [position])

  // Removed the pathname check that was disabling the cursor on admin pages

  return (
    <div className="cursor-container" style={{ opacity: isVisible ? 1 : 0 }}>
      {/* Main cursor element removed */}

      {/* Trail elements */}
      {trailsRef.current.map((trail, index) => (
        <div
          key={index}
          className="cursor-trail"
          style={{
            left: `${trail.x}px`,
            top: `${trail.y}px`,
            opacity: trail.opacity,
            transform: `translate(-50%, -50%) rotate(${trail.rotation}deg) scale(1)`, // Adjusted scale
          }}
        >
          {/* New "Flat Film Strip" Trail Segment SVG */}
          <svg width="20" height="30" viewBox="-10 -15 20 30" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Left film edge */}
            <rect x="-10" y="-15" width="3.5" height="30" fill="rgba(100,100,100,0.6)"/>
            {/* Sprocket holes for left edge */}
            <rect x="-9" y="-12" width="2" height="4" fill="rgba(50,50,50,0.7)" rx="0.5"/>
            <rect x="-9" y="-5"  width="2" height="4" fill="rgba(50,50,50,0.7)" rx="0.5"/>
            <rect x="-9" y="2"   width="2" height="4" fill="rgba(50,50,50,0.7)" rx="0.5"/>
            <rect x="-9" y="9"   width="2" height="4" fill="rgba(50,50,50,0.7)" rx="0.5"/>

            {/* Right film edge */}
            <rect x="6.5" y="-15" width="3.5" height="30" fill="rgba(100,100,100,0.6)"/>
            {/* Sprocket holes for right edge */}
            <rect x="7" y="-12" width="2" height="4" fill="rgba(50,50,50,0.7)" rx="0.5"/>
            <rect x="7" y="-5"  width="2" height="4" fill="rgba(50,50,50,0.7)" rx="0.5"/>
            <rect x="7" y="2"   width="2" height="4" fill="rgba(50,50,50,0.7)" rx="0.5"/>
            <rect x="7" y="9"   width="2" height="4" fill="rgba(50,50,50,0.7)" rx="0.5"/>

            {/* Faint Frame lines in the transparent middle */}
            <line x1="-6.5" y1="0" x2="6.5" y2="0" stroke="rgba(200,200,200,0.2)" strokeWidth="0.5"/>
            <line x1="-6.5" y1="-14.5" x2="6.5" y2="-14.5" stroke="rgba(200,200,200,0.1)" strokeWidth="0.5"/>
            <line x1="-6.5" y1="14.5" x2="6.5" y2="14.5" stroke="rgba(200,200,200,0.1)" strokeWidth="0.5"/>
            
            {/* Central transparent area - effectively created by the gap between edge rects */}
          </svg>
        </div>
      ))}
    </div>
  )
}
