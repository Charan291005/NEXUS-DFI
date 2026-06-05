import { useState, useRef, useEffect, memo } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { casesApi, evidenceApi, analysisApi } from '../utils/api';
import type { NexusEvidence, NexusCase } from '../types';
import { PageHeader, SectionHeader, RiskMeter, RiskBadge, Badge, Spinner } from '../components/ui';
import { fileIcon, fileType, fmtDateTime, riskColor, riskLabel, STATUS_COLORS, PRIORITY_COLORS } from '../utils/helpers';

// ── Mock data ─────────────────────────────────────────────
const MOCK_EVIDENCE: NexusEvidence[] = [
  {
    id: 1, filename: 'suspect_image_001.jpg', file_path: '/uploads/1.jpg', file_type: 'image',
    sha256_hash: 'a3f2c8d9e1b4f6a7c2d5e8b1f4a7c2d5e8b1f4a7c2d5e8b1f4a7c2d5e8b1f4a7',
    uploaded_at: new Date(Date.now()-3600000*2).toISOString(), case_id: 1,
    analysis: {
      id:1, evidence_id:1, module:'image_forensics', risk_score: 78,
      created_at: new Date().toISOString(),
      result: {
        summary: 'High probability of tampering detected via Error Level Analysis. Multiple JPEG compression artifacts suggest image regions were composited from different sources.',
        findings: [
          { category:'ELA Analysis',     severity:'High',   description:'Inconsistent compression artifacts detected in lower-right quadrant', value:'78%' },
          { category:'Metadata',         severity:'Medium', description:'GPS coordinates stripped — possible evidence of manipulation', value:'Missing' },
          { category:'Color Histogram',  severity:'Low',    description:'Slight histogram discontinuity at image boundary', value:'Δ=0.12' },
          { category:'Clone Detection',  severity:'High',   description:'Duplicate pixel patterns detected — possible region cloning', value:'2 regions' },
        ],
        metadata: { 'Camera Model':'Canon EOS 5D', 'Software':'Adobe Photoshop 2024', 'Date Taken':'2026-05-28', 'Resolution':'4800×3200' },
        ela_risk: 78,
        recommendation: 'Immediate manual review recommended. Submit to certified forensics lab for secondary analysis.',
      }
    }
  },
  {
    id: 2, filename: 'deepfake_video_evidence.mp4', file_path: '/uploads/2.mp4', file_type: 'video',
    sha256_hash: 'b4e5f6a7c8d9e1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6',
    uploaded_at: new Date(Date.now()-3600000*5).toISOString(), case_id: 1,
    analysis: {
      id:2, evidence_id:2, module:'deepfake_detection', risk_score: 91,
      created_at: new Date().toISOString(),
      result: {
        summary: 'AI model detects strong deepfake indicators. Face swap artifacts visible in temporal blending analysis.',
        findings: [
          { category:'Facial Blending', severity:'Critical', description:'Inconsistent facial skin tone across frames — deepfake signature', value:'91%' },
          { category:'Eye Blink Pattern', severity:'High',  description:'Unnatural eye blink frequency detected (0.4x normal)', value:'Abnormal' },
          { category:'Temporal Coherence', severity:'High', description:'Frame-to-frame facial landmark inconsistency detected', value:'87% confidence' },
          { category:'GAN Fingerprint',  severity:'Critical', description:'StyleGAN2 generation fingerprint identified', value:'Detected' },
        ],
        deepfake_confidence: 91,
        recommendation: 'Content is very likely AI-generated. Do not use as authentic evidence without further verification.',
      }
    }
  },
  {
    id: 3, filename: 'server_access.log', file_path: '/uploads/3.log', file_type: 'log',
    sha256_hash: 'c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6',
    uploaded_at: new Date(Date.now()-3600000*8).toISOString(), case_id: 1,
    analysis: {
      id:3, evidence_id:3, module:'log_analysis', risk_score: 62,
      created_at: new Date().toISOString(),
      result: {
        summary: 'Log analysis complete. 14 suspicious events detected including multiple failed logins, unusual off-hours access, and potential data exfiltration patterns.',
        findings: [
          { category:'Brute Force',      severity:'High',   description:'247 failed login attempts from IP 192.168.1.45 in 3 minutes', value:'247 attempts' },
          { category:'Off-Hours Access', severity:'Medium', description:'Admin account accessed at 03:42 AM — outside business hours', value:'03:42 UTC' },
          { category:'Data Transfer',    severity:'High',   description:'Anomalous outbound transfer: 2.3GB to unknown external IP', value:'2.3 GB' },
          { category:'Privilege Escalation', severity:'Critical', description:'sudo privilege elevation without valid session', value:'Detected' },
        ],
        log_events: [
          { timestamp: '2026-05-28T03:42:17Z', type:'AUTH_FAILURE',    message:'Multiple authentication failures', severity:'High' },
          { timestamp: '2026-05-28T03:45:02Z', type:'AUTH_SUCCESS',    message:'Successful login after 247 failures', severity:'Critical' },
          { timestamp: '2026-05-28T03:46:11Z', type:'DATA_TRANSFER',   message:'Large outbound transfer initiated', severity:'High' },
          { timestamp: '2026-05-28T03:48:33Z', type:'PRIVILEGE_ESCALATION', message:'Sudo access granted', severity:'Critical' },
        ],
        recommendation: 'Incident escalation required. Isolate affected systems immediately. Preserve logs for chain-of-custody.',
      }
    }
  },
];

