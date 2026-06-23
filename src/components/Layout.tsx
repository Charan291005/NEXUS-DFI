import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

const NAV_ITEMS = [
  { to: '/dashboard',    label: 'Dashboard',       allowedRoles: ['Admin', 'Investigator', 'Viewer'] },
  { to: '/cases',        label: 'Cases',            allowedRoles: ['Admin', 'Investigator', 'Viewer'] },
  { to: '/evidence',     label: 'Evidence',         allowedRoles: ['Admin', 'Investigator'] },
  { to: '/timeline',     label: 'Timeline',         allowedRoles: ['Admin', 'Investigator', 'Viewer'] },
  { to: '/reports',      label: 'Reports',          allowedRoles: ['Admin', 'Investigator', 'Viewer'] },
  { to: '/assistant',    label: 'Analysis Assistant', allowedRoles: ['Admin', 'Investigator'] },
  { to: '/threat-intel', label: 'Threat Intel',      allowedRoles: ['Admin'] },
  { to: '/guide',        label: 'Workflow',          allowedRoles: ['Admin', 'Investigator', 'Viewer'] },
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

export default function Layout() {
  const { user, logout, showTimeoutWarning } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [time, setTime] = useState(new Date());

  // Live clock
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleLogout = () => { logout(); navigate('/login'); };

  const currentPage = Object.entries(PAGE_TITLES).find(([path]) =>
    location.pathname.startsWith(path)
  )?.[1] ?? 'NexusDFI';

  // Page transition variants
  const pageVariants = {
    initial: { opacity: 0, y: 12, filter: 'blur(4px)' },
    animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
    exit:    { opacity: 0, y: -8, filter: 'blur(4px)' },
  };

  return (
    <div className="flex h-screen overflow-hidden page-bg noise-overlay">

      {/* ── Sidebar ─────────────────────────────────────── */}
      <motion.aside
        animate={{ width: collapsed ? 64 : 240 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="sidebar flex flex-col h-screen flex-shrink-0 overflow-hidden"
      >
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
              transition: 'box-shadow 0.3s ease',
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
          {NAV_ITEMS.filter(item => !user || item.allowedRoles.includes(user.role)).map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              id={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
              className={({ isActive }) =>
                `nav-link ${isActive ? 'active' : ''} ${collapsed ? 'justify-center' : ''}`
              }
            >
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
              {collapsed && (
                <span style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '-0.01em' }}>{item.label[0]}</span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div style={{ padding: '8px', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
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
            {!collapsed ? <span>Sign Out</span> : <span style={{ fontSize: '11px' }}>×</span>}
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
              animate={{ rotate: collapsed ? 0 : 180 }}
              transition={{ duration: 0.3 }}
              style={{ display: 'inline-block', fontSize: '10px' }}
            >
              ▶
            </motion.span>
            {!collapsed && <span>Collapse</span>}
          </button>
        </div>
      </motion.aside>

      {/* ── Main Content ─────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden">
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
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
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
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Session Timeout Warning Modal */}
      <AnimatePresence>
        {showTimeoutWarning && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
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
              boxShadow: '0 16px 48px rgba(0,0,0,0.7)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <div style={{ marginTop: '2px', color: '#FBBF24', fontSize: '14px' }}>⚠</div>
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
