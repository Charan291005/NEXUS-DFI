import type { CasePriority, CaseStatus, RiskLevel } from '../types';

// ─── Risk helpers ────────────────────────────────────────
export function riskColor(score: number): string {
  if (score >= 80) return '#ef4444'; // red-500
  if (score >= 60) return '#ea580c'; // orange-600
  if (score >= 40) return '#f59e0b'; // amber-500
  if (score >= 20) return '#3b82f6'; // blue-500
  return '#10b981'; // emerald-500
}

export function riskLabel(score: number): RiskLevel {
  if (score >= 80) return 'Critical';
  if (score >= 60) return 'High';
  if (score >= 40) return 'Medium';
  if (score >= 20) return 'Low';
  return 'Safe';
}

export const RISK_COLORS: Record<RiskLevel, string> = {
  Critical: '#ef4444',
  High:     '#ea580c',
  Medium:   '#f59e0b',
  Low:      '#3b82f6',
  Safe:     '#10b981',
};

// ─── Priority / Status helpers ───────────────────────────
export const PRIORITY_COLORS: Record<CasePriority, string> = {
  Critical: 'badge-danger',
  High:     'badge-warning',
  Medium:   'badge-info',
  Low:      'badge-gray',
};

export const STATUS_COLORS: Record<CaseStatus, string> = {
  Active:   'badge-success',
  Open:     'badge-info',
  Closed:   'badge-gray',
  Archived: 'badge-purple',
};

// ─── Date / time ─────────────────────────────────────────
export function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}
export function fmtDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}
export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(mins  / 60);
  const days  = Math.floor(hours / 24);
  if (days  > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (mins  > 0) return `${mins}m ago`;
  return 'just now';
}

// ─── File helpers ─────────────────────────────────────────
export function fileIcon(type: string): string {
  const icons: Record<string, string> = {
    image: '🖼️', video: '🎬', pdf: '📄',
    zip: '🗜️', log: '📋', document: '📝', other: '📁',
  };
  return icons[type] ?? '📁';
}

export function fileType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() ?? '';
  if (['jpg','jpeg','png','gif','bmp','webp','tiff'].includes(ext)) return 'image';
  if (['mp4','avi','mov','mkv','webm'].includes(ext)) return 'video';
  if (ext === 'pdf') return 'pdf';
  if (ext === 'zip' || ext === 'tar' || ext === 'gz') return 'zip';
  if (['log','txt','csv'].includes(ext)) return 'log';
  if (['doc','docx','xls','xlsx'].includes(ext)) return 'document';
  return 'other';
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes/1024).toFixed(1)} KB`;
  return `${(bytes/1048576).toFixed(1)} MB`;
}

// ─── Case ID generator ────────────────────────────────────
export function generateCaseId(): string {
  const now  = new Date();
  const yr   = now.getFullYear().toString().slice(-2);
  const mo   = String(now.getMonth() + 1).padStart(2, '0');
  const rand = Math.floor(Math.random() * 9000 + 1000);
  return `NXDFI-${yr}${mo}-${rand}`;
}

// ─── Chart colors ─────────────────────────────────────────
export const CHART_COLORS = ['#3b82f6','#8b5cf6','#10b981','#f59e0b','#ef4444','#64748b'];
