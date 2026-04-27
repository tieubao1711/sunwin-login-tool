import React, { useState } from 'react';
import CopyButton from '../CopyButton';
import AccountDetailModal from '../AccountDetailModal';

export default function FlaggedAccountsTable({
  items,
  page,
  limit,
  formatNumber
}) {
  const [selected, setSelected] = useState(null);

  function handleViewDetail(acc) {
    setSelected(acc);
  }

  function handleCloseDetail() {
    setSelected(null);
  }

  return (
    <>
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
            <th className="px-4 py-3 text-center">Deposit</th>
            <th className="px-4 py-3 text-center">Withdraw</th>
            <th className="px-4 py-3 text-right">Total Deposit</th>
            <th className="px-4 py-3 text-right">Total Withdraw</th>
            <th className="px-4 py-3 text-center">Action</th>
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

              <td className="px-4 py-3 text-center text-amber-300">
                {formatNumber(acc.depositCount)}
              </td>

              <td className="px-4 py-3 text-center text-orange-300">
                {formatNumber(acc.withdrawCount)}
              </td>

              <td className="px-4 py-3 text-right text-amber-300">
                {formatNumber(acc.totalDeposit)}
              </td>

              <td className="px-4 py-3 text-right text-orange-300">
                {formatNumber(acc.totalWithdraw)}
              </td>

              <td className="px-4 py-3 text-center">
                <button
                  onClick={() => handleViewDetail(acc)}
                  className="rounded-lg bg-indigo-500 px-3 py-1 text-xs font-medium text-white hover:bg-indigo-400"
                >
                  Chi tiết
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <AccountDetailModal
        open={!!selected}
        item={selected}
        onClose={handleCloseDetail}
      />
    </>
  );
}