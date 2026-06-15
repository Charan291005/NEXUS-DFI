import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PageHeader, RiskMeter, RiskBadge, Spinner } from '../components/ui';
import { evidenceApi, analysisApi } from '../utils/api';
import type { NexusEvidence, Finding } from '../types';

export default function EvidencePage() {
  const [evidence, setEvidence] = useState<NexusEvidence[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [verificationStatus, setVerificationStatus] = useState<'idle' | 'loading' | 'match' | 'mismatch' | 'missing'>('idle');

  // Backend base URL for media files
  const BASE_URL = import.meta.env.PROD ? 'https://nexusdfi-backend-741401327113.us-central1.run.app' : (import.meta.env.VITE_API_URL || 'http://localhost:8000');

  const fetchEvidence = () => {
    setLoading(true);
    evidenceApi.listAll()
      .then(res => setEvidence(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchEvidence();
  }, []);

  const selected = evidence.find(e => e.id === selectedId);

  const runAnalysis = async (module: string) => {
    if (!selected) return;
    setAnalyzing(true);
    try {
      let res;
      if (module === 'image_forensics') res = await analysisApi.runImageForensics(selected.id);
      else if (module === 'deepfake_detection') res = await analysisApi.runDeepfake(selected.id);
      else res = await analysisApi.runLogAnalysis(selected.id);
      setEvidence(prev => prev.map(e => e.id === selected.id ? { ...e, analysis: res.data } : e));
    } catch (e) {
      console.error(e);
      alert('Analysis failed');
    }
    setAnalyzing(false);
  };

  const handleVerify = async () => {
    if (!selected) return;
    setVerificationStatus('loading');
    try {
      const res = await evidenceApi.verify(selected.id);
      setVerificationStatus(res.data.status);
    } catch (e) {
      console.error("Verification failed", e);
      setVerificationStatus('idle');
      alert("Failed to verify integrity.");
    }
  };

  const handleDelete = async () => {
    if (!selected) return;
    if (window.confirm("Are you sure you want to delete this evidence? This action cannot be undone.")) {
      try {
        await evidenceApi.delete(selected.id);
        setSelectedId(null);
        fetchEvidence();
      } catch (e) {
        console.error("Deletion failed", e);
        alert("Failed to delete evidence.");
      }
    }
  };

  useEffect(() => {
    setVerificationStatus('idle');
  }, [selectedId]);

  const containerVariants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.05 } },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show:   { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
  };

  const getMediaUrl = (filePath: string) => {
    return `${BASE_URL}/${filePath.replace(/\\/g, '/')}`;
  };

  return (
    <div className="space-y-8 pb-12">
      <PageHeader 
        title="Evidence Management" 
        subtitle="Cryptographically verifiable digital forensics evidence vault" 
        icon="🔍" 
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Sidebar: Evidence List */}
        <div className="lg:col-span-4 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-bold text-white font-display tracking-wide">Evidence Vault</h3>
            <span className="px-3 py-1 bg-navy-800 rounded-full text-xs font-semibold text-navy-300 border border-navy-700">
              {evidence.length} Items
            </span>
          </div>

          <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-3">
            {loading ? (
              <div className="flex justify-center py-12"><Spinner size="lg" /></div>
            ) : evidence.length === 0 ? (
              <div className="glass p-8 text-center rounded-2xl border border-navy-700 border-dashed">
                <span className="text-4xl block mb-3 opacity-50">📂</span>
                <p className="text-navy-300 text-sm">No evidence uploaded yet.</p>
              </div>
            ) : (
              evidence.map(ev => (
                <motion.div
                  key={ev.id}
                  variants={itemVariants}
                  whileHover={{ scale: 1.02, x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedId(ev.id)}
                  className={`relative overflow-hidden p-4 rounded-xl cursor-pointer transition-all duration-300 ${
                    selectedId === ev.id 
                      ? 'bg-gradient-to-r from-accent-500/20 to-purple-500/10 border border-accent-400/50 shadow-[0_0_20px_rgba(59,130,246,0.15)]' 
                      : 'glass border border-navy-700 hover:border-navy-500'
                  }`}
                >
                  {selectedId === ev.id && (
                    <motion.div layoutId="active-indicator" className="absolute left-0 top-0 bottom-0 w-1 bg-accent-400" />
                  )}
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-2xl shadow-inner ${
                      ev.file_type === 'image' ? 'bg-blue-500/10 text-blue-400' : 
                      ev.file_type === 'video' ? 'bg-purple-500/10 text-purple-400' : 
                      'bg-emerald-500/10 text-emerald-400'
                    }`}>
                      {ev.file_type === 'image' ? '🖼️' : ev.file_type === 'video' ? '🎬' : '📋'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-white truncate">{ev.filename}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] uppercase tracking-wider font-bold text-navy-400">{ev.file_type}</span>
                        <span className="w-1 h-1 rounded-full bg-navy-600"></span>
                        <span className="text-[10px] text-navy-400 truncate font-mono">{ev.sha256_hash.substring(0,8)}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </motion.div>
        </div>

        {/* Main Panel: Evidence Details & Analysis */}
        <div className="lg:col-span-8">
          <AnimatePresence mode="wait">
            {!selected ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="h-full min-h-[500px] glass rounded-3xl border border-navy-700 flex flex-col items-center justify-center p-12 text-center"
              >
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                  className="w-32 h-32 mb-6 rounded-full bg-gradient-to-tr from-accent-500/10 to-purple-500/10 flex items-center justify-center border border-navy-600 shadow-[0_0_40px_rgba(59,130,246,0.1)]"
                >
                  <span className="text-5xl opacity-80">🔬</span>
                </motion.div>
                <h3 className="text-2xl font-display font-bold text-white mb-2">Awaiting Selection</h3>
                <p className="text-navy-300 max-w-sm mx-auto leading-relaxed">
                  Select an evidence file from the vault to review chain of custody and run AI-powered forensic analysis.
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="details"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                {/* Media Preview & Metadata Card */}
                <div className="glass rounded-3xl overflow-hidden border border-navy-700 shadow-xl">
                  {/* Visual Preview */}
                  <div className="bg-navy-950/80 border-b border-navy-800 relative group flex items-center justify-center min-h-[250px] max-h-[400px] overflow-hidden">
                    {selected.file_type === 'image' ? (
                      <img 
                        src={getMediaUrl(selected.file_path)} 
                        alt={selected.filename} 
                        className="object-contain w-full h-full max-h-[400px] transition-transform duration-700 group-hover:scale-105"
                      />
                    ) : selected.file_type === 'video' ? (
                      <video 
                        src={getMediaUrl(selected.file_path)} 
                        controls 
                        className="w-full max-h-[400px] object-contain bg-black"
                      />
                    ) : (
                      <div className="flex flex-col items-center opacity-50 py-16">
                        <span className="text-6xl mb-4">📄</span>
                        <p className="text-sm font-mono">No visual preview available for {selected.file_type}</p>
                      </div>
                    )}
                    <div className="absolute top-4 right-4 flex gap-2">
                      <span className="px-3 py-1.5 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                        {selected.file_type}
                      </span>
                    </div>
                  </div>

                  {/* Chain of Custody */}
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-bold font-display text-white flex items-center gap-2">
                        <span className="text-accent-400">🛡️</span> Chain of Custody
                      </h3>
                      <button 
                        onClick={handleDelete}
                        className="text-xs px-4 py-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 transition-all hover:scale-105 font-bold"
                      >
                        Destroy Evidence
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 rounded-2xl bg-navy-900/40 border border-navy-800 hover:border-navy-600 transition-colors">
                        <p className="text-[10px] uppercase tracking-widest text-navy-400 font-bold mb-1">Filename</p>
                        <p className="text-sm text-white font-medium truncate" title={selected.filename}>{selected.filename}</p>
                      </div>
                      <div className="p-4 rounded-2xl bg-navy-900/40 border border-navy-800 hover:border-navy-600 transition-colors">
                        <p className="text-[10px] uppercase tracking-widest text-navy-400 font-bold mb-1">Timestamp</p>
                        <p className="text-sm text-white font-medium">{new Date(selected.uploaded_at).toLocaleString()}</p>
                      </div>
                      <div className="md:col-span-2 p-4 rounded-2xl bg-navy-900/40 border border-navy-800 hover:border-navy-600 transition-colors flex items-center justify-between group">
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] uppercase tracking-widest text-navy-400 font-bold mb-1">Cryptographic Hash (SHA-256)</p>
                          <p className="text-accent-400 font-medium font-mono text-xs truncate select-all pr-4">{selected.sha256_hash}</p>
                        </div>
                        <button 
                          onClick={() => navigator.clipboard.writeText(selected.sha256_hash)}
                          className="w-8 h-8 rounded-lg bg-navy-800 flex items-center justify-center hover:bg-navy-700 text-navy-300 transition-colors opacity-0 group-hover:opacity-100"
                          title="Copy Hash"
                        >
                          📋
                        </button>
                      </div>
                    </div>

                    {/* Integrity Verification */}
                    <div className="mt-6 pt-6 border-t border-navy-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex-1">
                        {verificationStatus === 'idle' && <p className="text-sm text-navy-300">Verify file integrity against stored cryptographic signature.</p>}
                        {verificationStatus === 'loading' && <p className="text-sm text-navy-300 animate-pulse">Computing hash on disk...</p>}
                        {verificationStatus === 'match' && (
                          <div className="flex items-start gap-2 text-emerald-400">
                            <span className="text-xl">✅</span>
                            <div>
                              <p className="font-bold text-sm">Integrity Verified</p>
                              <p className="text-xs opacity-80 mt-0.5">Hash matches exact record. Evidence is untampered.</p>
                            </div>
                          </div>
                        )}
                        {verificationStatus === 'mismatch' && (
                          <div className="flex items-start gap-2 text-red-400">
                            <span className="text-xl animate-bounce">❌</span>
                            <div>
                              <p className="font-bold text-sm">Integrity Failed</p>
                              <p className="text-xs opacity-80 mt-0.5">File has been modified after upload. Chain of custody broken.</p>
                            </div>
                          </div>
                        )}
                        {verificationStatus === 'missing' && (
                          <div className="flex items-start gap-2 text-orange-400">
                            <span className="text-xl">⚠️</span>
                            <div>
                              <p className="font-bold text-sm">File Missing</p>
                              <p className="text-xs opacity-80 mt-0.5">Unable to locate file on storage.</p>
                            </div>
                          </div>
                        )}
                      </div>
                      <button
                        onClick={handleVerify}
                        disabled={verificationStatus === 'loading'}
                        className={`shrink-0 px-6 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg ${
                          verificationStatus === 'match' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' :
                          verificationStatus === 'mismatch' ? 'bg-red-500/10 text-red-400 border border-red-500/30' :
                          'bg-navy-800 hover:bg-navy-700 text-white border border-navy-600 hover:border-navy-400'
                        }`}
                      >
                        {verificationStatus === 'loading' ? <div className="flex items-center gap-2"><Spinner size="sm"/> Verifying</div> : 'Verify Integrity'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Analysis Section */}
                <div className="glass rounded-3xl p-6 border border-navy-700 shadow-xl relative overflow-hidden">
                  {/* Decorative background element */}
                  <div className="absolute top-0 right-0 w-64 h-64 bg-accent-500/5 rounded-full blur-3xl pointer-events-none transform translate-x-1/2 -translate-y-1/2"></div>
                  
                  <div className="flex items-start justify-between mb-8 relative z-10">
                    <div>
                      <h3 className="text-xl font-bold font-display text-white flex items-center gap-2 mb-1">
                        <span className="text-purple-400">⚡</span> Forensic Analysis Engine
                      </h3>
                      <p className="text-sm text-navy-300">Run authentic, deterministic forensic algorithms on the evidence.</p>
                    </div>
                    
                    {!analyzing && (
                      <motion.button
                        whileHover={{ scale: 1.05, boxShadow: '0 0 20px rgba(59,130,246,0.4)' }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          if (selected?.file_type === 'image') runAnalysis('image_forensics');
                          else if (selected?.file_type === 'video') runAnalysis('deepfake_detection');
                          else runAnalysis('log_analysis');
                        }}
                        className="px-6 py-3 rounded-xl bg-gradient-to-r from-accent-600 to-purple-600 text-white font-bold text-sm shadow-lg border border-white/10 flex items-center gap-2 group"
                      >
                        <span>Run Analysis</span>
                        <span className="group-hover:translate-x-1 transition-transform">→</span>
                      </motion.button>
                    )}
                  </div>

                  {analyzing ? (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }} 
                      animate={{ opacity: 1, scale: 1 }} 
                      className="py-16 flex flex-col items-center justify-center text-center bg-navy-900/30 rounded-2xl border border-navy-800"
                    >
                      <div className="relative mb-6">
                        <div className="w-20 h-20 rounded-full border-2 border-navy-800 flex items-center justify-center">
                          <div className="w-16 h-16 rounded-full border-t-2 border-l-2 border-accent-400 animate-spin"></div>
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-2xl opacity-80 animate-pulse">🧠</span>
                        </div>
                      </div>
                      <h4 className="text-lg font-bold text-white mb-2">Executing Authentic Forensic Pipeline</h4>
                      <p className="text-sm text-navy-300 max-w-sm">
                        Analyzing structural integrity, mathematical variances, and deep computational signatures...
                      </p>
                    </motion.div>
                  ) : selected?.analysis ? (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5 }}
                      className="space-y-6 relative z-10"
                    >
                      {/* Risk Score Highlight */}
                      <div className="p-6 rounded-2xl bg-navy-950/50 border border-navy-800 flex flex-col md:flex-row items-center gap-8">
                        <div className="w-full md:w-1/3">
                          <RiskMeter score={selected.analysis.risk_score} />
                        </div>
                        <div className="w-full md:w-2/3 space-y-3">
                          <h4 className="text-sm uppercase tracking-widest text-navy-400 font-bold">Executive Summary</h4>
                          <p className="text-base text-white leading-relaxed font-medium">
                            {selected.analysis.result.summary}
                          </p>
                          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-accent-500/10 border border-accent-500/20 text-accent-300 text-xs font-bold mt-2">
                            <span>💡 Recommendation:</span>
                            <span className="text-white">{selected.analysis.result.recommendation}</span>
                          </div>
                        </div>
                      </div>

                      {/* Detailed Findings */}
                      <div className="space-y-3">
                        <h4 className="text-sm uppercase tracking-widest text-navy-400 font-bold mb-4">Technical Findings</h4>
                        {selected.analysis.result.findings?.map((f: Finding, i: number) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.04] transition-colors group"
                          >
                            <div className="shrink-0"><RiskBadge level={f.severity} /></div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-white mb-0.5">{f.category}</p>
                              <p className="text-xs text-navy-300 leading-relaxed">{f.description}</p>
                            </div>
                            <div className="shrink-0 sm:text-right">
                              <span className="inline-block px-3 py-1 rounded bg-navy-900 border border-navy-700 text-xs font-mono text-accent-400 group-hover:border-accent-500/30 transition-colors">
                                {f.value}
                              </span>
                            </div>
                          </motion.div>
                        ))}
                      </div>

                      {/* Raw Metadata (if present) */}
                      {selected.analysis.result.metadata && Object.keys(selected.analysis.result.metadata).length > 0 && (
                        <div className="mt-8">
                          <h4 className="text-sm uppercase tracking-widest text-navy-400 font-bold mb-4">Extracted Metadata</h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {Object.entries(selected.analysis.result.metadata).slice(0, 12).map(([key, value]) => (
                              <div key={key} className="p-3 rounded-lg bg-navy-900/40 border border-navy-800">
                                <p className="text-[10px] text-navy-400 uppercase truncate" title={key}>{key}</p>
                                <p className="text-xs text-white font-mono truncate mt-1" title={value as string}>{value as string}</p>
                              </div>
                            ))}
                          </div>
                          {Object.keys(selected.analysis.result.metadata).length > 12 && (
                            <p className="text-xs text-center text-navy-400 mt-4 italic">+ {Object.keys(selected.analysis.result.metadata).length - 12} more metadata fields available in raw export</p>
                          )}
                        </div>
                      )}
                    </motion.div>
                  ) : (
                    <div className="py-12 text-center border-t border-navy-800 mt-4 border-dashed">
                      <p className="text-navy-400 text-sm">Analysis module ready. Awaiting execution.</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

