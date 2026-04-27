import React from 'react';

export default function AccountTabs({ tab, setTab }) {
  const tabs = [
    { key: 'all', label: 'All Accounts' },
    { key: 'checked', label: 'Checked' },
    { key: 'flagged', label: 'Flagged' }
  ];

  return (
    <div className="mb-4 flex flex-wrap gap-2">
      {tabs.map((item) => (
        <button
          key={item.key}
          onClick={() => setTab(item.key)}
          className={
            tab === item.key
              ? 'rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950'
              : 'rounded-lg bg-slate-800 px-4 py-2 text-sm text-slate-300'
          }
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}