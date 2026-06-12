import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { PageHeader, Card, SectionHeader, RiskMeter, RiskBadge, Spinner } from '../components/ui';
import { evidenceApi, analysisApi } from '../utils/api';
import type { NexusEvidence, Finding } from '../types';

export default function EvidencePage() {
  const [evidence, setEvidence]   = useState<NexusEvidence[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [verificationStatus, setVerificationStatus] = useState<'idle' | 'loading' | 'match' | 'mismatch' | 'missing'>('idle');

  // Refresh evidence list
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
      alert("Failed to verify integrity. Check server logs.");
    }
  };

  const handleDelete = async () => {
    if (!selected) return;
    if (window.confirm("Are you sure you want to delete this evidence? This action cannot be undone and breaks the chain of custody.")) {
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

  // Reset verification status when selecting new evidence
  useEffect(() => {
    setVerificationStatus('idle');
  }, [selectedId]);

  const containerVariants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.08 } },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    show:   { opacity: 1, y: 0, transition: { duration: 0.4 } },
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Evidence Management" subtitle="All uploaded forensic evidence across cases" icon="🔍" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Evidence list */}
        <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-3">
          <p className="label-cyber">Evidence Files</p>
          {loading ? <Spinner /> : evidence.length === 0 ? <p className="text-navy-400 text-sm">No evidence uploaded yet.</p> : evidence.map(ev => (
            <motion.div
              key={ev.id}
              variants={itemVariants}
              whileHover={{ x: 6, boxShadow: '0 8px 24px rgba(0,0,0,0.3)' }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedId(ev.id)}
              className={`glass p-4 cursor-pointer transition-all ${selectedId === ev.id ? 'border-glow' : ''}`}
            >
              <div className="flex items-center gap-3">
                <motion.span
                  whileHover={{ scale: 1.15, rotate: 5 }}
                  className="text-2xl"
                >
                  {ev.file_type === 'image' ? '🖼️' : ev.file_type === 'video' ? '🎬' : '📋'}
                </motion.span>
                <div>
                  <p className="text-sm text-navy-100 font-medium">{ev.filename}</p>
                  <p className="text-xs text-navy-400 capitalize">{ev.file_type}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Analysis panel */}
        <div className="lg:col-span-2">
          {!selected ? (
            <Card className="flex items-center justify-center h-64">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center"
              >
                <motion.div
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                  className="text-4xl mb-3 opacity-50"
                >
                  🔍
                </motion.div>
                <p className="text-navy-300 font-display">Select an evidence file to run analysis</p>
              </motion.div>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* Evidence Metadata & Chain of Custody Card */}
              <Card>
                <SectionHeader 
                  title="Chain of Custody" 
                  subtitle="Cryptographic integrity & metadata" 
                  icon="🛡️" 
                  action={
                    <button 
                      onClick={handleDelete}
                      className="text-xs px-3 py-1.5 rounded bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 transition-colors"
                    >
                      Delete Evidence
                    </button>
                  }
                />
                
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="p-3 rounded-xl bg-navy-900/50 border border-navy-800">
                    <p className="text-xs text-navy-400 mb-1">Filename</p>
                    <p className="text-white font-medium truncate">{selected.filename}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-navy-900/50 border border-navy-800">
                    <p className="text-xs text-navy-400 mb-1">Uploaded At</p>
                    <p className="text-white font-medium">{new Date(selected.uploaded_at).toLocaleString()}</p>
                  </div>
                  <div className="md:col-span-2 p-3 rounded-xl bg-navy-900/50 border border-navy-800 flex items-center justify-between">
                    <div className="min-w-0">
                      <p className="text-xs text-navy-400 mb-1">SHA-256 Hash</p>
                      <p className="text-teal-400 font-medium mono text-xs truncate select-all pr-4">{selected.sha256_hash}</p>
                    </div>
                    <button 
                      onClick={() => navigator.clipboard.writeText(selected.sha256_hash)}
                      className="p-1.5 rounded hover:bg-navy-700 text-navy-300 transition-colors"
                      title="Copy Hash"
                    >
                      📋
                    </button>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-navy-800 flex items-center justify-between">
                  <p className="text-xs text-navy-300">
                    {verificationStatus === 'idle' && 'Verify cryptographic hash against stored database record.'}
                    {verificationStatus === 'loading' && 'Recalculating hash on disk...'}
                    {verificationStatus === 'match' && <span className="text-teal-400 flex items-center gap-1">✅ Integrity Verified: Hash matches exact record</span>}
                    {verificationStatus === 'mismatch' && <span className="text-red-400 font-bold flex items-center gap-1">❌ Integrity Failed: File modified after upload</span>}
                    {verificationStatus === 'missing' && <span className="text-orange-400 flex items-center gap-1">⚠️ Error: File missing from storage</span>}
                  </p>
                  <button
                    onClick={handleVerify}
                    disabled={verificationStatus === 'loading'}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                      verificationStatus === 'match' ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20' :
                      verificationStatus === 'mismatch' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                      'bg-navy-700 hover:bg-navy-600 text-white'
                    }`}
                  >
                    {verificationStatus === 'loading' ? <Spinner size="sm" /> : 'Verify Integrity'}
                  </button>
                </div>
              </Card>

              {/* Analysis Modules Card */}
              <Card>
              <SectionHeader title="Analysis Modules" subtitle="Run AI-powered forensic analysis" icon="⚡" action={
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  id="btn-run-all"
                  onClick={() => {
                    if (selected?.file_type === 'image') runAnalysis('image_forensics');
                    else if (selected?.file_type === 'video') runAnalysis('deepfake_detection');
                    else runAnalysis('log_analysis');
                  }}
                  disabled={analyzing}
                  className="btn-cyber btn-primary text-sm"
                >
                  {analyzing ? <Spinner size="sm" /> : '🚀'} Run Default Module
                </motion.button>
              } />

              {/* Module cards */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                {[
                  { name:'Image Forensics', icon:'🖼️', color:'#3b82f6', desc:'ELA, metadata, clone detection' },
                  { name:'Deepfake AI',     icon:'🤖', color:'#8b5cf6', desc:'GAN fingerprint, facial analysis' },
                  { name:'Log Analysis',    icon:'📋', color:'#10b981', desc:'Anomaly detection, timeline' },
                ].map(m => (
                  <motion.div
                    key={m.name}
                    whileHover={{ scale: 1.03, y: -2 }}
                    transition={{ duration: 0.25 }}
                    className="glass p-4 text-center cursor-default"
                    style={{ borderColor: `${m.color}15` }}
                  >
                    <motion.div
                      whileHover={{ scale: 1.15, rotate: 5 }}
                      className="text-2xl mb-2"
                    >
                      {m.icon}
                    </motion.div>
                    <p className="text-xs font-semibold text-navy-200 font-display">{m.name}</p>
                    <p className="text-[10px] text-navy-400 mt-1">{m.desc}</p>
                  </motion.div>
                ))}
              </div>

              {analyzing && (
                <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} className="flex flex-col items-center gap-4 py-12">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full border-2 border-accent-400/15 border-t-accent-400 animate-spin" />
                    <div className="absolute inset-2 rounded-full border-2 border-purple-400/15 border-b-purple-400 animate-spin" style={{ animationDirection:'reverse', animationDuration:'0.8s' }} />
                  </div>
                  <p className="text-sm text-navy-300 font-display">Running forensic analysis pipeline...</p>
                  <div className="flex gap-3 text-xs text-navy-500">
                    {['ELA','Metadata','Deepfake','Integrity'].map((s,i) => (
                      <motion.span key={s} animate={{ color: ['#4A5568','#DC2626','#4A5568'] }} transition={{ delay: i * 0.4, duration:1.2, repeat:Infinity }}>
                        {s}
                      </motion.span>
                    ))}
                  </div>
                </motion.div>
              )}

              {selected?.analysis && !analyzing && (
                <motion.div
                  initial={{ opacity:0, y:12 }}
                  animate={{ opacity:1, y:0 }}
                  transition={{ duration: 0.45 }}
                  className="space-y-4"
                >
                  <RiskMeter score={selected.analysis.risk_score} />
                  <div className="glass p-4 rounded-xl">
                    <p className="text-xs text-navy-400 mb-1.5 font-semibold">Summary</p>
                    <p className="text-sm text-navy-200 leading-relaxed">{selected.analysis.result.summary}</p>
                  </div>
                  <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-2">
                    {selected.analysis.result.findings?.map((f: Finding, i: number) => (
                      <motion.div
                        key={i}
                        variants={itemVariants}
                        className="flex items-center gap-3 p-3.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
                      >
                        <RiskBadge level={f.severity} />
                        <div className="flex-1">
                          <p className="text-xs font-semibold text-navy-200">{f.category}</p>
                          <p className="text-[11px] text-navy-300 mt-0.5">{f.description}</p>
                        </div>
                        <span className="mono text-xs text-accent-400 font-medium">{f.value}</span>
                      </motion.div>
                    ))}
                  </motion.div>
                  <div className="p-3.5 rounded-xl bg-accent-500/5 border border-accent-500/12 text-xs text-navy-200">
                    🧠 <strong className="text-accent-400">AI Recommendation:</strong> {selected.analysis.result.recommendation}
                  </div>
                </motion.div>
              )}
            </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
