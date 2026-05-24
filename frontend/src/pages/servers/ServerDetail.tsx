import { useState } from 'react';
import { useParams } from 'react-router-dom';

const tabs = [
  'Overview', 'Console', 'Files', 'Config', 'Plugins',
  'Backups', 'Monitoring', 'Players', 'Schedules',
];

export default function ServerDetail() {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState('Overview');

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-100 m-0">Server Detail</h1>
        <div className="flex gap-2">
          <button className="py-2 px-4 bg-blue-600 text-white rounded-lg text-sm font-semibold cursor-pointer hover:bg-blue-700 transition-colors">▶ Start</button>
          <button className="py-2 px-4 bg-transparent text-slate-400 border border-slate-600 rounded-lg text-sm cursor-pointer hover:border-slate-500 hover:text-slate-200 transition-colors">⏹ Stop</button>
          <button className="py-2 px-4 bg-transparent text-slate-400 border border-slate-600 rounded-lg text-sm cursor-pointer hover:border-slate-500 hover:text-slate-200 transition-colors">↺ Restart</button>
        </div>
      </div>

      <div className="flex gap-1 border-b border-slate-700 mb-6 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap bg-transparent cursor-pointer border-b-2 transition-colors ${
              activeTab === tab
                ? 'text-blue-400 border-blue-500'
                : 'text-slate-500 border-transparent hover:text-slate-300'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-xl p-8 text-center text-slate-500">
        <p>Server ID: {id}</p>
        <p>{activeTab} tab content will render here.</p>
      </div>
    </div>
  );
}
