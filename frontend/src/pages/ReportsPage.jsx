import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import es from '../i18n/es.js';
import useAsync from '../hooks/useAsync.js';
import {
  getDailyReport,
  getOperatorReport,
  getSummaryReport,
  getVehicleTypeReport,
} from '../api/billingApi.js';
import { getOccupancy } from '../api/realtimeApi.js';
import Card from '../components/Card.jsx';
import KpiCard from '../components/KpiCard.jsx';
import Table from '../components/Table.jsx';
import { ErrorMessage, LoadingState } from '../components/States.jsx';
import { formatMoney, formatTime } from '../utils/format.js';

ChartJS.register(
  ArcElement,
  BarElement,
  CategoryScale,
  Filler,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip
);

const OCCUPANCY_WINDOW_MINUTES = 180;
const DOUGHNUT_COLORS = ['#4f46e5', '#16a34a', '#f59e0b'];

export default function ReportsPage() {
  const summary = useAsync(() => getSummaryReport(), []);
  const daily = useAsync(() => getDailyReport(), []);
  const byVehicleType = useAsync(() => getVehicleTypeReport(), []);
  const byOperator = useAsync(() => getOperatorReport(), []);
  const occupancy = useAsync(() => getOccupancy(OCCUPANCY_WINDOW_MINUTES), []);

  const firstError = summary.error || daily.error || byVehicleType.error || byOperator.error || occupancy.error;

  const dailyChart = {
    labels: (daily.data || []).map((point) => point.date.slice(5)),
    datasets: [
      {
        label: es.reports.dailyRevenue,
        data: (daily.data || []).map((point) => Number(point.total)),
        backgroundColor: '#6366f1',
        borderRadius: 4,
      },
    ],
  };

  const vehicleChart = {
    labels: (byVehicleType.data || []).map((row) => es.vehicleTypes[row.vehicleType]),
    datasets: [
      {
        data: (byVehicleType.data || []).map((row) => Number(row.total)),
        backgroundColor: DOUGHNUT_COLORS,
      },
    ],
  };

  const series = occupancy.data?.series || [];
  const occupancyChart = {
    labels: series.map((point) => formatTime(point.capturedAt)),
    datasets: [
      {
        label: es.reports.occupiedSeries,
        data: series.map((point) => point.occupied),
        borderColor: '#dc2626',
        backgroundColor: 'rgba(220, 38, 38, 0.1)',
        fill: true,
        tension: 0.3,
      },
      {
        label: es.reports.freeSeries,
        data: series.map((point) => point.free),
        borderColor: '#16a34a',
        backgroundColor: 'rgba(22, 163, 74, 0.1)',
        fill: true,
        tension: 0.3,
      },
    ],
  };

  const operatorColumns = [
    { key: 'operatorName', header: es.reports.operator },
    { key: 'invoices', header: es.reports.invoicesCount },
    { key: 'total', header: es.reports.revenue, render: (row) => formatMoney(row.total) },
  ];

  return (
    <>
      <h1 className="text-xl font-semibold text-slate-900">{es.reports.title}</h1>
      <ErrorMessage error={firstError} />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label={es.reports.revenueToday} value={formatMoney(summary.data?.today.total ?? 0)} tone="indigo" />
        <KpiCard label={es.reports.invoicesCount} value={summary.data?.today.invoices ?? 0} />
        <KpiCard label={es.reports.revenueMonth} value={formatMoney(summary.data?.month.total ?? 0)} tone="indigo" />
        <KpiCard label={es.reports.invoicesCount} value={summary.data?.month.invoices ?? 0} />
      </div>

      <Card title={es.reports.dailyRevenue}>
        {daily.loading ? (
          <LoadingState />
        ) : (
          <Bar data={dailyChart} options={{ responsive: true, plugins: { legend: { display: false } } }} />
        )}
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title={es.reports.byVehicleType}>
          {byVehicleType.loading ? <LoadingState /> : <Doughnut data={vehicleChart} />}
        </Card>
        <Card title={`${es.reports.occupancyOverTime} · ${es.reports.last3Hours}`}>
          {occupancy.loading && <LoadingState />}
          {!occupancy.loading && series.length === 0 && (
            <p className="py-8 text-center text-sm text-slate-500">{es.reports.noOccupancyData}</p>
          )}
          {series.length > 0 && <Line data={occupancyChart} options={{ responsive: true }} />}
        </Card>
      </div>

      <Card title={es.reports.byOperator}>
        <Table columns={operatorColumns} rows={byOperator.data || []} rowKey="operatorId" />
      </Card>
    </>
  );
}
