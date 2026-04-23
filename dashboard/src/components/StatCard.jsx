import React from 'react';
export default function StatCard({ label, value, tone = 'default' }) {
  const toneClass = {
    default: 'bg-slate-900 border-slate-800',
    success: 'bg-emerald-950/40 border-emerald-900/40',
    fail: 'bg-rose-950/40 border-rose-900/40',
    warn: 'bg-amber-950/40 border-amber-900/40'
  }[tone];

  return (
    <div className={`rounded-xl border p-3 ${toneClass}`}>
      <div className="text-xs text-slate-400">{label}</div>
      <div className="mt-1 text-xl font-semibold text-slate-100">{value}</div>
    </div>
  );
}