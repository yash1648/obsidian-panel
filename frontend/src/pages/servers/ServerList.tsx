import { Link } from 'react-router-dom';
import { PageHeader } from '../../components/shared/PageHeader';

export default function ServerList() {
  return (
    <div>
      <PageHeader title="Servers">
        <Link to="/servers/create" className="py-2.5 px-5 bg-blue-600 text-white rounded-lg text-sm font-semibold no-underline hover:bg-blue-700 transition-colors">
          + Create Server
        </Link>
      </PageHeader>

      <div className="flex gap-3 mb-4">
        <input
          type="text"
          placeholder="Search servers..."
          className="max-w-xs w-full px-3.5 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-slate-200 text-sm outline-none focus:border-blue-500 placeholder-slate-500"
        />
        <select className="px-3.5 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-slate-200 text-sm outline-none focus:border-blue-500">
          <option value="">All Status</option>
          <option value="RUNNING">Running</option>
          <option value="STOPPED">Stopped</option>
          <option value="ERROR">Error</option>
        </select>
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
        <table className="w-full border-collapse">
          <thead>
            <tr className="text-left text-xs text-slate-500 uppercase tracking-wider border-b border-slate-700">
              <th className="px-4 py-3 font-semibold">Name</th>
              <th className="px-4 py-3 font-semibold">Type</th>
              <th className="px-4 py-3 font-semibold">Version</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">CPU</th>
              <th className="px-4 py-3 font-semibold">RAM</th>
              <th className="px-4 py-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={7} className="text-center text-slate-500 py-10">
                No servers yet. Create your first server!
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
