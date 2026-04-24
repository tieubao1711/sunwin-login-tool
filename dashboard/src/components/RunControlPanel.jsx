import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  DownloadCloud,
  Play,
  Pause,
  RotateCcw,
  Square,
  ExternalLink
} from 'lucide-react';

import {
  loadAccountsFromApi,
  startRun,
  pauseRun,
  resumeRun,
  stopRun
} from '../lib/api';

export default function RunControlPanel({ onLoaded }) {
  const [fileName, setFileName] = useState('');
  const [startIndex, setStartIndex] = useState(1);
  const [endIndex, setEndIndex] = useState('');
  const [concurrency, setConcurrency] = useState(3);
  const [delayBetweenRequestsMs, setDelayBetweenRequestsMs] = useState(1000);
  const [highBalanceThreshold, setHighBalanceThreshold] = useState(100000);
  const [resetWarpEvery, setResetWarpEvery] = useState(5);
  const [loadedTotal, setLoadedTotal] = useState(0);
  const [currentRunId, setCurrentRunId] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('runControlConfig');
    if (!saved) return;

    try {
      const parsed = JSON.parse(saved);

      setFileName(parsed.fileName || '');
      setStartIndex(Number(parsed.startIndex || 1));
      setEndIndex(parsed.endIndex || '');
      setConcurrency(Number(parsed.concurrency || 3));
      setDelayBetweenRequestsMs(Number(parsed.delayBetweenRequestsMs || 1000));
      setHighBalanceThreshold(Number(parsed.highBalanceThreshold || 100000));
      setResetWarpEvery(Number(parsed.resetWarpEvery ?? 5));
      setCurrentRunId(parsed.currentRunId || '');
    } catch (err) {
      console.error('Load local config failed:', err.message);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      'runControlConfig',
      JSON.stringify({
        fileName,
        startIndex,
        endIndex,
        concurrency,
        delayBetweenRequestsMs,
        highBalanceThreshold,
        resetWarpEvery,
        currentRunId
      })
    );
  }, [
    fileName,
    startIndex,
    endIndex,
    concurrency,
    delayBetweenRequestsMs,
    highBalanceThreshold,
    resetWarpEvery,
    currentRunId
  ]);

  function cleanFileNameInput(value) {
    return String(value || '')
      .split(',')
      .map((x) => x.trim())
      .filter(Boolean)
      .join(',');
  }

  async function handleLoad() {
    try {
      setLoading(true);

      const cleanFileName = cleanFileNameInput(fileName);

      if (!cleanFileName) {
        alert('Vui lòng nhập tên file. Ví dụ: kendy1.json,kendy2.json');
        return;
      }

      const res = await loadAccountsFromApi({
        fileName: cleanFileName
      });

      const total = Number(res.total || 0);

      setLoadedTotal(total);
      setStartIndex(1);
      setEndIndex(total || '');

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

      const cleanFileName = cleanFileNameInput(fileName);
      const start = Number(startIndex || 1);
      const end = endIndex === '' ? loadedTotal : Number(endIndex);

      if (!cleanFileName) {
        alert('Vui lòng nhập tên file. Ví dụ: kendy1.json,kendy2.json');
        return;
      }

      if (!start || start < 1) {
        alert('Start Index phải >= 1');
        return;
      }

      if (!end || end < start) {
        alert('End Index phải >= Start Index');
        return;
      }

      const res = await startRun({
        fileName: cleanFileName,
        startIndex: start,
        endIndex: end,
        concurrency,
        delayBetweenRequestsMs,
        highBalanceThreshold,
        resetWarpEvery
      });
console.log('START RUN RESPONSE:', res);

      if (res.runId) {
        setCurrentRunId(res.runId);
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  }

  const selectedCount = (() => {
    const start = Number(startIndex || 1);
    const end = endIndex === '' ? loadedTotal : Number(endIndex || 0);

    if (!loadedTotal || start <= 0 || end < start) return 0;
    return end - start + 1;
  })();

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="text-sm font-semibold text-slate-200">
          Run Control
        </div>

        {currentRunId && (
          <Link
            to={`/runs/${currentRunId}`}
            className="inline-flex items-center gap-2 rounded-lg bg-slate-800 px-3 py-2 text-xs text-slate-200 hover:bg-slate-700"
          >
            <ExternalLink size={14} />
            View Current Run
          </Link>
        )}
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <div>
          <div className="mb-1 text-xs text-slate-400">File Name</div>
          <input
            value={fileName}
            onChange={(e) => setFileName(e.target.value)}
            placeholder="kendy1.json,kendy2.json"
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-emerald-500"
          />
          <div className="mt-1 text-[11px] text-slate-500">
            Nhập 1 hoặc nhiều file, cách nhau bằng dấu phẩy.
          </div>
        </div>

        <div>
          <div className="mb-1 text-xs text-slate-400">Start Index</div>
          <input
            type="number"
            min="1"
            value={startIndex}
            onChange={(e) => setStartIndex(Number(e.target.value))}
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-emerald-500"
          />
        </div>

        <div>
          <div className="mb-1 text-xs text-slate-400">End Index</div>
          <input
            type="number"
            min="1"
            value={endIndex}
            onChange={(e) => setEndIndex(e.target.value)}
            placeholder={loadedTotal ? String(loadedTotal) : 'End'}
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-emerald-500"
          />
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
        </div>

        <div>
          <div className="mb-1 text-xs text-slate-400">Reset WARP Every</div>
          <input
            type="number"
            min="0"
            value={resetWarpEvery}
            onChange={(e) => setResetWarpEvery(Number(e.target.value))}
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-emerald-500"
          />
          <div className="mt-1 text-[11px] text-slate-500">
            0 = tắt reset.
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
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          onClick={handleLoad}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg bg-slate-700 px-4 py-2 text-sm text-white transition hover:bg-slate-600 disabled:opacity-50"
        >
          <DownloadCloud size={16} />
          Load Accounts
        </button>

        <button
          onClick={handleStart}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm text-white transition hover:bg-emerald-500 disabled:opacity-50"
        >
          <Play size={16} />
          Start
        </button>

        <button
          onClick={pauseRun}
          className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm text-white transition hover:bg-amber-500"
        >
          <Pause size={16} />
          Pause
        </button>

        <button
          onClick={resumeRun}
          className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-sm text-white transition hover:bg-sky-500"
        >
          <RotateCcw size={16} />
          Resume
        </button>

        <button
          onClick={stopRun}
          className="inline-flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-sm text-white transition hover:bg-rose-500"
        >
          <Square size={16} />
          Stop
        </button>
      </div>

      <div className="mt-3 text-sm text-slate-400">
        Loaded: {loadedTotal.toLocaleString('vi-VN')} accounts
        {' | '}
        Selected: {selectedCount.toLocaleString('vi-VN')} accounts
        {' | '}
        Reset WARP every: {Number(resetWarpEvery || 0)} accounts
      </div>
    </div>
  );
}