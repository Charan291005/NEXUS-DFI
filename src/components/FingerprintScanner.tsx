/**
 * FingerprintScanner — Biometric scan animation shown on login submit.
 * Displays an animated fingerprint SVG with scanning laser and scan result text.
 */

import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import gsap from 'gsap';

interface FingerprintScannerProps {
  scanning: boolean;
  success: boolean;
  onDismiss: () => void;
}

export default function FingerprintScanner({ scanning, success, onDismiss }: FingerprintScannerProps) {
  const laserRef = useRef<HTMLDivElement>(null);
  const ringsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!scanning) return;

    // Animate the scan laser up and down
    if (laserRef.current) {
      gsap.killTweensOf(laserRef.current);
      gsap.fromTo(laserRef.current,
        { top: '0%' },
        { top: '100%', duration: 1.4, ease: 'sine.inOut', repeat: -1, yoyo: true }
      );
    }

    // Animate outer rings
    if (ringsRef.current) {
      const rings = ringsRef.current.querySelectorAll('.fp-ring');
      rings.forEach((ring, i) => {
        gsap.to(ring, {
          scale: 1.06,
          opacity: 0.3 + i * 0.1,
          duration: 1 + i * 0.3,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
          delay: i * 0.2,
        });
      });
    }

    return () => {
      if (laserRef.current) gsap.killTweensOf(laserRef.current);
    };
  }, [scanning]);

  useEffect(() => {
    if (success && laserRef.current) {
      gsap.killTweensOf(laserRef.current);
    }
  }, [success]);

  return (
    <AnimatePresence>
      {(scanning || success) && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: -20 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 200,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(20px)',
          }}
          onClick={success ? onDismiss : undefined}
        >
          <div style={{ textAlign: 'center', position: 'relative' }}>
            {/* Outer decorative rings */}
            <div ref={ringsRef} style={{ position: 'absolute', inset: '-60px', pointerEvents: 'none' }}>
              {[1, 2, 3].map(i => (
                <div
                  key={i}
                  className="fp-ring"
                  style={{
                    position: 'absolute',
                    inset: `${i * 15}px`,
                    borderRadius: '50%',
                    border: `1px solid rgba(26,47,251,${0.15 + i * 0.05})`,
                  }}
                />
              ))}
            </div>

            {/* Fingerprint container */}
            <div
              style={{
                position: 'relative',
                width: '160px',
                height: '160px',
                margin: '0 auto 24px',
                borderRadius: '24px',
                border: `1px solid ${success ? 'rgba(34,197,94,0.4)' : 'rgba(26,47,251,0.3)'}`,
                background: 'rgba(5,8,16,0.9)',
                overflow: 'hidden',
                transition: 'border-color 0.5s ease',
                boxShadow: success
                  ? '0 0 40px rgba(34,197,94,0.2), 0 0 80px rgba(34,197,94,0.05)'
                  : '0 0 40px rgba(26,47,251,0.2), 0 0 80px rgba(26,47,251,0.05)',
              }}
            >
              {/* Fingerprint SVG */}
              <svg
                viewBox="0 0 100 100"
                style={{ width: '100%', height: '100%', padding: '16px' }}
              >
                {/* Fingerprint ridges */}
                {[6, 12, 18, 24, 30, 36, 42].map((r, i) => (
                  <ellipse
                    key={i}
                    cx="50" cy="54"
                    rx={r} ry={r * 0.85}
                    fill="none"
                    stroke={success ? 'rgba(34,197,94,0.6)' : `rgba(26,47,251,${0.3 + i * 0.05})`}
                    strokeWidth="1"
                    style={{ transition: 'stroke 0.5s ease' }}
                  />
                ))}
                {/* Core whorl */}
                <circle cx="50" cy="54" r="3" fill={success ? '#22C55E' : '#1a2ffb'} style={{ transition: 'fill 0.5s ease' }} />
                {/* Arch lines at bottom */}
                {[-20, -10, 0, 10, 20].map((offset, i) => (
                  <line
                    key={i}
                    x1={50 + offset - 5}
                    y1="80"
                    x2={50 + offset + 5}
                    y2="80"
                    stroke={success ? 'rgba(34,197,94,0.4)' : 'rgba(26,47,251,0.3)'}
                    strokeWidth="0.8"
                    style={{ transition: 'stroke 0.5s ease' }}
                  />
                ))}
              </svg>

              {/* Scanning laser */}
              {!success && (
                <div
                  ref={laserRef}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '2px',
                    background: 'linear-gradient(90deg, transparent, #1a2ffb, transparent)',
                    boxShadow: '0 0 12px rgba(26,47,251,0.8)',
                  }}
                />
              )}

              {/* Success checkmark overlay */}
              {success && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'rgba(34,197,94,0.08)',
                  }}
                >
                  <motion.div
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    style={{ fontSize: '40px' }}
                  >
                    ✓
                  </motion.div>
                </motion.div>
              )}
            </div>

            {/* Status text */}
            <AnimatePresence mode="wait">
              <motion.div
                key={success ? 'success' : 'scanning'}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <p style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: '11px',
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  color: success ? '#22C55E' : '#1a2ffb',
                  marginBottom: '6px',
                }}>
                  {success ? '[ ACCESS GRANTED ]' : '[ SCANNING IDENTITY ]'}
                </p>
                <p style={{
                  fontSize: '12px',
                  color: '#4a4d5c',
                  fontFamily: "'IBM Plex Mono', monospace",
                }}>
                  {success ? 'Click anywhere to continue' : 'Verifying credentials...'}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
