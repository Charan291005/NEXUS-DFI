import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Spinner } from '../components/ui';
import ParticleCanvas from '../components/ParticleCanvas';
import CustomCursor from '../components/CustomCursor';
import gsap from 'gsap';

// ── Lusion-style stagger animation variants ─────────────
const lusionEase: [number, number, number, number] = [0.16, 1, 0.3, 1];

const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.6 } },
};

const textReveal: Variants = {
  hidden: { opacity: 0, y: 40, rotateX: -15 },
  show: { opacity: 1, y: 0, rotateX: 0, transition: { duration: 0.8, ease: lusionEase } },
};

const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.6 } },
};

const slideUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: lusionEase } },
};

// ── GSAP Text Scramble Effect ────────────────────────────
function useTextScramble(finalText: string, trigger: boolean, delay = 0) {
  const [display, setDisplay] = useState('');
  const chars = '!<>-_\\/[]{}—=+*^?#_NEXUS01';
  useEffect(() => {
    if (!trigger) { setDisplay(''); return; }
    let frame = 0;
    const totalFrames = 30;
    const timer = setTimeout(() => {
      const interval = setInterval(() => {
        frame++;
        const progress = frame / totalFrames;
        const result = finalText.split('').map((char, i) => {
          if (char === ' ') return ' ';
          if (i / finalText.length < progress) return finalText[i];
          return chars[Math.floor(Math.random() * chars.length)];
        }).join('');
        setDisplay(result);
        if (frame >= totalFrames) clearInterval(interval);
      }, 30);
      return () => clearInterval(interval);
    }, delay);
    return () => clearTimeout(timer);
  }, [trigger, finalText, delay]);
  return display;
}

// ── Magnetic Button Hook ─────────────────────────────────
function useMagneticRef() {
  const ref = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const handleMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const maxDist = 120;
      if (dist < maxDist) {
        const pull = (1 - dist / maxDist) * 0.35;
        gsap.to(el, { x: dx * pull, y: dy * pull, duration: 0.4, ease: 'power3.out' });
      } else {
        gsap.to(el, { x: 0, y: 0, duration: 0.6, ease: 'elastic.out(1, 0.5)' });
      }
    };
    const handleLeave = () => {
      gsap.to(el, { x: 0, y: 0, duration: 0.6, ease: 'elastic.out(1, 0.5)' });
    };
    window.addEventListener('mousemove', handleMove);
    el.addEventListener('mouseleave', handleLeave);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      el.removeEventListener('mouseleave', handleLeave);
    };
  }, []);
  return ref;
}

// ── Cursor Trail Canvas ──────────────────────────────────
function CursorTrail() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    let w = canvas.offsetWidth;
    let h = canvas.offsetHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);

    const trail: { x: number; y: number; age: number }[] = [];
    let animId = 0;

    const resize = () => {
      w = canvas.offsetWidth;
      h = canvas.offsetHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.scale(dpr, dpr);
    };
    window.addEventListener('resize', resize);

    const onMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      trail.push({ x: e.clientX - rect.left, y: e.clientY - rect.top, age: 0 });
      if (trail.length > 40) trail.shift();
    };
    canvas.addEventListener('mousemove', onMove);

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      for (let i = trail.length - 1; i >= 0; i--) {
        const p = trail[i];
        p.age++;
        if (p.age > 40) { trail.splice(i, 1); continue; }
        const alpha = (1 - p.age / 40) * 0.3;
        const radius = (1 - p.age / 40) * 12;
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, radius);
        grad.addColorStop(0, `rgba(26,47,251,${alpha})`);
        grad.addColorStop(1, 'transparent');
        ctx.beginPath();
        ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
      }
      animId = requestAnimationFrame(draw);
    };
    draw();
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('mousemove', onMove);
    };
  }, []);
  return <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'auto', zIndex: 0, opacity: 0.7 }} />;
}

