import React, { useEffect, useMemo, useState } from 'react';

import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import CopyButton from '../components/CopyButton';

import {
  getCentralRuns,
  getCentralLoginResults,
  deleteCentralRun
} from '../lib/api';

function fmtNumber(value) {
  return Number(value || 0).toLocaleString('vi-VN');
}

function fmtDate(value) {
  if (!value) return '-';

  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '-';

  return d.toLocaleString('vi-VN', {
    hour12: false
  });
}

async function handleDeleteRun(run) {
  const ok = window.confirm(
    `Xóa run này và toàn bộ results?\n\n${run.toolName || ''}\n${run.runKey}`
  );

  if (!ok) return;

  try {
    await deleteCentralRun(run.runKey);

    if (selectedRunKey === run.runKey) {
      setSelectedRunKey('');
      setResults([]);
    }

    await loadRuns();
  } catch (err) {
    alert(err.message);
  }
}

export default function CentralMonitorPage() {
  const [runs, setRuns] = useState([]);
  const [results, setResults] = useState([]);

  const [selectedRunKey, setSelectedRunKey] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [toolName, setToolName] = useState('');

  const [loadingRuns, setLoadingRuns] = useState(false);
  const [loadingResults, setLoadingResults] = useState(false);

  async function loadRuns() {
    try {
      setLoadingRuns(true);

      const res = await getCentralRuns({
        limit: 100
      });

      setRuns(res.items || []);

      if (!selectedRunKey && res.items?.[0]?.runKey) {
        setSelectedRunKey(res.items[0].runKey);
      }
    } catch (err) {
      console.error('Load central runs error:', err.message);
    } finally {
      setLoadingRuns(false);
    }
  }

  async function loadResults() {
    try {
      setLoadingResults(true);

      const res = await getCentralLoginResults({
        runKey: selectedRunKey,
        search,
        status,
        toolName,
        limit: 500
      });

      setResults(res.items || []);
    } catch (err) {
      console.error('Load central results error:', err.message);
    } finally {
      setLoadingResults(false);
    }
  }

  useEffect(() => {
    loadRuns();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadResults();
    }, 300);

    return () => clearTimeout(timer);
  }, [selectedRunKey, search, status, toolName]);

  const summary = useMemo(() => {
    const total = results.length;
    const success = results.filter((x) => x.status === 'SUCCESS').length;
    const failed = results.filter((x) => x.status === 'FAILED').length;
    const flagged = results.filter(
      (x) =>
        Number(x.depositCount || 0) > 0 ||
        Number(x.withdrawCount || 0) > 0
    ).length;

    const totalBalance = results.reduce(
      (sum, item) => sum + Number(item.balance || 0),
      0
    );

    return {
      total,
      success,
      failed,
      flagged,
      totalBalance
    };
  }, [results]);

  return (
    <div className="flex min-h-screen bg-slate-950 text-white">
      <Sidebar />

      <main className="flex-1 p-4">
        <Topbar
          title="Central Monitor"
          subtitle="Theo dõi login results từ nhiều bulk tool gửi lên VPS"
        />

        <div className="grid gap-3 md:grid-cols-5">
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
            <div className="text-xs text-slate-500">Total</div>
            <div className="mt-2 text-2xl font-semibold">{fmtNumber(summary.total)}</div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
            <div className="text-xs text-slate-500">Success</div>
            <div className="mt-2 text-2xl font-semibold text-emerald-400">
              {fmtNumber(summary.success)}
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
            <div className="text-xs text-slate-500">Failed</div>
            <div className="mt-2 text-2xl font-semibold text-rose-400">
              {fmtNumber(summary.failed)}
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
            <div className="text-xs text-slate-500">Flagged</div>
            <div className="mt-2 text-2xl font-semibold text-amber-400">
              {fmtNumber(summary.flagged)}
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
            <div className="text-xs text-slate-500">Total Balance</div>
            <div className="mt-2 text-2xl font-semibold text-sky-400">
              {fmtNumber(summary.totalBalance)}
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-4 xl:grid-cols-[360px,1fr]">
          <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
              <div>
                <div className="font-semibold text-slate-100">Central Runs</div>
                <div className="text-xs text-slate-500">
                  {loadingRuns ? 'Loading...' : `${runs.length} runs`}
                </div>
              </div>

              <button
                onClick={loadRuns}
                className="rounded-lg bg-slate-800 px-3 py-1 text-xs hover:bg-slate-700"
              >
                Refresh
              </button>
            </div>

            <div className="max-h-[720px] overflow-auto">
              {runs.map((run) => {
                const active = selectedRunKey === run.runKey;

                return (
                  <button
                    key={run._id || run.runKey}
                    onClick={() => setSelectedRunKey(run.runKey)}
                    className={[
                      'block w-full border-b border-slate-800 px-4 py-3 text-left hover:bg-slate-800/60',
                      active ? 'bg-emerald-500/10' : ''
                    ].join(' ')}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="truncate font-medium text-slate-100">
                        {run.toolName || 'unknown-tool'}
                      </div>

                      <span
                        className={[
                          'rounded-full px-2 py-0.5 text-[11px]',
                          run.status === 'DONE'
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : run.status === 'RUNNING'
                              ? 'bg-sky-500/10 text-sky-400'
                              : 'bg-slate-700 text-slate-300'
                        ].join(' ')}
                      >
                        {run.status || '-'}
                      </span>

                        <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteRun(run);
                        }}
                        className="rounded bg-rose-500/10 px-2 py-1 text-[11px] text-rose-400 hover:bg-rose-500/20"
                        >
                        Xóa
                        </button>
                    </div>

                    <div className="mt-1 text-xs text-slate-500">
                      {run.machineId || '-'} | {run.sourceFile || '-'}
                    </div>

                    <div className="mt-2 grid grid-cols-4 gap-2 text-xs">
                      <div>
                        <div className="text-slate-500">Total</div>
                        <div>{fmtNumber(run.total)}</div>
                      </div>
                      <div>
                        <div className="text-slate-500">OK</div>
                        <div className="text-emerald-400">{fmtNumber(run.successCount)}</div>
                      </div>
                      <div>
                        <div className="text-slate-500">Fail</div>
                        <div className="text-rose-400">{fmtNumber(run.failedCount)}</div>
                      </div>
                      <div>
                        <div className="text-slate-500">Flag</div>
                        <div className="text-amber-400">{fmtNumber(run.flaggedCount)}</div>
                      </div>
                    </div>

                    <div className="mt-2 text-[11px] text-slate-500">
                      Updated: {fmtDate(run.updatedAt)}
                    </div>
                  </button>
                );
              })}

              {!loadingRuns && runs.length === 0 && (
                <div className="px-4 py-8 text-center text-sm text-slate-500">
                  Chưa có central run
                </div>
              )}
            </div>
          </div>

          <div>
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
              <div className="grid gap-3 md:grid-cols-[1.2fr,0.8fr,0.8fr,0.4fr]">
                <div>
                  <div className="mb-1 text-xs text-slate-400">Search</div>
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="username / display name / phone / message..."
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <div className="mb-1 text-xs text-slate-400">Status</div>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                  >
                    <option value="">All</option>
                    <option value="SUCCESS">SUCCESS</option>
                    <option value="FAILED">FAILED</option>
                  </select>
                </div>

                <div>
                  <div className="mb-1 text-xs text-slate-400">Tool Name</div>
                  <input
                    value={toolName}
                    onChange={(e) => setToolName(e.target.value)}
                    placeholder="bulk-tool-01"
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="flex items-end">
                  <button
                    onClick={loadResults}
                    className="w-full rounded-lg bg-slate-700 px-3 py-2 text-sm hover:bg-slate-600"
                  >
                    Load
                  </button>
                </div>
              </div>

              <div className="mt-3 text-xs text-slate-500">
                RunKey: {selectedRunKey || '-'} {loadingResults ? '| Loading...' : ''}
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-slate-800 bg-slate-900 overflow-hidden">
              <div className="max-h-[620px] overflow-auto">
                <table className="min-w-full text-sm">
                  <thead className="sticky top-0 z-10 bg-slate-950 text-slate-400">
                    <tr>
                      <th className="px-4 py-3 text-center">#</th>
                      <th className="px-4 py-3 text-left">Username</th>
                      <th className="px-4 py-3 text-left">Password</th>
                      <th className="px-4 py-3 text-left">Tool</th>
                      <th className="px-4 py-3 text-left">Machine</th>
                      <th className="px-4 py-3 text-right">Balance</th>
                      <th className="px-4 py-3 text-right">Safe</th>
                      <th className="px-4 py-3 text-center">N/R</th>
                      <th className="px-4 py-3 text-left">Status</th>
                      <th className="px-4 py-3 text-left">Checked</th>
                    </tr>
                  </thead>

                  <tbody>
                    {results.map((item, idx) => (
                      <tr
                        key={item._id || `${item.runKey}-${item.username}-${idx}`}
                        className="border-t border-slate-800 text-slate-200 hover:bg-slate-800/40"
                      >
                        <td className="px-4 py-3 text-center text-xs text-slate-500">
                          {idx + 1}
                        </td>

                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <span>{item.username || '-'}</span>
                            <CopyButton text={item.username || ''} />
                          </div>
                        </td>

                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <span>{item.password || '-'}</span>
                            <CopyButton text={item.password || ''} />
                          </div>
                        </td>

                        <td className="px-4 py-3 text-slate-400">
                          {item.toolName || '-'}
                        </td>

                        <td className="px-4 py-3 text-slate-400">
                          {item.machineId || '-'}
                        </td>

                        <td className="px-4 py-3 text-right text-emerald-300">
                          {fmtNumber(item.balance)}
                        </td>

                        <td className="px-4 py-3 text-right text-cyan-300">
                          {fmtNumber(item.safe)}
                        </td>

                        <td className="px-4 py-3 text-center text-amber-300">
                          {fmtNumber(item.depositCount)} / {fmtNumber(item.withdrawCount)}
                        </td>

                        <td className="px-4 py-3">
                          <span
                            className={[
                              'rounded-full px-2 py-1 text-xs',
                              item.status === 'SUCCESS'
                                ? 'bg-emerald-500/10 text-emerald-400'
                                : 'bg-rose-500/10 text-rose-400'
                            ].join(' ')}
                          >
                            {item.status || '-'}
                          </span>
                        </td>

                        <td className="px-4 py-3 whitespace-nowrap text-slate-400">
                          {fmtDate(item.checkedAt || item.createdAt)}
                        </td>
                      </tr>
                    ))}

                    {!loadingResults && results.length === 0 && (
                      <tr>
                        <td
                          colSpan={11}
                          className="px-4 py-8 text-center text-slate-500"
                        >
                          Không có dữ liệu central results
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}