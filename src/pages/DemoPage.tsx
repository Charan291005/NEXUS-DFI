import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiDatabase, FiCpu, FiShield, FiFileText, FiHash, FiCheckCircle } from 'react-icons/fi';
import CustomCursor from '../components/CustomCursor';
import ParticleCanvas from '../components/ParticleCanvas';

// ── Types & Data ─────────────────────────────────────────────────────────────

type SimulationStep = 'idle' | 'upload' | 'hashing' | 'ledger' | 'analysis' | 'complete';

interface CaseDef {
  id: string;
  title: string;
  year: number;
  type: string;
  description: string;
  filename: string;
  filetype: string;
  hash: string;
  ledgerNode: string;
  analysisFindings: string[];
  themeColor: string;
}

const REAL_WORLD_CASES: CaseDef[] = [
  {
    id: 'silk-road',
    title: 'Silk Road Server Seizure',
    year: 2013,
    type: 'Cryptocurrency Tracing',
    description: 'Trace illicit Bitcoin transactions across the blockchain and analyze server logs to identify the master ledger.',
    filename: 'server_ledger_dump_2013.db',
    filetype: 'SQLite Database',
    hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    ledgerNode: 'Node-BTC-0x4F92A',
    analysisFindings: [
      'Found 14,000+ unregistered transactions.',
      'Identified wallet address cluster associated with DPR.',
      'Cross-referenced IP logs with Tor exit nodes.'
    ],
    themeColor: '#F59E0B' // Amber
  },
  {
    id: 'solarwinds',
    title: 'SolarWinds Supply Chain',
    year: 2020,
    type: 'Advanced Persistent Threat (APT)',
    description: 'Verify the hash of a compromised DLL and check it against global threat intelligence ledgers to detect the SUNBURST backdoor.',
    filename: 'SolarWinds.Orion.Core.BusinessLayer.dll',
    filetype: 'Windows PE32 Executable',
    hash: 'ce77d116a074dab7a22530ab4a6a5e6d252b128ff5e4b6d3b1dd82500c72b21c',
    ledgerNode: 'ThreatIntel-Global-Hash-Registry',
    analysisFindings: [
      'Signature mismatch detected in digital certificate.',
      'Obfuscated HTTP backdoor identified in initialization routine.',
      'DGA (Domain Generation Algorithm) traffic patterns logged.'
    ],
    themeColor: '#DC2626' // Red
  },
  {
    id: 'enron',
    title: 'Enron Corporation Scandal',
    year: 2001,
    type: 'Corporate Fraud Forensics',
    description: 'Perform metadata extraction and keyword sweeping on massive seized email archives to uncover financial fraud.',
    filename: 'skilling_j_archive.pst',
    filetype: 'Outlook Personal Storage Table',
    hash: '9d660e5db999e4f4fb0a426bfb776269b3dc32cff524e94112e4d075f8f8b894',
    ledgerNode: 'Corporate-Compliance-Archive',
    analysisFindings: [
      'Extracted 42,000+ emails from fragmented PST.',
      'Flagged keywords: "Raptor", "Chewco", "Off-balance sheet".',
      'Detected intentional deletion of 3,200 emails prior to subpoena.'
    ],
    themeColor: '#3B82F6' // Blue
  }
];

// ── Components ─────────────────────────────────────────────────────────────

function GlitchText({ text, color }: { text: string; color: string }) {
  const [glitch, setGlitch] = useState(text);
  useEffect(() => {
    const chars = '!<>-_\\\\/[]{}—=+*^?#_';
    let frame = 0;
    const interval = setInterval(() => {
      frame++;
      if (frame > 10) {
        setGlitch(text);
        clearInterval(interval);
      } else {
        setGlitch(text.split('').map(c => Math.random() > 0.5 ? chars[Math.floor(Math.random() * chars.length)] : c).join(''));
      }
    }, 40);
    return () => clearInterval(interval);
  }, [text]);
  return <span style={{ color, fontFamily: "'IBM Plex Mono', monospace" }}>{glitch}</span>;
}

