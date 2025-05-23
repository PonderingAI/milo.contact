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
  const canvasRef = useRef<HTMLCanvasElement>(null) // Added canvas ref
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null) // Added context ref

  // Initialize trails
  useEffect(() => {
    trailsRef.current = Array(120) // Increased from 20 to 120
      .fill(0)
      .map(() => ({ x: 0, y: 0, opacity: 0, rotation: 0 })) // Add rotation: 0
  }, [])

  // Effect for canvas setup and resize handling
  useEffect(() => {
    const canvas = canvasRef.current
    if (canvas) {
      const ctx = canvas.getContext('2d')
      ctxRef.current = ctx

      const setCanvasDimensions = () => {
        canvas.width = window.innerWidth
        canvas.height = window.innerHeight
        // Potential future redraw logic here
      }
      setCanvasDimensions() // Set initial size

      window.addEventListener('resize', setCanvasDimensions)
      return () => {
        window.removeEventListener('resize', setCanvasDimensions)
      }
    }
  }, []) // Empty dependency array to run once on mount and clean up on unmount

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
      const canvas = canvasRef.current;
      const ctx = ctxRef.current;

      if (!canvas || !ctx) {
        requestRef.current = requestAnimationFrame(animateTrail); // Keep animation loop going
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear canvas
      ctx.lineCap = 'round'; // Set default line cap
      ctx.lineJoin = 'round'; // Set default line join

      // Update trail positions (logic remains the same)
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

      // Draw trail segments on canvas
      for (let i = trailsRef.current.length - 1; i >= 0; i--) {
        const segment = trailsRef.current[i];
        if (segment.opacity <= 0) continue;

        ctx.globalAlpha = segment.opacity;

        const segmentLength = 30; 
        const filmWidth = 20;     
        const edgeWidth = 3.5;    
        const sprocketWidth = 2;
        const sprocketHeight = 4;
        const numSprocketsPerSide = 3; 
        const sprocketColor = "rgba(50,50,50,0.8)"; 
        const edgeColor = "rgba(100,100,100,0.7)";
        const frameLineColor = "rgba(200,200,200,0.3)";
        const frameLineWidth = 0.5;

        ctx.save();
        ctx.translate(segment.x, segment.y);
        ctx.rotate(segment.rotation * (Math.PI / 180)); // Convert degrees to radians

        // Draw Film Edges
        ctx.fillStyle = edgeColor;
        ctx.fillRect(-filmWidth / 2, -segmentLength / 2, edgeWidth, segmentLength);
        ctx.fillRect(filmWidth / 2 - edgeWidth, -segmentLength / 2, edgeWidth, segmentLength);

        // Draw Sprocket Holes
        ctx.fillStyle = sprocketColor;
        const sprocketSpacing = segmentLength / (numSprocketsPerSide + 1);
        for (let j = 1; j <= numSprocketsPerSide; j++) {
          const yPos = -segmentLength / 2 + j * sprocketSpacing - sprocketHeight / 2;
          ctx.fillRect(-filmWidth / 2 + (edgeWidth - sprocketWidth) / 2, yPos, sprocketWidth, sprocketHeight);
          ctx.fillRect(filmWidth / 2 - edgeWidth + (edgeWidth - sprocketWidth) / 2, yPos, sprocketWidth, sprocketHeight);
        }

        // Draw Frame Line
        ctx.strokeStyle = frameLineColor;
        ctx.lineWidth = frameLineWidth;
        ctx.beginPath();
        ctx.moveTo(-filmWidth / 2 + edgeWidth, 0);
        ctx.lineTo(filmWidth / 2 - edgeWidth, 0);
        ctx.stroke();

        ctx.restore();
      }
      ctx.globalAlpha = 1.0; // Reset global alpha

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
      <canvas
        ref={canvasRef}
        style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none', zIndex: 9998 }}
      />
      {/* Main cursor element removed */}
      {/* SVG trail elements rendering removed as canvas now handles it */}
    </div>
  )
}
