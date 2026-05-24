import { useEffect, useState } from 'react';
import { usersApi } from '../../api/users';
import { PageHeader } from '../../components/shared/PageHeader';
import { Card } from '../../components/ui/Card';
import type { User, Role } from '../../types/server';

const roleColors: Record<string, string> = {
  SUPER_ADMIN: 'bg-red-600',
  ADMIN: 'bg-blue-600',
  MODERATOR: 'bg-green-600',
  VIEWER: 'bg-slate-600',
};

export default function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Create user form
  const [showForm, setShowForm] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('VIEWER');
  const [creating, setCreating] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await usersApi.list();
      setUsers(data);
    } catch {
      setError('Failed to load users. SUPER_ADMIN role required.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreate = async () => {
    setCreating(true);
    setError('');
    try {
      await usersApi.create({ username, email, password, role });
      setShowForm(false);
      setUsername('');
      setEmail('');
      setPassword('');
      setRole('VIEWER');
      await fetchUsers();
    } catch {
      setError('Failed to create user. Username or email may already exist.');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this user?')) return;
    try {
      await usersApi.delete(id);
      await fetchUsers();
    } catch {
      setError('Failed to delete user.');
    }
  };

  return (
    <div>
      <PageHeader title="Users">
        <button onClick={() => setShowForm(!showForm)}
          className="py-2.5 px-5 bg-blue-600 text-white rounded-lg text-sm font-semibold cursor-pointer hover:bg-blue-700 transition-colors border-none">
          + Add User
        </button>
      </PageHeader>

      {error && <div className="bg-red-900/20 border border-red-500 text-red-300 px-4 py-2.5 rounded-lg text-sm mb-4">{error}</div>}

      {/* Create form */}
      {showForm && (
        <Card className="mb-6">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">New User</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-slate-400 font-medium">Username</label>
              <input type="text" value={username} onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-slate-200 text-sm outline-none focus:border-blue-500" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-slate-400 font-medium">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-slate-200 text-sm outline-none focus:border-blue-500" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-slate-400 font-medium">Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-slate-200 text-sm outline-none focus:border-blue-500" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-slate-400 font-medium">Role</label>
              <select value={role} onChange={(e) => setRole(e.target.value as Role)}
                className="w-full px-3.5 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-slate-200 text-sm outline-none focus:border-blue-500">
                <option value="VIEWER">Viewer</option>
                <option value="MODERATOR">Moderator</option>
                <option value="ADMIN">Admin</option>
                <option value="SUPER_ADMIN">Super Admin</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleCreate} disabled={creating || !username || !email || !password}
              className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm cursor-pointer hover:bg-green-700 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed transition-colors border-none">
              {creating ? 'Creating...' : 'Create User'}
            </button>
            <button onClick={() => setShowForm(false)}
              className="px-4 py-2 bg-transparent text-slate-400 border border-slate-600 rounded-lg text-sm cursor-pointer hover:text-slate-200 transition-colors">
              Cancel
            </button>
          </div>
        </Card>
      )}

      {/* User table */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
        <table className="w-full border-collapse">
          <thead>
            <tr className="text-left text-xs text-slate-500 uppercase tracking-wider border-b border-slate-700">
              <th className="px-4 py-3 font-semibold">User</th>
              <th className="px-4 py-3 font-semibold">Email</th>
              <th className="px-4 py-3 font-semibold">Role</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Created</th>
              <th className="px-4 py-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="text-center text-slate-500 py-10">Loading...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={6} className="text-center text-slate-500 py-10">No users found.</td></tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="hover:bg-slate-750 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-7 h-7 ${roleColors[user.role]} rounded-full flex items-center justify-center text-white text-xs font-bold`}>
                        {user.username.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm text-slate-200 font-medium">{user.username}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-400">{user.email}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium text-white ${roleColors[user.role]}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1.5 text-xs ${user.enabled ? 'text-green-400' : 'text-red-400'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${user.enabled ? 'bg-green-400' : 'bg-red-400'}`} />
                      {user.enabled ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-500">{new Date(user.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => handleDelete(user.id)}
                      className="text-xs text-red-400 bg-transparent border border-red-600/30 px-2 py-1 rounded cursor-pointer hover:bg-red-900/20 transition-colors">
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
