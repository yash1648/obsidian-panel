import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { Layout } from './components/layout/Layout';
import { useAuthStore } from './store/auth';
import Login from './pages/auth/Login';
import Dashboard from './pages/dashboard/Dashboard';
import ServerList from './pages/servers/ServerList';
import ServerCreate from './pages/servers/ServerCreate';
import ServerDetail from './pages/servers/ServerDetail';
import Templates from './pages/templates/Templates';
import Users from './pages/users/Users';
import AuditLog from './pages/audit/AuditLog';
import Settings from './pages/settings/Settings';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (!isAuthenticated) return <Navigate to="/auth/login" replace />;
  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (isAuthenticated) return <Navigate to="/" replace />;
  return <>{children}</>;
}

export default function App() {
  const loadFromStorage = useAuthStore((s) => s.loadFromStorage);

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/auth/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="servers" element={<ServerList />} />
          <Route path="servers/create" element={<ServerCreate />} />
          <Route path="servers/:id" element={<ServerDetail />} />
          <Route path="templates" element={<Templates />} />
          <Route path="users" element={<Users />} />
          <Route path="audit" element={<AuditLog />} />
          <Route path="settings" element={<Settings />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
