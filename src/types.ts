// NexusDFI — Shared TypeScript types

export type CaseStatus   = 'Open' | 'Active' | 'Closed' | 'Archived';
export type CasePriority = 'Low' | 'Medium' | 'High' | 'Critical';
export type EvidenceType = 'image' | 'video' | 'pdf' | 'zip' | 'log' | 'document' | 'other';
export type RiskLevel    = 'Safe' | 'Low' | 'Medium' | 'High' | 'Critical';
export type AnalysisModule = 'image_forensics' | 'deepfake_detection' | 'log_analysis' | 'metadata' | 'risk_assessment';

export interface NexusUser {
  id: number;
  username: string;
  is_admin: boolean;
  created_at: string;
}

export interface NexusCase {
  id: number;
  case_id: string;
  title: string;
  description: string;
  status: CaseStatus;
  priority: CasePriority;
  created_at: string;
  updated_at: string;
  owner_id: number;
  evidences?: NexusEvidence[];
  evidence_count?: number;
}

export interface NexusEvidence {
  id: number;
  filename: string;
  file_path: string;
  sha256_hash: string;
  file_type: EvidenceType;
  uploaded_at: string;
  case_id: number;
  analysis?: NexusAnalysisResult;
}

export interface NexusAnalysisResult {
  id: number;
  evidence_id: number;
  module: AnalysisModule;
  result: AnalysisData;
  risk_score: number;
  created_at: string;
}

export interface AnalysisData {
  summary: string;
  findings: Finding[];
  metadata?: Record<string, string>;
  ela_risk?: number;
  deepfake_confidence?: number;
  log_events?: LogEvent[];
  recommendation: string;
}

export interface Finding {
  category: string;
  severity: RiskLevel;
  description: string;
  value?: string;
}

export interface LogEvent {
  timestamp: string;
  type: string;
  message: string;
  severity: RiskLevel;
}

export interface DashboardStats {
  total_cases: number;
  active_investigations: number;
  evidence_files: number;
  high_risk_findings: number;
  deepfake_detections: number;
  cases_this_week: number;
  risk_distribution: { level: RiskLevel; count: number }[];
  evidence_by_type: { type: string; count: number }[];
  recent_activity: ActivityItem[];
  weekly_cases: { day: string; count: number }[];
}

export interface ActivityItem {
  id: number;
  message: string;
  timestamp: string;
  type: 'case_created' | 'evidence_uploaded' | 'analysis_complete' | 'report_generated' | 'alert';
  severity?: RiskLevel;
}

export interface AuthToken {
  access_token: string;
  token_type: string;
  user: NexusUser;
}

export interface CreateCaseDto {
  title: string;
  description: string;
  status: CaseStatus;
  priority: CasePriority;
}

export interface TimelineEvent {
  id: string;
  timestamp: string;
  title: string;
  description: string;
  type: 'evidence' | 'analysis' | 'case' | 'alert';
  severity?: RiskLevel;
}
