import React from 'react';

export default function AccountFilters(props) {
  const {
    tab,
    search,
    setSearch,
    fileName,
    setFileName,
    status,
    setStatus,
    minBalance,
    setMinBalance,
    maxBalance,
    setMaxBalance,
    minDeposit,
    setMinDeposit,
    minWithdraw,
    setMinWithdraw,
    hasDeposit,
    setHasDeposit,
    hasWithdraw,
    setHasWithdraw,
    limit,
    setLimit,
    total,
    loading,
    setPage,
    resetFilters,
    formatNumber
  } = props;

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
      <div className="grid gap-3 md:grid-cols-[1.2fr,1.2fr,0.8fr,0.6fr]">
        <div>
          <div className="mb-1 text-xs text-slate-400">Search</div>
          <input
            value={search}
            onChange={(e) => {
              setPage(1);
              setSearch(e.target.value);
            }}
            placeholder="username / phone / password..."
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-emerald-500"
          />
        </div>

        {tab === 'all' && (
          <div>
            <div className="mb-1 text-xs text-slate-400">
              File Name, cách nhau bằng dấu phẩy
            </div>
            <input
              value={fileName}
              onChange={(e) => {
                setPage(1);
                setFileName(e.target.value);
              }}
              placeholder="kendy1,kendy2"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-emerald-500"
            />
          </div>
        )}

        {tab === 'checked' && (
          <>
            <div>
              <div className="mb-1 text-xs text-slate-400">Status</div>
              <select
                value={status}
                onChange={(e) => {
                  setPage(1);
                  setStatus(e.target.value);
                }}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-emerald-500"
              >
                <option value="">All</option>
                <option value="SUCCESS">SUCCESS</option>
                <option value="FAILED">FAILED</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <input
                value={minBalance}
                onChange={(e) => {
                  setPage(1);
                  setMinBalance(e.target.value);
                }}
                placeholder="Min balance"
                className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-emerald-500"
              />

              <input
                value={maxBalance}
                onChange={(e) => {
                  setPage(1);
                  setMaxBalance(e.target.value);
                }}
                placeholder="Max balance"
                className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-emerald-500"
              />
            </div>
          </>
        )}

        {tab === 'flagged' && (
          <>
            <div className="grid grid-cols-2 gap-2">
              <input
                value={minDeposit}
                onChange={(e) => {
                  setPage(1);
                  setMinDeposit(e.target.value);
                }}
                placeholder="Min deposit"
                className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-emerald-500"
              />

              <input
                value={minWithdraw}
                onChange={(e) => {
                  setPage(1);
                  setMinWithdraw(e.target.value);
                }}
                placeholder="Min withdraw"
                className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex items-end gap-3">
              <label className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-300">
                <input
                  type="checkbox"
                  checked={hasDeposit}
                  onChange={(e) => {
                    setPage(1);
                    setHasDeposit(e.target.checked);
                  }}
                />
                Has deposit
              </label>

              <label className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-300">
                <input
                  type="checkbox"
                  checked={hasWithdraw}
                  onChange={(e) => {
                    setPage(1);
                    setHasWithdraw(e.target.checked);
                  }}
                />
                Has withdraw
              </label>
            </div>
          </>
        )}

        <div className="flex items-end">
          <button
            onClick={resetFilters}
            className="w-full rounded-lg bg-slate-700 px-3 py-2 text-sm hover:bg-slate-600"
          >
            Clear
          </button>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
        <div>
          Total: {formatNumber(total)} records
          {loading ? ' | Loading...' : ''}
        </div>

        <div className="flex items-center gap-2">
          <span>Limit</span>
          <select
            value={limit}
            onChange={(e) => {
              setPage(1);
              setLimit(Number(e.target.value));
            }}
            className="rounded-lg border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-white"
          >
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
            <option value={200}>200</option>
          </select>
        </div>
      </div>
    </div>
  );
}