import { useState, useEffect, useMemo } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import {
  FiGrid, FiFolder, FiShield, FiClock, FiFileText,
  FiCpu, FiTarget, FiBookOpen, FiLogOut, FiChevronLeft,
  FiCommand
} from 'react-icons/fi';
import AmbientCanvas from './AmbientCanvas';
import CommandPalette from './CommandPalette';

const NAV_ITEMS = [
  { to: '/dashboard',    label: 'Dashboard',    icon: FiGrid,     allowedRoles: ['Admin', 'Investigator', 'Viewer'] },
  { to: '/cases',        label: 'Cases',        icon: FiFolder,   allowedRoles: ['Admin', 'Investigator', 'Viewer'] },
  { to: '/evidence',     label: 'Evidence',     icon: FiShield,   allowedRoles: ['Admin', 'Investigator'] },
  { to: '/timeline',     label: 'Timeline',     icon: FiClock,    allowedRoles: ['Admin', 'Investigator', 'Viewer'] },
  { to: '/reports',      label: 'Reports',      icon: FiFileText, allowedRoles: ['Admin', 'Investigator', 'Viewer'] },
  { to: '/assistant',    label: 'AI Assistant', icon: FiCpu,      allowedRoles: ['Admin', 'Investigator'] },
  { to: '/threat-intel', label: 'Threat Intel', icon: FiTarget,   allowedRoles: ['Admin'] },
  { to: '/guide',        label: 'Workflow',     icon: FiBookOpen, allowedRoles: ['Admin', 'Investigator', 'Viewer'] },
];

const PAGE_TITLES: Record<string, string> = {
  '/dashboard':    'Dashboard',
  '/cases':        'Case Management',
  '/evidence':     'Evidence Management',
  '/timeline':     'Timeline Reconstruction',
  '/reports':      'Reports',
  '/assistant':    'Forensic Analysis Assistant',
  '/threat-intel': 'Threat Intelligence',
  '/profile':      'User Profile',
  '/guide':        'Investigation Workflow',
};

// ── Pulsing Live Clock ────────────────────────────────────
function LiveClock() {
  const [time, setTime] = useState(new Date());
  const [colonVisible, setColonVisible] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
      setColonVisible(v => !v);
    }, 500);
    return () => clearInterval(timer);
  }, []);

  const hms = time.toLocaleTimeString('en-IN', { hour12: false }).split(':');

  return (
    <>
      <span style={{
        fontSize: '11px', color: '#4a4d5c',
        fontFamily: "'IBM Plex Mono', monospace", letterSpacing: '0.04em',
      }}>
        {time.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
      </span>
      <div style={{ height: '16px', width: '1px', background: 'rgba(255,255,255,0.06)' }} />
      {/* Pulsing colons */}
      <span style={{
        fontSize: '11px', fontFamily: "'IBM Plex Mono', monospace",
        fontVariantNumeric: 'tabular-nums', letterSpacing: '0.04em',
        color: '#c1ff00',
        textShadow: '0 0 8px rgba(193,255,0,0.5)',
      }}>
        {hms[0]}<span style={{ opacity: colonVisible ? 1 : 0.2, transition: 'opacity 0.1s' }}>:</span>{hms[1]}<span style={{ opacity: colonVisible ? 1 : 0.2, transition: 'opacity 0.1s' }}>:</span>{hms[2]}
      </span>
    </>
  );
}

// ── Scanline sweep on route change ─────────────────────────
function RouteScanLine({ pathname }: { pathname: string }) {
  const [active, setActive] = useState(false);
  useEffect(() => {
    setActive(true);
    const t = setTimeout(() => setActive(false), 1200);
    return () => clearTimeout(t);
  }, [pathname]);

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          initial={{ top: 0, opacity: 0 }}
          animate={{ top: '100%', opacity: [0, 1, 1, 0] }}
          transition={{ duration: 1.0, ease: 'easeInOut' }}
          style={{
            position: 'fixed', left: 0, right: 0, height: '1px', zIndex: 9997,
            background: 'linear-gradient(90deg, transparent, rgba(193,255,0,0.6), rgba(26,47,251,0.8), transparent)',
            boxShadow: '0 0 12px rgba(26,47,251,0.5)',
            pointerEvents: 'none',
          }}
        />
      )}
    </AnimatePresence>
  );
}

