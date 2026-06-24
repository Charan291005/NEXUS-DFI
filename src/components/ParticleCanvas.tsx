import { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  opacity: number;
  color: string;
  glowColor: string;
  pulse: number;
  pulseSpeed: number;
  type: 'star' | 'node' | 'giant';
  twinkle: number;
  twinkleSpeed: number;
}

interface ShootingStar {
  x: number;
  y: number;
  vx: number;
  vy: number;
  length: number;
  opacity: number;
  life: number;
  maxLife: number;
  color: string;
}

interface Ripple {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  opacity: number;
  color: string;
}

interface Burst {
  x: number;
  y: number;
  particles: { x: number; y: number; vx: number; vy: number; life: number; color: string; radius: number }[];
}

export default function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -1000, y: -1000, prevX: -1000, prevY: -1000 });
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = canvas.offsetWidth;
    let height = canvas.offsetHeight;
    const dpr = window.devicePixelRatio || 1;

    const resize = () => {
      width = canvas.offsetWidth;
      height = canvas.offsetHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
    };
    resize();
    window.addEventListener('resize', resize);

    // ── Particle configuration ──────────────────────────
    const PARTICLE_COUNT = 130;
    const CONNECTION_DIST = 160;
    const MOUSE_ATTRACT_RADIUS = 180;
    const MOUSE_REPEL_RADIUS = 80;

    const COLORS = [
      { fill: '#1a2ffb', glow: 'rgba(26,47,251,', type: 'node' as const },
      { fill: '#3d4fff', glow: 'rgba(61,79,255,', type: 'node' as const },
      { fill: '#6670ff', glow: 'rgba(102,112,255,', type: 'star' as const },
      { fill: 'rgba(255,255,255,0.9)', glow: 'rgba(255,255,255,', type: 'star' as const },
      { fill: '#c1ff00', glow: 'rgba(193,255,0,', type: 'star' as const },
      { fill: 'rgba(255,255,255,0.6)', glow: 'rgba(255,255,255,', type: 'star' as const },
    ];

    const particles: Particle[] = Array.from({ length: PARTICLE_COUNT }, () => {
      const colorDef = COLORS[Math.floor(Math.random() * COLORS.length)];
      const isGiant = Math.random() < 0.04;
      return {
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        radius: isGiant ? 3.5 + Math.random() * 2 : colorDef.type === 'node' ? 1.5 + Math.random() * 1.5 : 0.8 + Math.random() * 1.2,
        opacity: isGiant ? 0.9 : 0.3 + Math.random() * 0.6,
        color: colorDef.fill,
        glowColor: colorDef.glow,
        pulse: Math.random() * Math.PI * 2,
        pulseSpeed: 0.01 + Math.random() * 0.02,
        type: isGiant ? 'giant' : colorDef.type,
        twinkle: Math.random(),
        twinkleSpeed: 0.005 + Math.random() * 0.015,
      };
    });

    const shootingStars: ShootingStar[] = [];
    const ripples: Ripple[] = [];
    const bursts: Burst[] = [];

    let time = 0;

    // ── Spawn shooting star ──────────────────────────────
    const spawnShootingStar = () => {
      const angle = -Math.PI / 6 + (Math.random() - 0.5) * (Math.PI / 4);
      const speed = 6 + Math.random() * 10;
      const colors = ['#1a2ffb', '#6670ff', '#c1ff00', '#ffffff'];
      shootingStars.push({
        x: Math.random() * width,
        y: Math.random() * (height * 0.4),
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        length: 60 + Math.random() * 100,
        opacity: 1,
        life: 0,
        maxLife: 60 + Math.random() * 40,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    };

    // Periodic shooting stars
    const ssInterval = setInterval(() => {
      if (Math.random() < 0.7) spawnShootingStar();
    }, 2800);

    // ── Mouse events ─────────────────────────────────────
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current.prevX = mouseRef.current.x;
      mouseRef.current.prevY = mouseRef.current.y;
      mouseRef.current.x = e.clientX - rect.left;
      mouseRef.current.y = e.clientY - rect.top;
    };
    const handleMouseLeave = () => {
      mouseRef.current = { x: -1000, y: -1000, prevX: -1000, prevY: -1000 };
    };

    // Click: ripple + burst
    const handleClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const cx = e.clientX - rect.left;
      const cy = e.clientY - rect.top;

      // Ripple
      const rippleColors = ['rgba(26,47,251,', 'rgba(193,255,0,', 'rgba(102,112,255,'];
      const rc = rippleColors[Math.floor(Math.random() * rippleColors.length)];
      for (let r = 0; r < 3; r++) {
        ripples.push({
          x: cx, y: cy,
          radius: 0,
          maxRadius: 80 + r * 60,
          opacity: 0.6 - r * 0.15,
          color: rc,
        });
      }

      // Burst
      const burstParticles = [];
      const count = 18 + Math.floor(Math.random() * 14);
      const burstColors = ['#1a2ffb', '#6670ff', '#c1ff00', '#ffffff', '#3d4fff'];
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2 + Math.random() * 0.3;
        const speed = 1.5 + Math.random() * 4;
        burstParticles.push({
          x: cx, y: cy,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 1,
          color: burstColors[Math.floor(Math.random() * burstColors.length)],
          radius: 1 + Math.random() * 2.5,
        });
      }
      bursts.push({ x: cx, y: cy, particles: burstParticles });

      // Attract nearby particles toward click
      particles.forEach(p => {
        const dx = cx - p.x;
        const dy = cy - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 200 && dist > 0) {
          const force = (200 - dist) / 200 * 1.5;
          p.vx += (dx / dist) * force;
          p.vy += (dy / dist) * force;
        }
      });
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseleave', handleMouseLeave);
    canvas.addEventListener('click', handleClick);

    // ── Draw helpers ──────────────────────────────────────
    const drawGlowCircle = (x: number, y: number, r: number, color: string, alpha: number) => {
      const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
      grad.addColorStop(0, `${color}${alpha})`);
      grad.addColorStop(1, `${color}0)`);
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.globalAlpha = 1;
      ctx.fill();
    };

    // ── Main animation loop ───────────────────────────────
    const animate = () => {
      time++;
      ctx.clearRect(0, 0, width, height);

      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;

      // ── Draw mouse aura ──────────────────────────────────
      if (mx > 0 && mx < width) {
        // Outer glow
        drawGlowCircle(mx, my, MOUSE_ATTRACT_RADIUS, 'rgba(26,47,251,', 0.05);
        // Inner core
        drawGlowCircle(mx, my, 40, 'rgba(26,47,251,', 0.12);
        // Bright center
        drawGlowCircle(mx, my, 12, 'rgba(100,120,255,', 0.25);

        // Draw constellation lines from mouse to nearby particles
        particles.forEach(p => {
          const dx = mx - p.x;
          const dy = my - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < MOUSE_ATTRACT_RADIUS) {
            const alpha = (1 - dist / MOUSE_ATTRACT_RADIUS) * 0.35;
            ctx.beginPath();
            ctx.moveTo(mx, my);
            ctx.lineTo(p.x, p.y);
            const grad = ctx.createLinearGradient(mx, my, p.x, p.y);
            grad.addColorStop(0, `rgba(26,47,251,${alpha})`);
            grad.addColorStop(1, `rgba(102,112,255,${alpha * 0.5})`);
            ctx.strokeStyle = grad;
            ctx.lineWidth = 0.8;
            ctx.globalAlpha = 1;
            ctx.stroke();
          }
        });
      }

      // ── Update & draw particles ──────────────────────────
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Twinkle
        p.twinkle += p.twinkleSpeed;
        p.pulse += p.pulseSpeed;
        const twinkleFactor = 0.7 + Math.sin(p.twinkle) * 0.3;
        const pulseFactor = 1 + Math.sin(p.pulse) * 0.15;

        // Mouse attract/repel physics
        const dx = mx - p.x;
        const dy = my - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < MOUSE_REPEL_RADIUS && dist > 0) {
          // Repel strongly close
          const force = (MOUSE_REPEL_RADIUS - dist) / MOUSE_REPEL_RADIUS * 0.06;
          p.vx -= (dx / dist) * force;
          p.vy -= (dy / dist) * force;
        } else if (dist < MOUSE_ATTRACT_RADIUS && dist > MOUSE_REPEL_RADIUS) {
          // Gentle attract
          const force = (1 - dist / MOUSE_ATTRACT_RADIUS) * 0.008;
          p.vx += (dx / dist) * force;
          p.vy += (dy / dist) * force;
        }

        // Move
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.998;
        p.vy *= 0.998;

        // Wrap edges
        if (p.x < -20) p.x = width + 20;
        if (p.x > width + 20) p.x = -20;
        if (p.y < -20) p.y = height + 20;
        if (p.y > height + 20) p.y = -20;

        const effectiveRadius = p.radius * pulseFactor;
        const effectiveOpacity = p.opacity * twinkleFactor;

        // Glow halo for nodes & giants
        if (p.type !== 'star') {
          drawGlowCircle(p.x, p.y, effectiveRadius * 5, p.glowColor, effectiveOpacity * 0.3);
        }

        // Draw particle
        ctx.beginPath();
        ctx.arc(p.x, p.y, effectiveRadius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = effectiveOpacity;
        ctx.fill();

        // Star cross sparkle for giant particles
        if (p.type === 'giant') {
          const sparkSize = effectiveRadius * 4;
          ctx.globalAlpha = effectiveOpacity * 0.4;
          ctx.strokeStyle = p.color;
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.moveTo(p.x - sparkSize, p.y);
          ctx.lineTo(p.x + sparkSize, p.y);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(p.x, p.y - sparkSize);
          ctx.lineTo(p.x, p.y + sparkSize);
          ctx.stroke();
          // Diagonal sparkles
          const d = sparkSize * 0.6;
          ctx.globalAlpha = effectiveOpacity * 0.2;
          ctx.beginPath();
          ctx.moveTo(p.x - d, p.y - d);
          ctx.lineTo(p.x + d, p.y + d);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(p.x + d, p.y - d);
          ctx.lineTo(p.x - d, p.y + d);
          ctx.stroke();
        }

        // ── Particle-to-particle connections ────────────────
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const cdx = p.x - p2.x;
          const cdy = p.y - p2.y;
          const cdist = Math.sqrt(cdx * cdx + cdy * cdy);
          if (cdist < CONNECTION_DIST) {
            const lineAlpha = (1 - cdist / CONNECTION_DIST) * 0.18;
            // Color the connection line based on node types
            let lineColor: string;
            if (p.type === 'node' && p2.type === 'node') {
              lineColor = `rgba(26,47,251,${lineAlpha})`;
            } else if (p.color.includes('c1ff00') || p2.color.includes('c1ff00')) {
              lineColor = `rgba(193,255,0,${lineAlpha * 0.6})`;
            } else {
              lineColor = `rgba(100,110,255,${lineAlpha})`;
            }
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = lineColor;
            ctx.globalAlpha = 1;
            ctx.lineWidth = cdist < CONNECTION_DIST * 0.4 ? 1 : 0.5;
            ctx.stroke();
          }
        }
      }

      // ── Draw shooting stars ──────────────────────────────
      for (let i = shootingStars.length - 1; i >= 0; i--) {
        const ss = shootingStars[i];
        ss.life++;
        const progress = ss.life / ss.maxLife;
        ss.opacity = progress < 0.2 ? progress / 0.2 : progress > 0.7 ? (1 - progress) / 0.3 : 1;
        const tailX = ss.x - (ss.vx / Math.sqrt(ss.vx * ss.vx + ss.vy * ss.vy)) * ss.length * ss.opacity;
        const tailY = ss.y - (ss.vy / Math.sqrt(ss.vx * ss.vx + ss.vy * ss.vy)) * ss.length * ss.opacity;

        const grad = ctx.createLinearGradient(ss.x, ss.y, tailX, tailY);
        grad.addColorStop(0, ss.color.startsWith('rgba') ? ss.color : ss.color + 'ff');
        grad.addColorStop(0.3, ss.color + '80');
        grad.addColorStop(1, 'transparent');

        ctx.beginPath();
        ctx.moveTo(ss.x, ss.y);
        ctx.lineTo(tailX, tailY);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.5;
        ctx.globalAlpha = ss.opacity * 0.9;
        ctx.stroke();

        // Head glow
        drawGlowCircle(ss.x, ss.y, 8, 'rgba(255,255,255,', ss.opacity * 0.6);

        ss.x += ss.vx;
        ss.y += ss.vy;
        if (ss.life >= ss.maxLife || ss.x > width + 100 || ss.y > height + 100) {
          shootingStars.splice(i, 1);
        }
      }

      // ── Draw ripples ─────────────────────────────────────
      for (let i = ripples.length - 1; i >= 0; i--) {
        const rpl = ripples[i];
        rpl.radius += 3;
        rpl.opacity *= 0.94;
        if (rpl.opacity < 0.01 || rpl.radius > rpl.maxRadius) {
          ripples.splice(i, 1); continue;
        }
        ctx.beginPath();
        ctx.arc(rpl.x, rpl.y, rpl.radius, 0, Math.PI * 2);
        ctx.strokeStyle = `${rpl.color}${rpl.opacity})`;
        ctx.lineWidth = 1.5;
        ctx.globalAlpha = 1;
        ctx.stroke();
      }

      // ── Draw bursts ──────────────────────────────────────
      for (let i = bursts.length - 1; i >= 0; i--) {
        const burst = bursts[i];
        let alive = false;
        burst.particles.forEach(bp => {
          if (bp.life <= 0) return;
          bp.x += bp.vx;
          bp.y += bp.vy;
          bp.vx *= 0.93;
          bp.vy *= 0.93;
          bp.life -= 0.025;
          if (bp.life > 0) {
            alive = true;
            ctx.beginPath();
            ctx.arc(bp.x, bp.y, bp.radius * bp.life, 0, Math.PI * 2);
            ctx.fillStyle = bp.color;
            ctx.globalAlpha = bp.life * 0.85;
            ctx.fill();
            drawGlowCircle(bp.x, bp.y, bp.radius * bp.life * 4, 'rgba(100,120,255,', bp.life * 0.3);
          }
        });
        if (!alive) bursts.splice(i, 1);
      }

      // ── Nebula pulse (slow ambient wave) ─────────────────
      const nebulaCx = width * 0.35;
      const nebulaCy = height * 0.55;
      const nebulaR = 200 + Math.sin(time * 0.008) * 30;
      const nebulaGrad = ctx.createRadialGradient(nebulaCx, nebulaCy, 0, nebulaCx, nebulaCy, nebulaR);
      nebulaGrad.addColorStop(0, 'rgba(26,47,251,0.04)');
      nebulaGrad.addColorStop(0.5, 'rgba(61,79,255,0.02)');
      nebulaGrad.addColorStop(1, 'transparent');
      ctx.beginPath();
      ctx.arc(nebulaCx, nebulaCy, nebulaR, 0, Math.PI * 2);
      ctx.fillStyle = nebulaGrad;
      ctx.globalAlpha = 1;
      ctx.fill();

      ctx.globalAlpha = 1;
      animRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animRef.current);
      clearInterval(ssInterval);
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
      canvas.removeEventListener('click', handleClick);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        background: 'linear-gradient(135deg, #000000 0%, #020208 50%, #000510 100%)',
        cursor: 'crosshair',
      }}
    />
  );
}
