"use client"

import { useEffect, useState, useRef } from "react"
import { usePathname } from "next/navigation"

export default function CustomCursor() {
  const [position, setPosition] = useState({ x: -100, y: -100 })
  const [isVisible, setIsVisible] = useState(false)
  const [isClicking, setIsClicking] = useState(false)
  const trailsRef = useRef<{ x: number; y: number; opacity: number }[]>([])
  const requestRef = useRef<number>()
  const pathname = usePathname()

  // Initialize trails
  useEffect(() => {
    trailsRef.current = Array(20)
      .fill(0)
      .map(() => ({ x: 0, y: 0, opacity: 0 }))
  }, [])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY })
      setIsVisible(true)
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
        }
      }

      // Add current position to the front
      newTrails[0] = { x: position.x, y: position.y, opacity: 1 }
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

  if (pathname.includes("/admin")) return null

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
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="16" cy="16" r="15" stroke="white" strokeWidth="2" fill="transparent" />
          <circle cx="16" cy="16" r="4" fill="white" />
          <rect x="8" y="2" width="2" height="4" fill="white" />
          <rect x="8" y="26" width="2" height="4" fill="white" />
          <rect x="22" y="2" width="2" height="4" fill="white" />
          <rect x="22" y="26" width="2" height="4" fill="white" />
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
            transform: `scale(${1 - index * 0.03})`,
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="11" stroke="white" strokeWidth="1" fill="transparent" />
            <rect x="6" y="2" width="1" height="2" fill="white" />
            <rect x="6" y="20" width="1" height="2" fill="white" />
            <rect x="17" y="2" width="1" height="2" fill="white" />
            <rect x="17" y="20" width="1" height="2" fill="white" />
          </svg>
        </div>
      ))}
    </div>
  )
}
