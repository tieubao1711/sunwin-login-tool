import React from 'react';
import CopyButton from '../CopyButton';

export default function CheckedAccountsTable({
  items,
  page,
  limit,
  formatNumber
}) {
  function formatDate(value) {
    if (!value) return '-';
    return new Date(value).toLocaleString('vi-VN');
  }

  return (
    <table className="min-w-full text-sm">
      <thead className="sticky top-0 z-10 bg-slate-950 text-slate-400">
        <tr>
          <th className="px-4 py-3 text-center w-[60px]">#</th>
          <th className="px-4 py-3 text-left">Username</th>
          <th className="px-4 py-3 text-left">Password</th>
          <th className="px-4 py-3 text-left">Display Name</th>
          <th className="px-4 py-3 text-left">Phone</th>
          <th className="px-4 py-3 text-right">Balance</th>
          <th className="px-4 py-3 text-right">Safe</th>
          <th className="px-4 py-3 text-left">Status</th>
          <th className="px-4 py-3 text-left">Message</th>
          <th className="px-4 py-3 text-left">Updated</th>
        </tr>
      </thead>

      <tbody>
        {items.map((acc, idx) => (
          <tr
            key={`${acc._id || acc.accountId || acc.username}-${idx}`}
            className="border-t border-slate-800 text-slate-200 hover:bg-slate-800/40"
          >
            <td className="px-4 py-3 text-center text-xs text-slate-500">
              {(page - 1) * limit + idx + 1}
            </td>

            <td className="px-4 py-3">
              <div className="flex items-center gap-1">
                <span>{acc.username || '-'}</span>
                <CopyButton text={acc.username || ''} />
              </div>
            </td>

            <td className="px-4 py-3">
              <div className="flex items-center gap-1">
                <span>{acc.password || '-'}</span>
                <CopyButton text={acc.password || ''} />
              </div>
            </td>

            <td className="px-4 py-3 text-slate-300">
              {acc.displayName || '-'}
            </td>

            <td className="px-4 py-3 text-slate-300">
              {acc.phone || '-'}
            </td>

            <td className="px-4 py-3 text-right text-emerald-300">
              {formatNumber(acc.balance)}
            </td>

            <td className="px-4 py-3 text-right text-cyan-300">
              {formatNumber(acc.safe)}
            </td>

            <td className="px-4 py-3">
              <span
                className={[
                  'rounded-full px-2 py-1 text-xs',
                  acc.status === 'SUCCESS'
                    ? 'bg-emerald-500/10 text-emerald-400'
                    : 'bg-rose-500/10 text-rose-400'
                ].join(' ')}
              >
                {acc.status || '-'}
              </span>
            </td>

            <td className="px-4 py-3 max-w-[320px] truncate text-slate-400">
              {acc.message || '-'}
            </td>

            <td className="px-4 py-3 whitespace-nowrap text-slate-400">
              {formatDate(acc.updatedAt)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}