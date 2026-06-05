import { useState } from 'react';
import { motion } from 'framer-motion';
import { PageHeader, Card, RiskBadge } from '../components/ui';
import { fmtDateTime } from '../utils/helpers';
import type { TimelineEvent } from '../types';

const MOCK_TIMELINE: TimelineEvent[] = [
  { id:'t1', timestamp:'2026-05-25T09:15:00Z', title:'Case Initiated',                   description:'Investigation case NXDFI-2605-4821 opened by admin.',                                                   type:'case',     severity:'Safe'     },
  { id:'t2', timestamp:'2026-05-25T09:30:00Z', title:'Initial Evidence Uploaded',         description:'3 suspect images uploaded. SHA-256 hashes computed and logged.',                                        type:'evidence', severity:'Low'      },
  { id:'t3', timestamp:'2026-05-25T10:00:00Z', title:'Image Forensics — ELA Run',         description:'Error Level Analysis detected tampering in suspect_image_001.jpg. Risk score: 78/100.',                type:'analysis', severity:'High'     },
  { id:'t4', timestamp:'2026-05-25T11:45:00Z', title:'Server Logs Collected',             description:'2.4MB server access log collected from victim system. Chain-of-custody preserved.',                    type:'evidence', severity:'Low'      },
  { id:'t5', timestamp:'2026-05-25T12:00:00Z', title:'Log Analysis — Anomalies Detected', description:'14 suspicious events detected: 247 brute-force attempts, privilege escalation, data exfiltration.',   type:'analysis', severity:'High'     },
  { id:'t6', timestamp:'2026-05-25T14:30:00Z', title:'Deepfake Video Evidence Secured',   description:'Suspect MP4 video uploaded. SHA-256: b4e5f6a7… Metadata intact.',                                    type:'evidence', severity:'Medium'   },
  { id:'t7', timestamp:'2026-05-25T15:00:00Z', title:'Deepfake Detection — CRITICAL',     description:'AI model identifies 91% deepfake confidence. GAN fingerprint detected: StyleGAN2.',                   type:'alert',    severity:'Critical' },
  { id:'t8', timestamp:'2026-05-26T09:00:00Z', title:'Threat Escalation Issued',          description:'Case escalated to Tier-2 SOC. Incident response team notified.',                                       type:'alert',    severity:'Critical' },
  { id:'t9', timestamp:'2026-05-26T11:00:00Z', title:'PDF Forensic Report Generated',     description:'Executive report exported with full evidence summary, risk assessment, and recommendations.',           type:'case',     severity:'Safe'     },
  { id:'t10',timestamp:'2026-05-27T09:00:00Z', title:'Second Evidence Batch Added',       description:'4 additional screenshots and 1 network packet capture added to case.',                                  type:'evidence', severity:'Medium'   },
  { id:'t11',timestamp:'2026-05-28T16:00:00Z', title:'Risk Assessment Updated',           description:'Overall case risk score updated to 91 (Critical) following deepfake confirmation.',                    type:'analysis', severity:'Critical' },
];

const TYPE_ICON: Record<string, string>  = { case:'📂', evidence:'💾', analysis:'🔍', alert:'🚨' };
const TYPE_COLOR: Record<string, string> = { case:'#7b2fff', evidence:'#00d4ff', analysis:'#00ff88', alert:'#ff3366' };

export default function TimelinePage() {
  const [filter, setFilter] = useState<'all'|'case'|'evidence'|'analysis'|'alert'>('all');

  const filtered = MOCK_TIMELINE.filter(e => filter === 'all' || e.type === filter);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Timeline Reconstruction"
        subtitle="Chronological event reconstruction for NXDFI-2605-4821"
        icon="⏱"
      />

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {(['all','case','evidence','analysis','alert'] as const).map(f => (
          <button
            key={f}
            id={`filter-timeline-${f}`}
            onClick={() => setFilter(f)}
            className={`btn-cyber text-xs py-1.5 capitalize ${filter === f ? 'btn-cyan' : 'btn-ghost'}`}
          >
            {f !== 'all' && TYPE_ICON[f]} {f}
          </button>
        ))}
        <span className="ml-auto text-xs text-slate-500 self-center">{filtered.length} events</span>
      </div>

      {/* Timeline */}
      <Card className="relative">
        {/* Vertical line */}
        <div className="absolute left-[2.75rem] top-6 bottom-6 w-px bg-gradient-to-b from-cyan-400/40 via-cyan-400/20 to-transparent" />

        <div className="space-y-1">
          {filtered.map((ev, i) => (
            <motion.div
              key={ev.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 }}
              className="flex gap-4 py-4 px-2 rounded-xl hover:bg-navy-800/50 transition-colors group"
            >
              {/* Icon */}
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0 relative z-10"
                style={{ background: `${TYPE_COLOR[ev.type]}15`, border: `1px solid ${TYPE_COLOR[ev.type]}30` }}
              >
                {TYPE_ICON[ev.type]}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-300 group-hover:text-white transition-colors">{ev.title}</p>
                  {ev.severity && <RiskBadge level={ev.severity} />}
                </div>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">{ev.description}</p>
                <p className="text-[11px] text-slate-600 mono mt-1.5">{fmtDateTime(ev.timestamp)}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </Card>
    </div>
  );
}
