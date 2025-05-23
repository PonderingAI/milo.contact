"use client"

import { useEffect, useState, useRef } from "react"

interface FilmSegment {
  id: number;
  x: number;
  y: number;
  scale: number;
  rotation: number;
}

const TRAIL_AMOUNT = 25; // Number of segments in the trail (Changed from 20)
const EASING_FACTOR = 0.3; // For smooth following, adjust as needed (Changed from 0.2)

export default function CustomCursor() {
  const [position, setPosition] = useState({ x: -100, y: -100 })
  const [currentRotation, setCurrentRotation] = useState(0) // Target rotation from mouse input
  const [isVisible, setIsVisible] = useState(false)
  const [filmSegments, setFilmSegments] = useState<FilmSegment[]>([]); // New state for film segments
  const requestRef = useRef<number>()
  const lastPositionRef = useRef({ x: -100, y: -100 }) // Ref for last mouse position
  // Removed trailsRef, canvasRef, ctxRef

  // Initialize filmSegments state
  useEffect(() => {
    const initialSegments: FilmSegment[] = [];
    for (let i = 0; i < TRAIL_AMOUNT; i++) {
      initialSegments.push({
        id: i,
        x: -100, // Initial off-screen position
        y: -100, // Initial off-screen position
        scale: 1 - 0.04 * i, // Example scaling (Changed from 0.05)
        rotation: 0,
      });
    }
    setFilmSegments(initialSegments);
  }, []); // Empty dependency array ensures this runs only once on mount

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
      if (filmSegments.length === 0) { // Guard if filmSegments not yet initialized
        requestRef.current = requestAnimationFrame(animateTrail);
        return;
      }

      let leaderX = position.x;
      let leaderY = position.y;
      // previousSegmentRotation from prompt is not used in the provided logic for updatedSegments.
      // Each segment's rotation is based on its own movement or currentRotation for the head.

      const updatedSegments = filmSegments.map((segment, index) => {
        const newSegmentState = { ...segment };

        const dxToLeader = leaderX - newSegmentState.x;
        const dyToLeader = leaderY - newSegmentState.y;

        const newX = newSegmentState.x + dxToLeader * EASING_FACTOR;
        const newY = newSegmentState.y + dyToLeader * EASING_FACTOR;

        // Calculate actual movement of this segment in this frame
        const actualSegmentDx = newX - newSegmentState.x;
        const actualSegmentDy = newY - newSegmentState.y;
        
        newSegmentState.x = newX;
        newSegmentState.y = newY;

        // Update rotation based on its actual movement direction
        if (Math.abs(actualSegmentDx) > 0.01 || Math.abs(actualSegmentDy) > 0.01) {
          newSegmentState.rotation = Math.atan2(actualSegmentDy, actualSegmentDx) * (180 / Math.PI);
        } else if (index === 0) {
          // If mouse is stationary and first segment hasn't moved, use overall mouse direction
          newSegmentState.rotation = currentRotation;
        }
        // If no significant movement and not the first segment, retain its previous rotation implicitly

        // Update leader for the next segment in the trail
        leaderX = newSegmentState.x;
        leaderY = newSegmentState.y;
        
        return newSegmentState;
      });

      setFilmSegments(updatedSegments);
      requestRef.current = requestAnimationFrame(animateTrail);
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
    <> {/* Main fragment */}
      <svg xmlns="http://www.w3.org/2000/svg" version="1.1" style={{ display: 'none' }}>
        <defs>
          <filter id="goo">
            <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 35 -15"
              result="goo"
            />
            <feComposite in="SourceGraphic" in2="goo" operator="atop" />
          </filter>
        </defs>
      </svg>
      <div
        className="cursor-container"
        style={{
          opacity: isVisible ? 1 : 0,
          filter: 'url(#goo)',
          mixBlendMode: 'difference',
          position: 'fixed', // Ensured from globals.css or inline
          top: 0,
          left: 0,
          width: '100vw', 
          height: '100vh',
          pointerEvents: 'none', // Ensured from globals.css or inline
          zIndex: 9999 // Ensured from globals.css or inline
        }}
      >
        {filmSegments.map((segment) => (
          <div
            key={segment.id}
            style={{
              position: 'absolute',
              top: 0, // Position is controlled by transform
              left: 0, // Position is controlled by transform
              width: '20px', // Set fixed width for the div
              height: '20px', // Set fixed height for the div (should match SVG)
              transformOrigin: 'center center', // Ensure rotation and scale happen around the center
              transform: `translate(${segment.x}px, ${segment.y}px) rotate(${segment.rotation}deg) scale(${segment.scale})`,
            }}
          >
            {/* Film Strip SVG for each segment */}
            <svg width="100%" height="100%" viewBox="-10 -10 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="-10" y="-10" width="20" height="20" fill="white" />

              {/* Film Edges (darker, drawn on top of white base) */}
              <rect x="-10" y="-10" width="3.5" height="20" fill="#222" /> {/* Dark edge */}
              <rect x="6.5" y="-10" width="3.5" height="20" fill="#222" /> {/* Dark edge */}

              {/* Sprocket Holes (even darker) */}
              <rect x="-9" y="-7" width="2" height="3" fill="#000000" rx="0.5"/>
              <rect x="-9" y="-1" width="2" height="3" fill="#000000" rx="0.5"/>
              <rect x="-9" y="5"  width="2" height="3" fill="#000000" rx="0.5"/>

              <rect x="7" y="-7" width="2" height="3" fill="#000000" rx="0.5"/>
              <rect x="7" y="-1" width="2" height="3" fill="#000000" rx="0.5"/>
              <rect x="7" y="5"  width="2" height="3" fill="#000000" rx="0.5"/>
            </svg>
          </div>
        ))}
      </div>
    </>
  )
}
