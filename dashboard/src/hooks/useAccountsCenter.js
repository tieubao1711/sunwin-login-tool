import { useEffect, useMemo, useState } from 'react';
import {
  getAccounts,
  getAccountChecked,
  getAccountFlagged
} from '../lib/api';

export function useAccountsCenter() {
  const [tab, setTab] = useState('all');

  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);

  const [search, setSearch] = useState('');
  const [fileName, setFileName] = useState('');
  const [status, setStatus] = useState('');

  const [minBalance, setMinBalance] = useState('');
  const [maxBalance, setMaxBalance] = useState('');
  const [minDeposit, setMinDeposit] = useState('');
  const [minWithdraw, setMinWithdraw] = useState('');

  const [hasDeposit, setHasDeposit] = useState(false);
  const [hasWithdraw, setHasWithdraw] = useState(false);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);
  const [loading, setLoading] = useState(false);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(total / limit));
  }, [total, limit]);

  function cleanFileName() {
    return fileName
      .split(',')
      .map((x) => x.trim())
      .filter(Boolean)
      .join(',');
  }

  async function loadData() {
    try {
      setLoading(true);

      let res;

      if (tab === 'all') {
        res = await getAccounts({
          page,
          limit,
          search,
          fileName: cleanFileName()
        });
      }

      if (tab === 'checked') {
        res = await getAccountChecked({
          page,
          limit,
          search,
          status,
          minBalance,
          maxBalance
        });
      }

      if (tab === 'flagged') {
        res = await getAccountFlagged({
          page,
          limit,
          search,
          hasDeposit,
          hasWithdraw,
          minDeposit,
          minWithdraw
        });
      }

      setItems(res?.items || []);
      setTotal(res?.pagination?.total || res?.total || res?.count || 0);
    } catch (err) {
      console.error('Load accounts error:', err.message);
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = setTimeout(loadData, 300);
    return () => clearTimeout(timer);
  }, [
    tab,
    page,
    limit,
    search,
    fileName,
    status,
    minBalance,
    maxBalance,
    minDeposit,
    minWithdraw,
    hasDeposit,
    hasWithdraw
  ]);

  function changeTab(nextTab) {
    setTab(nextTab);
    setItems([]);
    setTotal(0);
    setPage(1);
  }

  function resetFilters() {
    setSearch('');
    setFileName('');
    setStatus('');
    setMinBalance('');
    setMaxBalance('');
    setMinDeposit('');
    setMinWithdraw('');
    setHasDeposit(false);
    setHasWithdraw(false);
    setPage(1);
  }

  function formatNumber(value) {
    return Number(value || 0).toLocaleString('vi-VN');
  }

  return {
    tab,
    setTab: changeTab,

    items,
    total,
    totalPages,
    loading,

    search,
    setSearch,
    fileName,
    setFileName,
    status,
    setStatus,

    minBalance,
    setMinBalance,
    maxBalance,
    setMaxBalance,
    minDeposit,
    setMinDeposit,
    minWithdraw,
    setMinWithdraw,

    hasDeposit,
    setHasDeposit,
    hasWithdraw,
    setHasWithdraw,

    page,
    setPage,
    limit,
    setLimit,

    resetFilters,
    formatNumber
  };
}