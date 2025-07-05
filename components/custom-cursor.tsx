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
const FADE_OUT_DELAY = 1500; // milliseconds before cursor fades out when no movement

export default function CustomCursor() {
  const [position, setPosition] = useState({ x: -100, y: -100 });
  const [currentRotation, setCurrentRotation] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [shouldFadeOut, setShouldFadeOut] = useState(false);
  const [isOverIframe, setIsOverIframe] = useState(false);
  const [filmSegments, setFilmSegments] = useState<FilmSegment[]>([]);

  const requestRef = useRef<number>();
  const lastPositionRef = useRef({ x: -100, y: -100 });
  const fadeOutTimeoutRef = useRef<NodeJS.Timeout>();
  const lastMoveTimeRef = useRef<number>(0);
  const iframeListenersRef = useRef<Set<HTMLIFrameElement>>(new Set());

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

  // Function to handle mouse movement
  const handleMouseMovement = (x: number, y: number) => {
    const dx = x - lastPositionRef.current.x;
    const dy = y - lastPositionRef.current.y;
    const now = Date.now();

    // Only update if there's actual movement
    if (dx !== 0 || dy !== 0) {
      setCurrentRotation(Math.atan2(dy, dx) * (180 / Math.PI));
      lastMoveTimeRef.current = now;
      
      // Show cursor and cancel any fade out (but not if over iframe)
      if (!isOverIframe) {
        setShouldFadeOut(false);
        if (fadeOutTimeoutRef.current) {
          clearTimeout(fadeOutTimeoutRef.current);
        }

        // Set new fade out timer
        fadeOutTimeoutRef.current = setTimeout(() => {
          setShouldFadeOut(true);
        }, FADE_OUT_DELAY);
      }
    }

    setPosition({ x, y });
    if (!isOverIframe) {
      setIsVisible(true);
    }
    lastPositionRef.current = { x, y };
  };

  // Function to add event listeners to iframes
  const addIframeListeners = () => {
    const iframes = document.querySelectorAll('iframe');
    
    iframes.forEach((iframe) => {
      if (!iframeListenersRef.current.has(iframe)) {
        // Add mouseenter listener - fade out custom cursor
        const handleIframeEnter = () => {
          setIsOverIframe(true);
          setShouldFadeOut(false); // Clear any pending fade out
          if (fadeOutTimeoutRef.current) {
            clearTimeout(fadeOutTimeoutRef.current);
          }
        };

        // Add mouseleave listener - fade in custom cursor from current position
        const handleIframeLeave = (e: MouseEvent) => {
          setIsOverIframe(false);
          
          // Reset cursor position to current mouse position (no momentum)
          const currentX = e.clientX;
          const currentY = e.clientY;
          
          // Reset all segments to current mouse position to avoid jumping
          setPosition({ x: currentX, y: currentY });
          lastPositionRef.current = { x: currentX, y: currentY };
          
          // Reset all film segments to current position (no trail initially)
          setFilmSegments(prev => 
            prev.map((seg) => ({
              ...seg,
              x: currentX,
              y: currentY,
              rotation: 0 // Reset rotation as well
            }))
          );
          
          setIsVisible(true); // Show cursor again
        };

        iframe.addEventListener('mouseenter', handleIframeEnter);
        iframe.addEventListener('mouseleave', handleIframeLeave);
        
        iframeListenersRef.current.add(iframe);

        // Store listeners for cleanup
        (iframe as any)._cursorListeners = {
          enter: handleIframeEnter,
          leave: handleIframeLeave
        };
      }
    });
  };

  // Function to remove iframe listeners
  const removeIframeListeners = () => {
    iframeListenersRef.current.forEach((iframe) => {
      if ((iframe as any)._cursorListeners) {
        iframe.removeEventListener('mouseenter', (iframe as any)._cursorListeners.enter);
        iframe.removeEventListener('mouseleave', (iframe as any)._cursorListeners.leave);
        delete (iframe as any)._cursorListeners;
      }
    });
    iframeListenersRef.current.clear();
  };

  // mouse tracking + animation loop
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      handleMouseMovement(e.clientX, e.clientY);
    };

    const handleMouseLeave = () => {
      setIsVisible(false);
      setShouldFadeOut(false);
      setIsOverIframe(false);
      if (fadeOutTimeoutRef.current) {
        clearTimeout(fadeOutTimeoutRef.current);
      }
    };

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

    // Add initial iframe listeners
    addIframeListeners();

    // Set up a MutationObserver to watch for new iframes
    const observer = new MutationObserver(() => {
      addIframeListeners();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseleave", handleMouseLeave);
    requestRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      if (fadeOutTimeoutRef.current) clearTimeout(fadeOutTimeoutRef.current);
      
      removeIframeListeners();
      observer.disconnect();
    };
  }, [position, currentRotation, isOverIframe]);

  // Calculate opacity based on visibility, fade out state, and iframe state
  const getOpacity = () => {
    if (!isVisible || isOverIframe) return 0; // Hide completely when over iframe
    if (shouldFadeOut) return 0.2; // Subtle fade when inactive
    return 1; // Full opacity when active
  };

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
          opacity: getOpacity(),
          filter: "url(#goo)",
          mixBlendMode: "difference",
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          pointerEvents: "none",
          zIndex: 9999,
          transition: "opacity 0.3s ease", // Smooth fade transition
        }}
      >
        {filmSegments.map((segment) => (
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