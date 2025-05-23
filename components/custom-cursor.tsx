"use client"

import { useEffect, useState, useRef } from "react"

export default function CustomCursor() {
  const [position, setPosition] = useState({ x: -100, y: -100 })
  const [currentRotation, setCurrentRotation] = useState(0) // Added state for rotation
  const [isVisible, setIsVisible] = useState(false)
  const [isClicking, setIsClicking] = useState(false)
  const trailsRef = useRef<{ x: number; y: number; opacity: number; rotation: number }[]>([])
  const requestRef = useRef<number>()
  const lastPositionRef = useRef({ x: -100, y: -100 }) // Ref for last mouse position

  // Initialize trails
  useEffect(() => {
    trailsRef.current = Array(20)
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

      setCurrentRotation(prevRotation => prevRotation + deltaX * 0.5) // Update rotation
      setPosition({ x: newX, y: newY })
      setIsVisible(true)
      lastPositionRef.current = { x: newX, y: newY } // Update last position
    }

    const handleMouseDown = () => setIsClicking(true)
    const handleMouseUp = () => setIsClicking(false)
    const handleMouseLeave = () => setIsVisible(false)

    // Animation loop for the trail effect
    const animateTrail = () => {
      // Update trail positions
      const newTrails = [...trailsRef.current]

      // Shift all trails one position
      for (let i = newTrails.length - 1; i > 0; i--) {
        newTrails[i] = {
          x: newTrails[i - 1].x,
          y: newTrails[i - 1].y,
          opacity: Math.max(0, 1 - (i / newTrails.length) * 1.5),
          rotation: newTrails[i - 1].rotation, // Carry over rotation
        }
      }

      // Add current position to the front
      newTrails[0] = { x: position.x, y: position.y, opacity: 1, rotation: currentRotation } // Use currentRotation
      trailsRef.current = newTrails

      requestRef.current = requestAnimationFrame(animateTrail)
    }

    window.addEventListener("mousemove", handleMouseMove)
    window.addEventListener("mousedown", handleMouseDown)
    window.addEventListener("mouseup", handleMouseUp)
    window.addEventListener("mouseleave", handleMouseLeave)

    requestRef.current = requestAnimationFrame(animateTrail)

    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("mousedown", handleMouseDown)
      window.removeEventListener("mouseup", handleMouseUp)
      window.removeEventListener("mouseleave", handleMouseLeave)

      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current)
      }
    }
  }, [position])

  // Removed the pathname check that was disabling the cursor on admin pages

  return (
    <div className="cursor-container" style={{ opacity: isVisible ? 1 : 0 }}>
      {/* Main cursor */}
      <div
        className={`custom-cursor ${isClicking ? "clicking" : ""}`}
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
        }}
      >
        {/* New Film Roll SVG with Rotatable Spools */}
        <svg width="80" height="32" viewBox="-40 -16 80 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <g className="left-spool" transform={`rotate(${currentRotation} -25 0)`}>
            <circle cx="-25" cy="0" r="15" stroke="white" strokeWidth="1.5" fill="rgba(0,0,0,0.3)"/>
            <circle cx="-25" cy="0" r="5" fill="white"/>
            <rect x="-30" y="-1" width="10" height="2" fill="white" transform="rotate(45 -25 0)"/>
            <rect x="-30" y="-1" width="10" height="2" fill="white" transform="rotate(-45 -25 0)"/>
          </g>

          <g className="right-spool" transform={`rotate(${currentRotation} 25 0)`}>
            <circle cx="25" cy="0" r="15" stroke="white" strokeWidth="1.5" fill="rgba(0,0,0,0.3)"/>
            <circle cx="25" cy="0" r="5" fill="white"/>
            <rect x="20" y="-1" width="10" height="2" fill="white" transform="rotate(45 25 0)"/>
            <rect x="20" y="-1" width="10" height="2" fill="white" transform="rotate(-45 25 0)"/>
          </g>

          {/* Film Segment */}
          <rect x="-15" y="-8" width="30" height="16" fill="rgba(150,150,150,0.4)"/>

          {/* Sprocket Holes - Top */}
          <rect x="-12" y="-7" width="4" height="2" fill="rgba(50,50,50,0.8)" rx="0.5"/>
          <rect x="-6"  y="-7" width="4" height="2" fill="rgba(50,50,50,0.8)" rx="0.5"/>
          <rect x="2"   y="-7" width="4" height="2" fill="rgba(50,50,50,0.8)" rx="0.5"/>
          <rect x="8"   y="-7" width="4" height="2" fill="rgba(50,50,50,0.8)" rx="0.5"/>

          {/* Sprocket Holes - Bottom */}
          <rect x="-12" y="5" width="4" height="2" fill="rgba(50,50,50,0.8)" rx="0.5"/>
          <rect x="-6"  y="5" width="4" height="2" fill="rgba(50,50,50,0.8)" rx="0.5"/>
          <rect x="2"   y="5" width="4" height="2" fill="rgba(50,50,50,0.8)" rx="0.5"/>
          <rect x="8"   y="5" width="4" height="2" fill="rgba(50,50,50,0.8)" rx="0.5"/>
        </svg>
      </div>

      {/* Trail elements */}
      {trailsRef.current.map((trail, index) => (
        <div
          key={index}
          className="cursor-trail"
          style={{
            left: `${trail.x}px`,
            top: `${trail.y}px`,
            opacity: trail.opacity,
            transform: `scale(${1 - index * 0.03})`, // Keep existing scale
          }}
        >
          {/* New Film Strip Segment SVG for Trails */}
          <svg width="20" height="20" viewBox="-10 -10 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="-10" y="-10" width="20" height="20" fill="rgba(220,220,220,0.3)" />
            {/* Top Sprocket Holes */}
            <rect x="-9" y="-9" width="4" height="3" fill="rgba(50,50,50,0.7)" rx="0.5"/>
            <rect x="-2" y="-9" width="4" height="3" fill="rgba(50,50,50,0.7)" rx="0.5"/>
            <rect x="5" y="-9" width="4" height="3" fill="rgba(50,50,50,0.7)" rx="0.5"/>
            {/* Bottom Sprocket Holes */}
            <rect x="-9" y="6" width="4" height="3" fill="rgba(50,50,50,0.7)" rx="0.5"/>
            <rect x="-2" y="6" width="4" height="3" fill="rgba(50,50,50,0.7)" rx="0.5"/>
            <rect x="5" y="6" width="4" height="3" fill="rgba(50,50,50,0.7)" rx="0.5"/>
          </svg>
        </div>
      ))}
    </div>
  )
}
