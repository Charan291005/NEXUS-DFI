import { motion, type HTMLMotionProps } from 'framer-motion';
import type { ReactNode } from 'react';
import { riskColor, riskLabel } from '../utils/helpers';
import type { RiskLevel } from '../types';

// ─── Stat Card ────────────────────────────────────────────
interface StatCardProps {
  label:    string;
  value:    ReactNode;
  icon?:    string;
  color:    string;
  delta?:   string;
  subtitle?: string;
}
export function StatCard({ label, value, color, delta, subtitle }: StatCardProps) {
  return (
    <div className="stat-card">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-[11px] text-navy-400 uppercase tracking-[0.08em] font-medium mb-1">{label}</p>
          <p className="text-2xl font-bold font-display" style={{ color }}>{value}</p>
          {subtitle && <p className="text-xs text-navy-400 mt-1">{subtitle}</p>}
          {delta && (
            <p className="text-xs mt-1 font-medium" style={{ color: delta.startsWith('+') ? '#22C55E' : '#EF4444' }}>
              {delta} this week
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Glass Card ───────────────────────────────────────────
type CardProps = HTMLMotionProps<'div'>;
export function Card({ children, className = '', id, ...props }: CardProps) {
  return (
    <motion.div
      id={id}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`glass p-5 ${className}`}
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
        <h2 className="text-base font-semibold text-white font-display">{title}</h2>
        {subtitle && <p className="text-xs text-navy-400 mt-0.5">{subtitle}</p>}
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
        <span className="text-navy-400 font-medium">Risk Score</span>
        <span className="font-semibold" style={{ color }}>{label}</span>
      </div>
      <div className="risk-track">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="h-full rounded-full"
          style={{ background: color }}
        />
      </div>
      <div className="flex justify-between text-[10px] text-navy-500">
        <span>0 Safe</span>
        <span className="font-mono font-semibold" style={{ color }}>{score}/100</span>
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
  const s = size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-10 h-10' : 'w-6 h-6';
  return (
    <div className="flex flex-col items-center gap-2">
      <div className={`${s} rounded-full border-2 border-navy-700 border-t-accent-400 animate-spin`} />
      {label && <p className="text-xs text-navy-400">{label}</p>}
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────
interface EmptyStateProps { icon: string; title: string; description: string; action?: ReactNode; }
export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center py-16 text-center"
    >
      <div className="text-4xl mb-3 opacity-30">{icon}</div>
      <h3 className="text-base font-semibold text-navy-200 mb-1 font-display">{title}</h3>
      <p className="text-sm text-navy-400 max-w-xs mb-5">{description}</p>
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
export function PageHeader({ title, subtitle, children }: PageHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="flex items-center justify-between mb-6"
    >
      <div>
        <h1 className="text-xl font-bold text-white font-display">{title}</h1>
        {subtitle && <p className="text-sm text-navy-400 mt-0.5">{subtitle}</p>}
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
        className="glass p-6 max-w-sm w-full mx-4"
      >
        <h3 className="text-base font-semibold text-white mb-2 font-display">{title}</h3>
        <p className="text-sm text-navy-300 mb-5">{message}</p>
        <div className="flex gap-3 justify-end">
          <button onClick={onCancel} className="btn-cyber btn-ghost">Cancel</button>
          <button onClick={onConfirm} className={`btn-cyber ${danger ? 'btn-danger' : 'btn-primary'}`}>Confirm</button>
        </div>
      </motion.div>
    </motion.div>
  );
}
