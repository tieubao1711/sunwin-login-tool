import React, { useEffect, useMemo, useState } from 'react';
import { Play, RefreshCw } from 'lucide-react';

import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import {
  getProxyPoolProxies,
  getProxyPools,
  testAccountWithProxy
} from '../lib/api';

function poolIdOf(item) {
  return item?._id || item?.id || item?.poolId;
}

function proxyIdOf(item) {
  return item?._id || item?.id || item?.proxyId;
}

function fmtNumber(value) {
  return Number(value || 0).toLocaleString('vi-VN');
}

function statusClass(ok) {
  return ok ? 'text-emerald-400' : 'text-rose-400';
}

export default function ProxyTestPage() {
  const [pools, setPools] = useState([]);
  const [proxies, setProxies] = useState([]);
  const [proxyPoolId, setProxyPoolId] = useState('');
  const [proxyId, setProxyId] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [result, setResult] = useState(null);
  const [loadingPools, setLoadingPools] = useState(false);
  const [loadingProxies, setLoadingProxies] = useState(false);
  const [testing, setTesting] = useState(false);

  const selectedPool = useMemo(
    () => pools.find((pool) => poolIdOf(pool) === proxyPoolId) || null,
    [pools, proxyPoolId]
  );

  useEffect(() => {
    loadPools();
  }, []);

  useEffect(() => {
    if (!proxyPoolId) {
      setProxies([]);
      setProxyId('');
      return;
    }

    loadProxies(proxyPoolId);
  }, [proxyPoolId]);

  async function loadPools() {
    try {
      setLoadingPools(true);
      const res = await getProxyPools();
      const items = res.items || [];
      setPools(items);

      if (!proxyPoolId && items.length) {
        setProxyPoolId(poolIdOf(items[0]));
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setLoadingPools(false);
    }
  }

  async function loadProxies(poolId = proxyPoolId) {
    if (!poolId) return;

    try {
      setLoadingProxies(true);
      const res = await getProxyPoolProxies(poolId);
      const items = res.items || [];
      setProxies(items);
      setProxyId((current) =>
        current && items.some((item) => proxyIdOf(item) === current) ? current : ''
      );
    } catch (err) {
      alert(err.message);
    } finally {
      setLoadingProxies(false);
    }
  }

  async function handleTest() {
    if (!proxyPoolId) {
      alert('Chon proxy pool');
      return;
    }

    if (!username.trim() || !password.trim()) {
      alert('Nhap username va password');
      return;
    }

    try {
      setTesting(true);
      setResult(null);
      const res = await testAccountWithProxy({
        username: username.trim(),
        password: password.trim(),
        proxyPoolId,
        proxyId
      });
      setResult(res);
    } catch (err) {
      setResult({
        success: false,
        message: err.message,
        stages: []
      });
    } finally {
      setTesting(false);
    }
  }

  const stages = result?.stages || result?.data?.stages || [];

  return (
    <div className="flex min-h-screen bg-slate-950 text-white">
      <Sidebar />

      <main className="flex-1 p-4">
        <Topbar
          title="Proxy Test"
          subtitle="Test account qua proxy pool va xem tung API stage"
        />

        <div className="grid gap-4 xl:grid-cols-[420px,1fr]">
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-slate-200">
                  Test Input
                </div>
                <div className="text-xs text-slate-500">
                  Chon pool, proxy cu the hoac de auto
                </div>
              </div>

              <button
                onClick={handleTest}
                disabled={testing}
                className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-3 py-2 text-xs text-white hover:bg-sky-500 disabled:opacity-50"
              >
                <Play size={14} />
                {testing ? 'Testing' : 'Test'}
              </button>
            </div>

            <div className="space-y-3">
              <select
                value={proxyPoolId}
                onChange={(e) => setProxyPoolId(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-emerald-500"
              >
                <option value="">Select proxy pool</option>
                {pools.map((pool) => (
                  <option key={poolIdOf(pool)} value={poolIdOf(pool)}>
                    {pool.name || poolIdOf(pool)} ({pool.activeCount || 0}/{pool.total || 0})
                  </option>
                ))}
              </select>

              <select
                value={proxyId}
                onChange={(e) => setProxyId(e.target.value)}
                disabled={!proxyPoolId || loadingProxies}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-emerald-500 disabled:opacity-50"
              >
                <option value="">Auto proxy in pool</option>
                {proxies
                  .filter((proxy) => proxy.status === 'ACTIVE')
                  .map((proxy) => {
                    const id = proxyIdOf(proxy);
                    const label = `${proxy.host || proxy.address || id}${proxy.port ? `:${proxy.port}` : ''}`;

                    return (
                      <option key={id} value={id}>
                        {label}
                      </option>
                    );
                  })}
              </select>

              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="username"
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-emerald-500"
              />

              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="password"
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-emerald-500"
              />

              <button
                onClick={() => Promise.all([loadPools(), loadProxies()])}
                className="inline-flex items-center gap-2 rounded-lg bg-slate-700 px-3 py-2 text-xs text-white hover:bg-slate-600"
              >
                <RefreshCw size={14} />
                Refresh Pools
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
              <div className="grid gap-3 md:grid-cols-5">
                <div>
                  <div className="text-xs text-slate-500">Result</div>
                  <div className={statusClass(result?.success)}>
                    {result ? (result.success ? 'SUCCESS' : 'FAILED') : '-'}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">HTTP</div>
                  <div>{result?.status || '-'}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">Proxy</div>
                  <div className="break-all">{result?.proxyId || result?.requestedProxyId || '-'}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">Duration</div>
                  <div>{result ? `${fmtNumber(result.durationMs)} ms` : '-'}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">Pool</div>
                  <div>{selectedPool?.name || '-'}</div>
                </div>
              </div>

              <div className="mt-3 text-xs text-slate-500">Message</div>
              <div className="mt-1 break-words text-sm text-slate-200">
                {result?.message || '-'}
              </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
              <div className="border-b border-slate-800 px-4 py-3">
                <div className="font-semibold text-slate-100">API Stages</div>
                <div className="text-xs text-slate-500">
                  loginHash, transaction, deposit, withdraw, wallet
                </div>
              </div>

              <table className="min-w-full text-sm">
                <thead className="bg-slate-950 text-slate-400">
                  <tr>
                    <th className="px-4 py-3 text-left">Stage</th>
                    <th className="px-4 py-3 text-left">Result</th>
                    <th className="px-4 py-3 text-left">HTTP</th>
                    <th className="px-4 py-3 text-right">Duration</th>
                    <th className="px-4 py-3 text-left">Message</th>
                  </tr>
                </thead>
                <tbody>
                  {stages.map((stage) => (
                    <tr key={stage.name} className="border-t border-slate-800">
                      <td className="px-4 py-3">{stage.name}</td>
                      <td className={`px-4 py-3 ${statusClass(stage.ok)}`}>
                        {stage.ok ? 'OK' : 'FAIL'}
                      </td>
                      <td className="px-4 py-3">{stage.status || '-'}</td>
                      <td className="px-4 py-3 text-right">
                        {fmtNumber(stage.durationMs)} ms
                      </td>
                      <td className="px-4 py-3 text-slate-300">
                        {stage.message || '-'}
                      </td>
                    </tr>
                  ))}

                  {result && stages.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                        No stage report returned
                      </td>
                    </tr>
                  )}

                  {!result && (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                        Run a test to see API stages
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
