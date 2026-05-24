import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../../api/auth';
import { useAuthStore } from '../../store/auth';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;
    setLoading(true);
    setError('');

    try {
      const res = await authApi.login({ username, password });
      login(res.user, res.accessToken, res.refreshToken);
      navigate('/');
    } catch {
      setError('Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-900">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-10 w-full max-w-md">
        <h1 className="text-2xl font-bold text-slate-100 text-center mb-1">Obsidian Panel</h1>
        <p className="text-slate-500 text-sm text-center mb-8">Minecraft Server Management</p>

        {error && (
          <div className="bg-red-900/20 border border-red-500 text-red-300 px-4 py-2.5 rounded-lg text-sm mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-slate-400 font-medium">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-slate-200 text-sm outline-none focus:border-blue-500 placeholder-slate-500"
              placeholder="Enter username"
              autoComplete="username"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-slate-400 font-medium">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-slate-200 text-sm outline-none focus:border-blue-500 placeholder-slate-500"
              placeholder="Enter password"
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !username || !password}
            className="w-full py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold cursor-pointer hover:bg-blue-700 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
