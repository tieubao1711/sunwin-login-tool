import React from 'react';

import AllAccountsTable from './AllAccountsTable.jsx';
import CheckedAccountsTable from './CheckedAccountsTable';
import FlaggedAccountsTable from './FlaggedAccountsTable';

export default function AccountTable(props) {
  const { tab, items, loading } = props;

  return (
    <div className="mt-4 rounded-xl border border-slate-800 bg-slate-900 overflow-hidden">
      <div className="max-h-[650px] overflow-auto">
        {tab === 'all' && <AllAccountsTable {...props} />}
        {tab === 'checked' && <CheckedAccountsTable {...props} />}
        {tab === 'flagged' && <FlaggedAccountsTable {...props} />}

        {!loading && items.length === 0 && (
          <div className="px-4 py-8 text-center text-slate-500">
            Không có dữ liệu
          </div>
        )}
      </div>
    </div>
  );
}