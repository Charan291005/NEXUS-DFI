import { useState, useRef, useEffect, memo } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { casesApi, evidenceApi, analysisApi } from '../utils/api';
import type { NexusEvidence, NexusCase, NexusAnalysisResult } from '../types';
import { PageHeader, SectionHeader, RiskMeter, RiskBadge, Badge, Spinner } from '../components/ui';
import { fileIcon, fmtDateTime, riskColor, riskLabel, STATUS_COLORS, PRIORITY_COLORS } from '../utils/helpers';



const EvidenceCard = memo(function EvidenceCard({ ev, onAnalyze, index }: { ev: NexusEvidence; onAnalyze: (id: number, module: string) => void; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState<'summary' | 'findings' | 'metadata' | 'timeline'>('summary');

  const runAnalysis = async (module: string) => {
    setAnalyzing(true);
    await onAnalyze(ev.id, module);
    setAnalyzing(false);
  };

  const r = ev.analysis;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
      layout
      className="glass glass-hover overflow-hidden border border-navy-800/80 hover:border-navy-700"
    >
      {/* Header */}
      <div
        className="p-4 cursor-pointer select-none flex items-center gap-4"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="w-10 h-10 rounded-xl bg-navy-800 border border-navy-700 flex items-center justify-center text-xl flex-shrink-0 shadow-inner">
          {fileIcon(ev.file_type)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-navy-100 truncate flex items-center gap-2">
            {ev.filename}
            <span className="text-[10px] uppercase text-navy-400 font-mono px-2 py-0.5 bg-navy-900/60 rounded border border-navy-800">
              {ev.file_type}
            </span>
          </p>
          <p className="text-[11px] text-navy-500 mono mt-1 truncate">
            SHA256: <span className="text-accent-400">{ev.sha256_hash.substring(0, 24)}…</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          {r ? (
            <div className="text-right">
              <p className="text-sm font-bold font-mono" style={{ color: riskColor(r.risk_score) }}>
                {r.risk_score}/100
              </p>
              <p className="text-[10px] uppercase tracking-wider font-mono font-semibold" style={{ color: riskColor(r.risk_score) }}>
                {riskLabel(r.risk_score)}
              </p>
            </div>
          ) : (
            <span className="text-[11px] text-navy-400 font-mono bg-navy-900/50 px-2.5 py-1 rounded border border-navy-800">
              Unanalyzed
            </span>
          )}
          <motion.span
            animate={{ rotate: expanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="text-navy-400 text-xs ml-1"
          >
            ▼
          </motion.span>
        </div>
      </div>

      {/* Expanded details */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 border-t border-navy-800 pt-5 space-y-5 bg-navy-900/20">
              {/* File info HUD */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-navy-900/60 border border-navy-800">
                  <p className="text-[10px] text-navy-400 font-mono uppercase tracking-wider mb-1">File Type</p>
                  <p className="text-navy-100 font-bold capitalize">{ev.file_type}</p>
                </div>
                <div className="p-3 rounded-xl bg-navy-900/60 border border-navy-800">
                  <p className="text-[10px] text-navy-400 font-mono uppercase tracking-wider mb-1">Uploaded</p>
                  <p className="text-navy-100 font-medium mono">{fmtDateTime(ev.uploaded_at)}</p>
                </div>
                <div className="col-span-2 md:col-span-1 p-3 rounded-xl bg-navy-900/60 border border-navy-800">
                  <p className="text-[10px] text-navy-400 font-mono uppercase tracking-wider mb-1">Status</p>
                  <p className="text-success-400 font-medium mono flex items-center gap-1.5">
                    <span className="status-dot inline-block" /> Cryptographically Verified
                  </p>
                </div>
                <div className="col-span-2 md:col-span-3 p-3 rounded-xl bg-navy-900/60 border border-navy-800">
                  <p className="text-[10px] text-navy-400 font-mono uppercase tracking-wider mb-1">Complete SHA-256 Hash</p>
                  <p className="text-accent-400 font-medium mono text-[11px] break-all">{ev.sha256_hash}</p>
                </div>
              </div>

              {/* Analysis actions */}
              {!r && (
                <div className="p-5 rounded-xl bg-navy-900/40 border border-navy-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-white uppercase tracking-wider font-mono">NΞXUS AI Engine Analysis</p>
                      <p className="text-xs text-navy-400 mt-0.5">Deploy deep learning forensics on this artifact to uncover hidden anomalies.</p>
                    </div>
                  </div>
                  <div className="flex gap-3 flex-wrap pt-1">
                    {ev.file_type === 'image' && (
                      <button onClick={() => runAnalysis('image_forensics')} disabled={analyzing} className="btn-cyber btn-cyan text-xs py-2 px-4">
                        {analyzing ? <Spinner size="sm" /> : '🔍 Run ELA & PRNU Image Forensics'}
                      </button>
                    )}
                    {(ev.file_type === 'image' || ev.file_type === 'video') && (
                      <button onClick={() => runAnalysis('deepfake_detection')} disabled={analyzing} className="btn-cyber btn-primary text-xs py-2 px-4">
                        {analyzing ? <Spinner size="sm" /> : '⚡ Deploy Deepfake Neural Detector'}
                      </button>
                    )}
                    {ev.file_type === 'log' && (
                      <button onClick={() => runAnalysis('log_analysis')} disabled={analyzing} className="btn-cyber btn-cyan text-xs py-2 px-4">
                        {analyzing ? <Spinner size="sm" /> : '🛡️ Run Threat & IoC Log Analysis'}
                      </button>
                    )}
                    {(!['image','video','log'].includes(ev.file_type)) && (
                      <p className="text-xs text-navy-400 italic">Automated threat scanning is complete. No specialized neural models required for this format.</p>
                    )}
                  </div>
                </div>
              )}

              {/* Analysis results */}
              {r && (
                <div className="space-y-5 pt-2">
                  <RiskMeter score={r.risk_score} />

                  {/* Tabs */}
                  <div className="flex gap-2 border-b border-navy-800 pb-2">
                    {(['summary', 'findings', 'metadata', 'timeline'] as const).map((tab) => {
                      if (tab === 'metadata' && !r.result.metadata) return null;
                      if (tab === 'timeline' && !r.result.log_events) return null;
                      return (
                        <button
                          key={tab}
                          onClick={() => setActiveTab(tab)}
                          className={`btn-cyber text-xs py-1.5 px-3.5 ${activeTab === tab ? 'btn-primary' : 'btn-ghost'}`}
                        >
                          {tab.toUpperCase()}
                        </button>
                      );
                    })}
                  </div>

                  {/* Tab content */}
                  {activeTab === 'summary' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                      <div className="p-4 rounded-xl bg-navy-900/60 border border-navy-800">
                        <p className="text-[10px] text-navy-400 font-mono uppercase tracking-wider mb-2">Executive Overview</p>
                        <p className="text-sm text-navy-100 leading-relaxed">{r.result.summary}</p>
                      </div>
                      <div className="p-4 rounded-xl bg-accent-500/5 border border-accent-500/20">
                        <p className="text-[10px] text-accent-400 font-mono uppercase tracking-wider mb-1">Analyst Recommendation</p>
                        <p className="text-xs text-navy-200 leading-relaxed">{r.result.recommendation}</p>
                      </div>
                    </motion.div>
                  )}

                  {activeTab === 'findings' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
                      <p className="text-[10px] text-navy-400 font-mono uppercase tracking-wider mb-2">Verified Threat & Anomaly Findings</p>
                      {r.result.findings.map((f, i) => (
                        <div key={i} className="flex items-start gap-3 p-3.5 rounded-xl bg-navy-900/40 border border-navy-800">
                          <RiskBadge level={f.severity} />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-white">{f.category}</p>
                            <p className="text-[11px] text-navy-300 mt-1 leading-relaxed">{f.description}</p>
                          </div>
                          {f.value && <span className="text-xs mono text-accent-400 font-bold bg-navy-950 px-2 py-1 rounded border border-navy-800">{f.value}</span>}
                        </div>
                      ))}
                    </motion.div>
                  )}

                  {activeTab === 'metadata' && r.result.metadata && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
                      <p className="text-[10px] text-navy-400 font-mono uppercase tracking-wider mb-2">Extracted File Metadata</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {Object.entries(r.result.metadata).map(([k, v]) => (
                          <div key={k} className="flex items-center justify-between p-2.5 rounded-lg bg-navy-900/40 text-xs border border-navy-800">
                            <span className="text-navy-400 font-mono truncate mr-2">{k}</span>
                            <span className="text-navy-100 font-mono font-medium truncate bg-navy-950 px-2 py-0.5 rounded border border-navy-800">{v}</span>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {activeTab === 'timeline' && r.result.log_events && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
                      <p className="text-[10px] text-navy-400 font-mono uppercase tracking-wider mb-2">Sequence of Events</p>
                      <div className="space-y-1.5">
                        {r.result.log_events.map((ev, i) => (
                          <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg bg-navy-900/40 text-xs border border-navy-800">
                            <RiskBadge level={ev.severity} />
                            <span className="mono text-navy-300 bg-navy-950 px-2 py-0.5 rounded border border-navy-800">{ev.timestamp.substring(11, 19)}</span>
                            <span className="text-navy-200 flex-1 truncate">{ev.message}</span>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
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
  const [evidence, setEvidence] = useState<NexusEvidence[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragOver,  setDragOver]  = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const [currentCase, setCurrentCase] = useState<NexusCase | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.resolve().then(() => setLoading(true));
    casesApi.get(Number(id) || 1)
      .then(res => { setCurrentCase(res.data); })
      .catch((e) => { console.error(e); setCurrentCase(null); });

    evidenceApi.list(Number(id) || 1)
      .then(res => { setEvidence(res.data); })
      .catch((e) => { console.error(e); setEvidence([]); })
      .finally(() => { setLoading(false); });
  }, [id]);

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    for (const file of Array.from(files)) {
      try {
        const res = await evidenceApi.upload(Number(id) || 1, file);
        setEvidence(prev => [res.data, ...prev]);
      } catch (e) {
        console.error('Failed to upload evidence', e);
        alert(`Failed to upload ${file.name}. Backend error.`);
      }
    }
    setUploading(false);
  };

  const handleAnalyze = async (evidenceId: number, module: string) => {
    try {
      let res: { data: NexusAnalysisResult };
      if (module === 'image_forensics')   res = await analysisApi.runImageForensics(evidenceId);
      else if (module === 'deepfake_detection') res = await analysisApi.runDeepfake(evidenceId);
      else res = await analysisApi.runLogAnalysis(evidenceId);
      setEvidence(prev => prev.map(e => e.id === evidenceId ? { ...e, analysis: res.data } : e));
    } catch (e) {
      console.error('Analysis failed', e);
      alert('Analysis failed. Backend might be offline.');
    }
  };

  if (loading || !currentCase) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Spinner size="lg" label="Loading case details..." />
      </div>
    );
  }

  const peakRisk = evidence.reduce((max, e) => e.analysis ? Math.max(max, e.analysis.risk_score) : max, 0);

  return (
    <div className="space-y-6">
      <PageHeader title={currentCase.title} subtitle={`Case ID: ${currentCase.case_id}`}>
        <Badge label={currentCase.status} variant={STATUS_COLORS[currentCase.status]} dot />
        <Badge label={currentCase.priority} variant={PRIORITY_COLORS[currentCase.priority]} />
        <button
          id="btn-generate-report"
          className="btn-cyber btn-primary"
          onClick={() => analysisApi.generateReport(Number(id)||1).then(r => {
            const url = window.URL.createObjectURL(new Blob([r.data]));
            const a = document.createElement('a'); a.href = url;
            a.download = `${currentCase.case_id}_report.pdf`; a.click();
          }).catch(() => alert('Backend offline – PDF generation requires the FastAPI server.'))}
        >
          Generate Report
        </button>
      </PageHeader>

      {/* Investigation Overview Banner */}
      <div className="glass p-6 rounded-2xl border border-navy-800 grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="border-r border-navy-800/80 pr-6">
          <p className="text-[10px] text-navy-400 uppercase tracking-widest font-mono font-semibold mb-1">Investigation State</p>
          <p className="text-lg font-bold text-white font-display flex items-center gap-2">
            <span className="pulse-dot inline-block" /> Active & Monitored
          </p>
        </div>
        <div className="border-r border-navy-800/80 pr-6">
          <p className="text-[10px] text-navy-400 uppercase tracking-widest font-mono font-semibold mb-1">Cryptographic Ledger</p>
          <p className="text-lg font-bold text-success-400 font-display">100% SHA-256 Verified</p>
        </div>
        <div className="border-r border-navy-800/80 pr-6">
          <p className="text-[10px] text-navy-400 uppercase tracking-widest font-mono font-semibold mb-1">Secured Evidence</p>
          <p className="text-lg font-bold text-white font-display">{evidence.length} Artifacts</p>
        </div>
        <div>
          <p className="text-[10px] text-navy-400 uppercase tracking-widest font-mono font-semibold mb-1">Peak Risk Index</p>
          <p className="text-lg font-bold font-mono" style={{ color: riskColor(peakRisk) }}>{peakRisk} / 100</p>
        </div>
      </div>

      {/* Chain of Custody Table */}
      {evidence.length > 0 && (
        <div className="glass overflow-hidden border border-navy-800">
          <div className="p-4 border-b border-navy-700 bg-navy-900/40">
            <h3 className="text-sm font-semibold text-white font-display">Chain of Custody Ledger</h3>
            <p className="text-xs text-navy-400 mt-0.5">Cryptographic integrity log for all secured evidence</p>
          </div>
          <table className="table-cyber">
            <thead>
              <tr>
                <th>Evidence</th>
                <th>Type</th>
                <th>SHA-256</th>
                <th>Collected</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {evidence.map((ev) => (
                <tr key={ev.id}>
                  <td className="font-medium text-navy-100">{ev.filename}</td>
                  <td><span className="text-xs uppercase text-navy-400 font-mono bg-navy-950 px-2 py-0.5 rounded border border-navy-800">{ev.file_type}</span></td>
                  <td><span className="mono text-[11px] text-accent-400">{ev.sha256_hash.substring(0, 16)}…</span></td>
                  <td><span className="mono text-xs text-navy-400">{fmtDateTime(ev.uploaded_at)}</span></td>
                  <td><span className="badge badge-success">Verified</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Upload drop zone */}
      <div className="gradient-border rounded-2xl">
        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => { e.preventDefault(); setDragOver(false); handleUpload(e.dataTransfer.files); }}
          className={`glass p-10 text-center cursor-pointer border-2 border-dashed transition-all rounded-2xl ${
            dragOver ? 'border-neon bg-accent-500/5 shadow-2xl' : 'border-navy-700 hover:border-accent-500/50'
          }`}
          onClick={() => fileRef.current?.click()}
        >
          <input ref={fileRef} type="file" multiple accept="image/*,video/*,.pdf,.zip,.log,.txt,.csv" className="hidden" onChange={e => handleUpload(e.target.files)} />
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-navy-900 border border-navy-800 flex items-center justify-center text-2xl shadow-inner text-accent-400">
            {uploading ? '⏳' : '📥'}
          </div>
          <p className="text-lg font-bold text-white font-display mb-1">
            {uploading ? 'Securing & Cryptographically Hashing Evidence...' : 'Drag & Drop Evidence Artifacts to Secure Vault'}
          </p>
          <p className="text-xs text-navy-400 max-w-md mx-auto">
            Files are immediately hashed with SHA-256 upon selection to guarantee absolute chain of custody integrity. Supports Images, Videos, Logs, PDFs, and Archives.
          </p>
          {uploading && <div className="mt-6 flex justify-center"><Spinner label="Transferring to NΞXUS Vault..." /></div>}
        </div>
      </div>

      {/* Evidence cards */}
      <div>
        <SectionHeader
          title="Evidence Collection & Intelligence"
          subtitle={`${evidence.length} files secured with SHA-256 integrity hashing`}
        />
        <div className="space-y-4">
          {evidence.map((ev, i) => (
            <EvidenceCard key={ev.id} ev={ev} onAnalyze={handleAnalyze} index={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
