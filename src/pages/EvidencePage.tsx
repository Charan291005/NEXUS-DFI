import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { evidenceApi, analysisApi } from '../utils/api';
import type { NexusEvidence } from '../types';
import { PageHeader, Card, Spinner, RiskMeter, RiskBadge, Badge } from '../components/ui';
import { fileIcon, fmtDateTime, riskColor } from '../utils/helpers';

export default function EvidencePage() {
  const [evidence, setEvidence] = useState<NexusEvidence[]>([]);
  const [loading, setLoading]   = useState(true);
  const [selected, setSelected] = useState<NexusEvidence | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [verifying, setVerifying] = useState<number | null>(null);

  useEffect(() => {
    evidenceApi.list(1) // Showing all for demo
      .then(res => { setEvidence(res.data); if (res.data.length > 0) setSelected(res.data[0]); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const runAnalysis = async (module: string) => {
    if (!selected) return;
    setAnalyzing(true);
    try {
      let res;
      if (module === 'image_forensics')   res = await analysisApi.runImageForensics(selected.id);
      else if (module === 'deepfake_detection') res = await analysisApi.runDeepfake(selected.id);
      else res = await analysisApi.runLogAnalysis(selected.id);

      const updated = { ...selected, analysis: res.data };
      setSelected(updated);
      setEvidence(prev => prev.map(e => e.id === selected.id ? updated : e));
    } catch (e) {
      console.error('Analysis failed', e);
      alert('Analysis failed. Check if backend is running.');
    }
    setAnalyzing(false);
  };

  const verifyHash = async (ev: NexusEvidence) => {
    setVerifying(ev.id);
    try {
      const res = await evidenceApi.verify(ev.id);
      if (res.data.status === 'verified') {
        const u = { ...ev, _verified: true } as any;
        setSelected(u);
        setEvidence(prev => prev.map(e => e.id === ev.id ? u : e));
      }
    } catch (e) {
      console.error("Verification failed", e);
    }
    setVerifying(null);
  };

  const containerVariants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.05 } },
  };
  const itemVariants = {
    hidden: { opacity: 0, x: -16 },
    show:   { opacity: 1, x: 0, transition: { duration: 0.3 } },
  };

  return (
    <div className="space-y-6 flex flex-col h-[calc(100vh-8rem)]">
      <PageHeader
        title="Evidence Management"
        subtitle="Cryptographically verified central evidence vault"
      />

      <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0">
        {/* Left: Vault List */}
        <Card className="w-full lg:w-1/3 flex flex-col min-h-0 p-0 border-r border-navy-800">
          <div className="p-4 border-b border-navy-700 bg-navy-900/50">
            <h2 className="text-sm font-semibold text-white font-display">Chain of Custody Vault</h2>
            <p className="text-xs text-navy-400 mt-0.5">{evidence.length} secured artifacts</p>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {loading ? <div className="p-4 flex justify-center"><Spinner /></div> : null}
            <motion.div variants={containerVariants} initial="hidden" animate="show">
              {evidence.map((ev) => (
                <motion.button
                  key={ev.id}
                  variants={itemVariants}
                  onClick={() => setSelected(ev)}
                  className={`w-full text-left p-3 rounded-xl border transition-colors flex items-center gap-3 ${
                    selected?.id === ev.id
                      ? 'bg-accent-500/10 border-accent-500/30'
                      : 'bg-navy-900/30 border-navy-800 hover:bg-navy-800/60'
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg bg-navy-800 flex items-center justify-center flex-shrink-0 text-sm">
                    {fileIcon(ev.file_type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${selected?.id === ev.id ? 'text-accent-300' : 'text-navy-100'}`}>
                      {ev.filename}
                    </p>
                    <p className="text-[10px] text-navy-500 mono mt-0.5">
                      {fmtDateTime(ev.uploaded_at)}
                    </p>
                  </div>
                  {ev.analysis && (
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: riskColor(ev.analysis.risk_score) }} />
                  )}
                </motion.button>
              ))}
            </motion.div>
          </div>
        </Card>

        {/* Right: Details & Analysis */}
        <Card className="w-full lg:w-2/3 flex flex-col min-h-0 overflow-y-auto p-6 relative">
          <AnimatePresence mode="wait">
            {selected ? (
              <motion.div
                key={selected.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                className="space-y-6 relative z-10"
              >
                {/* Header info */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-navy-800 flex items-center justify-center text-3xl shadow-inner border border-navy-700">
                      {fileIcon(selected.file_type)}
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white font-display mb-1">{selected.filename}</h2>
                      <div className="flex gap-2 text-xs">
                        <Badge label={selected.file_type} variant="badge-info" />
                        <span className="text-navy-400 mono self-center">{fmtDateTime(selected.uploaded_at)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right space-y-2">
                    <p className="text-xs text-navy-400 uppercase tracking-widest font-semibold mb-1">Integrity Hash</p>
                    <p className="text-xs mono text-accent-400 bg-accent-500/10 px-2 py-1 rounded border border-accent-500/20">{selected.sha256_hash}</p>
                    <button
                      onClick={() => verifyHash(selected)}
                      disabled={verifying === selected.id}
                      className="text-xs text-navy-300 hover:text-white transition-colors"
                    >
                      {verifying === selected.id ? 'Verifying...' : (selected as any)._verified ? '✓ Verified Match' : 'Re-verify Hash'}
                    </button>
                  </div>
                </div>

                <hr className="border-navy-700" />

                {/* Analysis Section */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-navy-200 uppercase tracking-widest">Forensic Analysis Engine</h3>

                  {/* Actions */}
                  {!selected.analysis && (
                    <div className="flex gap-3 flex-wrap">
                      {selected.file_type === 'image' && (
                        <button onClick={() => runAnalysis('image_forensics')} disabled={analyzing} className="btn-cyber btn-cyan">
                          {analyzing ? <Spinner size="sm" /> : 'Run Image Forensics (ELA & PRNU)'}
                        </button>
                      )}
                      {(selected.file_type === 'image' || selected.file_type === 'video') && (
                        <button onClick={() => runAnalysis('deepfake_detection')} disabled={analyzing} className="btn-cyber btn-primary">
                          {analyzing ? <Spinner size="sm" /> : 'Run Deepfake Detection'}
                        </button>
                      )}
                      {selected.file_type === 'log' && (
                        <button onClick={() => runAnalysis('log_analysis')} disabled={analyzing} className="btn-cyber btn-cyan">
                          {analyzing ? <Spinner size="sm" /> : 'Run Log Analysis (IoC & Anomaly)'}
                        </button>
                      )}
                      {(!['image','video','log'].includes(selected.file_type)) && (
                        <p className="text-sm text-navy-400">No specialized AI modules available for this file type.</p>
                      )}
                    </div>
                  )}

                  {/* Loading State */}
                  {analyzing && (
                    <div className="p-8 text-center rounded-xl border border-navy-700 bg-navy-900/50">
                      <Spinner size="lg" label="Processing through NΞXUS AI Engine..." />
                      <p className="text-xs text-navy-400 mt-2">Checking metadata, anomalies, and threat signatures.</p>
                    </div>
                  )}

                  {/* Results */}
                  {selected.analysis && !analyzing && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Summary & Risk */}
                        <div className="space-y-6">
                          <RiskMeter score={selected.analysis.risk_score} />
                          <div>
                            <p className="text-xs text-navy-400 uppercase tracking-widest font-semibold mb-2">AI Summary</p>
                            <p className="text-sm text-navy-200 leading-relaxed bg-navy-900/50 p-4 rounded-xl border border-navy-800">
                              {selected.analysis.result.summary}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-navy-400 uppercase tracking-widest font-semibold mb-2">Recommendation</p>
                            <div className="p-3 rounded-lg border bg-accent-500/10 border-accent-500/20 text-sm text-accent-100">
                              {selected.analysis.result.recommendation}
                            </div>
                          </div>
                        </div>

                        {/* Findings & Metadata */}
                        <div className="space-y-6">
                          <div>
                            <p className="text-xs text-navy-400 uppercase tracking-widest font-semibold mb-2">Findings</p>
                            <div className="space-y-2">
                              {selected.analysis.result.findings.map((f, i) => (
                                <div key={i} className="flex gap-3 p-3 rounded-lg bg-navy-900/50 border border-navy-800">
                                  <div className="mt-0.5"><RiskBadge level={f.severity} /></div>
                                  <div>
                                    <p className="text-xs font-semibold text-white">{f.category}</p>
                                    <p className="text-[11px] text-navy-300 mt-1">{f.description}</p>
                                    {f.value && <p className="text-[10px] mono text-accent-400 mt-1">{f.value}</p>}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                          {selected.analysis.result.metadata && (
                            <div>
                              <p className="text-xs text-navy-400 uppercase tracking-widest font-semibold mb-2">Metadata</p>
                              <div className="grid grid-cols-2 gap-2 text-xs">
                                {Object.entries(selected.analysis.result.metadata).map(([k,v]) => (
                                  <div key={k} className="flex flex-col p-2 bg-navy-900/50 rounded border border-navy-800">
                                    <span className="text-navy-400 mb-0.5">{k}</span>
                                    <span className="text-white font-mono truncate">{v}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            ) : (
              <div className="h-full flex items-center justify-center text-navy-500">
                <p>Select an evidence file from the vault to view details.</p>
              </div>
            )}
          </AnimatePresence>
        </Card>
      </div>
    </div>
  );
}