export default function DemoPage() {
  const navigate = useNavigate();
  const [selectedCase, setSelectedCase] = useState<CaseDef | null>(null);
  const [step, setStep] = useState<SimulationStep>('idle');
  const [progress, setProgress] = useState(0);
  const [isSimulating, setIsSimulating] = useState(false);

  const runStep = () => {
    if (isSimulating || progress === 100) return;
    setIsSimulating(true);
    setProgress(0);
    
    let current = 0;
    const speed = step === 'hashing' ? 3 : step === 'ledger' ? 2 : 1;
    
    const interval = setInterval(() => {
      current += speed;
      if (current >= 100) {
        setProgress(100);
        setIsSimulating(false);
        clearInterval(interval);
      } else {
        setProgress(current);
      }
    }, 50);
  };

  const nextStep = () => {
    setProgress(0);
    if (step === 'upload') setStep('hashing');
    else if (step === 'hashing') setStep('ledger');
    else if (step === 'ledger') setStep('analysis');
    else if (step === 'analysis') setStep('complete');
  };

  const reset = () => {
    setSelectedCase(null);
    setStep('idle');
    setProgress(0);
  };

  return (
    <div style={{ position: 'relative', width: '100vw', minHeight: '100vh', background: '#020208', overflow: 'hidden', color: '#fff' }}>
      <ParticleCanvas />
      <CustomCursor />

      {/* Top Nav */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: '24px', zIndex: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button 
          onClick={() => navigate('/login')}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '8px 16px', borderRadius: '100px', cursor: 'pointer', color: '#fff', fontSize: '13px' }}
        >
          <FiArrowLeft /> Back to Portal
        </button>
        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '12px', color: '#1a2ffb', border: '1px solid #1a2ffb', padding: '4px 12px', borderRadius: '4px', letterSpacing: '0.1em' }}>
          INTERACTIVE DEMO MODE
        </div>
      </div>

      <div style={{ position: 'relative', zIndex: 5, padding: '100px 24px', maxWidth: '1200px', margin: '0 auto', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        
        <AnimatePresence mode="wait">
          {/* ── CASE SELECTION ── */}
          {!selectedCase && (
            <motion.div
              key="selection"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
            >
              <h1 style={{ fontSize: '3rem', fontWeight: 800, marginBottom: '16px', textAlign: 'center' }}>
                Simulate <span style={{ color: '#1a2ffb' }}>Real-World</span> Investigations
              </h1>
              <p style={{ color: '#7a7d8e', marginBottom: '48px', textAlign: 'center', maxWidth: '600px', fontSize: '1.1rem' }}>
                Select a historical case file below to walk through the NexusDFI forensic pipeline. Experience how evidence is cryptographically hashed, verified on the ledger, and analyzed by AI.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', width: '100%' }}>
                {REAL_WORLD_CASES.map((c, i) => (
                  <motion.div
                    key={c.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    onClick={() => { setSelectedCase(c); setStep('upload'); }}
                    whileHover={{ y: -5, borderColor: c.themeColor, boxShadow: `0 10px 30px -10px ${c.themeColor}` }}
                    style={{
                      background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
                      padding: '24px', borderRadius: '16px', cursor: 'pointer', position: 'relative', overflow: 'hidden'
                    }}
                  >
                    <div style={{ position: 'absolute', top: 0, right: 0, background: c.themeColor, color: '#000', padding: '4px 12px', fontSize: '11px', fontWeight: 700, borderBottomLeftRadius: '16px', fontFamily: "'IBM Plex Mono', monospace" }}>
                      {c.year}
                    </div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '8px', color: '#fff' }}>{c.title}</h3>
                    <div style={{ fontSize: '11px', color: c.themeColor, fontFamily: "'IBM Plex Mono', monospace", marginBottom: '16px', textTransform: 'uppercase' }}>
                      {c.type}
                    </div>
                    <p style={{ fontSize: '0.9rem', color: '#7a7d8e', lineHeight: 1.6, marginBottom: '24px' }}>
                      {c.description}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#b0b3c0' }}>
                      <FiDatabase /> {c.filename}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ── SIMULATION PIPELINE ── */}
          {selectedCase && (
            <motion.div
              key="simulation"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
            >
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '24px' }}>
                <div>
                  <h2 style={{ fontSize: '2rem', fontWeight: 700, color: '#fff' }}>{selectedCase.title}</h2>
                  <p style={{ color: '#7a7d8e', fontFamily: "'IBM Plex Mono', monospace", fontSize: '13px', marginTop: '4px' }}>TARGET: {selectedCase.filename}</p>
                </div>
                <button onClick={reset} style={{ background: 'transparent', color: '#7a7d8e', border: '1px solid rgba(255,255,255,0.1)', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer' }}>
                  Abort Simulation
                </button>
              </div>

              {/* Main Canvas */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '32px', flex: 1 }}>
                
                {/* Left: Visualization */}
                <div style={{ background: 'rgba(0,0,0,0.4)', border: `1px solid ${selectedCase.themeColor}30`, borderRadius: '16px', padding: '32px 32px 100px 32px', minHeight: '450px', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  
                  {/* Scan Line Overlay */}
                  {step !== 'complete' && (
                    <motion.div
                      animate={{ top: ['0%', '100%'] }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                      style={{ position: 'absolute', left: 0, right: 0, height: '4px', background: `linear-gradient(90deg, transparent, ${selectedCase.themeColor}, transparent)`, opacity: 0.5, zIndex: 10, boxShadow: `0 0 20px ${selectedCase.themeColor}` }}
                    />
                  )}

                  <AnimatePresence mode="wait">
                    {/* Upload View */}
                    {step === 'upload' && (
                      <motion.div key="upload" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 0.9 }} style={{ textAlign: 'center' }}>
                        <FiDatabase size={64} color={selectedCase.themeColor} style={{ margin: '0 auto 24px' }} />
                        <h3 style={{ fontSize: '24px', marginBottom: '8px' }}>Acquiring Evidence Image</h3>
                        <p style={{ color: '#7a7d8e', fontFamily: "'IBM Plex Mono', monospace" }}>Reading {selectedCase.filename}...</p>
                      </motion.div>
                    )}

                    {/* Hashing View */}
                    {step === 'hashing' && (
                      <motion.div key="hash" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 0.9 }} style={{ textAlign: 'center', width: '100%' }}>
                        <FiHash size={64} color={selectedCase.themeColor} style={{ margin: '0 auto 24px' }} />
                        <h3 style={{ fontSize: '24px', marginBottom: '8px' }}>Computing SHA-256 Checksum</h3>
                        <div style={{ background: '#000', padding: '16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', marginTop: '16px', overflow: 'hidden' }}>
                          <p style={{ fontFamily: "'IBM Plex Mono', monospace", color: selectedCase.themeColor, wordBreak: 'break-all', fontSize: '18px' }}>
                            {progress < 100 ? (
                              <GlitchText text={selectedCase.hash} color={selectedCase.themeColor} />
                            ) : selectedCase.hash}
                          </p>
                        </div>
                      </motion.div>
                    )}

                    {/* Ledger View */}
                    {step === 'ledger' && (
                      <motion.div key="ledger" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 0.9 }} style={{ textAlign: 'center' }}>
                        <FiShield size={64} color={selectedCase.themeColor} style={{ margin: '0 auto 24px' }} />
                        <h3 style={{ fontSize: '24px', marginBottom: '8px' }}>Immutable Ledger Verification</h3>
                        <p style={{ color: '#7a7d8e', fontFamily: "'IBM Plex Mono', monospace" }}>Querying Node: {selectedCase.ledgerNode}</p>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', marginTop: '32px' }}>
                          <div style={{ padding: '12px 24px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>Local Hash</div>
                          <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1 }}>↔</motion.div>
                          <div style={{ padding: '12px 24px', background: `${selectedCase.themeColor}20`, borderRadius: '8px', border: `1px solid ${selectedCase.themeColor}` }}>Ledger Hash</div>
                        </div>
                        {progress > 80 && (
                          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ color: '#22C55E', fontWeight: 700, marginTop: '24px', fontSize: '18px' }}>
                            ✓ VERIFIED SECURE
                          </motion.div>
                        )}
                      </motion.div>
                    )}

                    {/* Analysis View */}
                    {step === 'analysis' && (
                      <motion.div key="analysis" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 0.9 }} style={{ textAlign: 'center' }}>
                        <FiCpu size={64} color={selectedCase.themeColor} style={{ margin: '0 auto 24px' }} />
                        <h3 style={{ fontSize: '24px', marginBottom: '8px' }}>AI Forensic Scan</h3>
                        <p style={{ color: '#7a7d8e', fontFamily: "'IBM Plex Mono', monospace" }}>Deep learning engine active...</p>
                        
                        {/* Fake code scroll */}
                        <div style={{ width: '100%', height: '100px', background: '#000', borderRadius: '8px', marginTop: '24px', padding: '12px', textAlign: 'left', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
                           {Array.from({ length: 5 }).map((_, i) => (
                             <motion.div
                               key={i}
                               initial={{ opacity: 0, x: -20 }}
                               animate={{ opacity: progress > i * 20 ? 1 : 0, x: 0 }}
                               style={{ fontFamily: "'IBM Plex Mono', monospace", color: '#4a4d5c', fontSize: '10px', marginBottom: '4px' }}
                             >
                               [SYS] Scanning sector {Math.floor(Math.random() * 9999)}... {Math.random() > 0.8 ? 'ANOMALY DETECTED' : 'CLEAN'}
                             </motion.div>
                           ))}
                        </div>
                      </motion.div>
                    )}

                    {/* Complete View */}
                    {step === 'complete' && (
                      <motion.div key="complete" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} style={{ textAlign: 'center' }}>
                        <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: `${selectedCase.themeColor}20`, border: `2px solid ${selectedCase.themeColor}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', color: selectedCase.themeColor }}>
                          <FiCheckCircle size={40} />
                        </div>
                        <h3 style={{ fontSize: '32px', marginBottom: '8px', color: selectedCase.themeColor }}>Analysis Complete</h3>
                        <p style={{ color: '#7a7d8e', fontSize: '18px' }}>Simulation finished successfully.</p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Manual Controls */}
                  {step !== 'complete' && (
                    <div style={{ position: 'absolute', bottom: '32px', display: 'flex', gap: '16px', zIndex: 20 }}>
                      {progress < 100 ? (
                        <button
                          onClick={runStep}
                          disabled={isSimulating}
                          style={{
                            background: isSimulating ? 'rgba(255,255,255,0.05)' : `${selectedCase.themeColor}20`,
                            border: `1px solid ${isSimulating ? 'rgba(255,255,255,0.1)' : selectedCase.themeColor}`,
                            color: isSimulating ? '#7a7d8e' : selectedCase.themeColor,
                            padding: '12px 24px', borderRadius: '100px', cursor: isSimulating ? 'not-allowed' : 'pointer',
                            fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', fontSize: '12px',
                            transition: 'all 0.3s'
                          }}
                        >
                          {isSimulating ? `EXECUTING... ${progress}%` : `EXECUTE PHASE: ${step.toUpperCase()}`}
                        </button>
                      ) : (
                        <motion.button
                          initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                          onClick={nextStep}
                          style={{
                            background: selectedCase.themeColor, color: '#000',
                            border: 'none', padding: '12px 24px', borderRadius: '100px', cursor: 'pointer',
                            fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', fontSize: '12px',
                            boxShadow: `0 0 20px ${selectedCase.themeColor}40`
                          }}
                        >
                          PROCEED TO NEXT PHASE →
                        </motion.button>
                      )}
                    </div>
                  )}
                </div>

                {/* Right: Progress Tracker & Report */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  
                  {/* Step Tracker */}
                  <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', padding: '24px' }}>
                    <h4 style={{ fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '24px', color: '#7a7d8e', fontWeight: 600 }}>Simulation Pipeline</h4>
                    
                    {[
                      { id: 'upload', icon: FiDatabase, label: 'Evidence Acquisition' },
                      { id: 'hashing', icon: FiHash, label: 'Cryptographic Hashing' },
                      { id: 'ledger', icon: FiShield, label: 'Ledger Verification' },
                      { id: 'analysis', icon: FiCpu, label: 'AI Forensic Scan' },
                    ].map((s, i) => {
                      const isActive = step === s.id;
                      const isPast = ['upload', 'hashing', 'ledger', 'analysis', 'complete'].indexOf(step) > i;
                      const color = isActive ? selectedCase.themeColor : isPast ? '#22C55E' : '#4a4d5c';
                      
                      return (
                        <div key={s.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: i === 3 ? 0 : '24px' }}>
                           <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: isActive ? `${color}20` : 'transparent', border: `1px solid ${color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color, transition: 'all 0.3s ease' }}>
                             <s.icon size={14} />
                           </div>
                           <div style={{ flex: 1 }}>
                             <p style={{ color: isActive || isPast ? '#fff' : '#7a7d8e', fontWeight: isActive ? 600 : 400, fontSize: '14px' }}>{s.label}</p>
                             {isActive && (
                               <div style={{ height: '2px', background: 'rgba(255,255,255,0.1)', marginTop: '8px', borderRadius: '2px', overflow: 'hidden' }}>
                                 <div style={{ height: '100%', width: `${progress}%`, background: color, transition: 'width 0.1s linear' }} />
                               </div>
                             )}
                           </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* Generated Report (appears at end) */}
                  <AnimatePresence>
                    {step === 'complete' && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        style={{ background: 'rgba(26,47,251,0.05)', border: '1px solid rgba(26,47,251,0.2)', borderRadius: '16px', padding: '24px' }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#1a2ffb', marginBottom: '16px' }}>
                          <FiFileText size={20} />
                          <h4 style={{ fontWeight: 700 }}>Forensic Findings</h4>
                        </div>
                        <ul style={{ paddingLeft: '20px', margin: 0, color: '#f0f1fa', fontSize: '13px', lineHeight: 1.6 }}>
                          {selectedCase.analysisFindings.map((finding, idx) => (
                            <motion.li key={idx} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + idx * 0.1 }} style={{ marginBottom: '8px' }}>
                              {finding}
                            </motion.li>
                          ))}
                        </ul>
                      </motion.div>
                    )}
                  </AnimatePresence>

                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
