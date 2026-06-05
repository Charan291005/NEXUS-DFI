import { useState } from 'react';
import { motion } from 'framer-motion';
import { PageHeader, Card, SectionHeader, RiskMeter, RiskBadge, Spinner } from '../components/ui';

const MOCK_EVIDENCE = [
  { id:1, filename:'suspect_image_001.jpg', type:'image' },
  { id:2, filename:'deepfake_video.mp4',    type:'video' },
  { id:3, filename:'server_access.log',     type:'log'   },
];

export default function EvidencePage() {
  const [selected, setSelected]   = useState<number | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult]       = useState<any>(null);

  const runAll = async () => {
    setAnalyzing(true);
    setResult(null);
    await new Promise(r => setTimeout(r, 2000));
    setResult({
      risk_score: 82,
      module: 'image_forensics',
      result: {
        summary: 'Comprehensive analysis complete. High-confidence tampering detected.',
        findings: [
          { category:'ELA',            severity:'High',     description:'Compression artifacts indicate digital manipulation', value:'82%' },
          { category:'Metadata',       severity:'Medium',   description:'Timestamp inconsistency between EXIF and file system',value:'Δ 2h' },
          { category:'Steganography',  severity:'Low',      description:'No hidden data detected in image LSB',               value:'Clean' },
        ],
        recommendation: 'Submit to forensics lab for court-admissible verification.',
      }
    });
    setAnalyzing(false);
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Evidence Management" subtitle="All uploaded forensic evidence across cases" icon="🔍" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Evidence list */}
        <div className="space-y-3">
          <p className="label-cyber">Evidence Files</p>
          {MOCK_EVIDENCE.map(ev => (
            <motion.div
              key={ev.id}
              whileHover={{ x: 4 }}
              onClick={() => { setSelected(ev.id); setResult(null); }}
              className={`glass p-4 cursor-pointer transition-colors ${selected === ev.id ? 'border-glow' : ''}`}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{ev.type === 'image' ? '🖼️' : ev.type === 'video' ? '🎬' : '📋'}</span>
                <div>
                  <p className="text-sm text-navy-100 font-medium">{ev.filename}</p>
                  <p className="text-xs text-navy-400 capitalize">{ev.type}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Analysis panel */}
        <div className="lg:col-span-2">
          {!selected ? (
            <Card className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="text-4xl mb-3">🔍</div>
                <p className="text-navy-300">Select an evidence file to run analysis</p>
              </div>
            </Card>
          ) : (
            <Card>
              <SectionHeader title="Analysis Modules" subtitle="Run AI-powered forensic analysis" icon="⚡" action={
                <button id="btn-run-all" onClick={() => runAll()} disabled={analyzing} className="btn-cyber btn-primary text-sm">
                  {analyzing ? <Spinner size="sm" /> : '🚀'} Run All Modules
                </button>
              } />

              {/* Module cards */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                {[
                  { name:'Image Forensics', icon:'🖼️', color:'#00d4ff', desc:'ELA, metadata, clone detection' },
                  { name:'Deepfake AI',     icon:'🤖', color:'#7b2fff', desc:'GAN fingerprint, facial analysis' },
                  { name:'Log Analysis',    icon:'📋', color:'#00ff88', desc:'Anomaly detection, timeline' },
                ].map(m => (
                  <div key={m.name} className="glass p-3 text-center" style={{ borderColor: `${m.color}20` }}>
                    <div className="text-2xl mb-2">{m.icon}</div>
                    <p className="text-xs font-semibold text-navy-200">{m.name}</p>
                    <p className="text-[10px] text-navy-400 mt-1">{m.desc}</p>
                  </div>
                ))}
              </div>

              {analyzing && (
                <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} className="flex flex-col items-center gap-4 py-12">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full border-2 border-accent-400/20 border-t-accent-400 animate-spin" />
                    <div className="absolute inset-2 rounded-full border-2 border-purple-400/20 border-b-purple-400 animate-spin" style={{ animationDirection:'reverse', animationDuration:'0.8s' }} />
                  </div>
                  <p className="text-sm text-navy-300">Running forensic analysis pipeline...</p>
                  <div className="flex gap-2 text-xs text-navy-500">
                    {['ELA','Metadata','Deepfake','Integrity'].map((s,i) => (
                      <motion.span key={s} animate={{ color: ['#3d4f6f','#4f6ef7','#3d4f6f'] }} transition={{ delay: i * 0.4, duration:1.2, repeat:Infinity }}>
                        {s}
                      </motion.span>
                    ))}
                  </div>
                </motion.div>
              )}

              {result && !analyzing && (
                <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} className="space-y-4">
                  <RiskMeter score={result.risk_score} />
                  <div className="glass p-3 rounded-xl">
                    <p className="text-xs text-navy-400 mb-1">Summary</p>
                    <p className="text-sm text-navy-200">{result.result.summary}</p>
                  </div>
                  <div className="space-y-2">
                    {result.result.findings.map((f: any, i: number) => (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02]">
                        <RiskBadge level={f.severity} />
                        <div className="flex-1">
                          <p className="text-xs font-semibold text-navy-200">{f.category}</p>
                          <p className="text-[11px] text-navy-300">{f.description}</p>
                        </div>
                        <span className="mono text-xs text-accent-400">{f.value}</span>
                      </div>
                    ))}
                  </div>
                  <div className="p-3 rounded-xl bg-accent-500/5 border border-accent-500/15 text-xs text-navy-200">
                    🧠 <strong className="text-accent-400">AI Recommendation:</strong> {result.result.recommendation}
                  </div>
                </motion.div>
              )}
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
