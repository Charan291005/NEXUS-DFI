import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiGrid, FiFolder, FiShield, FiClock, FiFileText,
  FiCpu, FiTarget, FiBookOpen, FiUser, FiSearch, FiCommand
} from 'react-icons/fi';

interface CommandItem {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  shortcut?: string;
  action: () => void;
  keywords: string[];
}

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const go = useCallback((path: string) => {
    navigate(path);
    setOpen(false);
  }, [navigate]);

  const commands: CommandItem[] = useMemo(() => [
    { id: 'dashboard', label: 'Dashboard', description: 'Overview & analytics', icon: <FiGrid />, shortcut: '⌘1', action: () => go('/dashboard'), keywords: ['home', 'overview', 'stats', 'analytics'] },
    { id: 'cases', label: 'Case Management', description: 'Track investigations', icon: <FiFolder />, shortcut: '⌘2', action: () => go('/cases'), keywords: ['case', 'investigation', 'manage'] },
    { id: 'evidence', label: 'Evidence Vault', description: 'Digital evidence repository', icon: <FiShield />, shortcut: '⌘3', action: () => go('/evidence'), keywords: ['evidence', 'files', 'vault', 'upload'] },
    { id: 'timeline', label: 'Timeline', description: 'Event reconstruction', icon: <FiClock />, shortcut: '⌘4', action: () => go('/timeline'), keywords: ['timeline', 'events', 'history'] },
    { id: 'reports', label: 'Reports', description: 'Generate forensic reports', icon: <FiFileText />, shortcut: '⌘5', action: () => go('/reports'), keywords: ['report', 'pdf', 'generate', 'export'] },
    { id: 'assistant', label: 'AI Assistant', description: 'Forensic analysis assistant', icon: <FiCpu />, shortcut: '⌘6', action: () => go('/assistant'), keywords: ['ai', 'assistant', 'chat', 'analysis', 'gemini'] },
    { id: 'threat-intel', label: 'Threat Intelligence', description: 'IOC analysis engine', icon: <FiTarget />, shortcut: '⌘7', action: () => go('/threat-intel'), keywords: ['threat', 'intel', 'ioc', 'indicator'] },
    { id: 'workflow', label: 'Workflow Guide', description: 'Investigation workflow', icon: <FiBookOpen />, shortcut: '⌘8', action: () => go('/guide'), keywords: ['workflow', 'guide', 'help'] },
    { id: 'profile', label: 'Profile', description: 'Account settings', icon: <FiUser />, shortcut: '⌘9', action: () => go('/profile'), keywords: ['profile', 'account', 'settings', 'user'] },
  ], [go]);

  const filtered = useMemo(() => {
    if (!query.trim()) return commands;
    const q = query.toLowerCase();
    return commands.filter(cmd =>
      cmd.label.toLowerCase().includes(q) ||
      cmd.description.toLowerCase().includes(q) ||
      cmd.keywords.some(k => k.includes(q))
    );
  }, [query, commands]);

  // Global keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(prev => !prev);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setQuery('');
       
      setActiveIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Keyboard navigation
  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(i => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && filtered[activeIndex]) {
      filtered[activeIndex].action();
    }
  };

  // Reset active index when query changes
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setActiveIndex(0); }, [query]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="cmd-overlay"
          onClick={() => setOpen(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="cmd-palette"
            onClick={e => e.stopPropagation()}
          >
            {/* Search Input */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '0 20px' }}>
              <FiSearch style={{ color: '#4a4d5c', flexShrink: 0 }} />
              <input
                ref={inputRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={handleInputKeyDown}
                className="cmd-input"
                placeholder="Search commands, navigate..."
                style={{ paddingLeft: 0 }}
              />
              <kbd style={{
                fontSize: '10px', fontFamily: "'IBM Plex Mono', monospace",
                color: '#4a4d5c', background: 'rgba(255,255,255,0.04)',
                padding: '2px 6px', borderRadius: '4px',
                border: '1px solid rgba(255,255,255,0.06)',
                flexShrink: 0,
              }}>ESC</kbd>
            </div>

            {/* Results */}
            <div style={{ maxHeight: '320px', overflowY: 'auto', padding: '8px 0' }}>
              {filtered.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', color: '#4a4d5c', fontSize: '13px' }}>
                  No results found for "{query}"
                </div>
              ) : (
                <div>
                  <p style={{
                    fontSize: '10px', fontWeight: 600, color: '#22222e',
                    textTransform: 'uppercase', letterSpacing: '0.12em',
                    padding: '8px 20px 4px', fontFamily: "'IBM Plex Mono', monospace",
                  }}>
                    Navigation
                  </p>
                  {filtered.map((cmd, i) => (
                    <div
                      key={cmd.id}
                      className={`cmd-item ${i === activeIndex ? 'active' : ''}`}
                      onClick={cmd.action}
                      onMouseEnter={() => setActiveIndex(i)}
                    >
                      <span style={{
                        width: '28px', height: '28px', borderRadius: '8px',
                        background: i === activeIndex ? 'rgba(26,47,251,0.15)' : 'rgba(255,255,255,0.04)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: i === activeIndex ? '#3d4fff' : '#7a7d8e',
                        fontSize: '14px', flexShrink: 0,
                        transition: 'all 0.15s ease',
                        border: `1px solid ${i === activeIndex ? 'rgba(26,47,251,0.2)' : 'rgba(255,255,255,0.04)'}`,
                      }}>
                        {cmd.icon}
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{
                          fontSize: '13px', fontWeight: 500,
                          color: i === activeIndex ? '#f0f1fa' : '#b0b3c0',
                        }}>{cmd.label}</p>
                        <p style={{ fontSize: '11px', color: '#4a4d5c', marginTop: '1px' }}>
                          {cmd.description}
                        </p>
                      </div>
                      {cmd.shortcut && <span className="cmd-shortcut">{cmd.shortcut}</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '8px 20px', borderTop: '1px solid rgba(255,255,255,0.04)',
              fontSize: '10px', color: '#22222e',
              fontFamily: "'IBM Plex Mono', monospace",
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <kbd style={{
                    background: 'rgba(255,255,255,0.04)', padding: '1px 4px',
                    borderRadius: '3px', border: '1px solid rgba(255,255,255,0.06)',
                  }}>↑↓</kbd> navigate
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <kbd style={{
                    background: 'rgba(255,255,255,0.04)', padding: '1px 4px',
                    borderRadius: '3px', border: '1px solid rgba(255,255,255,0.06)',
                  }}>↵</kbd> select
                </span>
              </div>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <FiCommand size={10} /> NEXUSDFI
              </span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
