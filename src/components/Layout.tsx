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
  { to: '/dashboard',    label: 'Dashboard',         icon: FiGrid,     allowedRoles: ['Admin', 'Investigator', 'Viewer'] },
  { to: '/cases',        label: 'Cases',             icon: FiFolder,   allowedRoles: ['Admin', 'Investigator', 'Viewer'] },
  { to: '/evidence',     label: 'Evidence',          icon: FiShield,   allowedRoles: ['Admin', 'Investigator'] },
  { to: '/timeline',     label: 'Timeline',          icon: FiClock,    allowedRoles: ['Admin', 'Investigator', 'Viewer'] },
  { to: '/reports',      label: 'Reports',           icon: FiFileText, allowedRoles: ['Admin', 'Investigator', 'Viewer'] },
  { to: '/assistant',    label: 'AI Assistant',       icon: FiCpu,      allowedRoles: ['Admin', 'Investigator'] },
  { to: '/threat-intel', label: 'Threat Intel',       icon: FiTarget,   allowedRoles: ['Admin'] },
  { to: '/guide',        label: 'Workflow',           icon: FiBookOpen, allowedRoles: ['Admin', 'Investigator', 'Viewer'] },
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

function LiveClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  
  return (
    <>
      <span style={{
        fontSize: '11px',
        color: '#4a4d5c',
        fontFamily: "'IBM Plex Mono', monospace",
        letterSpacing: '0.04em',
      }}>
        {time.toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })}
      </span>
      <div style={{ height: '16px', width: '1px', background: 'rgba(255,255,255,0.06)' }} />
      <span style={{
        fontSize: '11px',
        fontFamily: "'IBM Plex Mono', monospace",
        fontVariantNumeric: 'tabular-nums',
        color: '#c1ff00',
        letterSpacing: '0.04em',
      }}>
        {time.toLocaleTimeString('en-IN', { hour12: false })}
      </span>
    </>
  );
}

