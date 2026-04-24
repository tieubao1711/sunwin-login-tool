import React, { useEffect, useMemo, useState } from 'react';

import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import CopyButton from '../components/CopyButton';
import { getAccounts } from '../lib/api';

export default function AccountsPage() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);

  const [search, setSearch] = useState('');
  const [fileName, setFileName] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);

  const [loading, setLoading] = useState(false);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(total / limit));
  }, [total, limit]);

  async function loadAccounts() {
    try {
      setLoading(true);

      const cleanFileName = fileName
        .split(',')
        .map((x) => x.trim())
        .filter(Boolean)
        .join(',');

      const res = await getAccounts({
        page,
        limit,
        search,
        fileName: cleanFileName
      });

      setItems(res.items || []);
      setTotal(res.total || res.count || 0);
    } catch (err) {
      console.error('Load accounts error:', err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      loadAccounts();
    }, 300);

    return () => clearTimeout(timer);
  }, [page, limit, search, fileName]);

  function resetFilters() {
    setSearch('');
    setFileName('');
    setPage(1);
  }

  return (
    <div className="flex min-h-screen bg-slate-950 text-white">
      <Sidebar />

      <main className="flex-1 p-4">
        <Topbar title="Accounts" subtitle="Danh sách tài khoản theo file" />

        <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
          <div className="grid gap-3 md:grid-cols-[1.2fr,1.2fr,0.6fr]">
            <div>
              <div className="mb-1 text-xs text-slate-400">Search</div>
              <input
                value={search}
                onChange={(e) => {
                  setPage(1);
                  setSearch(e.target.value);
                }}
                placeholder="username / password..."
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <div className="mb-1 text-xs text-slate-400">
                File Name (comma separated)
              </div>
              <input
                value={fileName}
                onChange={(e) => {
                  setPage(1);
                  setFileName(e.target.value);
                }}
                placeholder="kendy1.json,kendy2.json"
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex items-end gap-2">
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
              Total: {total.toLocaleString('vi-VN')} accounts
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

        <div className="mt-4 rounded-xl border border-slate-800 bg-slate-900 overflow-hidden">
          <div className="max-h-[650px] overflow-y-auto">
            <table className="min-w-full text-sm">
              <thead className="sticky top-0 z-10 bg-slate-950 text-slate-400">
                <tr>
                  <th className="px-4 py-3 text-center w-[60px]">#</th>
                  <th className="px-4 py-3 text-left">Username</th>
                  <th className="px-4 py-3 text-left">Password</th>
                  <th className="px-4 py-3 text-left">File</th>
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
                  </tr>
                ))}

                {!loading && items.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-4 py-8 text-center text-slate-500"
                    >
                      Không có dữ liệu
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="rounded-lg bg-slate-800 px-4 py-2 text-sm disabled:opacity-40 hover:bg-slate-700"
          >
            Previous
          </button>

          <div className="text-sm text-slate-400">
            Page {page} / {totalPages}
          </div>

          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="rounded-lg bg-slate-800 px-4 py-2 text-sm disabled:opacity-40 hover:bg-slate-700"
          >
            Next
          </button>
        </div>
      </main>
    </div>
  );
}