// ── Floating Grid Lines Background ───────────────────────
function FloatingGrid() {
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const lines = el.querySelectorAll('.grid-line');
    gsap.set(lines, { opacity: 0, scaleY: 0 });
    gsap.to(lines, {
      opacity: (i: number) => 0.03 + (i % 3) * 0.015,
      scaleY: 1,
      duration: 1.8,
      stagger: 0.08,
      delay: 1.5,
      ease: 'power3.out',
    });
    lines.forEach((line, i) => {
      gsap.to(line, {
        y: `+=${8 + (i % 3) * 4}`,
        duration: 3 + (i % 4) * 0.5,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        delay: i * 0.2,
      });
    });
  }, []);
  return (
    <div ref={containerRef} style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="grid-line" style={{
          position: 'absolute', left: `${8 + i * 8}%`, top: 0, bottom: 0, width: '1px',
          background: `linear-gradient(180deg, transparent 0%, rgba(26,47,251,0.15) 30%, rgba(26,47,251,0.15) 70%, transparent 100%)`,
          transformOrigin: 'top',
        }} />
      ))}
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={`h-${i}`} className="grid-line" style={{
          position: 'absolute', top: `${10 + i * 12}%`, left: 0, right: 0, height: '1px',
          background: `linear-gradient(90deg, transparent 0%, rgba(26,47,251,0.1) 30%, rgba(26,47,251,0.1) 70%, transparent 100%)`,
          transformOrigin: 'left',
        }} />
      ))}
    </div>
  );
}

// ── Morphing Gradient Orbs ───────────────────────────────
function MorphingOrbs() {
  const orbsRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = orbsRef.current;
    if (!el) return;
    const orbs = el.querySelectorAll('.morph-orb');
    orbs.forEach((orb, i) => {
      const tl = gsap.timeline({ repeat: -1, yoyo: true, delay: i * 1.5 });
      tl.to(orb, {
        x: `+=${40 + i * 20}`, y: `+=${30 - i * 15}`,
        scale: 1.2 + i * 0.1,
        borderRadius: `${40 + i * 10}% ${60 - i * 5}% ${50 + i * 8}% ${45 - i * 3}%`,
        duration: 6 + i * 2, ease: 'sine.inOut',
      });
      tl.to(orb, {
        x: `-=${20 + i * 10}`, y: `-=${40 - i * 10}`,
        scale: 0.9,
        borderRadius: `${55}% ${45}% ${60}% ${40}%`,
        duration: 5 + i, ease: 'sine.inOut',
      });
    });
  }, []);
  return (
    <div ref={orbsRef} style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
      <div className="morph-orb" style={{
        position: 'absolute', top: '15%', left: '20%', width: '300px', height: '300px',
        borderRadius: '40% 60% 55% 45%',
        background: 'radial-gradient(circle, rgba(26,47,251,0.08) 0%, transparent 70%)',
        filter: 'blur(40px)',
      }} />
      <div className="morph-orb" style={{
        position: 'absolute', bottom: '20%', right: '10%', width: '250px', height: '250px',
        borderRadius: '55% 45% 50% 50%',
        background: 'radial-gradient(circle, rgba(193,255,0,0.04) 0%, transparent 70%)',
        filter: 'blur(50px)',
      }} />
      <div className="morph-orb" style={{
        position: 'absolute', top: '50%', left: '50%', width: '200px', height: '200px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(102,112,255,0.05) 0%, transparent 70%)',
        filter: 'blur(60px)',
      }} />
    </div>
  );
}



// ── Rotating DNA Helix SVG ───────────────────────────────
function DnaHelix() {
  const ref = useRef<SVGSVGElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    const dots = ref.current.querySelectorAll('.helix-dot');
    dots.forEach((dot, i) => {
      gsap.to(dot, {
        cx: `+=${Math.sin(i * 0.5) * 8}`,
        opacity: 0.15 + (i % 3) * 0.1,
        duration: 2 + (i % 4) * 0.3,
        repeat: -1, yoyo: true,
        ease: 'sine.inOut',
        delay: i * 0.08,
      });
    });
    const lines = ref.current.querySelectorAll('.helix-line');
    lines.forEach((line, i) => {
      gsap.to(line, {
        opacity: 0.08,
        duration: 1.5,
        repeat: -1, yoyo: true,
        ease: 'sine.inOut',
        delay: i * 0.15,
      });
    });
  }, []);
  const points = Array.from({ length: 20 }, (_, i) => ({
    y: 30 + i * 22,
    x1: 40 + Math.sin(i * 0.6) * 25,
    x2: 40 - Math.sin(i * 0.6) * 25,
  }));
  return (
    <svg ref={ref} width="80" height="500" viewBox="0 0 80 500" style={{
      position: 'absolute', right: '8%', top: '10%',
      opacity: 0.2, pointerEvents: 'none', zIndex: 0,
    }}>
      {points.map((p, i) => (
        <g key={i}>
          <circle className="helix-dot" cx={p.x1} cy={p.y} r="2.5" fill="#1a2ffb" opacity="0.2" />
          <circle className="helix-dot" cx={p.x2} cy={p.y} r="2.5" fill="#6670ff" opacity="0.15" />
          {i % 2 === 0 && (
            <line className="helix-line" x1={p.x1} y1={p.y} x2={p.x2} y2={p.y}
              stroke="rgba(26,47,251,0.1)" strokeWidth="0.5" opacity="0.05" />
          )}
        </g>
      ))}
    </svg>
  );
}

