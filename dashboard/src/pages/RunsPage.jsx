import React from 'react';
import { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import RunTable from '../components/RunTable';
import { getRuns } from '../lib/api';

export default function RunsPage() {
  const [runs, setRuns] = useState([]);

  useEffect(() => {
    getRuns(50).then((res) => setRuns(res.items || []));
  }, []);

  return (
    <div className="flex min-h-screen bg-slate-950 text-white">
      <Sidebar />
      <main className="flex-1 p-6">
        <Topbar title="Runs" subtitle="Lịch sử các lần chạy" />
        <RunTable items={runs} />
      </main>
    </div>
  );
}