import React from 'react';
import { BarChart3, History, Activity } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const items = [
  { to: '/dashboard', label: 'Dashboard', icon: BarChart3 },
  { to: '/runs', label: 'Runs', icon: History }
];

export default function Sidebar() {
  const location = useLocation();

  return (
    <aside className="w-64 shrink-0 border-r border-slate-800 bg-slate-950">
      <div className="px-5 py-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-emerald-500/20 p-2 text-emerald-400">
            <Activity size={20} />
          </div>
          <div>
            <div className="font-semibold text-slate-100">Bulk Monitor</div>
            <div className="text-xs text-slate-400">Realtime Dashboard</div>
          </div>
        </div>
      </div>

      <nav className="p-3 space-y-1">
        {items.map((item) => {
          const Icon = item.icon;
          const active = location.pathname.startsWith(item.to);

          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition ${
                active
                  ? 'bg-emerald-500/15 text-emerald-300'
                  : 'text-slate-300 hover:bg-slate-900'
              }`}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}