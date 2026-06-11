import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

const NAV_ITEMS = [
  { to: '/dashboard',   icon: '⬡',  label: 'Dashboard',       color: '#F05A28', allowedRoles: ['Admin', 'Investigator', 'Viewer'] },
  { to: '/cases',       icon: '📂', label: 'Cases',            color: '#00D4AA', allowedRoles: ['Admin', 'Investigator', 'Viewer'] },
  { to: '/evidence',   icon: '🔍', label: 'Evidence',         color: '#F05A28', allowedRoles: ['Admin', 'Investigator'] },
  { to: '/timeline',   icon: '⏱',  label: 'Timeline',         color: '#00D4AA', allowedRoles: ['Admin', 'Investigator', 'Viewer'] },
  { to: '/reports',    icon: '📑', label: 'Reports',          color: '#F05A28', allowedRoles: ['Admin', 'Investigator', 'Viewer'] },
  { to: '/assistant',  icon: '🤖', label: 'AI Assistant',     color: '#00D4AA', allowedRoles: ['Admin', 'Investigator'] },
  { to: '/threat-intel', icon: '🕵️', label: 'Threat Intel', color: '#7b2fff', allowedRoles: ['Admin'] },
];

const PAGE_TITLES: Record<string, string> = {
  '/dashboard':   'Intelligence Dashboard',
  '/cases':       'Case Management',
  '/evidence':    'Evidence Analysis',
  '/timeline':    'Event Timeline',
  '/reports':     'Report Generator',
  '/assistant':   'AI Investigation Assistant',
  '/threat-intel':'Threat Intelligence',
  '/profile':     'User Profile',
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
    initial: { opacity: 0, y: 16, scale: 0.99, filter: 'blur(4px)' },
    animate: { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' },
    exit:    { opacity: 0, y: -12, scale: 0.99, filter: 'blur(4px)' },
  };

  return (
    <div className="flex h-screen overflow-hidden page-bg">

      {/* ── Sidebar ─────────────────────────────────────── */}
      <motion.aside
        animate={{ width: collapsed ? 72 : 256 }}
        transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
        className="sidebar flex flex-col h-screen flex-shrink-0 overflow-hidden relative"
        style={{ borderRadius: 0 }}
      >
        {/* Scan-line effect */}
        <div className="scanline-effect" />

        {/* Ambient glow inside sidebar */}
        <div className="absolute top-0 left-0 w-40 h-40 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(240,90,40,0.07), transparent 70%)', filter: 'blur(40px)' }}
        />
        <div className="absolute bottom-20 right-0 w-32 h-32 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(0,212,170,0.05), transparent 70%)', filter: 'blur(30px)' }}
        />

        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-navy-700/40 relative z-10">
          <motion.div
            whileHover={{ scale: 1.05, rotate: 2 }}
            whileTap={{ scale: 0.95 }}
            className="w-10 h-10 flex-shrink-0 rounded-xl flex items-center justify-center logo-pulse"
            style={{
              background: 'linear-gradient(135deg, #F05A28, #C84820)',
              boxShadow: '0 4px 16px rgba(240,90,40,0.35)',
            }}
          >
            <span className="text-white font-bold text-sm font-display">NX</span>
          </motion.div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
              >
                <p className="text-white font-bold text-sm leading-tight font-display tracking-wide">NexusDFI</p>
                <p className="text-[10px] tracking-[0.2em] mono" style={{ color: '#F05A28' }}>FORENSICS INTEL</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto relative z-10">
          {NAV_ITEMS.filter(item => !user || item.allowedRoles.includes(user.role)).map((item, index) => (
            <motion.div
              key={item.to}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05, duration: 0.3 }}
            >
              <NavLink
                to={item.to}
                id={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                className={({ isActive }) =>
                  `nav-link ${isActive ? 'active' : ''} ${collapsed ? 'justify-center' : ''}`
                }
              >
                <span className="text-lg flex-shrink-0">{item.icon}</span>
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -8 }}
                      transition={{ duration: 0.15 }}
                      className="whitespace-nowrap"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </NavLink>
            </motion.div>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-2 py-3 border-t border-navy-700/40 relative z-10">
          {/* User */}
          <NavLink to="/profile" className="block w-full">
            <motion.div
              whileHover={{ scale: 1.02 }}
              className={`flex items-center gap-2 px-2.5 py-2.5 rounded-xl bg-navy-800/60 backdrop-blur-sm hover:bg-navy-700/80 transition-colors ${collapsed ? 'justify-center' : ''}`}
            >
              <div
                className="w-8 h-8 flex-shrink-0 rounded-lg flex items-center justify-center text-xs font-bold text-white"
                style={{
                  background: 'linear-gradient(135deg, #F05A28, #C84820)',
                  boxShadow: '0 2px 8px rgba(240,90,40,0.25)',
                }}
              >
                {user?.username?.[0]?.toUpperCase() ?? 'U'}
              </div>
              {!collapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-navy-100 font-semibold truncate">{user?.username}</p>
                  <p className="text-[10px] text-navy-400">{user?.role}</p>
                </div>
              )}
            </motion.div>
          </NavLink>

          {/* Logout */}
          <motion.button
            whileHover={{ x: 2 }}
            whileTap={{ scale: 0.97 }}
            id="btn-logout"
            onClick={handleLogout}
            className={`nav-link w-full mt-1 text-red-400/70 hover:text-red-400 hover:bg-red-500/8 ${collapsed ? 'justify-center' : ''}`}
          >
            <span className="text-sm">⏻</span>
            {!collapsed && <span>Logout</span>}
          </motion.button>

          {/* Collapse toggle */}
          <motion.button
            whileHover={{ x: collapsed ? 0 : 2 }}
            whileTap={{ scale: 0.97 }}
            id="btn-collapse"
            onClick={() => setCollapsed(!collapsed)}
            className={`nav-link w-full mt-1 ${collapsed ? 'justify-center' : ''}`}
          >
            <motion.span
              animate={{ rotate: collapsed ? 0 : 180 }}
              transition={{ duration: 0.3 }}
              className="text-sm inline-block"
            >
              ▶
            </motion.span>
            {!collapsed && <span>Collapse</span>}
          </motion.button>
        </div>
      </motion.aside>

      {/* ── Main Content ─────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden">
        {/* Top bar */}
        <header
          className="sticky top-0 z-10 px-6 py-3 flex items-center justify-between border-b border-navy-700/40"
          style={{
            borderRadius: 0,
            background: 'rgba(7,11,20,0.88)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
          }}
        >
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-accent-400 pulse-dot" style={{ background: '#F05A28' }} />
            <h2 className="text-sm font-semibold text-navy-100 font-display tracking-wide">{currentPage}</h2>
          </div>
          <div className="flex items-center gap-4">
            {/* System status pill */}
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-teal-500/20 bg-teal-500/5">
              <span className="status-dot" />
              <span className="text-[10px] font-mono font-semibold tracking-widest" style={{ color: '#00D4AA' }}>SYS ONLINE</span>
            </div>
            <span className="text-[11px] text-navy-400 mono">
              {time.toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })}
            </span>
            <div className="h-4 w-px bg-navy-700/60" />
            <span className="text-[11px] mono tabular-nums font-semibold" style={{ color: '#F05A28' }}>
              {time.toLocaleTimeString('en-IN', { hour12: false })}
            </span>
          </div>
        </header>

        {/* Page content with enhanced animation */}
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.35 }}
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
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed bottom-6 right-6 z-50 glass p-5 max-w-sm rounded-2xl shadow-[0_10px_40px_rgba(240,90,40,0.2)] border border-orange-500/30"
            style={{ background: 'rgba(20, 10, 5, 0.95)' }}
          >
            <div className="flex items-start gap-3">
              <div className="text-2xl mt-0.5">⚠️</div>
              <div>
                <h3 className="text-sm font-bold text-white mb-1 font-display">Session Timeout Warning</h3>
                <p className="text-xs text-navy-300 leading-relaxed mb-3">
                  You have been inactive for 14 minutes. For your security, you will be automatically logged out in 1 minute.
                </p>
                <div className="flex gap-2">
                  <button 
                    className="flex-1 py-1.5 px-3 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-bold rounded-lg hover:brightness-110 transition-all cursor-pointer"
                  >
                    Stay Logged In
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
