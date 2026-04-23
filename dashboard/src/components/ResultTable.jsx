import StatusBadge from './StatusBadge';
import BalanceBadge from './BalanceBadge';
import CopyButton from './CopyButton';
import { getPaymentSummary } from '../utils/paymentSummary';

export default function ResultTable({ items = [], onViewDetail }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden">
      <div className="max-h-[500px] overflow-y-auto">
        <table className="min-w-full text-sm">
          
          {/* HEADER */}
          <thead className="bg-slate-950 text-slate-400 sticky top-0 z-10">
            <tr>
              <th className="px-4 py-3 text-center w-[60px]">#</th>
              <th className="px-4 py-3 text-left">Username</th>
              <th className="px-4 py-3 text-left">Password</th>
              <th className="px-4 py-3 text-left">Fullname</th>
              <th className="px-4 py-3 text-left">Phone</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Balance</th>
              <th className="px-4 py-3 text-left">Safe</th>
              <th className="px-4 py-3 text-left">Nạp gần nhất</th>
              <th className="px-4 py-3 text-left">Rút gần nhất</th>
              <th className="px-4 py-3 text-left">Message</th>
              <th className="px-4 py-3 text-left">Action</th>
            </tr>
          </thead>

          {/* BODY */}
          <tbody>
            {items.map((item, idx) => {
              const payment = getPaymentSummary(item.rawResponse, 3);

              return (
                <tr
                  key={`${item._id || item.username}-${idx}`}
                  className="border-t border-slate-800 text-slate-200"
                >
                  {/* STT */}
                  <td className="px-4 py-3 text-center text-xs text-slate-500">
                    {idx + 1}
                  </td>

                  {/* USERNAME */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <span>{item.username}</span>
                      <CopyButton text={item.username} />
                    </div>
                  </td>

                  {/* PASSWORD */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <span>{item.password || '-'}</span>
                      <CopyButton text={item.password} />
                    </div>
                  </td>

                  {/* FULLNAME */}
                  <td className="px-4 py-3">{item.fullname || '-'}</td>

                  {/* PHONE */}
                  <td className="px-4 py-3">{item.phone || '-'}</td>

                  {/* STATUS */}
                  <td className="px-4 py-3">
                    <StatusBadge value={item.status} />
                  </td>

                  {/* BALANCE */}
                  <td className="px-4 py-3">
                    <BalanceBadge value={item.balance} />
                  </td>

                  {/* SAFE */}
                  <td className="px-4 py-3">
                    {Number(item.safe || 0).toLocaleString('vi-VN')}
                  </td>

                  {/* NẠP */}
                  <td className="px-4 py-3 text-emerald-400 font-medium">
                    {payment.totalDeposit.toLocaleString('vi-VN')}
                  </td>

                  {/* RÚT */}
                  <td className="px-4 py-3 text-rose-400 font-medium">
                    {payment.totalWithdraw.toLocaleString('vi-VN')}
                  </td>

                  {/* MESSAGE */}
                  <td className="px-4 py-3 max-w-[280px] truncate">
                    {item.message || '-'}
                  </td>

                  {/* ACTION */}
                  <td className="px-4 py-3">
                    <button
                      onClick={() => onViewDetail?.(item)}
                      className="rounded-lg bg-emerald-600 px-3 py-1 text-xs font-medium text-white hover:bg-emerald-500"
                    >
                      Chi tiết
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>

        </table>
      </div>
    </div>
  );
}