import { motion, type HTMLMotionProps } from 'framer-motion';
import type { ReactNode, MouseEvent as ReactMouseEvent } from 'react';
import { useRef, useCallback } from 'react';
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
  return { ref, onMouseMove: handleMouse };
}

// ─── Stat Card — Enhanced with spotlight + glow ───────────
interface StatCardProps {
  label:    string;
  value:    ReactNode;
  icon?:    string;
  color:    string;
  delta?:   string;
  subtitle?: string;
}
export function StatCard({ label, value, color, delta, subtitle }: StatCardProps) {
  const spotlight = useSpotlight();
  return (
    <motion.div
      ref={spotlight.ref}
      onMouseMove={spotlight.onMouseMove}
      className="stat-card card-spotlight"
      whileHover={{ y: -4, boxShadow: `0 12px 40px rgba(0,0,0,0.5), 0 0 20px ${color}15` }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Accent top line */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
        background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
        opacity: 0, transition: 'opacity 0.3s ease',
      }} className="stat-accent-line" />

      <div className="flex items-start justify-between">
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
          <p style={{
            fontSize: '28px',
            fontWeight: 800,
            letterSpacing: '-0.03em',
            color,
            lineHeight: 1,
          }}>{value}</p>
          {subtitle && <p style={{ fontSize: '12px', color: '#4a4d5c', marginTop: '8px' }}>{subtitle}</p>}
          {delta && (
            <p style={{
              fontSize: '11px',
              marginTop: '8px',
              fontWeight: 600,
              color: delta.startsWith('+') ? '#c1ff00' : '#F87171',
              fontFamily: "'IBM Plex Mono', monospace",
            }}>
              {delta} this week
            </p>
          )}
        </div>
        {/* Mini decoration */}
        <div style={{
          width: '32px', height: '32px', borderRadius: '10px',
          background: `${color}10`, border: `1px solid ${color}20`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <div style={{
            width: '6px', height: '6px', borderRadius: '50%',
            background: color, boxShadow: `0 0 8px ${color}60`,
          }} />
        </div>
      </div>

      <style>{`
        .stat-card:hover .stat-accent-line { opacity: 1 !important; }
      `}</style>
    </motion.div>
  );
}

// ─── Glass Card — Enhanced with spotlight ─────────────────
type CardProps = HTMLMotionProps<'div'>;
export function Card({ children, className = '', id, ...props }: CardProps) {
  const spotlight = useSpotlight();
  return (
    <motion.div
      id={id}
      ref={spotlight.ref}
      onMouseMove={spotlight.onMouseMove}
      initial={{ opacity: 0, y: 12, filter: 'blur(4px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className={`glass card-spotlight p-5 ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  );
}

// ─── Section Header ───────────────────────────────────────
interface SectionHeaderProps { title: string; subtitle?: string; action?: ReactNode; icon?: string; }
export function SectionHeader({ title, subtitle, action }: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div>
        <h2 style={{
          fontSize: '15px',
          fontWeight: 700,
          color: '#f0f1fa',
          letterSpacing: '-0.02em',
        }}>{title}</h2>
        {subtitle && <p style={{ fontSize: '12px', color: '#4a4d5c', marginTop: '4px' }}>{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

// ─── Risk Meter — Enhanced with glow dot ──────────────────
export function RiskMeter({ score }: { score: number }) {
  const color = riskColor(score);
  const label = riskLabel(score);
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span style={{ color: '#4a4d5c', fontWeight: 600, fontSize: '11px', fontFamily: "'IBM Plex Mono', monospace", letterSpacing: '0.06em', textTransform: 'uppercase' as const }}>Risk Score</span>
        <span className="font-semibold" style={{ color }}>{label}</span>
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
              position: 'absolute',
              right: '-4px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: color,
              color: color,
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

// ─── Badge — Enhanced with optional pulse ─────────────────
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

// ─── Loading Spinner — Enhanced with orbit ring ───────────
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
            width: s,
            height: s,
            borderRadius: '50%',
            border: `2px solid rgba(255,255,255,0.04)`,
            borderTopColor: '#1a2ffb',
          }}
        />
      </div>
      {label && <p style={{ fontSize: '11px', color: '#4a4d5c', fontFamily: "'IBM Plex Mono', monospace", letterSpacing: '0.06em' }}>{label}</p>}
    </div>
  );
}

// ─── Typing Dots (for AI assistant) ───────────────────────
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

// ─── Empty State — Enhanced with float ────────────────────
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

// ─── Page Header — Enhanced with gradient text ────────────
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
        {subtitle && <p style={{ fontSize: '13px', color: '#4a4d5c', marginTop: '4px' }}>{subtitle}</p>}
      </div>
      {children && <div className="flex items-center gap-3">{children}</div>}
    </motion.div>
  );
}

// ─── Confirmation Modal — Enhanced with blur transition ───
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
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(12px)',
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
