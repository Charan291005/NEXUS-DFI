import { useEffect, useRef, useState } from 'react';

export default function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);
  const pos = useRef({ x: -100, y: -100 });
  const target = useRef({ x: -100, y: -100 });
  const animRef = useRef<number>(0);
  const [isHovering, setIsHovering] = useState(false);
  const [cursorText, setCursorText] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    // Check for touch device
    const checkTouch = () => {
      setIsTouch('ontouchstart' in window || navigator.maxTouchPoints > 0);
    };
    checkTouch();
    if (isTouch) return;

    const handleMouseMove = (e: MouseEvent) => {
      target.current = { x: e.clientX, y: e.clientY };
      if (!isVisible) setIsVisible(true);
    };

    const handleMouseEnter = () => setIsVisible(true);
    const handleMouseLeave = () => setIsVisible(false);

    // Track hover on interactive elements
    const handleElementHover = (e: MouseEvent) => {
      const el = e.target as HTMLElement;
      const interactive = el.closest('button, a, input, select, textarea, [data-cursor]');
      if (interactive) {
        setIsHovering(true);
        const text = interactive.getAttribute('data-cursor') || '';
        setCursorText(text);
      } else {
        setIsHovering(false);
        setCursorText('');
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousemove', handleElementHover);
    document.addEventListener('mouseenter', handleMouseEnter);
    document.addEventListener('mouseleave', handleMouseLeave);

    // Animation loop with spring physics
    const lerp = (start: number, end: number, factor: number) => start + (end - start) * factor;

    const animate = () => {
      pos.current.x = lerp(pos.current.x, target.current.x, 0.12);
      pos.current.y = lerp(pos.current.y, target.current.y, 0.12);

      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate(${pos.current.x}px, ${pos.current.y}px) translate(-50%, -50%)`;
      }
      if (dotRef.current) {
        dotRef.current.style.transform = `translate(${target.current.x}px, ${target.current.y}px) translate(-50%, -50%)`;
      }

      animRef.current = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousemove', handleElementHover);
      document.removeEventListener('mouseenter', handleMouseEnter);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [isTouch, isVisible]);

  if (isTouch) return null;

  return (
    <>
      {/* Hide default cursor globally */}
      <style>{`
        * { cursor: none !important; }
      `}</style>

      {/* Outer ring (lagging) */}
      <div
        ref={cursorRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: isHovering ? '80px' : '40px',
          height: isHovering ? '80px' : '40px',
          borderRadius: '50%',
          border: isHovering ? 'none' : '1px solid rgba(255,255,255,0.4)',
          background: isHovering ? 'rgba(26, 47, 251, 0.15)' : 'transparent',
          backdropFilter: isHovering ? 'blur(4px)' : 'none',
          pointerEvents: 'none',
          zIndex: 99999,
          transition: 'width 0.3s cubic-bezier(0.16, 1, 0.3, 1), height 0.3s cubic-bezier(0.16, 1, 0.3, 1), background 0.3s ease, border 0.3s ease',
          opacity: isVisible ? 1 : 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mixBlendMode: 'difference',
        }}
      >
        {cursorText && (
          <span style={{
            fontSize: '9px',
            fontWeight: 600,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: '#ffffff',
            fontFamily: "'IBM Plex Mono', monospace",
          }}>
            {cursorText}
          </span>
        )}
      </div>

      {/* Inner dot (instant) */}
      <div
        ref={dotRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '4px',
          height: '4px',
          borderRadius: '50%',
          background: isHovering ? '#1a2ffb' : '#ffffff',
          pointerEvents: 'none',
          zIndex: 100000,
          opacity: isVisible ? 1 : 0,
          transition: 'background 0.2s ease, opacity 0.2s ease',
        }}
      />
    </>
  );
}
