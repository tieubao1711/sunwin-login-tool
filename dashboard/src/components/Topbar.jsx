import React from 'react';
export default function Topbar({ title, subtitle }) {
  return (
    <div className="mb-6 flex items-end justify-between">
      <div>
        <h1 className="text-2xl font-semibold text-slate-100">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-400">{subtitle}</p>}
      </div>
    </div>
  );
}