import React, { useEffect, useState } from 'react';
import {
  loadAccountsFromApi,
  startRun,
  pauseRun,
  resumeRun,
  stopRun
} from '../lib/api';

export default function RunControlPanel({ onLoaded }) {
  const [accountApiUrl, setAccountApiUrl] = useState('http://103.82.135.143:1711');
  const [concurrency, setConcurrency] = useState(3);
  const [delayBetweenRequestsMs, setDelayBetweenRequestsMs] = useState(1000);
  const [highBalanceThreshold, setHighBalanceThreshold] = useState(100000);
  const [loadedTotal, setLoadedTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('runControlConfig');
    if (!saved) return;

    try {
      const parsed = JSON.parse(saved);

      setAccountApiUrl(parsed.accountApiUrl || 'http://103.82.135.143:1711');
      setConcurrency(Number(parsed.concurrency || 3));
      setDelayBetweenRequestsMs(Number(parsed.delayBetweenRequestsMs || 1000));
      setHighBalanceThreshold(Number(parsed.highBalanceThreshold || 100000));
    } catch (err) {
      console.error('Load local config failed:', err.message);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      'runControlConfig',
      JSON.stringify({
        accountApiUrl,
        concurrency,
        delayBetweenRequestsMs,
        highBalanceThreshold
      })
    );
  }, [accountApiUrl, concurrency, delayBetweenRequestsMs, highBalanceThreshold]);

  async function handleLoad() {
    try {
      setLoading(true);
      const res = await loadAccountsFromApi({ accountApiUrl });
      setLoadedTotal(res.total || 0);
      onLoaded?.(res);
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleStart() {
    try {
      setLoading(true);
      await startRun({
        accountApiUrl,
        concurrency,
        delayBetweenRequestsMs,
        highBalanceThreshold
      });
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handlePause() {
    try {
      await pauseRun();
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleResume() {
    try {
      await resumeRun();
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleStop() {
    try {
      await stopRun();
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
      <div className="mb-3 text-sm font-semibold text-slate-200">
        Run Control
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <div>
          <div className="mb-1 text-xs text-slate-400">Account API URL</div>
          <input
            value={accountApiUrl}
            onChange={(e) => setAccountApiUrl(e.target.value)}
            placeholder="http://103.82.135.143:1711"
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-emerald-500"
          />
          <div className="mt-1 text-[11px] text-slate-500">
            API nguồn account. Hệ thống sẽ gọi <code>/accounts?all=true</code>
          </div>
        </div>

        <div>
          <div className="mb-1 text-xs text-slate-400">Concurrency</div>
          <input
            type="number"
            min="1"
            value={concurrency}
            onChange={(e) => setConcurrency(Number(e.target.value))}
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-emerald-500"
          />
          <div className="mt-1 text-[11px] text-slate-500">
            Số account chạy song song. Khuyên dùng 3–5.
          </div>
        </div>

        <div>
          <div className="mb-1 text-xs text-slate-400">Delay (ms)</div>
          <input
            type="number"
            min="0"
            value={delayBetweenRequestsMs}
            onChange={(e) => setDelayBetweenRequestsMs(Number(e.target.value))}
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-emerald-500"
          />
          <div className="mt-1 text-[11px] text-slate-500">
            Thời gian nghỉ giữa mỗi request theo từng worker.
          </div>
        </div>

        <div>
          <div className="mb-1 text-xs text-slate-400">High Balance Threshold</div>
          <input
            type="number"
            min="0"
            value={highBalanceThreshold}
            onChange={(e) => setHighBalanceThreshold(Number(e.target.value))}
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-emerald-500"
          />
          <div className="mt-1 text-[11px] text-slate-500">
            Account có số dư lớn hơn ngưỡng này sẽ được đánh dấu.
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          onClick={handleLoad}
          disabled={loading}
          className="rounded-lg bg-slate-700 px-4 py-2 text-sm text-white transition hover:bg-slate-600 disabled:opacity-50"
        >
          Load Accounts
        </button>

        <button
          onClick={handleStart}
          disabled={loading}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm text-white transition hover:bg-emerald-500 disabled:opacity-50"
        >
          Start
        </button>

        <button
          onClick={handlePause}
          className="rounded-lg bg-amber-600 px-4 py-2 text-sm text-white transition hover:bg-amber-500"
        >
          Pause
        </button>

        <button
          onClick={handleResume}
          className="rounded-lg bg-sky-600 px-4 py-2 text-sm text-white transition hover:bg-sky-500"
        >
          Resume
        </button>

        <button
          onClick={handleStop}
          className="rounded-lg bg-rose-600 px-4 py-2 text-sm text-white transition hover:bg-rose-500"
        >
          Stop
        </button>
      </div>

      <div className="mt-3 text-sm text-slate-400">
        Loaded: {loadedTotal.toLocaleString('vi-VN')} accounts
      </div>
    </div>
  );
}