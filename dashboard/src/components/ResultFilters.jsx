import React from 'react';
import SearchBox from './SearchBox';

export default function ResultFilters({
  search,
  setSearch,
  statusFilter,
  setStatusFilter,
  hasTransaction,
  setHasTransaction,
  hasDeposit,
  setHasDeposit
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-3">
      <div className="mb-3 text-sm font-semibold text-slate-200">Filters</div>

      <div className="grid gap-3 md:grid-cols-[1.6fr,0.8fr]">
        <div>
          <div className="mb-1 text-xs text-slate-400">Search</div>
          <SearchBox value={search} onChange={setSearch} />
        </div>

        <div>
          <div className="mb-1 text-xs text-slate-400">Status</div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
          >
            <option value="">All</option>
            <option value="SUCCESS">SUCCESS</option>
            <option value="FAILED">FAILED</option>
          </select>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-5 text-sm text-slate-300">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={hasTransaction}
            onChange={(e) => setHasTransaction(e.target.checked)}
          />
          Có lịch sử Cược
        </label>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={hasDeposit}
            onChange={(e) => setHasDeposit(e.target.checked)}
          />
          Có lịch sử Nạp/Rút
        </label>
      </div>
    </div>
  );
}