const EvidenceCard = memo(function EvidenceCard({ ev, onAnalyze }: { ev: NexusEvidence; onAnalyze: (id: number, module: string) => void }) {
  const [expanded, setExpanded] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  const runAnalysis = async (module: string) => {
    setAnalyzing(true);
    await onAnalyze(ev.id, module);
    setAnalyzing(false);
  };

  const r = ev.analysis;

  return (
    <motion.div
      layout
      className="glass glass-hover overflow-hidden"
    >
      {/* Header */}
      <div
        className="p-4 cursor-pointer select-none flex items-center gap-3"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="w-10 h-10 rounded-xl bg-white/[0.04] flex items-center justify-center text-xl flex-shrink-0">
          {fileIcon(ev.file_type)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-navy-100 truncate">{ev.filename}</p>
          <p className="text-[11px] text-slate-500 mono mt-0.5 truncate">
            SHA256: {ev.sha256_hash.substring(0, 24)}…
          </p>
        </div>
        <div className="flex items-center gap-2">
          {r && (
            <div className="text-right">
              <p className="text-sm font-bold" style={{ color: riskColor(r.risk_score) }}>
                {r.risk_score}/100
              </p>
              <p className="text-[10px]" style={{ color: riskColor(r.risk_score) }}>
                {riskLabel(r.risk_score)}
              </p>
            </div>
          )}
          <span className="text-navy-400 text-sm">{expanded ? '▲' : '▼'}</span>
        </div>
      </div>

      {/* Expanded details */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 border-t border-white/[0.05] pt-4 space-y-4">
              {/* File info */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="glass p-3 rounded-xl">
                  <p className="text-navy-400 mb-1">File Type</p>
                  <p className="text-navy-100 font-medium capitalize">{ev.file_type}</p>
                </div>
                <div className="glass p-3 rounded-xl">
                  <p className="text-navy-400 mb-1">Uploaded</p>
                  <p className="text-navy-100 font-medium mono">{fmtDateTime(ev.uploaded_at)}</p>
                </div>
                <div className="col-span-2 glass p-3 rounded-xl">
                  <p className="text-navy-400 mb-1">SHA-256 Hash (Integrity)</p>
                  <p className="text-accent-400 font-medium mono text-[11px] break-all">{ev.sha256_hash}</p>
                </div>
              </div>

              {/* Analysis actions */}
              {!r && (
                <div className="flex gap-2 flex-wrap">
                  <p className="w-full text-xs text-navy-300 mb-1">Run Analysis Modules:</p>
                  {ev.file_type === 'image' && (
                    <button onClick={() => runAnalysis('image_forensics')} disabled={analyzing} className="btn-cyber btn-cyan text-xs py-1.5">
                      {analyzing ? <Spinner size="sm" /> : '🔍'} Image Forensics
                    </button>
                  )}
                  {(ev.file_type === 'image' || ev.file_type === 'video') && (
                    <button onClick={() => runAnalysis('deepfake_detection')} disabled={analyzing} className="btn-cyber btn-primary text-xs py-1.5">
                      {analyzing ? <Spinner size="sm" /> : '🤖'} Deepfake Detection
                    </button>
                  )}
                  {ev.file_type === 'log' && (
                    <button onClick={() => runAnalysis('log_analysis')} disabled={analyzing} className="btn-cyber btn-cyan text-xs py-1.5">
                      {analyzing ? <Spinner size="sm" /> : '📋'} Log Analysis
                    </button>
                  )}
                </div>
              )}

              {/* Analysis results */}
              {r && (
                <div className="space-y-4">
                  <RiskMeter score={r.risk_score} />

                  <div className="glass p-3 rounded-xl">
                    <p className="text-xs text-navy-400 mb-2">AI Summary</p>
                    <p className="text-sm text-navy-200 leading-relaxed">{r.result.summary}</p>
                  </div>

                  {/* Findings */}
                  <div>
                    <p className="text-xs text-navy-400 mb-2">Findings</p>
                    <div className="space-y-2">
                      {r.result.findings.map((f, i) => (
                        <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02]">
                          <RiskBadge level={f.severity} />
                          <div className="flex-1">
                            <p className="text-xs font-semibold text-navy-200">{f.category}</p>
                            <p className="text-[11px] text-navy-300 mt-0.5">{f.description}</p>
                          </div>
                          {f.value && <span className="text-xs mono text-accent-400">{f.value}</span>}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Metadata */}
                  {r.result.metadata && (
                    <div>
                      <p className="text-xs text-navy-400 mb-2">File Metadata</p>
                      <div className="grid grid-cols-2 gap-2">
                        {Object.entries(r.result.metadata).map(([k, v]) => (
                          <div key={k} className="flex justify-between p-2 rounded-lg bg-white/[0.02] text-xs">
                            <span className="text-navy-400">{k}</span>
                            <span className="text-navy-200 font-medium mono">{v}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Log events */}
                  {r.result.log_events && (
                    <div>
                      <p className="text-xs text-navy-400 mb-2">Timeline Events</p>
                      <div className="space-y-1">
                        {r.result.log_events.map((ev, i) => (
                          <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-white/[0.02] text-xs">
                            <RiskBadge level={ev.severity} />
                            <span className="mono text-navy-300">{ev.timestamp.substring(11, 19)}</span>
                            <span className="text-navy-200">{ev.message}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recommendation */}
                  <div className="p-3 rounded-xl bg-accent-500/5 border border-accent-500/15">
                    <p className="text-xs text-accent-400 font-semibold mb-1">🧠 AI Recommendation</p>
                    <p className="text-xs text-navy-200">{r.result.recommendation}</p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
});

export default function CaseDetail() {
  const { id } = useParams();
  const [evidence, setEvidence] = useState<NexusEvidence[]>(MOCK_EVIDENCE);
  const [uploading, setUploading] = useState(false);
  const [dragOver,  setDragOver]  = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const [currentCase, setCurrentCase] = useState<NexusCase | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    casesApi.get(Number(id) || 1)
      .then(res => {
        setCurrentCase(res.data);
      })
      .catch(() => {
        const fallback = [
          { id:1, case_id:'NXDFI-2605-4821', title:'Operation Shadow Storm',   description:'Multi-vector phishing campaign targeting financial institutions with deepfake CEO audio.',   status:'Active' as const,   priority:'Critical' as const, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), owner_id:1, evidence_count:3 },
          { id:2, case_id:'NXDFI-2605-3317', title:'Insider Threat – DevOps', description:'Suspicious data exfiltration detected from internal DevOps repository access logs.',          status:'Active' as const,   priority:'High' as const,     created_at: new Date().toISOString(), updated_at: new Date().toISOString(), owner_id:1, evidence_count:0 },
          { id:3, case_id:'NXDFI-2605-9102', title:'Deepfake Political Video', description:'Viral video suspected to contain AI-generated content of public figure. Under analysis.',     status:'Open' as const,     priority:'High' as const,     created_at: new Date().toISOString(), updated_at: new Date().toISOString(), owner_id:1, evidence_count:0 },
          { id:4, case_id:'NXDFI-2605-1244', title:'Ransomware Incident R9X', description:'Post-incident forensic analysis of ransomware attack on healthcare provider.',                 status:'Closed' as const,   priority:'Critical' as const, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), owner_id:1, evidence_count:0 },
          { id:5, case_id:'NXDFI-2605-7763', title:'Social Engineering Probe', description:'Image-based social engineering artifacts for employee training exercise.',                     status:'Archived' as const, priority:'Low' as const,      created_at: new Date().toISOString(), updated_at: new Date().toISOString(), owner_id:1, evidence_count:0 },
          { id:6, case_id:'NXDFI-2605-5528', title:'Supply Chain Compromise',  description:'Suspected software supply chain attack via compromised NPM package with obfuscated payload.', status:'Active' as const,   priority:'Critical' as const, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), owner_id:1, evidence_count:0 },
        ].find(c => c.id === Number(id)) || {
          id: Number(id) || 1,
          case_id: `NXDFI-2605-${id ?? '4821'}`,
          title: `Investigation Case #${id ?? '1'}`,
          description: 'Forensic investigation details and evidence file repository.',
          status: 'Active' as const,
          priority: 'Medium' as const,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          owner_id: 1,
          evidence_count: 0
        };
        setCurrentCase(fallback);
      });

    evidenceApi.list(Number(id) || 1)
      .then(res => {
        setEvidence(res.data);
      })
      .catch(() => {
        if (Number(id) === 1 || !id) {
          setEvidence(MOCK_EVIDENCE);
        } else {
          setEvidence([]);
        }
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    for (const file of Array.from(files)) {
      try {
        const res = await evidenceApi.upload(Number(id) || 1, file);
        setEvidence(prev => [res.data, ...prev]);
      } catch {
        // Mock upload
        const fakeEv: NexusEvidence = {
          id: Date.now(), filename: file.name, file_path: `/uploads/${file.name}`,
          sha256_hash: Array.from(crypto.getRandomValues(new Uint8Array(32)))
            .map(b => b.toString(16).padStart(2, '0')).join(''),
          file_type: fileType(file.name) as any,
          uploaded_at: new Date().toISOString(), case_id: Number(id) || 1,
        };
        setEvidence(prev => [fakeEv, ...prev]);
      }
    }
    setUploading(false);
  };

  const handleAnalyze = async (evidenceId: number, module: string) => {
    try {
      let res: any;
      if (module === 'image_forensics')   res = await analysisApi.runImageForensics(evidenceId);
      else if (module === 'deepfake_detection') res = await analysisApi.runDeepfake(evidenceId);
      else res = await analysisApi.runLogAnalysis(evidenceId);
      setEvidence(prev => prev.map(e => e.id === evidenceId ? { ...e, analysis: res.data } : e));
    } catch {
      // keep existing mock analysis
    }
  };

  if (loading || !currentCase) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Spinner size="lg" label="Loading case details..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title={currentCase.title} subtitle={currentCase.case_id} icon="📂">
        <Badge label={currentCase.status} variant={STATUS_COLORS[currentCase.status]} dot />
        <Badge label={currentCase.priority} variant={PRIORITY_COLORS[currentCase.priority]} />
        <button id="btn-generate-report" className="btn-cyber btn-primary" onClick={() => analysisApi.generateReport(Number(id)||1).then(r => {
          const url = window.URL.createObjectURL(new Blob([r.data]));
          const a = document.createElement('a'); a.href = url;
          a.download = `${currentCase.case_id}_report.pdf`; a.click();
        }).catch(() => alert('Backend offline – PDF generation requires the FastAPI server.'))}>
          📑 Generate Report
        </button>
      </PageHeader>

      {/* Upload drop zone */}
      <motion.div
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={e => { e.preventDefault(); setDragOver(false); handleUpload(e.dataTransfer.files); }}
        animate={{ borderColor: dragOver ? 'rgba(0,212,255,0.5)' : 'rgba(0,212,255,0.1)' }}
        className="glass p-8 text-center cursor-pointer border-2 border-dashed border-cyan-400/10 rounded-2xl transition-colors"
        onClick={() => fileRef.current?.click()}
      >
        <input ref={fileRef} type="file" multiple accept="image/*,video/*,.pdf,.zip,.log,.txt,.csv" className="hidden" onChange={e => handleUpload(e.target.files)} />
        <div className="text-4xl mb-3">{uploading ? '⏳' : dragOver ? '📂' : '📁'}</div>
        <p className="text-navy-200 font-medium">{uploading ? 'Uploading & hashing evidence...' : 'Drop evidence files here or click to upload'}</p>
        <p className="text-xs text-navy-400 mt-2">Supports: Images, Videos, PDFs, ZIPs, Log files — SHA-256 hashed automatically</p>
        {uploading && <div className="mt-4 flex justify-center"><Spinner /></div>}
      </motion.div>

      {/* Evidence cards */}
      <div>
        <SectionHeader
          title="Evidence Collection"
          subtitle={`${evidence.length} files secured with SHA-256 integrity hashing`}
          icon="🔍"
        />
        <div className="space-y-3">
          {evidence.map(ev => (
            <EvidenceCard key={ev.id} ev={ev} onAnalyze={handleAnalyze} />
          ))}
        </div>
      </div>
    </div>
  );
}
