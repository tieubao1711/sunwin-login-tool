import React from 'react';
export default function StatusBadge({ value }) {
  const cls =
    value === 'SUCCESS'
      ? 'bg-emerald-500/15 text-emerald-300'
      : 'bg-rose-500/15 text-rose-300';

  return (
    <span className={`rounded-full px-2 py-1 text-xs font-medium ${cls}`}>
      {value}
    </span>
  );
}