export default function Layout() {
  const { user, logout, showTimeoutWarning } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };

  const currentPage = useMemo(() => Object.entries(PAGE_TITLES).find(([path]) =>
    location.pathname.startsWith(path)
  )?.[1] ?? 'NexusDFI', [location.pathname]);

  const filteredNavItems = useMemo(() => {
    return NAV_ITEMS.filter(item => !user || item.allowedRoles.includes(user.role));
  }, [user]);

  // Page transition variants
  const pageVariants = {
    initial: { opacity: 0, y: 12, filter: 'blur(4px)' },
    animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
    exit:    { opacity: 0, y: -8, filter: 'blur(4px)' },
  };

  return (
    <div className="flex h-screen overflow-hidden page-bg noise-overlay">
      {/* ── Command Palette ─────────────────────────────── */}
      <CommandPalette />

      {/* ── Ambient Background ──────────────────────────── */}
      <AmbientCanvas />

      {/* ── Sidebar ─────────────────────────────────────── */}
      <motion.aside
        animate={{ width: collapsed ? 68 : 240 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="sidebar flex flex-col h-screen flex-shrink-0 overflow-hidden"
        style={{ position: 'relative', zIndex: 10 }}
      >
        {/* Glow strip */}
        <div className="sidebar-glow" />

        {/* Logo */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '20px 16px',
          borderBottom: '1px solid rgba(255,255,255,0.04)',
        }}>
          <motion.div
            whileHover={{ boxShadow: '0 0 20px rgba(26,47,251,0.3)' }}
            animate={{ boxShadow: ['0 0 0px rgba(26,47,251,0)', '0 0 12px rgba(26,47,251,0.2)', '0 0 0px rgba(26,47,251,0)'] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              width: '32px',
              height: '32px',
              flexShrink: 0,
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.06)',
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
                transition={{ duration: 0.2 }}
              >
                <p style={{ color: '#f0f1fa', fontWeight: 700, fontSize: '13px', letterSpacing: '-0.02em' }}>NEXUSDFI</p>
                <p style={{ color: '#22222e', fontSize: '9px', letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: "'IBM Plex Mono', monospace" }}>Digital Forensics</p>
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
                fontSize: '9px',
                fontWeight: 600,
                color: '#22222e',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                fontFamily: "'IBM Plex Mono', monospace",
              }}
            >
              Navigation
            </motion.p>
          )}
        </AnimatePresence>

        {/* Nav links */}
        <nav style={{ flex: 1, padding: '4px 8px', display: 'flex', flexDirection: 'column', gap: '2px', overflowY: 'auto' }}>
          {filteredNavItems.map((item) => {
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
                    {/* Animated active pill */}
                    {isActive && (
                      <motion.div
                        layoutId="nav-active-pill"
                        className="nav-active-pill"
                        transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                      />
                    )}
                    <Icon
                      size={16}
                      style={{
                        flexShrink: 0,
                        color: isActive ? '#1a2ffb' : '#4a4d5c',
                        transition: 'color 0.2s ease',
                      }}
                    />
                    <AnimatePresence>
                      {!collapsed && (
                        <motion.span
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -8 }}
                          transition={{ duration: 0.15 }}
                          style={{ whiteSpace: 'nowrap', fontSize: '13px' }}
                        >
                          {item.label}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Footer */}
        <div style={{ padding: '8px', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
          {/* ⌘K Shortcut hint */}
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '6px 10px',
                  marginBottom: '4px',
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

          {/* User */}
          <NavLink to="/profile" style={{ display: 'block', width: '100%', textDecoration: 'none' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '8px 10px',
                borderRadius: '12px',
                background: 'rgba(255,255,255,0.02)',
                transition: 'background 0.2s ease',
                justifyContent: collapsed ? 'center' : 'flex-start',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
            >
              <div
                className="avatar-ring"
                style={{
                  width: '28px',
                  height: '28px',
                  flexShrink: 0,
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#000000',
                  background: 'linear-gradient(135deg, #1a2ffb, #c1ff00)',
                }}
              >
                {user?.username?.[0]?.toUpperCase() ?? 'U'}
              </div>
              {!collapsed && (
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: '12px', color: '#b0b3c0', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.username}</p>
                  <p style={{ fontSize: '10px', color: '#22222e', fontFamily: "'IBM Plex Mono', monospace", letterSpacing: '0.06em' }}>{user?.role}</p>
                </div>
              )}
            </div>
          </NavLink>

          {/* Logout */}
          <button
            id="btn-logout"
            onClick={handleLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              width: '100%',
              padding: '8px 10px',
              marginTop: '4px',
              borderRadius: '12px',
              border: 'none',
              background: 'transparent',
              color: '#4a4d5c',
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              justifyContent: collapsed ? 'center' : 'flex-start',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#F87171';
              e.currentTarget.style.background = 'rgba(239,68,68,0.06)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#4a4d5c';
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <FiLogOut size={14} style={{ flexShrink: 0 }} />
            {!collapsed && <span>Sign Out</span>}
          </button>

          {/* Collapse toggle */}
          <button
            id="btn-collapse"
            onClick={() => setCollapsed(!collapsed)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              width: '100%',
              padding: '8px 10px',
              marginTop: '2px',
              borderRadius: '12px',
              border: 'none',
              background: 'transparent',
              color: '#22222e',
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              justifyContent: collapsed ? 'center' : 'flex-start',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#7a7d8e';
              e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#22222e';
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <motion.span
              animate={{ rotate: collapsed ? 180 : 0 }}
              transition={{ duration: 0.3 }}
              style={{ display: 'inline-flex', fontSize: '14px' }}
            >
              <FiChevronLeft />
            </motion.span>
            {!collapsed && <span>Collapse</span>}
          </button>
        </div>
      </motion.aside>

      {/* ── Main Content ─────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden aurora-bg" style={{ position: 'relative', zIndex: 1 }}>
        {/* Top bar — Lusion-style transparent blur */}
        <header
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 10,
            padding: '12px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid rgba(255,255,255,0.04)',
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h2 style={{
              fontSize: '14px',
              fontWeight: 700,
              color: '#f0f1fa',
              letterSpacing: '-0.02em',
            }}>{currentPage}</h2>
            <div style={{
              width: '4px', height: '4px', borderRadius: '50%',
              background: '#c1ff00', boxShadow: '0 0 8px rgba(193,255,0,0.5)',
            }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {/* ⌘K trigger */}
            <button
              onClick={() => {
                window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true, ctrlKey: true }));
              }}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '5px 10px', borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.06)',
                background: 'rgba(255,255,255,0.02)',
                color: '#4a4d5c', fontSize: '11px', cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(26,47,251,0.2)';
                e.currentTarget.style.color = '#7a7d8e';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
                e.currentTarget.style.color = '#4a4d5c';
              }}
            >
              <FiCommand size={11} />
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '10px' }}>⌘K</span>
            </button>

            <LiveClock />
          </div>
        </header>

        {/* Page content */}
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
              position: 'fixed',
              bottom: '24px',
              right: '24px',
              zIndex: 50,
              padding: '20px',
              maxWidth: '360px',
              borderRadius: '16px',
              background: 'rgba(15,15,25,0.9)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.06)',
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
                  background: '#1a2ffb',
                  color: '#ffffff',
                  fontSize: '11px',
                  fontWeight: 600,
                  borderRadius: '100px',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
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