export default function Layout() {
  const { user, logout, showTimeoutWarning } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };

  const currentPage = useMemo(() =>
    Object.entries(PAGE_TITLES).find(([path]) =>
      location.pathname.startsWith(path)
    )?.[1] ?? 'NexusDFI', [location.pathname]);

  const filteredNavItems = useMemo(() => {
    return NAV_ITEMS.filter(item => !user || item.allowedRoles.includes(user.role));
  }, [user]);

  // Page transition variants
  const pageVariants = {
    initial: { opacity: 0, y: 16, filter: 'blur(6px)' },
    animate: { opacity: 1, y: 0,  filter: 'blur(0px)' },
    exit:    { opacity: 0, y: -10, filter: 'blur(4px)' },
  };

  return (
    <div className="flex h-screen overflow-hidden page-bg noise-overlay">
      {/* ── Route Scanline ────────────────────────────────── */}
      <RouteScanLine pathname={location.pathname} />

      {/* ── Command Palette ───────────────────────────────── */}
      <CommandPalette />

      {/* ── Ambient Background ────────────────────────────── */}
      <AmbientCanvas />

      {/* ── Sidebar ───────────────────────────────────────── */}
      <motion.aside
        animate={{ width: collapsed ? 68 : 240 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="sidebar flex flex-col h-screen flex-shrink-0 overflow-hidden"
        style={{ position: 'relative', zIndex: 10 }}
      >
        {/* Animated glow strip */}
        <div className="sidebar-glow" />

        {/* Subtle horizontal scanlines in sidebar */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 24px, rgba(26,47,251,0.01) 24px, rgba(26,47,251,0.01) 25px)',
        }} />

        {/* Logo */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '12px',
          padding: '20px 16px',
          borderBottom: '1px solid rgba(255,255,255,0.04)',
          position: 'relative', zIndex: 1,
        }}>
          <motion.div
            animate={{
              boxShadow: [
                '0 0 0px rgba(26,47,251,0)',
                '0 0 16px rgba(26,47,251,0.35)',
                '0 0 0px rgba(26,47,251,0)',
              ],
            }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            whileHover={{ scale: 1.08 }}
            style={{
              width: '32px', height: '32px', flexShrink: 0,
              borderRadius: '10px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              overflow: 'hidden',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <img src="/nexusdfi-logo.png" alt="NexusDFI" style={{ width: '22px', height: '22px', objectFit: 'contain' }} />
          </motion.div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.25 }}
              >
                <p style={{
                  color: '#f0f1fa', fontWeight: 800, fontSize: '13px', letterSpacing: '0.04em',
                  fontFamily: "'Orbitron', sans-serif",
                }}>NEXUSDFI</p>
                <p style={{
                  color: '#4a4d5c', fontSize: '9px', letterSpacing: '0.1em',
                  textTransform: 'uppercase', fontFamily: "'IBM Plex Mono', monospace",
                }}>Digital Forensics</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Nav section label */}
        <AnimatePresence>
          {!collapsed && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                padding: '16px 16px 8px',
                fontSize: '9px', fontWeight: 600,
                color: '#22222e', letterSpacing: '0.14em',
                textTransform: 'uppercase',
                fontFamily: "'IBM Plex Mono', monospace",
                position: 'relative', zIndex: 1,
              }}
            >
              Navigation
            </motion.p>
          )}
        </AnimatePresence>

        {/* Nav links */}
        <nav style={{
          flex: 1, padding: '4px 8px',
          display: 'flex', flexDirection: 'column', gap: '2px',
          overflowY: 'auto', position: 'relative', zIndex: 1,
        }}>
          {filteredNavItems.map((item, idx) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                id={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                className={({ isActive }) =>
                  `nav-link ${isActive ? 'active' : ''} ${collapsed ? 'justify-center' : ''}`
                }
              >
                {({ isActive }) => (
                  <>
                    {/* Spring-animated active pill */}
                    {isActive && (
                      <motion.div
                        layoutId="nav-active-pill"
                        className="nav-active-pill"
                        transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                      />
                    )}
                    <motion.div
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.04, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                      style={{ display: 'contents' }}
                    >
                      <Icon
                        size={16}
                        style={{
                          flexShrink: 0,
                          color: isActive ? '#6670ff' : '#4a4d5c',
                          transition: 'color 0.3s ease, filter 0.3s ease',
                          filter: isActive ? 'drop-shadow(0 0 4px rgba(102,112,255,0.6))' : 'none',
                        }}
                      />
                      <AnimatePresence>
                        {!collapsed && (
                          <motion.span
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -8 }}
                            transition={{ duration: 0.18 }}
                            style={{ whiteSpace: 'nowrap', fontSize: '13px' }}
                          >
                            {item.label}
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div style={{ padding: '8px', borderTop: '1px solid rgba(255,255,255,0.04)', position: 'relative', zIndex: 1 }}>
          {/* ⌘K Shortcut hint */}
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '6px 10px', marginBottom: '4px',
                  borderRadius: '10px',
                  border: '1px solid rgba(255,255,255,0.04)',
                  background: 'rgba(255,255,255,0.02)',
                  cursor: 'default',
                }}
              >
                <FiCommand size={12} style={{ color: '#4a4d5c' }} />
                <span style={{ fontSize: '11px', color: '#4a4d5c', flex: 1 }}>Command palette</span>
                <kbd style={{
                  fontSize: '9px', fontFamily: "'IBM Plex Mono', monospace",
                  color: '#4a4d5c', background: 'rgba(255,255,255,0.04)',
                  padding: '1px 5px', borderRadius: '4px',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}>⌘K</kbd>
              </motion.div>
            )}
          </AnimatePresence>

          {/* User profile link */}
          <NavLink to="/profile" style={{ display: 'block', width: '100%', textDecoration: 'none' }}>
            <motion.div
              whileHover={{ background: 'rgba(255,255,255,0.04)' }}
              style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '8px 10px', borderRadius: '12px',
                background: 'rgba(255,255,255,0.02)',
                justifyContent: collapsed ? 'center' : 'flex-start',
                cursor: 'pointer',
              }}
            >
              <div
                className="avatar-ring"
                style={{
                  width: '28px', height: '28px', flexShrink: 0,
                  borderRadius: '8px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '11px', fontWeight: 700, color: '#000000',
                  background: 'linear-gradient(135deg, #1a2ffb, #c1ff00)',
                }}
              >
                {user?.username?.[0]?.toUpperCase() ?? 'U'}
              </div>
              {!collapsed && (
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: '12px', color: '#b0b3c0', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.username}</p>
                  <p style={{ fontSize: '10px', color: '#4a4d5c', fontFamily: "'IBM Plex Mono', monospace", letterSpacing: '0.06em' }}>{user?.role}</p>
                </div>
              )}
            </motion.div>
          </NavLink>

          {/* Logout */}
          <motion.button
            id="btn-logout"
            onClick={handleLogout}
            whileHover={{ background: 'rgba(239,68,68,0.06)', color: '#F87171' }}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              width: '100%', padding: '8px 10px', marginTop: '4px',
              borderRadius: '12px', border: 'none',
              background: 'transparent', color: '#4a4d5c',
              fontSize: '13px', fontWeight: 500,
              cursor: 'pointer',
              justifyContent: collapsed ? 'center' : 'flex-start',
            }}
          >
            <FiLogOut size={14} style={{ flexShrink: 0 }} />
            {!collapsed && <span>Sign Out</span>}
          </motion.button>

          {/* Collapse toggle */}
          <motion.button
            id="btn-collapse"
            onClick={() => setCollapsed(!collapsed)}
            whileHover={{ background: 'rgba(255,255,255,0.03)', color: '#7a7d8e' }}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              width: '100%', padding: '8px 10px', marginTop: '2px',
              borderRadius: '12px', border: 'none',
              background: 'transparent', color: '#22222e',
              fontSize: '13px', fontWeight: 500, cursor: 'pointer',
              justifyContent: collapsed ? 'center' : 'flex-start',
            }}
          >
            <motion.span
              animate={{ rotate: collapsed ? 180 : 0 }}
              transition={{ duration: 0.4, type: 'spring', stiffness: 250, damping: 25 }}
              style={{ display: 'inline-flex', fontSize: '14px' }}
            >
              <FiChevronLeft />
            </motion.span>
            {!collapsed && <span>Collapse</span>}
          </motion.button>
        </div>
      </motion.aside>

      {/* ── Main Content ──────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden aurora-bg" style={{ position: 'relative', zIndex: 1 }}>
        {/* Top bar — glassmorphism */}
        <header
          style={{
            position: 'sticky', top: 0, zIndex: 10,
            padding: '12px 24px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            borderBottom: '1px solid rgba(255,255,255,0.04)',
            background: 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <AnimatePresence mode="wait">
              <motion.h2
                key={currentPage}
                initial={{ opacity: 0, y: -8, filter: 'blur(4px)' }}
                animate={{ opacity: 1, y: 0,  filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                style={{
                  fontSize: '14px', fontWeight: 700, color: '#f0f1fa', letterSpacing: '-0.02em',
                }}
              >
                {currentPage}
              </motion.h2>
            </AnimatePresence>
            <motion.div
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
              style={{
                width: '4px', height: '4px', borderRadius: '50%',
                background: '#c1ff00',
                boxShadow: '0 0 8px rgba(193,255,0,0.6)',
              }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {/* ⌘K trigger */}
            <motion.button
              whileHover={{ borderColor: 'rgba(26,47,251,0.3)', color: '#9da4ff' }}
              onClick={() => {
                window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true, ctrlKey: true }));
              }}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '5px 10px', borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.06)',
                background: 'rgba(255,255,255,0.02)',
                color: '#4a4d5c', fontSize: '11px', cursor: 'pointer',
              }}
            >
              <FiCommand size={11} />
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '10px' }}>⌘K</span>
            </motion.button>

            <LiveClock />
          </div>
        </header>

        {/* Page content with transitions */}
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="p-6"
            style={{ position: 'relative', zIndex: 1 }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Session Timeout Warning Modal */}
      <AnimatePresence>
        {showTimeoutWarning && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            style={{
              position: 'fixed', bottom: '24px', right: '24px',
              zIndex: 50, padding: '20px', maxWidth: '360px',
              borderRadius: '16px',
              background: 'rgba(13,13,22,0.95)',
              backdropFilter: 'blur(24px)',
              border: '1px solid rgba(239,68,68,0.15)',
              boxShadow: '0 16px 48px rgba(0,0,0,0.7), 0 0 0 1px rgba(239,68,68,0.1)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                style={{ marginTop: '2px', color: '#FBBF24', fontSize: '14px' }}
              >⚠</motion.div>
              <div>
                <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#f0f1fa', marginBottom: '4px', letterSpacing: '-0.02em' }}>Session Timeout</h3>
                <p style={{ fontSize: '12px', color: '#7a7d8e', lineHeight: 1.5, marginBottom: '12px' }}>
                  You have been inactive for 14 minutes. You will be automatically logged out in 1 minute.
                </p>
                <button style={{
                  padding: '8px 20px',
                  background: 'linear-gradient(135deg, #1a2ffb, #3d4fff)',
                  color: '#ffffff', fontSize: '11px', fontWeight: 600,
                  borderRadius: '100px', border: 'none', cursor: 'pointer',
                  letterSpacing: '0.04em', textTransform: 'uppercase',
                  boxShadow: '0 4px 16px rgba(26,47,251,0.3)',
                }}>
                  Stay Logged In
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
