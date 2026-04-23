import React, { useEffect, useMemo, useState } from 'react';

import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import StatCard from '../components/StatCard';
import ProgressCard from '../components/ProgressCard';
import ResultTable from '../components/ResultTable';
import AccountDetailModal from '../components/AccountDetailModal';
import ResultFilters from '../components/ResultFilters';

import SuccessFailChart from '../components/charts/SuccessFailChart';
import BalanceBucketsChart from '../components/charts/BalanceBucketsChart';
import RunControlPanel from '../components/RunControlPanel';

import { getLatestRun, getRunResults, getResultDetail } from '../lib/api';
import { socket } from '../lib/socket';

export default function DashboardPage() {
  const [latestRun, setLatestRun] = useState(null);
  const [results, setResults] = useState([]);
  const [liveSummary, setLiveSummary] = useState(null);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [hasTransaction, setHasTransaction] = useState(false);
  const [hasDeposit, setHasDeposit] = useState(false);
  const [hasWithdraw, setHasWithdraw] = useState(false);

  const [selectedItem, setSelectedItem] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const currentRunId = useMemo(() => {
    if (liveSummary?.runId) return String(liveSummary.runId);
    if (latestRun?._id) return String(latestRun._id);
    return '';
  }, [liveSummary, latestRun]);

  async function loadResults(runId, extraParams = {}) {
    if (!runId) return;

    try {
      const res = await getRunResults(runId, {
        limit: 500,
        search,
        status: statusFilter,
        hasTransaction,
        hasDeposit,
        hasWithdraw,
        ...extraParams
      });

      setResults(res.items || []);
    } catch (err) {
      console.error('Load results error:', err.message);
    }
  }

  useEffect(() => {
    async function bootstrap() {
      try {
        const run = await getLatestRun();
        setLatestRun(run);

        if (run?._id) {
          setLiveSummary({
            ...run,
            runId: String(run._id)
          });

          await loadResults(String(run._id), {});
        }
      } catch (err) {
        console.error('Init load error:', err.message);
      }
    }

    bootstrap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!currentRunId) return;

    const timer = setTimeout(() => {
      loadResults(currentRunId);
    }, 250);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    currentRunId,
    search,
    statusFilter,
    hasTransaction,
    hasDeposit,
    hasWithdraw
  ]);

  useEffect(() => {
    function onStarted(payload) {
      setLiveSummary({
        runId: String(payload.runId),
        totalAccounts: payload.totalAccounts,
        successCount: 0,
        failedCount: 0,
        highBalanceCount: 0
      });

      setResults([]);
    }

    function onResult(payload) {
      setLiveSummary((prev) => {
        if (!prev) return prev;
        if (String(prev.runId) !== String(payload.runId)) return prev;

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

      loadResults(String(payload.runId));
    }

    function onSummary(payload) {
      setLiveSummary({
        ...payload.summary,
        runId: String(payload.runId)
      });

      loadResults(String(payload.runId));
    }

    socket.on('run:started', onStarted);
    socket.on('run:result', onResult);
    socket.on('run:summary', onSummary);

    return () => {
      socket.off('run:started', onStarted);
      socket.off('run:result', onResult);
      socket.off('run:summary', onSummary);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, statusFilter, hasTransaction, hasDeposit, hasWithdraw]);

  const summary = useMemo(() => {
    if (liveSummary) return liveSummary;

    if (latestRun) {
      return {
        ...latestRun,
        runId: String(latestRun._id)
      };
    }

    return {};
  }, [liveSummary, latestRun]);

  const processed = useMemo(() => {
    return Number(summary.successCount || 0) + Number(summary.failedCount || 0);
  }, [summary]);

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

      <main className="flex-1 p-4">
        <Topbar
          title="Dashboard"
          subtitle="Realtime monitoring & analytics"
        />

        <div className="grid gap-3 md:grid-cols-4">
          <StatCard label="Total" value={summary.totalAccounts || 0} />
          <StatCard
            label="Success"
            value={summary.successCount || 0}
            tone="success"
          />
          <StatCard
            label="Failed"
            value={summary.failedCount || 0}
            tone="fail"
          />
          <StatCard
            label="High Balance"
            value={summary.highBalanceCount || 0}
            tone="warn"
          />
        </div>

        <div className="mb-4 mt-3">
          <RunControlPanel />
        </div>

        <div className="mt-3 grid gap-3 xl:grid-cols-[1.3fr,0.9fr,1fr]">
          <ProgressCard
            total={summary.totalAccounts || 0}
            processed={processed}
          />

          <SuccessFailChart
            success={summary.successCount || 0}
            failed={summary.failedCount || 0}
          />

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

        <div className="mt-3">
          <ResultTable
            items={results}
            onViewDetail={handleViewDetail}
          />
        </div>

        <div className="mt-3">
          <BalanceBucketsChart items={results} />
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