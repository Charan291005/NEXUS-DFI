import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { lazy, Suspense, Component, type ReactNode } from 'react';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';

// ── Lazy-loaded pages (code splitting) ────────────────────
const Dashboard    = lazy(() => import('./pages/Dashboard'));
const CaseList     = lazy(() => import('./pages/CaseList'));
const CaseDetail   = lazy(() => import('./pages/CaseDetail'));
const EvidencePage = lazy(() => import('./pages/EvidencePage'));
const TimelinePage = lazy(() => import('./pages/TimelinePage'));
const ReportsPage  = lazy(() => import('./pages/ReportsPage'));
const AssistantPage = lazy(() => import('./pages/AssistantPage'));
const ThreatIntelPage = lazy(() => import('./pages/ThreatIntelPage'));

// ── Error Boundary ────────────────────────────────────────
interface ErrorBoundaryState { hasError: boolean; error?: Error; }
class ErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };
  static getDerivedStateFromError(error: Error) { return { hasError: true, error }; }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen page-bg">
          <div className="glass p-8 max-w-md text-center">
            <div className="text-4xl mb-4">⚠️</div>
            <h2 className="text-lg font-bold text-white mb-2">Something went wrong</h2>
            <p className="text-sm text-navy-300 mb-4">{this.state.error?.message ?? 'An unexpected error occurred.'}</p>
            <button onClick={() => window.location.reload()} className="btn-cyber btn-primary">Reload Page</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// ── Page loading fallback ─────────────────────────────────
function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 rounded-full border-2 border-accent-400/20 border-t-accent-400 animate-spin" />
        <p className="text-sm text-navy-400 mono">Loading...</p>
      </div>
    </div>
  );
}

function PrivateRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="flex items-center justify-center min-h-screen page-bg">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-full border-2 border-accent-400/20 border-t-accent-400 animate-spin" />
        <p className="text-sm text-navy-400 mono">Initializing NexusDFI...</p>
      </div>
    </div>
  );
  return user ? children : <Navigate to="/login" replace />;
}

function RoleRoute({ children, allowedRoles }: { children: ReactNode, allowedRoles: string[] }) {
  const { user } = useAuth();
  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={
              <PrivateRoute>
                <Layout />
              </PrivateRoute>
            }>
              <Route index         element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<RoleRoute allowedRoles={['Admin', 'Investigator', 'Viewer']}><Suspense fallback={<PageLoader />}><Dashboard /></Suspense></RoleRoute>} />
              <Route path="cases"     element={<RoleRoute allowedRoles={['Admin', 'Investigator', 'Viewer']}><Suspense fallback={<PageLoader />}><CaseList /></Suspense></RoleRoute>} />
              <Route path="cases/:id" element={<RoleRoute allowedRoles={['Admin', 'Investigator', 'Viewer']}><Suspense fallback={<PageLoader />}><CaseDetail /></Suspense></RoleRoute>} />
              <Route path="evidence"  element={<RoleRoute allowedRoles={['Admin', 'Investigator']}><Suspense fallback={<PageLoader />}><EvidencePage /></Suspense></RoleRoute>} />
              <Route path="timeline"  element={<RoleRoute allowedRoles={['Admin', 'Investigator', 'Viewer']}><Suspense fallback={<PageLoader />}><TimelinePage /></Suspense></RoleRoute>} />
              <Route path="reports"   element={<RoleRoute allowedRoles={['Admin', 'Investigator', 'Viewer']}><Suspense fallback={<PageLoader />}><ReportsPage /></Suspense></RoleRoute>} />
              <Route path="assistant" element={<RoleRoute allowedRoles={['Admin', 'Investigator']}><Suspense fallback={<PageLoader />}><AssistantPage /></Suspense></RoleRoute>} />
              <Route path="threat-intel" element={<RoleRoute allowedRoles={['Admin']}><Suspense fallback={<PageLoader />}><ThreatIntelPage /></Suspense></RoleRoute>} />
            </Route>
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
}
