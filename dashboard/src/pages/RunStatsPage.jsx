import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';

import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import StatCard from '../components/StatCard';
import { getRunFullStats } from '../lib/api';

import SuccessFailChart from '../components/charts/SuccessFailChart';
import BalanceBucketsChart from '../components/charts/BalanceBucketsChart';

function fmtNumber(value) {
  return Number(value || 0).toLocaleString('vi-VN');
}

function fmtDate(value) {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '-';

  return d.toLocaleString('vi-VN', {
    hour12: false
  });
}

function fmtRange(range) {
  if (!range?.min || !range?.max) return '-';
  return `${fmtDate(range.min)} → ${fmtDate(range.max)}`;
}

function StatsGrid({ stats }) {
  return (
    <div className="grid gap-3 md:grid-cols-4">
      <StatCard label="Total" value={fmtNumber(stats?.total)} />
      <StatCard label="Success" value={fmtNumber(stats?.success)} tone="success" />
      <StatCard label="Failed" value={fmtNumber(stats?.failed)} tone="fail" />
      <StatCard label="Balance > 0" value={fmtNumber(stats?.balancePositive)} tone="warn" />

      <StatCard label="Tổng Balance" value={fmtNumber(stats?.totalBalance)} />
      <StatCard
        label="Balance lớn nhất"
        value={fmtNumber(stats?.highestBalance > 0 ? stats.highestBalance : 0)}
      />
      <StatCard label="Có lịch sử cược" value={fmtNumber(stats?.playersWithBetHistory)} />
      <StatCard label="Có nạp/rút" value={fmtNumber(stats?.playersWithPaymentHistory)} />
    </div>
  );
}

