import { motion, type HTMLMotionProps } from 'framer-motion';
import type { ReactNode, MouseEvent as ReactMouseEvent } from 'react';
import { useRef, useCallback, useState, useEffect } from 'react';
import { riskColor, riskLabel } from '../utils/helpers';
import type { RiskLevel } from '../types';

// ─── Card Spotlight Hook (mouse-tracked gradient) ─────────
function useSpotlight() {
  const ref = useRef<HTMLDivElement>(null);
  const handleMouse = useCallback((e: ReactMouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    ref.current.style.setProperty('--spotlight-x', `${x}px`);
    ref.current.style.setProperty('--spotlight-y', `${y}px`);
  }, []);
  return [ref, handleMouse] as const;
}

// ─── 3D Tilt Hook ─────────────────────────────────────────
function useTilt() {
  const ref = useRef<HTMLDivElement>(null);

  const handleMouseMove = useCallback((e: ReactMouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const tiltX = ((y - centerY) / centerY) * -5;
    const tiltY = ((x - centerX) / centerX) * 5;
    ref.current.style.transform = `perspective(1000px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) translateZ(4px)`;
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (!ref.current) return;
    ref.current.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0px)';
    ref.current.style.transition = 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)';
  }, []);

  const handleMouseEnter = useCallback(() => {
    if (!ref.current) return;
    ref.current.style.transition = 'transform 0.1s ease';
  }, []);

  return { ref, handleMouseMove, handleMouseLeave, handleMouseEnter };
}

// ─── Stat Card — Enhanced with spotlight + glow grid ─────
interface StatCardProps {
  label:     string;
  value:     ReactNode;
  icon?:     string;
  color:     string;
  delta?:    string;
  subtitle?: string;
}
export function StatCard({ label, value, color, delta, subtitle }: StatCardProps) {
  const [spotlightRef, onMouseMove] = useSpotlight();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(t);
  }, []);

  return (
    <motion.div
      ref={spotlightRef}
      onMouseMove={onMouseMove}
      className="stat-card card-spotlight"
      whileHover={{ y: -4, boxShadow: `0 16px 48px rgba(0,0,0,0.5), 0 0 24px ${color}20` }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Scan sweep div */}
      <div className="scan-sweep" />

      {/* Accent top line — animated on mount */}
      <motion.div
        initial={{ scaleX: 0, opacity: 0 }}
        animate={mounted ? { scaleX: 1, opacity: 1 } : {}}
        transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
        style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
          background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
          transformOrigin: 'left',
        }}
      />

      {/* Corner accent */}
      <div style={{
        position: 'absolute', top: 0, right: 0,
        width: '60px', height: '60px',
        background: `radial-gradient(circle at top right, ${color}10, transparent 70%)`,
        borderRadius: '0 16px 0 60px',
        pointerEvents: 'none',
      }} />

      <div className="flex items-start justify-between" style={{ position: 'relative', zIndex: 1 }}>
        <div className="flex-1">
          <p style={{
            fontSize: '10px',
            color: '#4a4d5c',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            fontWeight: 600,
            marginBottom: '8px',
            fontFamily: "'IBM Plex Mono', monospace",
          }}>{label}</p>
          <motion.p
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            style={{
              fontSize: '32px',
              fontWeight: 800,
              letterSpacing: '-0.04em',
              color,
              lineHeight: 1,
              textShadow: `0 0 20px ${color}40`,
            }}
          >{value}</motion.p>
          {subtitle && <p style={{ fontSize: '12px', color: '#4a4d5c', marginTop: '8px' }}>{subtitle}</p>}
          {delta && (
            <motion.p
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.5 }}
              style={{
                fontSize: '11px',
                marginTop: '10px',
                fontWeight: 600,
                color: delta.startsWith('+') ? '#c1ff00' : '#F87171',
                fontFamily: "'IBM Plex Mono', monospace",
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              {delta.startsWith('+') ? '▲' : '▼'} {delta} this week
            </motion.p>
          )}
        </div>
        {/* Animated orb decoration */}
        <motion.div
          animate={{
            boxShadow: [`0 0 0px ${color}00`, `0 0 16px ${color}50`, `0 0 0px ${color}00`],
          }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            width: '36px', height: '36px', borderRadius: '12px',
            background: `${color}10`, border: `1px solid ${color}25`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <div style={{
            width: '8px', height: '8px', borderRadius: '50%',
            background: color,
            boxShadow: `0 0 10px ${color}80`,
          }} />
        </motion.div>
      </div>
    </motion.div>
  );
}

