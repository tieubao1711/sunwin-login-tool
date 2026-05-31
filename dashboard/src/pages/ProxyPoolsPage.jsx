import React, { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  CircleSlash,
  Plus,
  RefreshCw,
  Save,
  Trash2,
  Upload
} from 'lucide-react';

import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import {
  createProxyPool,
  deleteProxyPool,
  deleteProxyPoolProxy,
  getProxyPoolProxies,
  getProxyPools,
  importProxyPoolProxies,
  updateProxyPool,
  updateProxyPoolProxy
} from '../lib/api';

function fmtNumber(value) {
  return Number(value || 0).toLocaleString('vi-VN');
}

function proxyIdOf(item) {
  return item?._id || item?.id || item?.proxyId;
}

function poolIdOf(item) {
  return item?._id || item?.id || item?.poolId;
}

function statusClass(status) {
  if (status === 'ACTIVE') return 'bg-emerald-500/10 text-emerald-400';
  if (status === 'DEAD') return 'bg-rose-500/10 text-rose-400';
  if (status === 'DISABLED') return 'bg-slate-700 text-slate-300';
  return 'bg-sky-500/10 text-sky-400';
}

export default function ProxyPoolsPage() {
  const [pools, setPools] = useState([]);
  const [selectedPoolId, setSelectedPoolId] = useState('');
  const [proxies, setProxies] = useState([]);
  const [newPoolName, setNewPoolName] = useState('');
  const [newPoolDescription, setNewPoolDescription] = useState('');
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [importText, setImportText] = useState('');
  const [loadingPools, setLoadingPools] = useState(false);
  const [loadingProxies, setLoadingProxies] = useState(false);
  const [saving, setSaving] = useState(false);

  const selectedPool = useMemo(
    () => pools.find((pool) => poolIdOf(pool) === selectedPoolId) || null,
    [pools, selectedPoolId]
  );

  useEffect(() => {
    loadPools();
  }, []);

  useEffect(() => {
    if (!selectedPoolId) {
      setProxies([]);
      setEditName('');
      setEditDescription('');
      return;
    }

    setEditName(selectedPool?.name || '');
    setEditDescription(selectedPool?.description || '');
    loadProxies(selectedPoolId);
  }, [selectedPoolId, selectedPool?.name, selectedPool?.description]);

  async function loadPools() {
    try {
      setLoadingPools(true);
      const res = await getProxyPools();
      const items = res.items || [];
      setPools(items);

      if (!selectedPoolId && items.length) {
        setSelectedPoolId(poolIdOf(items[0]));
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setLoadingPools(false);
    }
  }

  async function loadProxies(poolId = selectedPoolId) {
    if (!poolId) return;

    try {
      setLoadingProxies(true);
      const res = await getProxyPoolProxies(poolId);
      setProxies(res.items || []);
    } catch (err) {
      alert(err.message);
    } finally {
      setLoadingProxies(false);
    }
  }

  async function handleCreatePool() {
    const name = newPoolName.trim();
    if (!name) {
      alert('Nhap ten proxy pool');
      return;
    }

    try {
      setSaving(true);
      const res = await createProxyPool({
        name,
        description: newPoolDescription.trim()
      });

      setNewPoolName('');
      setNewPoolDescription('');
      await loadPools();

      const created = res.item || res.pool || res;
      const createdId = poolIdOf(created);
      if (createdId) setSelectedPoolId(createdId);
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleSavePool() {
    if (!selectedPoolId) return;

    try {
      setSaving(true);
      await updateProxyPool(selectedPoolId, {
        name: editName.trim(),
        description: editDescription.trim()
      });
      await loadPools();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDeletePool() {
    if (!selectedPoolId || !selectedPool) return;

    const ok = window.confirm(`Delete proxy pool "${selectedPool.name}"?`);
    if (!ok) return;

    try {
      setSaving(true);
      await deleteProxyPool(selectedPoolId);
      setSelectedPoolId('');
      setProxies([]);
      await loadPools();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleImport() {
    if (!selectedPoolId) {
      alert('Chon proxy pool truoc');
      return;
    }

    const text = importText.trim();
    if (!text) {
      alert('Nhap danh sach proxy');
      return;
    }

    try {
      setSaving(true);
      await importProxyPoolProxies(selectedPoolId, {
        text,
        rawText: text,
        proxies: text
      });
      setImportText('');
      await Promise.all([loadPools(), loadProxies(selectedPoolId)]);
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleProxyStatus(proxy, status) {
    const proxyId = proxyIdOf(proxy);
    if (!selectedPoolId || !proxyId) return;

    try {
      await updateProxyPoolProxy(selectedPoolId, proxyId, { status });
      await Promise.all([loadPools(), loadProxies(selectedPoolId)]);
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleDeleteProxy(proxy) {
    const proxyId = proxyIdOf(proxy);
    if (!selectedPoolId || !proxyId) return;

    const ok = window.confirm('Delete this proxy?');
    if (!ok) return;

    try {
      await deleteProxyPoolProxy(selectedPoolId, proxyId);
      await Promise.all([loadPools(), loadProxies(selectedPoolId)]);
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <div className="flex min-h-screen bg-slate-950 text-white">
      <Sidebar />

      <main className="flex-1 p-4">
        <Topbar
          title="Proxy Pools"
          subtitle="Import va quan ly proxy pool dung cho login tool"
        />

        <div className="grid gap-4 xl:grid-cols-[360px,1fr]">
          <div className="space-y-4">
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="text-sm font-semibold text-slate-200">
                  Create Pool
                </div>
                <button
                  onClick={handleCreatePool}
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-xs text-white hover:bg-emerald-500 disabled:opacity-50"
                >
                  <Plus size={14} />
                  Add
                </button>
              </div>

              <div className="space-y-3">
                <input
                  value={newPoolName}
                  onChange={(e) => setNewPoolName(e.target.value)}
                  placeholder="proxy-vn-1"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                />
                <input
                  value={newPoolDescription}
                  onChange={(e) => setNewPoolDescription(e.target.value)}
                  placeholder="description"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
              <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
                <div>
                  <div className="font-semibold text-slate-100">Pools</div>
                  <div className="text-xs text-slate-500">
                    {loadingPools ? 'Loading...' : `${pools.length} pools`}
                  </div>
                </div>
                <button
                  onClick={loadPools}
                  className="inline-flex items-center gap-2 rounded-lg bg-slate-800 px-3 py-2 text-xs hover:bg-slate-700"
                >
                  <RefreshCw size={14} />
                  Refresh
                </button>
              </div>

              <div className="max-h-[620px] overflow-auto">
                {pools.map((pool) => {
                  const id = poolIdOf(pool);
                  const active = id === selectedPoolId;

                  return (
                    <button
                      key={id}
                      onClick={() => setSelectedPoolId(id)}
                      className={[
                        'block w-full border-b border-slate-800 px-4 py-3 text-left hover:bg-slate-800/60',
                        active ? 'bg-emerald-500/10' : ''
                      ].join(' ')}
                    >
                      <div className="truncate font-medium text-slate-100">
                        {pool.name || id}
                      </div>
                      <div className="mt-2 grid grid-cols-4 gap-2 text-xs">
                        <div>
                          <div className="text-slate-500">Total</div>
                          <div>{fmtNumber(pool.total)}</div>
                        </div>
                        <div>
                          <div className="text-slate-500">Active</div>
                          <div className="text-emerald-400">
                            {fmtNumber(pool.activeCount)}
                          </div>
                        </div>
                        <div>
                          <div className="text-slate-500">Dead</div>
                          <div className="text-rose-400">
                            {fmtNumber(pool.deadCount)}
                          </div>
                        </div>
                        <div>
                          <div className="text-slate-500">Off</div>
                          <div className="text-slate-300">
                            {fmtNumber(pool.disabledCount)}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}

                {!loadingPools && pools.length === 0 && (
                  <div className="px-4 py-8 text-center text-sm text-slate-500">
                    No proxy pool
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-slate-200">
                    Pool Detail
                  </div>
                  <div className="text-xs text-slate-500">
                    {selectedPool ? selectedPool.name : 'Select a pool'}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleSavePool}
                    disabled={!selectedPoolId || saving}
                    className="inline-flex items-center gap-2 rounded-lg bg-slate-700 px-3 py-2 text-xs text-white hover:bg-slate-600 disabled:opacity-50"
                  >
                    <Save size={14} />
                    Save
                  </button>
                  <button
                    onClick={handleDeletePool}
                    disabled={!selectedPoolId || saving}
                    className="inline-flex items-center gap-2 rounded-lg bg-rose-600 px-3 py-2 text-xs text-white hover:bg-rose-500 disabled:opacity-50"
                  >
                    <Trash2 size={14} />
                    Delete
                  </button>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="pool name"
                  disabled={!selectedPoolId}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-emerald-500 disabled:opacity-50"
                />
                <input
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="description"
                  disabled={!selectedPoolId}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-emerald-500 disabled:opacity-50"
                />
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-slate-200">
                    Import Proxies
                  </div>
                  <div className="text-xs text-slate-500">
                    ip:port, ip:port:user:pass, user:pass@ip:port, http, socks5
                  </div>
                </div>

                <button
                  onClick={handleImport}
                  disabled={!selectedPoolId || saving}
                  className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-xs text-white hover:bg-emerald-500 disabled:opacity-50"
                >
                  <Upload size={14} />
                  Import
                </button>
              </div>

              <textarea
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                disabled={!selectedPoolId}
                rows={7}
                placeholder="http://user:pass@1.2.3.4:8000"
                className="w-full resize-y rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-sm outline-none focus:border-emerald-500 disabled:opacity-50"
              />
            </div>

            <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
              <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
                <div>
                  <div className="font-semibold text-slate-100">Proxies</div>
                  <div className="text-xs text-slate-500">
                    {loadingProxies ? 'Loading...' : `${proxies.length} proxies`}
                  </div>
                </div>

                <button
                  onClick={() => loadProxies()}
                  disabled={!selectedPoolId}
                  className="inline-flex items-center gap-2 rounded-lg bg-slate-800 px-3 py-2 text-xs hover:bg-slate-700 disabled:opacity-50"
                >
                  <RefreshCw size={14} />
                  Refresh
                </button>
              </div>

              <div className="max-h-[540px] overflow-auto">
                <table className="min-w-full text-sm">
                  <thead className="sticky top-0 z-10 bg-slate-950 text-slate-400">
                    <tr>
                      <th className="px-4 py-3 text-left">Proxy</th>
                      <th className="px-4 py-3 text-left">Protocol</th>
                      <th className="px-4 py-3 text-left">Status</th>
                      <th className="px-4 py-3 text-right">OK</th>
                      <th className="px-4 py-3 text-right">Fail</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {proxies.map((proxy) => {
                      const id = proxyIdOf(proxy);
                      const status = proxy.status || '-';

                      return (
                        <tr
                          key={id}
                          className="border-t border-slate-800 text-slate-200 hover:bg-slate-800/40"
                        >
                          <td className="px-4 py-3">
                            <div className="font-medium">
                              {proxy.host || proxy.address || proxy.name || id}
                            </div>
                            <div className="text-xs text-slate-500">
                              {proxy.port ? `:${proxy.port}` : ''}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-slate-400">
                            {proxy.protocol || '-'}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={[
                                'rounded-full px-2 py-1 text-xs',
                                statusClass(status)
                              ].join(' ')}
                            >
                              {status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right text-emerald-300">
                            {fmtNumber(proxy.successCount)}
                          </td>
                          <td className="px-4 py-3 text-right text-rose-300">
                            {fmtNumber(proxy.failCount)}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex justify-end gap-2">
                              <button
                                title="Set ACTIVE"
                                onClick={() => handleProxyStatus(proxy, 'ACTIVE')}
                                className="rounded-lg bg-emerald-500/10 p-2 text-emerald-400 hover:bg-emerald-500/20"
                              >
                                <CheckCircle2 size={15} />
                              </button>
                              <button
                                title="Set DISABLED"
                                onClick={() => handleProxyStatus(proxy, 'DISABLED')}
                                className="rounded-lg bg-slate-700 p-2 text-slate-300 hover:bg-slate-600"
                              >
                                <CircleSlash size={15} />
                              </button>
                              <button
                                title="Delete"
                                onClick={() => handleDeleteProxy(proxy)}
                                className="rounded-lg bg-rose-500/10 p-2 text-rose-400 hover:bg-rose-500/20"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}

                    {!loadingProxies && proxies.length === 0 && (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-4 py-8 text-center text-slate-500"
                        >
                          No proxy in selected pool
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