export default function RunStatsPage() {
  const { runId } = useParams();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  async function loadStats() {
    try {
      setLoading(true);
      const res = await getRunFullStats(runId);
      setData(res);
    } catch (err) {
      console.error('Load full stats error:', err.message);
      alert(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStats();
  }, [runId]);

  const run = data?.run;
  const overall = data?.overall || {};
  const byFile = data?.byFile || [];

  const durationText = useMemo(() => {
    const ms = Number(run?.durationMs || 0);
    if (!ms) return '-';

    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);

    return `${minutes}m ${seconds}s`;
  }, [run]);

  return (
    <div className="flex min-h-screen bg-slate-950 text-white">
      <Sidebar />

      <main className="flex-1 p-4">
        <Topbar
          title="Run Statistics"
          subtitle={run ? `${run.name || '-'} | ${run.sourceFile || '-'}` : 'Full run stats'}
        />

        <div className="mb-4 flex items-center gap-2">
          <Link
            to="/runs"
            className="rounded-lg bg-slate-800 px-3 py-2 text-sm text-slate-200 hover:bg-slate-700"
          >
            ← Back to Runs
          </Link>

          <Link
            to={`/runs/${runId}`}
            className="rounded-lg bg-emerald-600 px-3 py-2 text-sm text-white hover:bg-emerald-500"
          >
            Xem Results
          </Link>

          <button
            onClick={loadStats}
            disabled={loading}
            className="rounded-lg bg-sky-600 px-3 py-2 text-sm text-white hover:bg-sky-500 disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4 text-sm">
            <div>
              <div className="text-xs text-slate-500">Run ID</div>
              <div className="mt-1 break-all text-slate-200">{run?._id || '-'}</div>
            </div>

            <div>
              <div className="text-xs text-slate-500">Started At</div>
              <div className="mt-1 text-slate-200">{fmtDate(run?.startedAt || run?.createdAt)}</div>
            </div>

            <div>
              <div className="text-xs text-slate-500">Finished At</div>
              <div className="mt-1 text-slate-200">{fmtDate(run?.finishedAt || run?.updatedAt)}</div>
            </div>

            <div>
              <div className="text-xs text-slate-500">Duration</div>
              <div className="mt-1 text-slate-200">{durationText}</div>
            </div>

            <div className="md:col-span-2">
              <div className="text-xs text-slate-500">TG cược</div>
              <div className="mt-1 text-slate-200">{fmtRange(overall.betRange)}</div>
            </div>

            <div className="md:col-span-2">
              <div className="text-xs text-slate-500">TG nạp/rút</div>
              <div className="mt-1 text-slate-200">{fmtRange(overall.paymentRange)}</div>
            </div>
          </div>
        </div>

        <div className="mt-4">
          <StatsGrid stats={overall} />
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <SuccessFailChart
            success={overall.success || 0}
            failed={overall.failed || 0}
          />

          <div className="rounded-xl border border-slate-800 bg-slate-900 p-3">
            <div className="mb-3 text-sm font-semibold text-slate-200">
              Dòng tiền nạp / rút
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-slate-950 p-4">
                <div className="text-xs text-slate-500">Tổng nạp</div>
                <div className="mt-2 text-xl font-semibold text-emerald-400">
                  {fmtNumber(overall.totalDeposit)}
                </div>
              </div>

              <div className="rounded-xl bg-slate-950 p-4">
                <div className="text-xs text-slate-500">Tổng rút</div>
                <div className="mt-2 text-xl font-semibold text-rose-400">
                  {fmtNumber(overall.totalWithdraw)}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-slate-800 bg-slate-900 overflow-hidden">
          <div className="border-b border-slate-800 px-4 py-3">
            <div className="font-semibold text-slate-100">Chi tiết theo file</div>
            <div className="text-xs text-slate-500">
              {byFile.length.toLocaleString('vi-VN')} file
            </div>
          </div>

          <div className="max-h-[620px] overflow-auto">
            <table className="min-w-full text-sm">
              <thead className="sticky top-0 z-10 bg-slate-950 text-slate-400">
                <tr>
                  <th className="px-4 py-3 text-center">#</th>
                  <th className="px-4 py-3 text-left">File</th>
                  <th className="px-4 py-3 text-right">Total</th>
                  <th className="px-4 py-3 text-right">Success</th>
                  <th className="px-4 py-3 text-right">Failed</th>
                  <th className="px-4 py-3 text-right">Balance &gt; 0</th>
                  <th className="px-4 py-3 text-right">Max Balance</th>
                  <th className="px-4 py-3 text-left">Max User</th>
                  <th className="px-4 py-3 text-right">Tổng Balance</th>
                  <th className="px-4 py-3 text-right">Có Cược</th>
                  <th className="px-4 py-3 text-right">Có N/R</th>
                  <th className="px-4 py-3 text-right">Tổng Nạp</th>
                  <th className="px-4 py-3 text-right">Tổng Rút</th>
                  <th className="px-4 py-3 text-left">TG Cược</th>
                  <th className="px-4 py-3 text-left">TG N/R</th>
                </tr>
              </thead>

              <tbody>
                {byFile.map((item, idx) => (
                  <tr
                    key={item.fileName}
                    className="border-t border-slate-800 text-slate-200 hover:bg-slate-800/40"
                  >
                    <td className="px-4 py-3 text-center text-xs text-slate-500">
                      {idx + 1}
                    </td>
                    <td className="px-4 py-3 font-medium">{item.fileName}</td>
                    <td className="px-4 py-3 text-right">{fmtNumber(item.total)}</td>
                    <td className="px-4 py-3 text-right text-emerald-400">{fmtNumber(item.success)}</td>
                    <td className="px-4 py-3 text-right text-rose-400">{fmtNumber(item.failed)}</td>
                    <td className="px-4 py-3 text-right">{fmtNumber(item.balancePositive)}</td>
                    <td className="px-4 py-3 text-right">{fmtNumber(item.highestBalance > 0 ? item.highestBalance : 0)}</td>
                    <td className="px-4 py-3">{item.highestBalanceUser || '-'}</td>
                    <td className="px-4 py-3 text-right">{fmtNumber(item.totalBalance)}</td>
                    <td className="px-4 py-3 text-right">{fmtNumber(item.playersWithBetHistory)}</td>
                    <td className="px-4 py-3 text-right">{fmtNumber(item.playersWithPaymentHistory)}</td>
                    <td className="px-4 py-3 text-right text-emerald-400">{fmtNumber(item.totalDeposit)}</td>
                    <td className="px-4 py-3 text-right text-rose-400">{fmtNumber(item.totalWithdraw)}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{fmtRange(item.betRange)}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{fmtRange(item.paymentRange)}</td>
                  </tr>
                ))}

                {!loading && byFile.length === 0 && (
                  <tr>
                    <td colSpan={15} className="px-4 py-8 text-center text-slate-500">
                      Không có dữ liệu thống kê
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}