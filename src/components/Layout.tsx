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
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    exit:    { opacity: 0, y: -8 },
  };

  return (
    <div className="flex h-screen overflow-hidden page-bg">

      {/* ── Sidebar ─────────────────────────────────────── */}
      <motion.aside
        animate={{ width: collapsed ? 64 : 240 }}
        transition={{ duration: 0.2, ease: 'easeInOut' }}
        className="sidebar flex flex-col h-screen flex-shrink-0 overflow-hidden"
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-4 border-b border-navy-800">
          <div
            className="w-8 h-8 flex-shrink-0 rounded-lg flex items-center justify-center overflow-hidden"
            style={{ background: '#F8FAFC' }}
          >
            <img src="/nexusdfi-logo.png" alt="NexusDFI" className="w-6 h-6 object-contain" />
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.15 }}
              >
                <p className="text-white font-semibold text-sm font-display">NexusDFI</p>
                <p className="text-[10px] text-navy-400">Digital Forensics</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
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
                    transition={{ duration: 0.1 }}
                    className="whitespace-nowrap text-sm"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
              {collapsed && (
                <span className="text-xs font-medium">{item.label[0]}</span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-2 py-3 border-t border-navy-800">
          {/* User */}
          <NavLink to="/profile" className="block w-full">
            <div
              className={`flex items-center gap-2 px-2.5 py-2 rounded-lg bg-navy-950/50 hover:bg-navy-800 transition-colors ${collapsed ? 'justify-center' : ''}`}
            >
              <div
                className="w-7 h-7 flex-shrink-0 rounded-md flex items-center justify-center text-xs font-semibold text-white"
                style={{ background: '#2563EB' }}
              >
                {user?.username?.[0]?.toUpperCase() ?? 'U'}
              </div>
              {!collapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-navy-100 font-medium truncate">{user?.username}</p>
                  <p className="text-[10px] text-navy-400">{user?.role}</p>
                </div>
              )}
            </div>
          </NavLink>

          {/* Logout */}
          <button
            id="btn-logout"
            onClick={handleLogout}
            className={`nav-link w-full mt-1 text-navy-400 hover:text-red-400 hover:bg-red-500/8 ${collapsed ? 'justify-center' : ''}`}
          >
            {!collapsed ? <span className="text-sm">Sign Out</span> : <span className="text-xs">×</span>}
          </button>

          {/* Collapse toggle */}
          <button
            id="btn-collapse"
            onClick={() => setCollapsed(!collapsed)}
            className={`nav-link w-full mt-1 ${collapsed ? 'justify-center' : ''}`}
          >
            <motion.span
              animate={{ rotate: collapsed ? 0 : 180 }}
              transition={{ duration: 0.2 }}
              className="text-xs inline-block"
            >
              ▶
            </motion.span>
            {!collapsed && <span className="text-sm">Collapse</span>}
          </button>
        </div>
      </motion.aside>

      {/* ── Main Content ─────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden">
        {/* Top bar */}
        <header
          className="sticky top-0 z-10 px-6 py-3 flex items-center justify-between border-b border-navy-800"
          style={{ background: 'rgba(11,18,32,0.92)', backdropFilter: 'blur(12px)' }}
        >
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-semibold text-navy-100 font-display">{currentPage}</h2>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-[11px] text-navy-400 mono">
              {time.toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })}
            </span>
            <div className="h-4 w-px bg-navy-700" />
            <span className="text-[11px] mono tabular-nums text-navy-300">
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
            transition={{ duration: 0.2 }}
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
            className="fixed bottom-6 right-6 z-50 p-5 max-w-sm rounded-xl shadow-elevated border border-navy-700"
            style={{ background: '#1E293B' }}
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5 text-amber-400 text-sm">⚠</div>
              <div>
                <h3 className="text-sm font-semibold text-white mb-1 font-display">Session Timeout</h3>
                <p className="text-xs text-navy-300 leading-relaxed mb-3">
                  You have been inactive for 14 minutes. You will be automatically logged out in 1 minute.
                </p>
                <button className="py-1.5 px-4 bg-accent-500 text-white text-xs font-semibold rounded-lg hover:bg-accent-600 transition-colors cursor-pointer">
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
