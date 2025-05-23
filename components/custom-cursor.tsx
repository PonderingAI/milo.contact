"use client";

import { useEffect, useState, useRef } from "react";

interface FilmSegment {
  id: number;
  x: number;
  y: number;
  scale: number;
  rotation: number;
}

const TRAIL_AMOUNT = 25; // number of segments in the trail
const EASING_FACTOR = 0.3; // easing factor for smooth following

export default function CustomCursor() {
  const [position, setPosition] = useState({ x: -100, y: -100 });
  const [currentRotation, setCurrentRotation] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [filmSegments, setFilmSegments] = useState<FilmSegment[]>([]);

  const requestRef = useRef<number>();
  const lastPositionRef = useRef({ x: -100, y: -100 });

  // initialise segments once on mount
  useEffect(() => {
    const initial = Array.from({ length: TRAIL_AMOUNT }, (_, i) => ({
      id: i,
      x: -100,
      y: -100,
      scale: 1 - 0.04 * i,
      rotation: 0,
    }));
    setFilmSegments(initial);
  }, []);

  // mouse tracking + animation loop
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const { clientX: x, clientY: y } = e;
      const dx = x - lastPositionRef.current.x;
      const dy = y - lastPositionRef.current.y;

      if (dx || dy) {
        setCurrentRotation(Math.atan2(dy, dx) * (180 / Math.PI));
      }

      setPosition({ x, y });
      setIsVisible(true);
      lastPositionRef.current = { x, y };
    };

    const handleMouseLeave = () => setIsVisible(false);

    const animate = () => {
      let leaderX = position.x;
      let leaderY = position.y;

      setFilmSegments(prev =>
        prev.map((seg, index) => {
          const dx = leaderX - seg.x;
          const dy = leaderY - seg.y;
          const newX = seg.x + dx * EASING_FACTOR;
          const newY = seg.y + dy * EASING_FACTOR;

          const movedX = newX - seg.x;
          const movedY = newY - seg.y;

          const rotation =
            Math.abs(movedX) > 0.01 || Math.abs(movedY) > 0.01
              ? Math.atan2(movedY, movedX) * (180 / Math.PI)
              : index === 0
              ? currentRotation
              : seg.rotation;

          leaderX = newX;
          leaderY = newY;

          return { ...seg, x: newX, y: newY, rotation };
        }),
      );

      requestRef.current = requestAnimationFrame(animate);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseleave", handleMouseLeave);
    requestRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [position, currentRotation]);

  return (
    <>
      {/* hidden SVG defs for goo filter */}
      <svg xmlns="http://www.w3.org/2000/svg" style={{ display: "none" }}>
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

      {/* cursor container */}
      <div
        className="cursor-container"
        style={{
          opacity: isVisible ? 1 : 0,
          filter: "url(#goo)",
          mixBlendMode: "difference",
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          pointerEvents: "none",
          zIndex: 9999,
        }}
      >
        {filmSegments.map(segment => (
          <div
            key={segment.id}
            style={{
              position: "absolute",
              width: "20px",
              height: "20px",
              transformOrigin: "center center",
              transform: `translate(${segment.x}px, ${segment.y}px) rotate(${segment.rotation}deg) scale(${segment.scale})`,
            }}
          >
            {/* film‑strip segment */}
            <svg
              width="100%"
              height="100%"
              viewBox="-10 -10 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect x="-10" y="-10" width="20" height="20" fill="white" />
              {/* dark edges */}
              <rect x="-10" y="-10" width="3.5" height="20" fill="#222" />
              <rect x="6.5" y="-10" width="3.5" height="20" fill="#222" />
              {/* sprocket holes */}
              <rect x="-9" y="-7" width="2" height="3" fill="#000" rx="0.5" />
              <rect x="-9" y="-1" width="2" height="3" fill="#000" rx="0.5" />
              <rect x="-9" y="5" width="2" height="3" fill="#000" rx="0.5" />
              <rect x="7" y="-7" width="2" height="3" fill="#000" rx="0.5" />
              <rect x="7" y="-1" width="2" height="3" fill="#000" rx="0.5" />
              <rect x="7" y="5" width="2" height="3" fill="#000" rx="0.5" />
            </svg>
          </div>
        ))}
      </div>
    </>
  );
}
