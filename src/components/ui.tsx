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
      whileHover={{ y: -3, boxShadow: '0 12px 40px rgba(0,0,0,0.6)' }}
      className="stat-card"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs text-navy-400 uppercase tracking-widest font-semibold mb-1">{label}</p>
          <p className="text-3xl font-bold" style={{ color }}>{value}</p>
          {subtitle && <p className="text-xs text-navy-400 mt-1">{subtitle}</p>}
          {delta && (
            <p className="text-xs mt-1" style={{ color: delta.startsWith('+') ? '#34d399' : '#f87171' }}>
              {delta} this week
            </p>
          )}
        </div>
        <div className="text-3xl opacity-80">{icon}</div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-b-2xl" style={{ background: `linear-gradient(90deg, ${color}33, ${color})` }} />
    </motion.div>
  );
}

// ─── Glass Card ───────────────────────────────────────────
interface CardProps extends HTMLMotionProps<'div'> {}
export function Card({ children, className = '', id, ...props }: CardProps) {
  return (
    <motion.div
      id={id}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
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
        <div className="flex items-center gap-2 mb-0.5">
          {icon && <span>{icon}</span>}
          <h2 className="text-lg font-bold text-white">{title}</h2>
        </div>
        {subtitle && <p className="text-xs text-navy-300">{subtitle}</p>}
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
        <span className="text-navy-300">Risk Score</span>
        <span className="font-bold" style={{ color }}>{label}</span>
      </div>
      <div className="risk-track">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className="h-full rounded-full"
          style={{ background: `linear-gradient(90deg, ${color}88, ${color})` }}
        />
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
      <div className={`${s} rounded-full border-2 border-accent-400/20 border-t-accent-400 animate-spin`} />
      {label && <p className="text-xs text-navy-300 mono">{label}</p>}
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────
interface EmptyStateProps { icon: string; title: string; description: string; action?: ReactNode; }
export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="text-5xl mb-4 opacity-40">{icon}</div>
      <h3 className="text-lg font-semibold text-navy-200 mb-1">{title}</h3>
      <p className="text-sm text-navy-400 max-w-xs mb-6">{description}</p>
      {action}
    </div>
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
    <div className="flex items-center justify-between mb-8">
      <div className="flex items-center gap-4">
        {icon && (
          <div className="w-12 h-12 rounded-xl glass flex items-center justify-center text-2xl border border-accent-500/15">
            {icon}
          </div>
        )}
        <div>
          <h1 className="text-2xl font-bold text-white">{title}</h1>
          {subtitle && <p className="text-sm text-navy-300 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {children && <div className="flex items-center gap-3">{children}</div>}
    </div>
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass p-6 max-w-sm w-full mx-4"
      >
        <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
        <p className="text-sm text-navy-300 mb-6">{message}</p>
        <div className="flex gap-3 justify-end">
          <button onClick={onCancel}  className="btn-cyber btn-ghost">Cancel</button>
          <button onClick={onConfirm} className={`btn-cyber ${danger ? 'btn-danger' : 'btn-primary'}`}>Confirm</button>
        </div>
      </motion.div>
    </div>
  );
}
