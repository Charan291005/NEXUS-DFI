import { useState, useEffect, useMemo } from 'react';
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
  const [activeFilter, setActiveFilter] = useState<'All' | 'image' | 'video' | 'log' | 'pdf' | 'document' | 'other'>('All');

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
        const u = { ...ev, _verified: true } as NexusEvidence & { _verified?: boolean };
        setSelected(u);
        setEvidence(prev => prev.map(e => e.id === ev.id ? u : e));
      }
    } catch (e) {
      console.error("Verification failed", e);
    }
    setVerifying(null);
  };

  const filteredEvidence = useMemo(() => evidence.filter(e => activeFilter === 'All' || e.file_type === activeFilter), [evidence, activeFilter]);

  const containerVariants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.05 } },
  };
  const itemVariants = {
    hidden: { opacity: 0, x: -16 },
    show:   { opacity: 1, x: 0, transition: { duration: 0.25 } },
  };

  return (
    <div className="space-y-6 flex flex-col h-[calc(100vh-8rem)]">
      <PageHeader
        title="Evidence Vault"
        subtitle="Cryptographically verified central chain of custody repository"
      />

      {/* Filter Pills HUD */}
      <Card className="py-3 px-5 flex items-center justify-between gap-4 flex-wrap">
        <span className="text-xs font-mono uppercase tracking-widest text-navy-400 font-semibold">Filter by Asset Type:</span>
        <div className="flex gap-2 flex-wrap">
          {(['All', 'image', 'video', 'log', 'pdf', 'document', 'other'] as const).map(f => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`btn-cyber text-xs py-1.5 px-3.5 ${activeFilter === f ? 'btn-primary' : 'btn-ghost'}`}
            >
              {f === 'All' ? 'All Artifacts' : f.toUpperCase()}
            </button>
          ))}
        </div>
      </Card>

      <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0">
        {/* Left: Vault List */}
        <Card className="w-full lg:w-1/3 flex flex-col min-h-0 p-0 border-r border-navy-800">
          <div className="p-4 border-b border-navy-700 bg-navy-900/50 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-white font-display">Secured Ledger</h2>
              <p className="text-xs text-navy-400 mt-0.5">{filteredEvidence.length} items matching filter</p>
            </div>
            <span className="pulse-dot inline-block" />
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {loading ? <div className="p-4 flex justify-center"><Spinner label="Syncing vault..." /></div> : null}
            {!loading && filteredEvidence.length === 0 && (
              <div className="p-8 text-center text-navy-500 text-xs font-mono">
                No artifacts found for selected asset type.
              </div>
            )}
            <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-2">
              {filteredEvidence.map((ev) => (
                <motion.button
                  key={ev.id}
                  variants={itemVariants}
                  onClick={() => setSelected(ev)}
                  className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-center gap-3.5 ${
                    selected?.id === ev.id
                      ? 'bg-accent-500/10 border-accent-500/40 shadow-lg shadow-accent-500/5'
                      : 'bg-navy-900/30 border-navy-800 hover:bg-navy-800/60 hover:border-navy-700'
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-navy-800 border border-navy-700 flex items-center justify-center flex-shrink-0 text-lg shadow-inner">
                    {fileIcon(ev.file_type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-bold truncate ${selected?.id === ev.id ? 'text-accent-300' : 'text-navy-100'}`}>
                      {ev.filename}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] uppercase font-mono bg-navy-950 px-2 py-0.5 rounded text-navy-400 border border-navy-800">
                        {ev.file_type}
                      </span>
                      <p className="text-[10px] text-navy-500 mono truncate">
                        {fmtDateTime(ev.uploaded_at)}
                      </p>
                    </div>
                  </div>
                  {ev.analysis ? (
                    <div className="flex flex-col items-end flex-shrink-0">
                      <span className="text-xs font-bold font-mono" style={{ color: riskColor(ev.analysis.risk_score) }}>
                        {ev.analysis.risk_score}
                      </span>
                      <span className="w-1.5 h-1.5 rounded-full mt-0.5" style={{ background: riskColor(ev.analysis.risk_score) }} />
                    </div>
                  ) : (
                    <span className="text-[10px] text-navy-500 font-mono italic flex-shrink-0">Unscanned</span>
                  )}
                </motion.button>
              ))}
            </motion.div>
          </div>
        </Card>

        {/* Right: Details & Analysis HUD */}
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
                {/* Header info HUD */}
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-navy-800 flex items-center justify-center text-3xl shadow-inner border border-navy-700">
                      {fileIcon(selected.file_type)}
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white font-display mb-1.5">{selected.filename}</h2>
                      <div className="flex gap-2.5 items-center text-xs">
                        <Badge label={selected.file_type} variant="badge-info" />
                        <span className="text-navy-400 mono self-center">{fmtDateTime(selected.uploaded_at)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right space-y-2 max-w-full">
                    <p className="text-xs text-navy-400 uppercase tracking-widest font-mono font-semibold mb-1">Cryptographic Ledger Hash</p>
                    <p className="text-xs mono text-accent-400 bg-accent-500/10 px-3 py-1.5 rounded-lg border border-accent-500/20 break-all max-w-md">
                      {selected.sha256_hash}
                    </p>
                    <button
                      onClick={() => verifyHash(selected)}
                      disabled={verifying === selected.id}
                      className="text-xs text-navy-300 hover:text-white transition-colors font-mono inline-flex items-center gap-1 mt-1"
                    >
                      {verifying === selected.id ? '⏳ Verifying via SHA-256...' : (selected as NexusEvidence & { _verified?: boolean })._verified ? '🟢 Cryptographically Match Verified' : '🔄 Click to Re-verify Ledger Hash'}
                    </button>
                  </div>
                </div>

                <hr className="border-navy-800" />

                {/* Analysis Section */}
                <div className="space-y-5">
                  <h3 className="text-sm font-semibold text-navy-200 uppercase tracking-widest font-mono">Deep Learning Forensics Engine</h3>

                  {/* Actions */}
                  {!selected.analysis && (
                    <div className="p-6 rounded-2xl bg-navy-900/40 border border-navy-800 space-y-4">
                      <p className="text-xs text-navy-300 leading-relaxed">
                        This artifact has been secured in the vault but has not yet been processed through the NΞXUS deep neural scanning pipelines. Select an inspection module below to deploy AI forensics.
                      </p>
                      <div className="flex gap-3 flex-wrap">
                        {selected.file_type === 'image' && (
                          <button onClick={() => runAnalysis('image_forensics')} disabled={analyzing} className="btn-cyber btn-cyan text-xs py-2 px-4">
                            {analyzing ? <Spinner size="sm" /> : '🔍 Run Error Level Analysis & PRNU'}
                          </button>
                        )}
                        {(selected.file_type === 'image' || selected.file_type === 'video') && (
                          <button onClick={() => runAnalysis('deepfake_detection')} disabled={analyzing} className="btn-cyber btn-primary text-xs py-2 px-4">
                            {analyzing ? <Spinner size="sm" /> : '⚡ Deploy Deepfake Neural Detector'}
                          </button>
                        )}
                        {selected.file_type === 'log' && (
                          <button onClick={() => runAnalysis('log_analysis')} disabled={analyzing} className="btn-cyber btn-cyan text-xs py-2 px-4">
                            {analyzing ? <Spinner size="sm" /> : '🛡️ Deploy Threat & IoC Scanner'}
                          </button>
                        )}
                        {(!['image','video','log'].includes(selected.file_type)) && (
                          <p className="text-xs text-navy-400 italic">Static file verification complete. No custom neural models required for this format.</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Loading State */}
                  {analyzing && (
                    <div className="p-12 text-center rounded-2xl border border-navy-700 bg-navy-900/60 shadow-2xl space-y-4">
                      <Spinner size="lg" label="Exec NΞXUS Neural Pipelines..." />
                      <p className="text-xs text-navy-400 font-mono">
                        Scanning metadata structures, extracting compression artifacts, and evaluating threat vectors...
                      </p>
                    </div>
                  )}

                  {/* Results HUD */}
                  {selected.analysis && !analyzing && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Summary & Risk */}
                        <div className="space-y-6">
                          <RiskMeter score={selected.analysis.risk_score} />
                          <div>
                            <p className="text-xs text-navy-400 uppercase tracking-widest font-mono font-semibold mb-2">Executive Analysis</p>
                            <p className="text-sm text-navy-100 leading-relaxed bg-navy-900/50 p-5 rounded-2xl border border-navy-800 shadow-inner">
                              {selected.analysis.result.summary}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-navy-400 uppercase tracking-widest font-mono font-semibold mb-2">Strategic Recommendation</p>
                            <div className="p-4 rounded-xl border bg-accent-500/10 border-accent-500/20 text-xs text-accent-100 leading-relaxed shadow-lg shadow-accent-500/5">
                              {selected.analysis.result.recommendation}
                            </div>
                          </div>
                        </div>

                        {/* Findings & Metadata */}
                        <div className="space-y-6">
                          <div>
                            <p className="text-xs text-navy-400 uppercase tracking-widest font-mono font-semibold mb-2">Identified Threats & Findings</p>
                            <div className="space-y-2.5">
                              {selected.analysis.result.findings.map((f, i) => (
                                <div key={i} className="flex gap-3.5 p-4 rounded-xl bg-navy-900/40 border border-navy-800">
                                  <div className="mt-0.5"><RiskBadge level={f.severity} /></div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-bold text-white">{f.category}</p>
                                    <p className="text-[11px] text-navy-300 mt-1 leading-relaxed">{f.description}</p>
                                    {f.value && <p className="text-[10px] mono text-accent-400 mt-1.5 bg-navy-950 px-2 py-1 rounded border border-navy-800 inline-block">{f.value}</p>}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                          {selected.analysis.result.metadata && (
                            <div>
                              <p className="text-xs text-navy-400 uppercase tracking-widest font-mono font-semibold mb-2">File Header Metadata</p>
                              <div className="grid grid-cols-2 gap-2 text-xs">
                                {Object.entries(selected.analysis.result.metadata).map(([k,v]) => (
                                  <div key={k} className="flex flex-col p-2.5 bg-navy-900/40 rounded-lg border border-navy-800">
                                    <span className="text-navy-400 mb-1 font-mono text-[10px] uppercase tracking-wider">{k}</span>
                                    <span className="text-white font-mono truncate text-xs font-medium">{v}</span>
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
              <div className="h-full flex flex-col items-center justify-center text-navy-500 py-20">
                <span className="text-4xl mb-4 opacity-20">🗄️</span>
                <p className="text-sm font-mono">Select an evidence file from the vault ledger to view deep forensic details.</p>
              </div>
            )}
          </AnimatePresence>
        </Card>
      </div>
    </div>
  );
}
