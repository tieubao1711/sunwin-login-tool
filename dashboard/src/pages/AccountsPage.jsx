import React from 'react';

import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';

import { useAccountsCenter } from '../hooks/useAccountsCenter';
import AccountTabs from '../components/accounts/AccountTabs';
import AccountFilters from '../components/accounts/AccountFilters';
import AccountTable from '../components/accounts/AccountTable';

export default function AccountsPage() {
  const accounts = useAccountsCenter();

  return (
    <div className="flex min-h-screen bg-slate-950 text-white">
      <Sidebar />

      <main className="flex-1 p-4">
        <Topbar
          title="Accounts Center"
          subtitle="Quản lý tài khoản, tài khoản đã check và tài khoản chú ý"
        />

        <AccountTabs tab={accounts.tab} setTab={accounts.setTab} />

        <AccountFilters {...accounts} />

        <AccountTable {...accounts} />

        <div className="mt-4 flex items-center justify-between">
          <button
            disabled={accounts.page <= 1}
            onClick={() => accounts.setPage((p) => Math.max(1, p - 1))}
            className="rounded-lg bg-slate-800 px-4 py-2 text-sm disabled:opacity-40 hover:bg-slate-700"
          >
            Previous
          </button>

          <div className="text-sm text-slate-400">
            Page {accounts.page} / {accounts.totalPages}
          </div>

          <button
            disabled={accounts.page >= accounts.totalPages}
            onClick={() =>
              accounts.setPage((p) => Math.min(accounts.totalPages, p + 1))
            }
            className="rounded-lg bg-slate-800 px-4 py-2 text-sm disabled:opacity-40 hover:bg-slate-700"
          >
            Next
          </button>
        </div>
      </main>
    </div>
  );
}