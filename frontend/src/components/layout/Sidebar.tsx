import { NavLink } from 'react-router-dom';

const navItems = [
  { to: '/dashboard', icon: '📊', label: 'Dashboard' },
  { to: '/servers', icon: '🖥', label: 'Servers' },
  { to: '/templates', icon: '📋', label: 'Templates' },
  { to: '/users', icon: '👥', label: 'Users' },
  { to: '/audit', icon: '📝', label: 'Audit' },
  { to: '/settings', icon: '⚙️', label: 'Settings' },
];

interface SidebarProps {
  collapsed: boolean;
}

export function Sidebar({ collapsed }: SidebarProps) {
  return (
    <aside className={`sidebar ${collapsed ? 'w-16' : 'w-60'} bg-slate-800 border-r border-slate-700 flex flex-col overflow-hidden transition-all duration-200`}>
      <div className="p-4 text-xl font-bold text-blue-400 border-b border-slate-700 whitespace-nowrap">
        {collapsed ? '☰' : '☰ Panel'}
      </div>
      <nav className="p-2 flex flex-col gap-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm whitespace-nowrap transition-colors ${
                isActive
                  ? 'bg-blue-700 text-white'
                  : 'text-slate-400 hover:bg-slate-700 hover:text-slate-200'
              }`
            }
          >
            <span className="text-lg w-6 text-center flex-shrink-0">{item.icon}</span>
            {!collapsed && <span className="font-medium">{item.label}</span>}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
