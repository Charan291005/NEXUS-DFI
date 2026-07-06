/**
 * TerminalLog — Animated forensic boot log shown on the LoginPage left panel.
 * Streams realistic system boot messages line by line.
 */

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

const BOOT_LINES = [
  { text: '> NEXUSDFI FORENSIC OS v4.0 BOOT SEQUENCE', color: '#c1ff00', delay: 0 },
  { text: '> Initializing secure enclave...', color: '#4a4d5c', delay: 300 },
  { text: '  [OK] TPM 2.0 trusted module loaded', color: '#22C55E', delay: 700 },
  { text: '  [OK] AES-256 encryption layer active', color: '#22C55E', delay: 1100 },
  { text: '> Loading AI forensics engine...', color: '#4a4d5c', delay: 1500 },
  { text: '  [OK] Gemini-2.5 Pro neural network: READY', color: '#22C55E', delay: 1900 },
  { text: '  [OK] ELA image pipeline: CALIBRATED', color: '#22C55E', delay: 2200 },
  { text: '  [OK] Deepfake GAN detector: v3.1 LOADED', color: '#22C55E', delay: 2500 },
  { text: '> Verifying chain-of-custody protocols...', color: '#4a4d5c', delay: 2900 },
  { text: '  [OK] SHA-256 hash verification: ACTIVE', color: '#22C55E', delay: 3200 },
  { text: '  [OK] EXIF metadata scanner: ONLINE', color: '#22C55E', delay: 3500 },
  { text: '> Connecting to threat intelligence feeds...', color: '#4a4d5c', delay: 3900 },
  { text: '  [!!] CVE-2024-7291 PATCH APPLIED', color: '#F59E0B', delay: 4300 },
  { text: '  [OK] MITRE ATT&CK feed: SYNCED', color: '#22C55E', delay: 4700 },
  { text: '> All systems nominal. Access granted.', color: '#1a2ffb', delay: 5200 },
  { text: '─────────────────────────────────────────────', color: '#1e2d4a', delay: 5500 },
  { text: '  NEXUSDFI SECURE PORTAL READY', color: '#c1ff00', delay: 5700 },
];

interface TerminalLogProps {
  isReady: boolean;
}

export default function TerminalLog({ isReady }: TerminalLogProps) {
  const [visibleLines, setVisibleLines] = useState<number[]>([]);
  const [typedText, setTypedText] = useState<Record<number, string>>({});
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isReady) return;
    const timers: ReturnType<typeof setTimeout>[] = [];

    BOOT_LINES.forEach((line, i) => {
      const t = setTimeout(() => {
        setVisibleLines(prev => [...prev, i]);
        // Type each character
        let charIdx = 0;
        const typeInterval = setInterval(() => {
          charIdx++;
          setTypedText(prev => ({ ...prev, [i]: line.text.slice(0, charIdx) }));
          if (charIdx >= line.text.length) clearInterval(typeInterval);
        }, 18);

        // Scroll to bottom
        if (containerRef.current) {
          setTimeout(() => {
            if (containerRef.current) {
              containerRef.current.scrollTop = containerRef.current.scrollHeight;
            }
          }, 20);
        }
      }, line.delay);
      timers.push(t);
    });

    return () => timers.forEach(clearTimeout);
  }, [isReady]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={isReady ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: 0.3 }}
      style={{
        position: 'relative',
        background: 'rgba(0,0,0,0.5)',
        border: '1px solid rgba(26,47,251,0.15)',
        borderRadius: '12px',
        padding: '16px',
        overflow: 'hidden',
        maxHeight: '200px',
        backdropFilter: 'blur(10px)',
      }}
    >
      {/* Scanline overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.08) 2px, rgba(0,0,0,0.08) 4px)`,
          pointerEvents: 'none',
          zIndex: 1,
          borderRadius: '12px',
        }}
      />

      {/* Corner label */}
      <div
        style={{
          position: 'absolute',
          top: '8px',
          right: '12px',
          fontSize: '9px',
          color: '#22222e',
          fontFamily: "'IBM Plex Mono', monospace",
          letterSpacing: '0.1em',
          zIndex: 2,
        }}
      >
        SYS.LOG
      </div>

      {/* Terminal lines */}
      <div
        ref={containerRef}
        style={{
          overflowY: 'auto',
          maxHeight: '170px',
          position: 'relative',
          zIndex: 2,
          scrollbarWidth: 'none',
        }}
      >
        {visibleLines.map(i => (
          <div
            key={i}
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: '10px',
              lineHeight: '1.7',
              color: BOOT_LINES[i].color,
              whiteSpace: 'pre',
              letterSpacing: '0.02em',
            }}
          >
            {typedText[i] || ''}{i === Math.max(...visibleLines) && typedText[i]?.length < BOOT_LINES[i].text.length && (
              <span style={{ animation: 'blink 0.8s step-end infinite', color: '#c1ff00' }}>█</span>
            )}
          </div>
        ))}
      </div>

      <style>{`
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
      `}</style>
    </motion.div>
  );
}
