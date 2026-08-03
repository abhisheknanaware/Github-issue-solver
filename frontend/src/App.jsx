import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from './store/useAuthStore.js';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import RepoView from './pages/RepoView.jsx';
import IssueView from './pages/IssueView.jsx';
import ContributionView from './pages/ContributionView.jsx';
import PRDraftView from './pages/PRDraftView.jsx';
import { Loader2 } from 'lucide-react';

// Protected Route wrapper component
function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading, checkAuth, user } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (isLoading && !user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-slate-500 gap-3" style={{ background: '#0a0e1a' }}>
        <Loader2 className="w-7 h-7 animate-spin text-blue-500" />
        <p className="text-sm">Authenticating session...</p>
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

// Handles parsing OAuth redirect query params: ?token=JWT
function AuthCallback() {
  const [searchParams] = useSearchParams();
  const login = useAuthStore((state) => state.login);
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      login(token).then(() => {
        navigate('/dashboard', { replace: true });
      });
    } else {
      navigate('/login', { replace: true });
    }
  }, [searchParams, login, navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-slate-500 gap-3" style={{ background: '#0a0e1a' }}>
      <Loader2 className="w-7 h-7 animate-spin text-blue-500" />
      <p className="text-sm">Completing GitHub authorization...</p>
    </div>
  );
}

function MainRoutes() {
  const { isAuthenticated } = useAuthStore();
  return (
    <Routes>
      <Route
        path="/"
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />}
      />
      <Route path="/login" element={<Login />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/repo/:repoId"
        element={
          <ProtectedRoute>
            <RepoView />
          </ProtectedRoute>
        }
      />
      <Route
        path="/issue/:issueId"
        element={
          <ProtectedRoute>
            <IssueView />
          </ProtectedRoute>
        }
      />
      <Route
        path="/contribution/:id"
        element={
          <ProtectedRoute>
            <ContributionView />
          </ProtectedRoute>
        }
      />
      <Route
        path="/pr-draft/:id"
        element={
          <ProtectedRoute>
            <PRDraftView />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <MainRoutes />
    </BrowserRouter>
  );
}
