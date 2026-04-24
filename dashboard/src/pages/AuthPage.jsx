import React, { useEffect, useMemo, useState } from 'react';
import { Copy, Loader2, ShieldCheck, RefreshCcw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createAuthSession, getAuthStatus, setAuthToken } from '../lib/auth';

function formatExpire(ms) {
  if (!ms) return '-';

  const diff = Math.max(0, ms - Date.now());
  const sec = Math.floor(diff / 1000);

  const m = Math.floor(sec / 60);
  const s = sec % 60;

  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function AuthPage() {
  const navigate = useNavigate();

  const [code, setCode] = useState('');
  const [expiresAt, setExpiresAt] = useState(0);
  const [status, setStatus] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('Đang tạo mã đăng nhập...');
  const [tick, setTick] = useState(Date.now());

  const command = useMemo(() => {
    return code ? `/login ${code}` : '';
  }, [code]);

  async function requestSession() {
    try {
      setLoading(true);
      setMessage('Đang tạo mã đăng nhập...');

      const res = await createAuthSession();

      setCode(res.code);
      setExpiresAt(res.expiresAt);
      setStatus('pending');
      setMessage('Mở Telegram bot và gửi lệnh bên dưới.');
    } catch (err) {
      console.error('Create auth session error:', err.message);
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function copyCommand() {
    try {
      await navigator.clipboard.writeText(command);
      setMessage('Đã copy lệnh login.');
    } catch {
      setMessage(command);
    }
  }

  useEffect(() => {
    requestSession();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setTick(Date.now());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!code) return;

    const timer = setInterval(async () => {
      try {
        const res = await getAuthStatus(code);

        setStatus(res.status || 'pending');

        if (res.status === 'approved' && res.token) {
          setAuthToken(res.token);
          navigate('/dashboard', { replace: true });
        }

        if (res.status === 'expired') {
          setMessage('Mã đã hết hạn. Bấm tạo mã mới.');
        }
      } catch (err) {
        console.error('Auth status error:', err.message);
      }
    }, 1500);

    return () => clearInterval(timer);
  }, [code, navigate]);

  const expired = expiresAt && Date.now() > expiresAt;

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-white">
      <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
        <div className="mb-5 flex items-center gap-3">
          <div className="rounded-2xl bg-emerald-500/20 p-3 text-emerald-400">
            <ShieldCheck size={24} />
          </div>

          <div>
            <div className="text-lg font-semibold text-slate-100">
              Telegram Auth
            </div>
            <div className="text-sm text-slate-400">
              Xác thực local bằng Telegram bot
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
          <div className="text-xs text-slate-500">Login code</div>

          <div className="mt-2 flex items-center justify-between gap-3">
            <div className="text-4xl font-bold tracking-[0.25em] text-emerald-400">
              {loading ? '------' : code}
            </div>

            <button
              onClick={requestSession}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg bg-slate-800 px-3 py-2 text-sm text-slate-200 hover:bg-slate-700 disabled:opacity-50"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCcw size={16} />}
              New
            </button>
          </div>

          <div className="mt-3 text-sm text-slate-400">
            Expires in: <span className="text-slate-200">{formatExpire(expiresAt)}</span>
            {expired ? <span className="ml-2 text-rose-400">Expired</span> : null}
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950 p-4">
          <div className="text-xs text-slate-500">Gửi lệnh này cho Telegram bot</div>

          <div className="mt-2 flex items-center justify-between gap-3 rounded-lg bg-slate-900 px-3 py-3">
            <code className="text-lg text-slate-100">{command || '-'}</code>

            <button
              onClick={copyCommand}
              disabled={!command}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm text-white hover:bg-emerald-500 disabled:opacity-50"
            >
              <Copy size={16} />
              Copy
            </button>
          </div>

          <div className="mt-3 text-sm text-slate-400">
            Sau khi gửi lệnh, dashboard sẽ tự vào app khi bot xác nhận.
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950 p-4 text-sm">
          <div className="flex items-center gap-2 text-slate-300">
            {status === 'pending' ? (
              <Loader2 size={16} className="animate-spin text-emerald-400" />
            ) : null}

            <span>
              Status:{' '}
              <span className={status === 'approved' ? 'text-emerald-400' : status === 'expired' ? 'text-rose-400' : 'text-slate-100'}>
                {status}
              </span>
            </span>
          </div>

          <div className="mt-2 text-xs text-slate-500">
            {message}
          </div>
        </div>
      </div>
    </div>
  );
}