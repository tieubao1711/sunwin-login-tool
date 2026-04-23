import React from 'react';
export default function BalanceBadge({ value }) {
  const cls =
    Number(value) > 100000
      ? 'bg-amber-400/20 text-amber-300'
      : 'bg-slate-800 text-slate-300';

  return (
    <span className={`rounded-full px-2 py-1 text-xs font-medium ${cls}`}>
      {Number(value || 0).toLocaleString('vi-VN')}
    </span>
  );
}