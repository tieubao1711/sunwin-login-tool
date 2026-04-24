import React from 'react';
import { LogOut } from 'lucide-react';
import { clearAuthToken } from '../lib/auth';

export default function Topbar({ title, subtitle }) {
  return (
    <div className="mb-6 flex items-end justify-between">
      <div>
        <h1 className="text-2xl font-semibold text-slate-100">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-400">{subtitle}</p>}
      </div>
      <button
        onClick={() => {
          clearAuthToken();
          window.location.href = '/auth';
        }}
        className="inline-flex items-center gap-2 rounded-lg bg-slate-800 px-3 py-2 text-sm text-slate-200 hover:bg-slate-700"
      >
        <LogOut size={16} />
        Logout
      </button>
    </div>
  );
}