import { useEffect, useRef } from 'react';

/**
 * AmbientCanvas — A subtle, performant ambient background for the main app shell.
 * Renders floating gradient orbs that slowly morph and drift.
 * Very low opacity so it doesn't distract from content.
 */
export default function AmbientCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    let w = canvas.offsetWidth;
    let h = canvas.offsetHeight;

    const resize = () => {
      w = canvas.offsetWidth;
      h = canvas.offsetHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.scale(dpr, dpr);
    };
    resize();
    window.addEventListener('resize', resize);

    // Floating orbs configuration
    const orbs = [
      { x: 0.2, y: 0.3, r: 200, color: 'rgba(26,47,251,0.025)', speed: 0.0003, phase: 0 },
      { x: 0.7, y: 0.6, r: 250, color: 'rgba(193,255,0,0.012)', speed: 0.0004, phase: Math.PI / 3 },
      { x: 0.5, y: 0.8, r: 180, color: 'rgba(102,112,255,0.018)', speed: 0.0002, phase: Math.PI / 2 },
      { x: 0.8, y: 0.2, r: 160, color: 'rgba(26,47,251,0.015)', speed: 0.00035, phase: Math.PI },
    ];

    let time = 0;
    let lastFrame = 0;
    const FPS_CAP = 30; // Throttle to 30fps for performance
    const frameInterval = 1000 / FPS_CAP;

    const animate = (timestamp: number) => {
      animRef.current = requestAnimationFrame(animate);

      // Throttle frame rate
      if (timestamp - lastFrame < frameInterval) return;
      lastFrame = timestamp;

      time += 0.01;
      ctx.clearRect(0, 0, w, h);

      for (const orb of orbs) {
        const ox = (orb.x + Math.sin(time * orb.speed * 100 + orb.phase) * 0.08) * w;
        const oy = (orb.y + Math.cos(time * orb.speed * 80 + orb.phase) * 0.06) * h;
        const pulsedR = orb.r + Math.sin(time * 0.5 + orb.phase) * 30;

        const grad = ctx.createRadialGradient(ox, oy, 0, ox, oy, pulsedR);
        grad.addColorStop(0, orb.color);
        grad.addColorStop(1, 'transparent');

        ctx.beginPath();
        ctx.arc(ox, oy, pulsedR, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
      }

      // Subtle grid dots
      ctx.fillStyle = 'rgba(255,255,255,0.012)';
      const gridSize = 60;
      const offsetX = (time * 3) % gridSize;
      const offsetY = (time * 2) % gridSize;
      for (let x = -gridSize; x < w + gridSize; x += gridSize) {
        for (let y = -gridSize; y < h + gridSize; y += gridSize) {
          ctx.beginPath();
          ctx.arc(x + offsetX, y + offsetY, 0.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    };

    animRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
        opacity: 0.6,
      }}
    />
  );
}