// ── GSAP Character Reveal Component ──────────────────────
function GsapCharReveal({ text, style, delay = 0, isReady }: {
  text: string; className?: string; style?: React.CSSProperties; delay?: number; isReady: boolean;
}) {
  const containerRef = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (!isReady || !containerRef.current) return;
    const chars = containerRef.current.querySelectorAll('.gsap-char');
    gsap.set(chars, { opacity: 0, y: 60, rotateX: -90 });
    gsap.to(chars, {
      opacity: 1, y: 0, rotateX: 0,
      duration: 0.8, stagger: 0.025, delay,
      ease: 'power4.out',
    });
  }, [isReady, delay]);
  return (
    <span ref={containerRef} style={{ ...style, display: 'inline-block', perspective: '600px' }}>
      {text.split('').map((char, i) => (
        <span key={i} className="gsap-char" style={{ display: 'inline-block', willChange: 'transform, opacity' }}>
          {char === ' ' ? '\u00A0' : char}
        </span>
      ))}
    </span>
  );
}

// ── Animated Stat Counter ────────────────────────────────
function AnimatedCounter({ end, label, suffix = '', isReady, delay = 0 }: {
  end: number; label: string; suffix?: string; isReady: boolean; delay?: number;
}) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!isReady) return;
    const obj = { v: 0 };
    gsap.to(obj, {
      v: end, duration: 2, delay: 1.4 + delay,
      ease: 'power2.out',
      onUpdate: () => setVal(Math.round(obj.v)),
    });
    if (ref.current) {
      gsap.fromTo(ref.current,
        { opacity: 0, y: 20, scale: 0.9 },
        { opacity: 1, y: 0, scale: 1, duration: 0.8, delay: 1.2 + delay, ease: 'power3.out' }
      );
    }
  }, [isReady, end, delay]);
  return (
    <div ref={ref} style={{ opacity: 0, textAlign: 'center' }}>
      <p style={{
        fontSize: '22px', fontWeight: 800, color: '#f0f1fa',
        letterSpacing: '-0.03em', lineHeight: 1,
        fontFamily: "'IBM Plex Mono', monospace",
      }}>
        {val}{suffix}
      </p>
      <p style={{
        fontSize: '9px', color: '#4a4d5c', textTransform: 'uppercase',
        letterSpacing: '0.12em', marginTop: '4px',
        fontFamily: "'IBM Plex Mono', monospace",
      }}>
        {label}
      </p>
    </div>
  );
}

// ── Workflow Step with Magnetic Hover ─────────────────────
function WorkflowStep({ step, label, index, isReady }: {
  step: string; label: string; index: number; isReady: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);

  // Animate the connecting line
  useEffect(() => {
    if (!isReady || !lineRef.current) return;
    gsap.fromTo(lineRef.current,
      { scaleX: 0 },
      { scaleX: 1, duration: 0.5, delay: 1.4 + index * 0.15, ease: 'power3.out' }
    );
  }, [isReady, index]);

  const handleMove = useCallback((e: React.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = (e.clientX - cx) * 0.15;
    const dy = (e.clientY - cy) * 0.15;
    gsap.to(ref.current, { x: dx, y: dy, duration: 0.3, ease: 'power2.out' });
  }, []);
  const handleLeave = useCallback(() => {
    if (!ref.current) return;
    gsap.to(ref.current, { x: 0, y: 0, duration: 0.5, ease: 'elastic.out(1, 0.4)' });
  }, []);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: -30 }}
      animate={isReady ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.6, delay: 1.2 + index * 0.12, ease: [0.16, 1, 0.3, 1] }}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      style={{
        display: 'flex', alignItems: 'center', gap: '16px',
        padding: '8px 12px', borderRadius: '12px',
        cursor: 'default',
      }}
      whileHover={{ background: 'rgba(26,47,251,0.06)' }}
    >
      <span style={{
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: '11px', fontWeight: 700, color: '#1a2ffb',
        minWidth: '28px',
        background: 'rgba(26,47,251,0.08)',
        padding: '3px 6px', borderRadius: '6px',
        textAlign: 'center',
        border: '1px solid rgba(26,47,251,0.15)',
      }}>{step}</span>
      <div ref={lineRef} style={{ width: '20px', height: '1px', background: 'rgba(255,255,255,0.08)', transformOrigin: 'left' }} />
      <span style={{ fontSize: '13px', color: '#7a7d8e', fontWeight: 400 }}>{label}</span>
    </motion.div>
  );
}

