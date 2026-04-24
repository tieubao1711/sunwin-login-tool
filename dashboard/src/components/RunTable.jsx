import React from 'react';
import { Link } from 'react-router-dom';

function fmtDate(value) {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleString('vi-VN', { hour12: false });
}

function fmtNumber(value) {
  return Number(value || 0).toLocaleString('vi-VN');
}

export default function RunTable({ items = [] }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden">
      <div className="max-h-[650px] overflow-y-auto">
        <table className="min-w-full text-sm">
          <thead className="sticky top-0 z-10 bg-slate-950 text-slate-400">
            <tr>
              <th className="px-4 py-3 text-center w-[60px]">#</th>
              <th className="px-4 py-3 text-left">Run</th>
              <th className="px-4 py-3 text-left">Source</th>
              <th className="px-4 py-3 text-right">Total</th>
              <th className="px-4 py-3 text-right">Success</th>
              <th className="px-4 py-3 text-right">Failed</th>
              <th className="px-4 py-3 text-right">High Balance</th>
              <th className="px-4 py-3 text-left">Started</th>
              <th className="px-4 py-3 text-left">Finished</th>
              <th className="px-4 py-3 text-left">Action</th>
            </tr>
          </thead>

          <tbody>
            {items.map((run, idx) => (
              <tr
                key={run._id}
                className="border-t border-slate-800 text-slate-200 hover:bg-slate-800/40"
              >
                <td className="px-4 py-3 text-center text-xs text-slate-500">
                  {idx + 1}
                </td>

                <td className="px-4 py-3">
                  <div className="font-medium">{run.name || '-'}</div>
                  <div className="text-xs text-slate-500">{run._id}</div>
                </td>

                <td className="px-4 py-3 max-w-[280px] truncate">
                  {run.sourceFile || '-'}
                </td>

                <td className="px-4 py-3 text-right">
                  {fmtNumber(run.totalAccounts)}
                </td>

                <td className="px-4 py-3 text-right text-emerald-400">
                  {fmtNumber(run.successCount)}
                </td>

                <td className="px-4 py-3 text-right text-rose-400">
                  {fmtNumber(run.failedCount)}
                </td>

                <td className="px-4 py-3 text-right">
                  {fmtNumber(run.highBalanceCount)}
                </td>

                <td className="px-4 py-3 whitespace-nowrap">
                  {fmtDate(run.startedAt)}
                </td>

                <td className="px-4 py-3 whitespace-nowrap">
                  {fmtDate(run.finishedAt)}
                </td>

                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    <Link
                      to={`/runs/${run._id}`}
                      className="rounded-lg bg-slate-700 px-3 py-1 text-xs text-white hover:bg-slate-600"
                    >
                      Results
                    </Link>

                    <Link
                      to={`/runs/${run._id}/stats`}
                      className="rounded-lg bg-emerald-600 px-3 py-1 text-xs text-white hover:bg-emerald-500"
                    >
                      Thống kê
                    </Link>
                  </div>
                </td>
              </tr>
            ))}

            {items.length === 0 && (
              <tr>
                <td colSpan={10} className="px-4 py-8 text-center text-slate-500">
                  Không có run nào
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}