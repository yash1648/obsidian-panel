import { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { useAuthStore } from '../../store/auth';

export function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/auth/login');
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-900">
      <Sidebar collapsed={!sidebarOpen} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 bg-slate-800 border-b border-slate-700 flex items-center justify-between px-4 flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-slate-400 hover:text-slate-200 text-2xl bg-transparent border-none cursor-pointer p-1 rounded"
          >
            ☰
          </button>
          <div className="flex items-center gap-4">
            <span className="text-slate-200 text-sm">{user?.username || 'User'}</span>
            <button
              onClick={handleLogout}
              className="text-sm text-slate-400 bg-transparent border border-slate-600 px-3 py-1.5 rounded-md cursor-pointer hover:border-red-500 hover:text-red-400 transition-colors"
            >
              Logout
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 bg-slate-900">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
