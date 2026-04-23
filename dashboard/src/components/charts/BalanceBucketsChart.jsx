import React from 'react';
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Tooltip
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

function buildBuckets(items = []) {
  const buckets = {
    '0': 0,
    '1-100K': 0,
    '100K-500K': 0,
    '500K-1M': 0,
    '1M+': 0
  };

  for (const item of items) {
    const balance = Number(item.balance || 0);

    if (balance <= 0) buckets['0'] += 1;
    else if (balance <= 100000) buckets['1-100K'] += 1;
    else if (balance <= 500000) buckets['100K-500K'] += 1;
    else if (balance <= 1000000) buckets['500K-1M'] += 1;
    else buckets['1M+'] += 1;
  }

  return buckets;
}

export default function BalanceBucketsChart({ items = [] }) {
  const buckets = buildBuckets(items);

  const data = {
    labels: Object.keys(buckets),
    datasets: [
      {
        label: 'Accounts',
        data: Object.values(buckets),
        backgroundColor: [
          '#334155',
          '#22c55e',
          '#eab308',
          '#f97316',
          '#ef4444'
        ],
        borderRadius: 10
      }
    ]
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        display: false
      }
    },
    scales: {
      x: {
        ticks: { color: '#94a3b8' },
        grid: { display: false }
      },
      y: {
        beginAtZero: true,
        ticks: {
          color: '#94a3b8',
          precision: 0
        },
        grid: {
          color: 'rgba(148,163,184,0.12)'
        }
      }
    }
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-3">
      <div className="mb-2 text-sm text-slate-300">Balance Buckets</div>
      <div className="h-[220px]">
        <Bar data={data} options={{ ...options, maintainAspectRatio: false }} />
      </div>
    </div>
  );
}