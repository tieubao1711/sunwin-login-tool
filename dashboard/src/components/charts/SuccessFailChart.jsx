import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

export default function SuccessFailChart({ success, failed }) {
  const data = {
    labels: ['Success', 'Failed'],
    datasets: [
      {
        data: [success, failed],
        backgroundColor: ['#10b981', '#f43f5e'],
        borderWidth: 0
      }
    ]
  };

  const options = {
    plugins: {
      legend: {
        labels: {
          color: '#94a3b8',
          boxWidth: 14
        }
      }
    },
    maintainAspectRatio: false
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-3">
      <div className="mb-2 text-sm text-slate-300">Success vs Failed</div>
      <div className="h-[180px]">
        <Doughnut data={data} options={options} />
      </div>
    </div>
  );
}