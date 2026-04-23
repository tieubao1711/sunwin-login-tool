import React from 'react';
import { Search, X } from 'lucide-react';

export default function SearchBox({
  value,
  onChange,
  placeholder = 'Tìm username, fullname, message...'
}) {
  return (
    <div className="relative">
      <Search
        size={16}
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
      />

      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-800 bg-slate-900 py-2 pl-9 pr-10 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-emerald-500/50"
      />

      {value ? (
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
        >
          <X size={16} />
        </button>
      ) : null}
    </div>
  );
}