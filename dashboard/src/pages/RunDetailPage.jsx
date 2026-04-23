import React, { useEffect, useMemo, useState } from 'react';
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

  async function loadResults(extraParams = {}) {
    try {
      const resultData = await getRunResults(runId, {
        limit: 500,
        search,
        status: statusFilter,
        hasTransaction,
        hasDeposit,
        hasWithdraw,
        ...extraParams
      });

      setResults(resultData.items || []);
    } catch (err) {
      console.error('Run detail results load error:', err.message);
    }
  }

  useEffect(() => {
    async function load() {
      try {
        const [runData, statsData] = await Promise.all([
          getRun(runId),
          getRunStats(runId)
        ]);

        setRun(runData);
        setStats(statsData);
        await loadResults({});
      } catch (err) {
        console.error('Run detail load error:', err.message);
      }
    }

    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadResults();
    }, 250);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runId, search, statusFilter, hasTransaction, hasDeposit, hasWithdraw]);

  useEffect(() => {
    function onResult(payload) {
      if (String(payload.runId) !== String(runId)) return;

      setStats((prev) => {
        if (!prev) return prev;

        return {
          ...prev,
          successCount:
            (prev.successCount || 0) +
            (payload.item.status === 'SUCCESS' ? 1 : 0),
          failedCount:
            (prev.failedCount || 0) +
            (payload.item.status === 'FAILED' ? 1 : 0),
          highBalanceCount:
            (prev.highBalanceCount || 0) +
            (Number(payload.item.balance || 0) > 100000 ? 1 : 0)
        };
      });

      loadResults();
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

      loadResults();
    }

    socket.on('run:result', onResult);
    socket.on('run:summary', onSummary);

    return () => {
      socket.off('run:result', onResult);
      socket.off('run:summary', onSummary);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runId, search, statusFilter, hasTransaction, hasDeposit, hasWithdraw]);

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