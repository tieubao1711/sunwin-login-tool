import React from 'react';
import CopyButton from '../CopyButton';

export default function AllAccountsTable({
  items,
  page,
  limit,
  formatNumber
}) {
  return (
    <table className="min-w-full text-sm">
      <thead className="sticky top-0 z-10 bg-slate-950 text-slate-400">
        <tr>
          <th className="px-4 py-3 text-center w-[60px]">#</th>
          <th className="px-4 py-3 text-left">Username</th>
          <th className="px-4 py-3 text-left">Password</th>
          <th className="px-4 py-3 text-left">File</th>
          <th className="px-4 py-3 text-left">Checked</th>
          <th className="px-4 py-3 text-right">Balance</th>
        </tr>
      </thead>

      <tbody>
        {items.map((acc, idx) => (
          <tr
            key={`${acc._id || acc.username}-${idx}`}
            className="border-t border-slate-800 text-slate-200 hover:bg-slate-800/40"
          >
            <td className="px-4 py-3 text-center text-xs text-slate-500">
              {(page - 1) * limit + idx + 1}
            </td>

            <td className="px-4 py-3">
              <div className="flex items-center gap-1">
                <span>{acc.username}</span>
                <CopyButton text={acc.username} />
              </div>
            </td>

            <td className="px-4 py-3">
              <div className="flex items-center gap-1">
                <span>{acc.password}</span>
                <CopyButton text={acc.password} />
              </div>
            </td>

            <td className="px-4 py-3 text-slate-400">
              {acc.fileName || '-'}
            </td>

            <td className="px-4 py-3">
              {acc.isChecked ? (
                <span className="rounded-full bg-emerald-500/10 px-2 py-1 text-xs text-emerald-400">
                  {acc.checkedStatus || 'CHECKED'}
                </span>
              ) : (
                <span className="rounded-full bg-slate-700 px-2 py-1 text-xs text-slate-400">
                  NEW
                </span>
              )}
            </td>

            <td className="px-4 py-3 text-right text-emerald-300">
              {formatNumber(acc.checkedBalance)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}