import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';

import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import StatCard from '../components/StatCard';
import ResultTable from '../components/ResultTable';
import AccountDetailModal from '../components/AccountDetailModal';
import ResultFilters from '../components/ResultFilters';

import { getRun, getRunResults, getRunStats, getResultDetail } from '../lib/api';
import { socket } from '../lib/socket';

export default function RunDetailPage() {
  const { runId } = useParams();

  const [run, setRun] = useState(null);
  const [stats, setStats] = useState(null);
  const [results, setResults] = useState([]);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [hasTransaction, setHasTransaction] = useState(false);
  const [hasDeposit, setHasDeposit] = useState(false);
  const [hasWithdraw, setHasWithdraw] = useState(false);

  const [selectedItem, setSelectedItem] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const loadResults = useCallback(async () => {
    try {
      const resultData = await getRunResults(runId, {
        limit: 500,
        search,
        status: statusFilter,
        hasTransaction,
        hasDeposit,
        hasWithdraw
      });

      setResults(resultData.items || []);
    } catch (err) {
      console.error('Run detail results load error:', err.message);
    }
  }, [runId, search, statusFilter, hasTransaction, hasDeposit, hasWithdraw]);

  const itemMatchesFilters = useCallback(
    (item) => {
      if (statusFilter && item.status !== statusFilter) return false;

      const q = search.trim().toLowerCase();
      if (q) {
        const matched = [item.username, item.fullname, item.message, item.phone]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(q));

        if (!matched) return false;
      }

      if (hasTransaction && Number(item.transactionCount || 0) <= 0) return false;
      if (hasDeposit && Number(item.slipCount || 0) <= 0) return false;
      if (hasWithdraw && Number(item.slipCount || 0) <= 0) return false;

      return true;
    },
    [search, statusFilter, hasTransaction, hasDeposit, hasWithdraw]
  );

  useEffect(() => {
    async function load() {
      try {
        const [runData, statsData] = await Promise.all([
          getRun(runId),
          getRunStats(runId)
        ]);

        setRun(runData);
        setStats(statsData);
        await loadResults();
      } catch (err) {
        console.error('Run detail load error:', err.message);
      }
    }

    load();
  }, [runId, loadResults]);

  // reload API khi đổi filter/search
  useEffect(() => {
    const timer = setTimeout(() => {
      loadResults();
    }, 300);

    return () => clearTimeout(timer);
  }, [loadResults]);

  // socket realtime chỉ đăng ký 1 lần theo filter hiện tại
  useEffect(() => {
    function refresh() {
      loadResults();
    }

    function onConnect() {
      console.log('✅ RunDetail socket connected');
      refresh();
    }

    function onResult(payload) {
      if (String(payload.runId) !== String(runId)) return;

      console.log('🔥 RunDetail got result', payload.item?.username);

      setStats((prev) => {
        const base = prev || {
          successCount: 0,
          failedCount: 0,
          highBalanceCount: 0
        };

        return {
          ...base,
          successCount:
            (base.successCount || 0) +
            (payload.item.status === 'SUCCESS' ? 1 : 0),
          failedCount:
            (base.failedCount || 0) +
            (payload.item.status === 'FAILED' ? 1 : 0),
          highBalanceCount:
            (base.highBalanceCount || 0) +
            (Number(payload.item.balance || 0) > 100000 ? 1 : 0)
        };
      });

      if (itemMatchesFilters(payload.item)) {
        setResults((prev) => {
          const existed = prev.some(
            (x) => String(x._id) === String(payload.item._id)
          );

          if (existed) return prev;

          return [payload.item, ...prev].slice(0, 500);
        });
      }
    }

    function onSummary(payload) {
      if (String(payload.runId) !== String(runId)) return;

      setRun((prev) => ({
        ...(prev || {}),
        ...(payload.summary || {}),
        _id: runId
      }));

      setStats({
        successCount: payload.summary?.successCount || 0,
        failedCount: payload.summary?.failedCount || 0,
        highBalanceCount: payload.summary?.highBalanceCount || 0
      });

      refresh();
    }

    socket.on('connect', onConnect);
    socket.io.on('reconnect', onConnect);
    socket.on('run:result', onResult);
    socket.on('run:summary', onSummary);

    return () => {
      socket.off('connect', onConnect);
      socket.io.off('reconnect', onConnect);
      socket.off('run:result', onResult);
      socket.off('run:summary', onSummary);
    };
  }, [runId, loadResults, itemMatchesFilters]);

  const summary = useMemo(() => {
    return {
      totalAccounts: run?.totalAccounts || 0,
      successCount: stats?.successCount || 0,
      failedCount: stats?.failedCount || 0,
      highBalanceCount: stats?.highBalanceCount || 0
    };
  }, [run, stats]);

  async function handleViewDetail(item) {
    try {
      const detail = await getResultDetail(item._id);
      setSelectedItem(detail);
      setDetailOpen(true);
    } catch (err) {
      console.error('Load detail error:', err.message);
    }
  }

  return (
    <div className="flex min-h-screen bg-slate-950 text-white">
      <Sidebar />

      <main className="flex-1 p-6">
        <Topbar
          title={run?.runName || run?.name || 'Run Detail'}
          subtitle={run?.sourceFile || ''}
        />

        <div className="grid gap-4 md:grid-cols-4">
          <StatCard label="Total" value={summary.totalAccounts} />
          <StatCard
            label="Success"
            value={summary.successCount}
            tone="success"
          />
          <StatCard
            label="Failed"
            value={summary.failedCount}
            tone="fail"
          />
          <StatCard
            label="High Balance"
            value={summary.highBalanceCount}
            tone="warn"
          />
        </div>

        <div className="mt-6">
          <ResultFilters
            search={search}
            setSearch={setSearch}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            hasTransaction={hasTransaction}
            setHasTransaction={setHasTransaction}
            hasDeposit={hasDeposit}
            setHasDeposit={setHasDeposit}
            hasWithdraw={hasWithdraw}
            setHasWithdraw={setHasWithdraw}
          />
        </div>

        <div className="mt-6">
          <ResultTable
            items={results}
            onViewDetail={handleViewDetail}
          />
        </div>

        <AccountDetailModal
          open={detailOpen}
          item={selectedItem}
          onClose={() => {
            setDetailOpen(false);
            setSelectedItem(null);
          }}
        />
      </main>
    </div>
  );
}