// ── Pulsing Ring Loader ──────────────────────────────────
function PulsingRingLoader({ progress }: { progress: number }) {
  const ringRef = useRef<SVGCircleElement>(null);
  const outerRef = useRef<SVGCircleElement>(null);
  useEffect(() => {
    if (!ringRef.current) return;
    const circumference = 2 * Math.PI * 45;
    gsap.to(ringRef.current, {
      strokeDashoffset: circumference - (progress / 100) * circumference,
      duration: 0.2, ease: 'power2.out',
    });
  }, [progress]);
  useEffect(() => {
    if (!outerRef.current) return;
    gsap.to(outerRef.current, {
      rotation: 360, duration: 8, repeat: -1, ease: 'none',
      transformOrigin: '50% 50%',
    });
  }, []);
  const circumference = 2 * Math.PI * 45;
  return (
    <svg width="140" height="140" viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
      {/* Outer spinning ring */}
      <circle ref={outerRef} cx="50" cy="50" r="48" fill="none"
        stroke="rgba(26,47,251,0.06)" strokeWidth="0.5"
        strokeDasharray="8 12" />
      {/* Track */}
      <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
      {/* Progress */}
      <circle
        ref={ringRef}
        cx="50" cy="50" r="45" fill="none"
        stroke="#1a2ffb" strokeWidth="1.5"
        strokeDasharray={circumference}
        strokeDashoffset={circumference}
        strokeLinecap="round"
        style={{ filter: 'drop-shadow(0 0 8px rgba(26,47,251,0.6))' }}
      />
      {/* Inner glow ring */}
      <circle cx="50" cy="50" r="40" fill="none"
        stroke="rgba(26,47,251,0.04)" strokeWidth="0.5" />
    </svg>
  );
}

// ── Animated Input with GSAP Focus Effects ───────────────
function GsapInput({ label, type, value, onChange, placeholder, id, required }: {
  label: string; type: string; value: string; onChange: (v: string) => void;
  placeholder: string; id: string; required?: boolean;
}) {
  const underlineRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);

  const handleFocus = () => {
    if (underlineRef.current) {
      gsap.to(underlineRef.current, { scaleX: 1, duration: 0.4, ease: 'power3.out' });
    }
    if (glowRef.current) {
      gsap.to(glowRef.current, { opacity: 1, duration: 0.3 });
    }
  };
  const handleBlur = () => {
    if (underlineRef.current) {
      gsap.to(underlineRef.current, { scaleX: 0, duration: 0.3, ease: 'power2.in' });
    }
    if (glowRef.current) {
      gsap.to(glowRef.current, { opacity: 0, duration: 0.3 });
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      <label style={{
        display: 'block', fontSize: '10px', fontWeight: 600, color: '#7a7d8e',
        textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '2px',
        fontFamily: "'IBM Plex Mono', monospace",
      }}>{label}</label>
      <input
        type={type} value={value}
        onChange={(e) => onChange(e.target.value)}
        className="input-cyber"
        placeholder={placeholder}
        required={required}
        id={id}
        data-cursor="TYPE"
        onFocus={handleFocus}
        onBlur={handleBlur}
      />
      {/* Animated focus underline */}
      <div ref={underlineRef} style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: '2px',
        background: 'linear-gradient(90deg, #1a2ffb, #c1ff00)',
        transformOrigin: 'left', transform: 'scaleX(0)',
        boxShadow: '0 0 12px rgba(26,47,251,0.4)',
      }} />
      {/* Soft glow underneath */}
      <div ref={glowRef} style={{
        position: 'absolute', bottom: '-8px', left: '10%', right: '10%', height: '16px',
        background: 'radial-gradient(ellipse, rgba(26,47,251,0.15) 0%, transparent 70%)',
        opacity: 0, pointerEvents: 'none',
      }} />
    </div>
  );
}