// ─── Glass Card — Enhanced with 3D tilt + spotlight ──────
type CardProps = HTMLMotionProps<'div'>;
export function Card({ children, className = '', id, ...props }: CardProps) {
  const [spotlightRef, onMouseMove] = useSpotlight();
  const tilt = useTilt();
  return (
    <motion.div
      id={id}
      ref={(el) => {
        (spotlightRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
        (tilt.ref as React.MutableRefObject<HTMLDivElement | null>).current = el;
      }}
      onMouseMove={(e) => { onMouseMove(e); tilt.handleMouseMove(e); }}
      onMouseLeave={tilt.handleMouseLeave}
      onMouseEnter={tilt.handleMouseEnter}
      initial={{ opacity: 0, y: 12, filter: 'blur(4px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className={`glass card-spotlight card-tilt p-5 ${className}`}
      style={{ willChange: 'transform', transformStyle: 'preserve-3d' }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

// ─── Section Header with glowing underline accent ─────────
interface SectionHeaderProps { title: string; subtitle?: string; action?: ReactNode; icon?: string; }
export function SectionHeader({ title, subtitle, action }: SectionHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-4">
      <div>
        <h2 style={{
          fontSize: '15px',
          fontWeight: 700,
          color: '#f0f1fa',
          letterSpacing: '-0.02em',
        }}>{title}</h2>
        <span className="section-accent" />
        {subtitle && <p style={{ fontSize: '12px', color: '#4a4d5c', marginTop: '6px' }}>{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

// ─── Risk Meter — Enhanced with animated gradient ─────────
export function RiskMeter({ score }: { score: number }) {
  const color = riskColor(score);
  const label = riskLabel(score);
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span style={{ color: '#4a4d5c', fontWeight: 600, fontSize: '11px', fontFamily: "'IBM Plex Mono', monospace", letterSpacing: '0.06em', textTransform: 'uppercase' as const }}>Risk Score</span>
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="font-semibold"
          style={{ color }}
        >{label}</motion.span>
      </div>
      <div className="risk-track" style={{ position: 'relative' }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          className="h-full rounded-full"
          style={{
            background: `linear-gradient(90deg, ${color}80, ${color})`,
            boxShadow: `0 0 12px ${color}40`,
            position: 'relative',
          }}
        >
          {/* Glowing end dot */}
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1, duration: 0.3 }}
            className="risk-end-dot"
            style={{
              position: 'absolute', right: '-4px', top: '50%',
              transform: 'translateY(-50%)',
              background: color, color: color,
            }}
          />
        </motion.div>
      </div>
      <div className="flex justify-between" style={{ fontSize: '10px', color: '#22222e' }}>
        <span style={{ fontFamily: "'IBM Plex Mono', monospace" }}>0 Safe</span>
        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontWeight: 600, color }}>{score}/100</span>
        <span style={{ fontFamily: "'IBM Plex Mono', monospace" }}>100 Critical</span>
      </div>
    </div>
  );
}

// ─── Badge — with optional pulse ─────────────────────────
interface BadgeProps { label: string; variant?: string; dot?: boolean; pulse?: boolean; }
export function Badge({ label, variant = 'badge-info', dot, pulse }: BadgeProps) {
  return (
    <span className={`badge ${variant}`}>
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full bg-current inline-block ${pulse ? 'pulse-dot' : ''}`}
          style={pulse ? { boxShadow: '0 0 6px currentColor' } : undefined}
        />
      )}
      {label}
    </span>
  );
}

// ─── Glow Button — with ripple effect ────────────────────
interface GlowButtonProps {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  variant?: 'blue' | 'neon' | 'purple';
}
export function GlowButton({ children, onClick, className = '', disabled, type = 'button', variant = 'blue' }: GlowButtonProps) {
  const ref = useRef<HTMLButtonElement>(null);

  const colors = {
    blue:   { bg: 'rgba(26,47,251,0.12)', border: 'rgba(26,47,251,0.4)', color: '#9da4ff', glow: 'rgba(26,47,251,0.4)' },
    neon:   { bg: 'rgba(193,255,0,0.06)',  border: 'rgba(193,255,0,0.3)', color: '#c1ff00', glow: 'rgba(193,255,0,0.3)' },
    purple: { bg: 'rgba(124,58,237,0.1)',  border: 'rgba(124,58,237,0.4)', color: '#a78bfa', glow: 'rgba(124,58,237,0.4)' },
  };
  const c = colors[variant];

  const handleClick = (e: ReactMouseEvent<HTMLButtonElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const ripple = document.createElement('span');
    ripple.className = 'btn-ripple-effect';
    ripple.style.left = `${e.clientX - rect.left - 20}px`;
    ripple.style.top  = `${e.clientY - rect.top - 20}px`;
    ref.current.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
    onClick?.();
  };

  return (
    <motion.button
      ref={ref}
      type={type}
      disabled={disabled}
      onClick={handleClick}
      whileHover={!disabled ? { scale: 1.02, boxShadow: `0 0 24px ${c.glow}, 0 0 48px ${c.glow}50` } : {}}
      whileTap={{ scale: 0.97 }}
      className={`btn-cyber ${className}`}
      style={{
        background: c.bg,
        border: `1px solid ${c.border}`,
        color: c.color,
        opacity: disabled ? 0.4 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontWeight: 600,
        letterSpacing: '0.04em',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {children}
    </motion.button>
  );
}

// ─── Loading Spinner — with orbit ring ────────────────────
export function Spinner({ size = 'md', label }: { size?: 'sm' | 'md' | 'lg'; label?: string }) {
  const s = size === 'sm' ? 16 : size === 'lg' ? 40 : 24;
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="orbit-spinner" style={{ width: s + 12, height: s + 12 }}>
        <div className="orbit-ring" />
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          style={{
            width: s, height: s, borderRadius: '50%',
            border: `2px solid rgba(255,255,255,0.04)`,
            borderTopColor: '#1a2ffb',
          }}
        />
      </div>
      {label && <p style={{ fontSize: '11px', color: '#4a4d5c', fontFamily: "'IBM Plex Mono', monospace", letterSpacing: '0.06em' }}>{label}</p>}
    </div>
  );
}

// ─── Typing Dots ──────────────────────────────────────────
export function TypingDots() {
  return (
    <div className="typing-dots">
      <span /><span /><span />
    </div>
  );
}

// ─── Skeleton Card ────────────────────────────────────────
export function SkeletonCard({ height = 120 }: { height?: number }) {
  return (
    <div className="skeleton" style={{ height, borderRadius: '16px' }}>
      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div className="skeleton skeleton-text" style={{ width: '40%' }} />
        <div className="skeleton skeleton-text" style={{ width: '70%' }} />
        <div className="skeleton skeleton-text" style={{ width: '55%' }} />
      </div>
    </div>
  );
}

// ─── Empty State — with float animation ───────────────────
interface EmptyStateProps { icon: string; title: string; description: string; action?: ReactNode; }
export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col items-center justify-center py-16 text-center"
    >
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        style={{ fontSize: '48px', marginBottom: '12px', opacity: 0.3 }}
      >
        {icon}
      </motion.div>
      <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#b0b3c0', marginBottom: '4px', letterSpacing: '-0.02em' }}>{title}</h3>
      <p style={{ fontSize: '13px', color: '#4a4d5c', maxWidth: '280px', marginBottom: '20px', lineHeight: 1.5 }}>{description}</p>
      {action}
    </motion.div>
  );
}

// ─── Risk Badge ───────────────────────────────────────────
const RISK_BADGE: Record<RiskLevel, string> = {
  Critical: 'badge-danger', High: 'badge-warning',
  Medium: 'badge-warning',  Low: 'badge-info', Safe: 'badge-success',
};
export function RiskBadge({ level }: { level: RiskLevel }) {
  return <Badge label={level} variant={RISK_BADGE[level]} dot />;
}

// ─── Page Header ─────────────────────────────────────────
interface PageHeaderProps { title: string; subtitle?: string; icon?: string; children?: ReactNode; }
export function PageHeader({ title, subtitle, children }: PageHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="flex items-center justify-between mb-6"
    >
      <div>
        <h1 style={{
          fontSize: '22px',
          fontWeight: 800,
          letterSpacing: '-0.03em',
          background: 'linear-gradient(135deg, #f0f1fa 0%, #b0b3c0 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}>{title}</h1>
        <span className="section-accent" style={{ width: '48px' }} />
        {subtitle && <p style={{ fontSize: '13px', color: '#4a4d5c', marginTop: '6px' }}>{subtitle}</p>}
      </div>
      {children && <div className="flex items-center gap-3">{children}</div>}
    </motion.div>
  );
}

// ─── Confirmation Modal ───────────────────────────────────
interface ConfirmModalProps {
  open: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  danger?: boolean;
}
export function ConfirmModal({ open, title, message, onConfirm, onCancel, danger }: ConfirmModalProps) {
  if (!open) return null;
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(16px)',
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20, filter: 'blur(8px)' }}
        animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="glass"
        style={{ padding: '24px', maxWidth: '380px', width: '100%', margin: '0 16px' }}
      >
        <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#f0f1fa', marginBottom: '8px', letterSpacing: '-0.02em' }}>{title}</h3>
        <p style={{ fontSize: '13px', color: '#7a7d8e', marginBottom: '20px', lineHeight: 1.5 }}>{message}</p>
        <div className="flex gap-3 justify-end">
          <button onClick={onCancel} className="btn-cyber btn-ghost">Cancel</button>
          <button onClick={onConfirm} className={`btn-cyber ${danger ? 'btn-danger' : 'btn-primary'}`}>Confirm</button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Threat Radar Widget ──────────────────────────────────
interface ThreatDot { x: number; y: number; id: number; }
export function ThreatRadar() {
  const [dots, setDots] = useState<ThreatDot[]>([
    { x: 55, y: 35, id: 1 },
    { x: 30, y: 60, id: 2 },
    { x: 70, y: 65, id: 3 },
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => [
        ...prev.filter(d => d.id > Date.now() - 8000),
        {
          x: 20 + Math.random() * 60,
          y: 20 + Math.random() * 60,
          id: Date.now(),
        },
      ].slice(-5));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const cx = 50, cy = 50, r = 44;
  const rings = [r * 0.33, r * 0.66, r];

  return (
    <div style={{ position: 'relative', width: '120px', height: '120px', flexShrink: 0 }}>
      <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%' }}>
        {/* Rings */}
        {rings.map((radius, i) => (
          <circle
            key={i}
            cx={cx} cy={cy} r={radius}
            fill="none"
            stroke="rgba(26,47,251,0.2)"
            strokeWidth="0.5"
          />
        ))}
        {/* Cross hairs */}
        <line x1={cx} y1={cy - r} x2={cx} y2={cy + r} stroke="rgba(26,47,251,0.1)" strokeWidth="0.4" />
        <line x1={cx - r} y1={cy} x2={cx + r} y2={cy} stroke="rgba(26,47,251,0.1)" strokeWidth="0.4" />

        {/* Sweep arm */}
        <g className="radar-sweep-arm">
          <line
            x1={cx} y1={cy} x2={cx + r} y2={cy}
            stroke="url(#sweepGrad)" strokeWidth="1"
          />
          <defs>
            <linearGradient id="sweepGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#1a2ffb" stopOpacity="0" />
              <stop offset="100%" stopColor="#c1ff00" stopOpacity="0.8" />
            </linearGradient>
          </defs>
          {/* Sweep fill */}
          <path
            d={`M ${cx} ${cy} L ${cx + r} ${cy} A ${r} ${r} 0 0 0 ${cx + r * Math.cos(-Math.PI/6)} ${cy + r * Math.sin(-Math.PI/6)} Z`}
            fill="url(#sweepFill)"
            opacity="0.15"
          />
          <defs>
            <radialGradient id="sweepFill" cx="0" cy="0.5" r="1">
              <stop offset="0%" stopColor="#1a2ffb" stopOpacity="0" />
              <stop offset="100%" stopColor="#c1ff00" stopOpacity="0.4" />
            </radialGradient>
          </defs>
        </g>

        {/* Center dot */}
        <circle cx={cx} cy={cy} r={2} fill="#1a2ffb" />
        <circle cx={cx} cy={cy} r={4} fill="none" stroke="rgba(26,47,251,0.3)" strokeWidth="0.5" />

        {/* Threat dots */}
        {dots.map((dot) => (
          <g key={dot.id}>
            <circle cx={dot.x} cy={dot.y} r={2} fill="#EF4444" opacity={0.9} />
            <circle cx={dot.x} cy={dot.y} r={4} fill="none" stroke="#EF4444" strokeWidth="0.5" opacity={0.4} className="radar-ping" />
          </g>
        ))}
      </svg>
      {/* Overlay label */}
      <div style={{
        position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)',
        fontSize: '8px', color: '#4a4d5c',
        fontFamily: "'IBM Plex Mono', monospace",
        letterSpacing: '0.1em', textTransform: 'uppercase',
        whiteSpace: 'nowrap',
      }}>
        Threat Radar
      </div>
    </div>
  );
}
