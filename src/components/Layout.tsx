import { useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

const NAV_ITEMS = [
  { to: '/dashboard', icon: '⬡',  label: 'Dashboard'  },
  { to: '/cases',     icon: '📂', label: 'Cases'       },
  { to: '/evidence',  icon: '🔍', label: 'Evidence'    },
  { to: '/timeline',  icon: '⏱',  label: 'Timeline'   },
  { to: '/reports',   icon: '📑', label: 'Reports'     },
  { to: '/assistant', icon: '🤖', label: 'AI Assistant'},
];

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/cases':     'Cases',
  '/evidence':  'Evidence',
  '/timeline':  'Timeline',
  '/reports':   'Reports',
  '/assistant': 'AI Assistant',
};

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };

  const currentPage = Object.entries(PAGE_TITLES).find(([path]) =>
    location.pathname.startsWith(path)
  )?.[1] ?? 'NexusDFI';

  return (
    <div className="flex h-screen overflow-hidden page-bg">

      {/* ── Sidebar ─────────────────────────────────────── */}
      <motion.aside
        animate={{ width: collapsed ? 68 : 240 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="sidebar flex flex-col h-screen flex-shrink-0 overflow-hidden"
        style={{ borderRadius: 0 }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-navy-700/50">
          <div className="w-9 h-9 flex-shrink-0 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #4f6ef7, #3b5ce4)' }}>
            <span className="text-white font-bold text-sm">NX</span>
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
              >
                <p className="text-white font-bold text-sm leading-tight">NexusDFI</p>
                <p className="text-[10px] text-accent-400 tracking-widest mono">FORENSICS INTEL</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              id={`nav-${item.label.toLowerCase().replace(' ','-')}`}
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
          ))}
        </nav>

        {/* Footer */}
        <div className="px-2 py-3 border-t border-navy-700/50">
          {/* User */}
          <div className={`flex items-center gap-2 px-2 py-2 rounded-xl bg-navy-800/80 ${collapsed ? 'justify-center' : ''}`}>
            <div className="w-7 h-7 flex-shrink-0 rounded-lg flex items-center justify-center text-xs font-bold text-white" style={{ background: 'linear-gradient(135deg, #4f6ef7, #3b5ce4)' }}>
              {user?.username?.[0]?.toUpperCase() ?? 'U'}
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-xs text-navy-100 font-semibold truncate">{user?.username}</p>
                <p className="text-[10px] text-navy-400">{user?.is_admin ? 'Admin' : 'Analyst'}</p>
              </div>
            )}
          </div>

          {/* Logout */}
          <button
            id="btn-logout"
            onClick={handleLogout}
            className={`nav-link w-full mt-1 text-red-400/70 hover:text-red-400 hover:bg-red-500/10 ${collapsed ? 'justify-center' : ''}`}
          >
            <span className="text-sm">⏻</span>
            {!collapsed && <span>Logout</span>}
          </button>

          {/* Collapse toggle */}
          <button
            id="btn-collapse"
            onClick={() => setCollapsed(!collapsed)}
            className={`nav-link w-full mt-1 ${collapsed ? 'justify-center' : ''}`}
          >
            <span className="text-sm">{collapsed ? '▶' : '◀'}</span>
            {!collapsed && <span>Collapse</span>}
          </button>
        </div>
      </motion.aside>

      {/* ── Main Content ─────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden">
        {/* Top bar */}
        <header className="sticky top-0 z-10 px-6 py-3 flex items-center justify-between border-b border-navy-700/50" style={{ borderRadius: 0, background: 'rgba(11,17,32,0.85)', backdropFilter: 'blur(12px)' }}>
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-semibold text-navy-100">{currentPage}</h2>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[11px] text-navy-400 mono">{new Date().toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })}</span>
            <div className="h-4 w-px bg-navy-700" />
            <span className="text-[11px] text-navy-400 mono">{new Date().toLocaleTimeString('en-IN', { hour12: false })}</span>
          </div>
        </header>

        {/* Page content with animation */}
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="p-6"
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
