import { motion, type HTMLMotionProps } from 'framer-motion';
import type { ReactNode } from 'react';
import { riskColor, riskLabel } from '../utils/helpers';
import type { RiskLevel } from '../types';

// ─── Stat Card ────────────────────────────────────────────
interface StatCardProps {
  label:    string;
  value:    ReactNode;
  icon:     string;
  color:    string;
  delta?:   string;
  subtitle?: string;
}
export function StatCard({ label, value, icon, color, delta, subtitle }: StatCardProps) {
  return (
    <motion.div
      whileHover={{ y: -4, boxShadow: `0 16px 48px rgba(0,0,0,0.5), 0 0 30px ${color}12` }}
      transition={{ duration: 0.35 }}
      className="stat-card"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-[11px] text-navy-400 uppercase tracking-[0.12em] font-semibold mb-1.5">{label}</p>
          <p className="text-3xl font-bold font-display" style={{ color }}>{value}</p>
          {subtitle && <p className="text-xs text-navy-400 mt-1.5">{subtitle}</p>}
          {delta && (
            <p className="text-xs mt-1.5 font-medium" style={{ color: delta.startsWith('+') ? '#34d399' : '#f87171' }}>
              {delta} this week
            </p>
          )}
        </div>
        <motion.div
          whileHover={{ scale: 1.1, rotate: 5 }}
          className="text-3xl opacity-60"
        >
          {icon}
        </motion.div>
      </div>
      <div
        className="absolute bottom-0 left-0 right-0 h-[2px] rounded-b-2xl"
        style={{ background: `linear-gradient(90deg, transparent, ${color}66, ${color}, ${color}66, transparent)` }}
      />
    </motion.div>
  );
}

// ─── Glass Card ───────────────────────────────────────────
type CardProps = HTMLMotionProps<'div'>;
export function Card({ children, className = '', id, ...props }: CardProps) {
  return (
    <motion.div
      id={id}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className={`glass p-5 ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  );
}

// ─── Section Header ───────────────────────────────────────
interface SectionHeaderProps { title: string; subtitle?: string; action?: ReactNode; icon?: string; }
export function SectionHeader({ title, subtitle, action, icon }: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-5">
      <div>
        <div className="flex items-center gap-2.5 mb-0.5">
          {icon && <span className="text-lg">{icon}</span>}
          <h2 className="text-lg font-bold text-white font-display tracking-wide">{title}</h2>
        </div>
        {subtitle && <p className="text-xs text-navy-300 mt-0.5">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

// ─── Risk Meter ───────────────────────────────────────────
export function RiskMeter({ score }: { score: number }) {
  const color = riskColor(score);
  const label = riskLabel(score);
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="text-navy-300 font-medium">Risk Score</span>
        <span className="font-bold font-display" style={{ color }}>{label}</span>
      </div>
      <div className="risk-track">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 1.2 }}
          className="h-full rounded-full relative"
          style={{ background: `linear-gradient(90deg, ${color}66, ${color})` }}
        >
          {/* Glow trail */}
          <div
            className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full"
            style={{ background: color, boxShadow: `0 0 8px ${color}, 0 0 16px ${color}66` }}
          />
        </motion.div>
      </div>
      <div className="flex justify-between text-[10px] text-navy-500">
        <span>0 Safe</span>
        <span className="font-mono font-bold" style={{ color }}>{score}/100</span>
        <span>100 Critical</span>
      </div>
    </div>
  );
}

// ─── Badge ────────────────────────────────────────────────
interface BadgeProps { label: string; variant?: string; dot?: boolean; }
export function Badge({ label, variant = 'badge-info', dot }: BadgeProps) {
  return (
    <span className={`badge ${variant}`}>
      {dot && <span className="w-1.5 h-1.5 rounded-full bg-current inline-block" />}
      {label}
    </span>
  );
}

// ─── Loading Spinner ──────────────────────────────────────
export function Spinner({ size = 'md', label }: { size?: 'sm' | 'md' | 'lg'; label?: string }) {
  const s = size === 'sm' ? 'w-5 h-5' : size === 'lg' ? 'w-14 h-14' : 'w-8 h-8';
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative">
        <div className={`${s} rounded-full border-2 border-accent-400/15 border-t-accent-400 animate-spin`} />
        {size !== 'sm' && (
          <div
            className={`${size === 'lg' ? 'w-10 h-10' : 'w-5 h-5'} absolute inset-0 m-auto rounded-full border-2 border-purple-400/15 border-b-purple-400 animate-spin`}
            style={{ animationDirection: 'reverse', animationDuration: '0.8s' }}
          />
        )}
      </div>
      {label && <p className="text-xs text-navy-300 mono">{label}</p>}
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────
interface EmptyStateProps { icon: string; title: string; description: string; action?: ReactNode; }
export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-20 text-center"
    >
      <motion.div
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        className="text-5xl mb-4 opacity-40"
      >
        {icon}
      </motion.div>
      <h3 className="text-lg font-semibold text-navy-200 mb-1 font-display">{title}</h3>
      <p className="text-sm text-navy-400 max-w-xs mb-6">{description}</p>
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

// ─── Page Header ──────────────────────────────────────────
interface PageHeaderProps { title: string; subtitle?: string; icon?: string; children?: ReactNode; }
export function PageHeader({ title, subtitle, icon, children }: PageHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex items-center justify-between mb-8"
    >
      <div className="flex items-center gap-4">
        {icon && (
          <motion.div
            whileHover={{ scale: 1.05, rotate: 3 }}
            className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl border border-accent-500/12"
            style={{
              background: 'linear-gradient(145deg, rgba(17,26,46,0.9), rgba(12,19,34,0.95))',
              boxShadow: '0 4px 16px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.03)',
            }}
          >
            {icon}
          </motion.div>
        )}
        <div>
          <h1 className="text-2xl font-bold text-white font-display tracking-wide">{title}</h1>
          {subtitle && <p className="text-sm text-navy-300 mt-0.5">{subtitle}</p>}
        </div>
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
        className="glass p-6 max-w-sm w-full mx-4"
      >
        <h3 className="text-lg font-bold text-white mb-2 font-display">{title}</h3>
        <p className="text-sm text-navy-300 mb-6">{message}</p>
        <div className="flex gap-3 justify-end">
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={onCancel}  className="btn-cyber btn-ghost">Cancel</motion.button>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={onConfirm} className={`btn-cyber ${danger ? 'btn-danger' : 'btn-primary'}`}>Confirm</motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}
