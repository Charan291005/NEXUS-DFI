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

  const runAnalysis = async (module: string) => {
    setAnalyzing(true);
    await onAnalyze(ev.id, module);
    setAnalyzing(false);
  };

  const r = ev.analysis;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.4 }}
      layout
      className="glass glass-hover overflow-hidden"
    >
      {/* Header */}
      <div
        className="p-4 cursor-pointer select-none flex items-center gap-3"
        onClick={() => setExpanded(!expanded)}
      >
        <motion.div
          whileHover={{ scale: 1.1, rotate: 5 }}
          className="w-10 h-10 rounded-xl bg-white/[0.03] flex items-center justify-center text-xl flex-shrink-0"
        >
          {fileIcon(ev.file_type)}
        </motion.div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-navy-100 truncate">{ev.filename}</p>
          <p className="text-[11px] text-navy-500 mono mt-0.5 truncate">
            SHA256: {ev.sha256_hash.substring(0, 24)}…
          </p>
        </div>
        <div className="flex items-center gap-2">
          {r && (
            <div className="text-right">
              <p className="text-sm font-bold font-display" style={{ color: riskColor(r.risk_score) }}>
                {r.risk_score}/100
              </p>
              <p className="text-[10px]" style={{ color: riskColor(r.risk_score) }}>
                {riskLabel(r.risk_score)}
              </p>
            </div>
          )}
          <motion.span
            animate={{ rotate: expanded ? 180 : 0 }}
            transition={{ duration: 0.3 }}
            className="text-navy-400 text-sm"
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
            transition={{ duration: 0.35 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 border-t border-white/[0.04] pt-4 space-y-4">
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
                    <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => runAnalysis('image_forensics')} disabled={analyzing} className="btn-cyber btn-cyan text-xs py-1.5">
                      {analyzing ? <Spinner size="sm" /> : '🔍'} Image Forensics
                    </motion.button>
                  )}
                  {(ev.file_type === 'image' || ev.file_type === 'video') && (
                    <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => runAnalysis('deepfake_detection')} disabled={analyzing} className="btn-cyber btn-primary text-xs py-1.5">
                      {analyzing ? <Spinner size="sm" /> : '🤖'} Deepfake Detection
                    </motion.button>
                  )}
                  {ev.file_type === 'log' && (
                    <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => runAnalysis('log_analysis')} disabled={analyzing} className="btn-cyber btn-cyan text-xs py-1.5">
                      {analyzing ? <Spinner size="sm" /> : '📋'} Log Analysis
                    </motion.button>
                  )}
                </div>
              )}

              {/* Analysis results */}
              {r && (
                <div className="space-y-4">
                  <RiskMeter score={r.risk_score} />

                  <div className="glass p-4 rounded-xl">
                    <p className="text-xs text-navy-400 mb-2 font-semibold">AI Summary</p>
                    <p className="text-sm text-navy-200 leading-relaxed">{r.result.summary}</p>
                  </div>

                  {/* Findings */}
                  <div>
                    <p className="text-xs text-navy-400 mb-2 font-semibold">Findings</p>
                    <div className="space-y-2">
                      {r.result.findings.map((f, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.06 }}
                          className="flex items-start gap-3 p-3.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
                        >
                          <RiskBadge level={f.severity} />
                          <div className="flex-1">
                            <p className="text-xs font-semibold text-navy-200">{f.category}</p>
                            <p className="text-[11px] text-navy-300 mt-0.5">{f.description}</p>
                          </div>
                          {f.value && <span className="text-xs mono text-accent-400 font-medium">{f.value}</span>}
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* Metadata */}
                  {r.result.metadata && (
                    <div>
                      <p className="text-xs text-navy-400 mb-2 font-semibold">File Metadata</p>
                      <div className="grid grid-cols-2 gap-2">
                        {Object.entries(r.result.metadata).map(([k, v]) => (
                          <div key={k} className="flex justify-between p-2.5 rounded-lg bg-white/[0.02] text-xs hover:bg-white/[0.04] transition-colors">
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
                      <p className="text-xs text-navy-400 mb-2 font-semibold">Timeline Events</p>
                      <div className="space-y-1">
                        {r.result.log_events.map((ev, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.06 }}
                            className="flex items-center gap-3 p-2.5 rounded-lg bg-white/[0.02] text-xs hover:bg-white/[0.04] transition-colors"
                          >
                            <RiskBadge level={ev.severity} />
                            <span className="mono text-navy-300">{ev.timestamp.substring(11, 19)}</span>
                            <span className="text-navy-200">{ev.message}</span>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recommendation */}
                  <div className="p-3.5 rounded-xl bg-accent-500/5 border border-accent-500/12">
                    <p className="text-xs text-accent-400 font-semibold mb-1">🧠 AI Recommendation</p>
                    <p className="text-xs text-navy-200 leading-relaxed">{r.result.recommendation}</p>
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
  const [evidence, setEvidence] = useState<NexusEvidence[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragOver,  setDragOver]  = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const [currentCase, setCurrentCase] = useState<NexusCase | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.resolve().then(() => setLoading(true));
    casesApi.get(Number(id) || 1)
      .then(res => {
        setCurrentCase(res.data);
      })
      .catch((e) => {
        console.error(e);
        setCurrentCase(null);
      });

    evidenceApi.list(Number(id) || 1)
      .then(res => {
        setEvidence(res.data);
      })
      .catch((e) => {
        console.error(e);
        setEvidence([]);
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

  return (
    <div className="space-y-6">
      <PageHeader title={currentCase.title} subtitle={currentCase.case_id} icon="📂">
        <Badge label={currentCase.status} variant={STATUS_COLORS[currentCase.status]} dot />
        <Badge label={currentCase.priority} variant={PRIORITY_COLORS[currentCase.priority]} />
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          id="btn-generate-report"
          className="btn-cyber btn-primary"
          onClick={() => analysisApi.generateReport(Number(id)||1).then(r => {
            const url = window.URL.createObjectURL(new Blob([r.data]));
            const a = document.createElement('a'); a.href = url;
            a.download = `${currentCase.case_id}_report.pdf`; a.click();
          }).catch(() => alert('Backend offline – PDF generation requires the FastAPI server.'))}
        >
          📑 Generate Report
        </motion.button>
      </PageHeader>

      {/* Upload drop zone */}
      <motion.div
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={e => { e.preventDefault(); setDragOver(false); handleUpload(e.dataTransfer.files); }}
        animate={{
          borderColor: dragOver ? 'rgba(220,38,38,0.5)' : 'rgba(220,38,38,0.1)',
          boxShadow: dragOver ? '0 0 30px rgba(220,38,38,0.1)' : '0 0 0 rgba(0,0,0,0)',
        }}
        whileHover={{ borderColor: 'rgba(220,38,38,0.25)' }}
        className="glass p-8 text-center cursor-pointer border-2 border-dashed border-accent-400/10 rounded-2xl transition-all"
        onClick={() => fileRef.current?.click()}
      >
        <input ref={fileRef} type="file" multiple accept="image/*,video/*,.pdf,.zip,.log,.txt,.csv" className="hidden" onChange={e => handleUpload(e.target.files)} />
        <motion.div
          animate={uploading ? { rotate: 360 } : dragOver ? { scale: 1.1 } : { y: [0, -4, 0] }}
          transition={uploading ? { duration: 2, repeat: Infinity, ease: 'linear' } : { duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          className="text-4xl mb-3 inline-block"
        >
          {uploading ? '⏳' : dragOver ? '📂' : '📁'}
        </motion.div>
        <p className="text-navy-200 font-medium font-display">{uploading ? 'Uploading & hashing evidence...' : 'Drop evidence files here or click to upload'}</p>
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
          {evidence.map((ev, i) => (
            <EvidenceCard key={ev.id} ev={ev} onAnalyze={handleAnalyze} index={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