// ── 3D Tilt Form Card ────────────────────────────────────
function TiltCard({ children, isReady }: { children: React.ReactNode; isReady: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const glareRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isReady || !ref.current) return;
    const el = ref.current;
    const handleMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      gsap.to(el, {
        rotateY: x * 6, rotateX: -y * 6,
        duration: 0.5, ease: 'power2.out',
      });
      if (glareRef.current) {
        gsap.to(glareRef.current, {
          x: `${x * 100}%`, y: `${y * 100}%`,
          opacity: 0.06, duration: 0.3,
        });
      }
    };
    const handleLeave = () => {
      gsap.to(el, { rotateY: 0, rotateX: 0, duration: 0.8, ease: 'elastic.out(1, 0.5)' });
      if (glareRef.current) {
        gsap.to(glareRef.current, { opacity: 0, duration: 0.3 });
      }
    };
    el.addEventListener('mousemove', handleMove);
    el.addEventListener('mouseleave', handleLeave);
    return () => {
      el.removeEventListener('mousemove', handleMove);
      el.removeEventListener('mouseleave', handleLeave);
    };
  }, [isReady]);

  return (
    <div ref={ref} style={{
      perspective: '1000px', transformStyle: 'preserve-3d',
      position: 'relative',
    }}>
      {/* Glare spot */}
      <div ref={glareRef} style={{
        position: 'absolute', width: '200px', height: '200px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 60%)',
        pointerEvents: 'none', zIndex: 2, opacity: 0,
        transform: 'translate(-50%, -50%)',
      }} />
      {children}
    </div>
  );
}


