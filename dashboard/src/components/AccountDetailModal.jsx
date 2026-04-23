import React from 'react';

function fmtMoney(value) {
  return Number(value || 0).toLocaleString('vi-VN');
}

function fmtTime(value) {
  if (!value) return '-';
  const num = Number(value);
  if (!Number.isNaN(num) && String(value).length >= 10) {
    const ms = String(value).length === 10 ? num * 1000 : num;
    return new Date(ms).toLocaleString();
  }
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? String(value) : d.toLocaleString();
}

function Section({ title, items, renderItem }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
      <div className="mb-3 text-sm font-semibold text-slate-200">{title}</div>

      {!items?.length ? (
        <div className="text-sm text-slate-500">Không có dữ liệu</div>
      ) : (
        <div className="space-y-3">
          {items.map((item, idx) => (
            <div
              key={idx}
              className="rounded-xl border border-slate-800 bg-slate-950 p-3 text-sm"
            >
              {renderItem(item)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AccountDetailModal({ open, item, onClose }) {
  if (!open || !item) return null;

  const raw = item.rawResponse || {};
  const transactions = raw?.data?.transactions?.data?.items || [];
  const depositItems = raw?.data?.slipHistory?.deposit?.data?.items || [];
  const withdrawItems = raw?.data?.slipHistory?.withdraw?.data?.items || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="max-h-[92vh] w-full max-w-7xl overflow-auto rounded-2xl border border-slate-800 bg-slate-950 shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-800 bg-slate-950 px-6 py-4">
          <div>
            <div className="text-lg font-semibold text-white">
              Chi tiết account: {item.username}
            </div>
            <div className="mt-1 text-sm text-slate-400">
              {item.fullname || '-'} | {item.phone || '-'}
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl bg-slate-800 px-4 py-2 text-sm text-white hover:bg-slate-700"
          >
            Đóng
          </button>
        </div>

        <div className="grid gap-4 p-6 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
            <div className="text-sm text-slate-400">Username</div>
            <div className="mt-2 font-medium">{item.username}</div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
            <div className="text-sm text-slate-400">Password</div>
            <div className="mt-2 font-medium">{item.password || '-'}</div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
            <div className="text-sm text-slate-400">Balance</div>
            <div className="mt-2 font-medium">{fmtMoney(item.balance)}</div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
            <div className="text-sm text-slate-400">Safe</div>
            <div className="mt-2 font-medium">{fmtMoney(item.safe)}</div>
          </div>
        </div>

        <div className="grid gap-4 px-6 pb-6 lg:grid-cols-3">
          <Section
            title="Lịch sử cược"
            items={transactions}
            renderItem={(tx) => (
              <div className="space-y-1">
                <div className="font-medium text-white">
                  {tx.serviceName || '-'} | {fmtMoney(tx.exchangeValue)}
                </div>
                <div className="text-slate-300">{tx.description || '-'}</div>
                <div className="text-slate-500">
                  Closing: {fmtMoney(tx.closingValue)} | Time: {fmtTime(tx.createdTime)}
                </div>
              </div>
            )}
          />

          <Section
            title="Lịch sử nạp"
            items={depositItems}
            renderItem={(tx) => (
              <div className="space-y-1">
                <div className="font-medium text-white">
                  {fmtMoney(tx.amount)} | {tx.statusDescription || '-'}
                </div>
                <div className="text-slate-300">
                  {tx.bankReceive?.accountName || '-'} - {tx.bankReceive?.accountNumber || '-'}
                </div>
                <div className="text-slate-500">
                  Request: {fmtTime(tx.requestTime)} | Response: {fmtTime(tx.responseTime)}
                </div>
                <div className="text-slate-500">
                  Code: {tx.transactionCode || '-'} | Note: {tx.notes || '-'}
                </div>
              </div>
            )}
          />

          <Section
            title="Lịch sử rút"
            items={withdrawItems}
            renderItem={(tx) => (
              <div className="space-y-1">
                <div className="font-medium text-white">
                  {fmtMoney(tx.amount)} | {tx.statusDescription || '-'}
                </div>
                <div className="text-slate-300">
                  {tx.bankReceive?.accountName || '-'} - {tx.bankReceive?.accountNumber || '-'}
                </div>
                <div className="text-slate-500">
                  Request: {fmtTime(tx.requestTime)} | Response: {fmtTime(tx.responseTime)}
                </div>
                <div className="text-slate-500">
                  Note: {tx.notes || '-'}
                </div>
              </div>
            )}
          />
        </div>
      </div>
    </div>
  );
}