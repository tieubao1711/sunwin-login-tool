import React from 'react';
export default function ProgressCard({ total, processed }) {
  const percent = total > 0 ? Math.round((processed / total) * 100) : 0;

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-3">
      <div className="mb-2 flex items-center justify-between">
        <div className="text-sm text-slate-300">Progress</div>
        <div className="text-xs text-slate-400">
          {processed}/{total} ({percent}%)
        </div>
      </div>

      <div className="h-2 rounded-full bg-slate-800">
        <div
          className="h-2 rounded-full bg-emerald-500 transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}