export default function LoginPage() {
  const { login, loginWithEmail, signupWithEmail, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);
  const [isReady, setIsReady] = useState(false);

  const magneticBtnRef = useMagneticRef();
  const formRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const dividerLeftRef = useRef<HTMLDivElement>(null);
  const dividerRightRef = useRef<HTMLDivElement>(null);

  const scrambledTitle = useTextScramble('NEXUSDFI', isReady, 400);
  const scrambledSubtitle = useTextScramble('DIGITAL FORENSICS INTELLIGENCE', isReady, 700);

  // GSAP entrance for form fields
  useEffect(() => {
    if (!isReady || !formRef.current) return;
    const inputs = formRef.current.querySelectorAll('.gsap-field');
    gsap.fromTo(inputs,
      { opacity: 0, y: 30, scale: 0.97 },
      { opacity: 1, y: 0, scale: 1, duration: 0.7, stagger: 0.1, delay: 0.8, ease: 'power3.out' }
    );
  }, [isReady]);

  // GSAP animated divider lines
  useEffect(() => {
    if (!isReady) return;
    [dividerLeftRef, dividerRightRef].forEach((r) => {
      if (r.current) {
        gsap.fromTo(r.current,
          { scaleX: 0 },
          { scaleX: 1, duration: 0.8, delay: 1.6, ease: 'power3.out' }
        );
      }
    });
  }, [isReady]);

  // GSAP hero section parallax on mouse
  useEffect(() => {
    if (!isReady) return;
    const handleMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 20;
      const y = (e.clientY / window.innerHeight - 0.5) * 10;
      if (heroRef.current) {
        gsap.to(heroRef.current, { x, y, duration: 1.2, ease: 'power2.out' });
      }
    };
    window.addEventListener('mousemove', handleMove);
    return () => window.removeEventListener('mousemove', handleMove);
  }, [isReady]);

  // Lusion-style loading counter
  useEffect(() => {
    const duration = 2200;
    const steps = 80;
    const increment = 100 / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= 100) {
        setLoadProgress(100);
        clearInterval(timer);
        setTimeout(() => setIsReady(true), 400);
      } else {
        setLoadProgress(Math.floor(current));
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (user && !authLoading) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, authLoading, navigate]);

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      await login();
    } catch {
      setError('Google Sign-In failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: any) => {
    e.preventDefault();
    if (!email || !password) { setError('Please enter both email and password.'); return; }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) { setError('Please enter a valid email address.'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters long.'); return; }

    setError('');
    setLoading(true);
    try {
      if (isSignUp) { await signupWithEmail(email, password); }
      else { await loginWithEmail(email, password); }
    } catch (err: any) {
      const code = err.code || '';
      if (code === 'auth/user-not-found' || code === 'auth/invalid-credential') setError('Incorrect email or password.');
      else if (code === 'auth/wrong-password') setError('Incorrect password.');
      else if (code === 'auth/email-already-in-use') setError('An account with this email already exists.');
      else if (code === 'auth/too-many-requests') setError('Too many failed attempts. Try again later.');
      else if (code === 'auth/weak-password') setError('Password is too weak.');
      else { setError(err.message || 'Authentication failed.'); console.error("Auth Error:", err); }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="noise-overlay" style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden', background: '#000000' }}>
      <CustomCursor />

      {/* ── Loading Overlay ─────────────────────────────────── */}
      <AnimatePresence>
        {!isReady && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.05, filter: 'blur(10px)', transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } }}
            style={{
              position: 'fixed', inset: 0, zIndex: 100, background: '#000000',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexDirection: 'column', gap: '24px',
            }}
          >
            <PulsingRingLoader progress={loadProgress} />
            <div style={{ textAlign: 'center' }}>
              <div className="loading-counter" style={{ fontSize: '24px', fontWeight: 700, color: '#f0f1fa', letterSpacing: '-0.02em' }}>
                {String(loadProgress).padStart(3, '0')}
              </div>
              <p style={{
                fontSize: '10px', color: '#4a4d5c', fontFamily: "'IBM Plex Mono', monospace",
                letterSpacing: '0.15em', textTransform: 'uppercase', marginTop: '8px',
              }}>
                INITIALIZING NEXUS SYSTEMS
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Main content ───────────────────────────────────── */}
      <div style={{ display: 'flex', width: '100%', height: '100%' }}>

        {/* ── Left Panel — Particle Canvas + Branding ──────── */}
        <div
          style={{ position: 'relative', width: '55%', height: '100%', overflow: 'hidden' }}
          className="hidden lg:block"
        >
          <ParticleCanvas />
          <DnaHelix />

          {/* Overlay content on top of particles */}
          <div ref={heroRef} style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
            padding: '3rem', zIndex: 2,
          }}>
            {/* Top — Logo with scramble */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={isReady ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.1 }}
              style={{ display: 'flex', alignItems: 'center', gap: '12px' }}
            >
              <div style={{
                width: '40px', height: '40px', borderRadius: '12px',
                background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(10px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)',
              }}>
                <img src="/nexusdfi-logo.png" alt="NexusDFI" style={{ width: '26px', height: '26px', objectFit: 'contain', filter: 'brightness(1.2)' }} />
              </div>
              <div>
                <p style={{
                  color: '#f0f1fa', fontWeight: 700, fontSize: '14px', letterSpacing: '-0.02em',
                  fontFamily: "'IBM Plex Mono', monospace",
                }}>
                  {scrambledTitle || 'NEXUSDFI'}
                </p>
                <p style={{ color: '#4a4d5c', fontSize: '10px', letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: "'IBM Plex Mono', monospace" }}>
                  {scrambledSubtitle || 'DIGITAL FORENSICS INTELLIGENCE'}
                </p>
              </div>
            </motion.div>

            {/* Center — Hero text with GSAP char reveal */}
            <motion.div
              variants={stagger}
              initial="hidden"
              animate={isReady ? "show" : "hidden"}
              style={{ maxWidth: '500px' }}
            >
              <div style={{
                fontSize: 'clamp(2rem, 4vw, 3.5rem)',
                fontWeight: 800, color: '#f0f1fa', lineHeight: 1.05,
                letterSpacing: '-0.04em', marginBottom: '24px',
              }}>
                <GsapCharReveal text="Digital Forensics" isReady={isReady} delay={0.5} style={{ display: 'block' }} />
                <GsapCharReveal
                  text="Intelligence Platform"
                  isReady={isReady}
                  delay={0.9}
                  style={{
                    display: 'block',
                    background: 'linear-gradient(135deg, #1a2ffb, #6670ff)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                />
              </div>

              <motion.p variants={slideUp} style={{
                color: '#7a7d8e', fontSize: '0.9375rem', lineHeight: 1.7,
                maxWidth: '420px', fontWeight: 400,
              }}>
                NexusDFI assists investigators in securely managing digital evidence,
                performing AI-assisted forensic analysis, and generating investigation reports.
              </motion.p>

              {/* Live stat counters */}
              <motion.div variants={fadeIn} style={{
                display: 'flex', gap: '32px', marginTop: '36px',
                padding: '16px 0', borderTop: '1px solid rgba(255,255,255,0.04)',
                borderBottom: '1px solid rgba(255,255,255,0.04)',
              }}>
                <AnimatedCounter end={256} label="Investigations" suffix="+" isReady={isReady} delay={0} />
                <AnimatedCounter end={1847} label="Evidence Files" isReady={isReady} delay={0.15} />
                <AnimatedCounter end={99} label="Accuracy" suffix="%" isReady={isReady} delay={0.3} />
              </motion.div>

              {/* Workflow steps with magnetic hover */}
              <motion.div variants={fadeIn} style={{ marginTop: '32px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {[
                  { step: '01', label: 'Case Creation & Assignment' },
                  { step: '02', label: 'Evidence Upload & SHA-256 Verification' },
                  { step: '03', label: 'AI-Powered Forensic Analysis' },
                  { step: '04', label: 'Report Generation & Export' },
                ].map((item, i) => (
                  <WorkflowStep key={item.step} step={item.step} label={item.label} index={i} isReady={isReady} />
                ))}
              </motion.div>
            </motion.div>

            {/* Bottom — Footer text */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={isReady ? { opacity: 1 } : {}}
              transition={{ delay: 1.8 }}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
            >
              <p style={{
                fontSize: '10px', color: '#22222e', letterSpacing: '0.08em',
                textTransform: 'uppercase', fontFamily: "'IBM Plex Mono', monospace",
              }}>
                Built with React · FastAPI · Firebase Auth · Gemini AI
              </p>
              <p style={{
                fontSize: '10px', color: '#22222e', letterSpacing: '0.15em',
                fontFamily: "'IBM Plex Mono', monospace",
              }}>
                SECURE · VERIFIED · TRUSTED
              </p>
            </motion.div>
          </div>
        </div>

        {/* ── Right Panel — Login Form ─────────────────────── */}
        <div
          className="flex-1"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '2rem', background: '#0a0a0f', position: 'relative', overflow: 'hidden',
          }}
        >
          <FloatingGrid />
          <MorphingOrbs />
          <CursorTrail />

          <TiltCard isReady={isReady}>
            <motion.div
              ref={formRef}
              variants={stagger}
              initial="hidden"
              animate={isReady ? "show" : "hidden"}
              style={{
                width: '100%', maxWidth: '380px', position: 'relative', zIndex: 1,
                padding: '2px',
              }}
            >
              {/* Mobile logo */}
              <motion.div variants={textReveal} className="lg:hidden" style={{ marginBottom: '48px', textAlign: 'center' }}>
                <div style={{
                  width: '56px', height: '56px', borderRadius: '16px',
                  background: 'rgba(255,255,255,0.04)', display: 'inline-flex',
                  alignItems: 'center', justifyContent: 'center', marginBottom: '16px',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}>
                  <img src="/nexusdfi-logo.png" alt="NexusDFI" style={{ width: '32px', height: '32px', objectFit: 'contain' }} />
                </div>
                <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#f0f1fa', letterSpacing: '-0.03em' }}>NEXUSDFI</h1>
              </motion.div>

              {/* Header text */}
              <motion.div variants={textReveal} style={{ marginBottom: '36px' }}>
                <AnimatePresence mode="wait">
                  <motion.h2
                    key={isSignUp ? 'signup' : 'signin'}
                    initial={{ opacity: 0, y: 20, filter: 'blur(4px)' }}
                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                    exit={{ opacity: 0, y: -20, filter: 'blur(4px)' }}
                    transition={{ duration: 0.4, ease: lusionEase }}
                    style={{
                      fontSize: '28px', fontWeight: 700, color: '#f0f1fa',
                      letterSpacing: '-0.03em', lineHeight: 1.2, marginBottom: '6px',
                    }}
                  >
                    {isSignUp ? 'Create Account' : 'Welcome back'}
                  </motion.h2>
                </AnimatePresence>
                <AnimatePresence mode="wait">
                  <motion.p
                    key={isSignUp ? 'sub-signup' : 'sub-signin'}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3, delay: 0.05, ease: lusionEase }}
                    style={{ color: '#4a4d5c', fontSize: '14px', fontWeight: 400 }}
                  >
                    {isSignUp ? 'Set up your investigation workspace' : 'Sign in to your investigation workspace'}
                  </motion.p>
                </AnimatePresence>
              </motion.div>

              {/* Email/Password form */}
              <form onSubmit={handleEmailAuth}>
                <div className="gsap-field" style={{ marginBottom: '20px' }}>
                  <GsapInput
                    label="Email" type="email" value={email}
                    onChange={setEmail} placeholder="your@email.com"
                    id="input-email" required
                  />
                </div>

                <div className="gsap-field" style={{ marginBottom: '28px' }}>
                  <GsapInput
                    label="Password" type="password" value={password}
                    onChange={setPassword} placeholder="••••••••"
                    id="input-password" required
                  />
                </div>

                <div className="gsap-field">
                  <motion.button
                    ref={magneticBtnRef}
                    type="submit"
                    disabled={loading}
                    data-cursor="CLICK"
                    id="btn-email-auth"
                    style={{
                      width: '100%', padding: '14px', borderRadius: '100px',
                      background: '#1a2ffb', color: '#ffffff', fontWeight: 600,
                      fontSize: '13px', letterSpacing: '0.04em', textTransform: 'uppercase',
                      border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                      transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                      opacity: loading ? 0.5 : 1,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                      position: 'relative', overflow: 'hidden',
                    }}
                    whileHover={!loading ? {
                      backgroundColor: '#c1ff00',
                      color: '#000000',
                      boxShadow: '0 0 50px rgba(193,255,0,0.35), 0 0 100px rgba(193,255,0,0.1)',
                    } : {}}
                    whileTap={!loading ? { scale: 0.97 } : {}}
                  >
                    {loading ? <Spinner size="sm" /> : (
                      <AnimatePresence mode="wait">
                        <motion.span
                          key={isSignUp ? 'btn-signup' : 'btn-signin'}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.2 }}
                        >
                          {isSignUp ? 'CREATE ACCOUNT' : 'SIGN IN'}
                        </motion.span>
                      </AnimatePresence>
                    )}
                  </motion.button>
                </div>
              </form>

              {/* Animated Divider */}
              <motion.div
                variants={fadeIn}
                style={{ display: 'flex', alignItems: 'center', gap: '16px', margin: '16px 0' }}
              >
                <div ref={dividerLeftRef} style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.06)', transformOrigin: 'right' }} />
                <span style={{
                  fontSize: '10px', color: '#4a4d5c', fontFamily: "'IBM Plex Mono', monospace",
                  letterSpacing: '0.1em', textTransform: 'uppercase',
                }}>or</span>
                <div ref={dividerRightRef} style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.06)', transformOrigin: 'left' }} />
              </motion.div>

              {/* Google Sign-In */}
              <motion.button
                variants={slideUp}
                onClick={handleGoogleLogin}
                disabled={loading}
                type="button"
                id="btn-google-signin"
                data-cursor="CLICK"
                className="gsap-field"
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  gap: '12px', padding: '12px', borderRadius: '100px',
                  border: '1px solid rgba(255,255,255,0.08)', background: 'transparent',
                  color: '#b0b3c0', cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
                  opacity: loading ? 0.5 : 1,
                }}
                whileHover={!loading ? {
                  borderColor: 'rgba(26,47,251,0.3)',
                  background: 'rgba(26,47,251,0.05)',
                  boxShadow: '0 0 30px rgba(26,47,251,0.1)',
                } : {}}
              >
                {loading ? (
                  <Spinner size="sm" />
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24">
                      <path fill="#EA4335" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="#4285F4" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    <span style={{ fontSize: '13px', fontWeight: 500, letterSpacing: '0.01em' }}>Continue with Google</span>
                  </>
                )}
              </motion.button>

              {/* Toggle Sign Up / Sign In */}
              <motion.div variants={fadeIn} style={{ textAlign: 'center', marginTop: '16px' }}>
                <button
                  type="button"
                  onClick={() => setIsSignUp(!isSignUp)}
                  style={{
                    background: 'none', border: 'none', color: '#4a4d5c',
                    fontSize: '12px', cursor: 'pointer',
                    transition: 'color 0.2s ease', fontWeight: 400,
                  }}
                  data-cursor="CLICK"
                  onMouseEnter={(e) => (e.target as HTMLElement).style.color = '#1a2ffb'}
                  onMouseLeave={(e) => (e.target as HTMLElement).style.color = '#4a4d5c'}
                >
                  {isSignUp ? 'Already have an account? Sign In' : 'Need an account? Sign Up'}
                </button>
              </motion.div>

              {/* Error message */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.95 }}
                    className="toast-error"
                    style={{ marginTop: '20px' }}
                  >
                    <span>{error}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Version footer */}
              <motion.div variants={fadeIn} style={{ textAlign: 'center', marginTop: '32px' }}>
                <p style={{
                  fontSize: '10px', color: '#22222e', letterSpacing: '0.1em',
                  fontFamily: "'IBM Plex Mono', monospace",
                }}>
                  NEXUSDFI v4.0 — DFIR PLATFORM
                </p>
              </motion.div>
            </motion.div>
          </TiltCard>
        </div>
      </div>
    </div>
  );
}
