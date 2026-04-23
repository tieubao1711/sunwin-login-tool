import React from 'react';
import { Link } from 'react-router-dom';

export default function RunTable({ items = [] }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
      <table className="min-w-full text-sm">
        <thead className="bg-slate-950 text-slate-400">
          <tr>
            <th className="px-4 py-3 text-left">Run</th>
            <th className="px-4 py-3 text-left">Total</th>
            <th className="px-4 py-3 text-left">Success</th>
            <th className="px-4 py-3 text-left">Failed</th>
            <th className="px-4 py-3 text-left">Started</th>
          </tr>
        </thead>
        <tbody>
          {items.map((run) => (
            <tr key={run._id} className="border-t border-slate-800 text-slate-200">
              <td className="px-4 py-3">
                <Link
                  to={`/runs/${run._id}`}
                  className="text-emerald-300 hover:underline"
                >
                  {run.name}
                </Link>
              </td>
              <td className="px-4 py-3">{run.totalAccounts}</td>
              <td className="px-4 py-3">{run.successCount || 0}</td>
              <td className="px-4 py-3">{run.failedCount || 0}</td>
              <td className="px-4 py-3">
                {run.startedAt ? new Date(run.startedAt).toLocaleString() : '-'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}