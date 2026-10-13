import { useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import es from '../i18n/es.js';
import { useAuth } from '../context/AuthContext.jsx';
import useAsync from '../hooks/useAsync.js';
import { getSummaryReport } from '../api/billingApi.js';
import { listEvents } from '../api/realtimeApi.js';
import Card from '../components/Card.jsx';
import KpiCard from '../components/KpiCard.jsx';
import ParkingMap from '../components/ParkingMap.jsx';
import Table from '../components/Table.jsx';
import { ErrorMessage } from '../components/States.jsx';
import { SPACE_COLORS } from '../utils/constants.js';
import { formatMoney, formatTime } from '../utils/format.js';

function countByStatus(spaces, status) {
  return spaces.filter((space) => space.status === status).length;
}

export default function DashboardPage() {
  const { spaces, occupancy, updateCount } = useOutletContext();
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const events = useAsync(() => listEvents(10), []);
  const summary = useAsync(() => (isAdmin ? getSummaryReport() : Promise.resolve(null)), [isAdmin]);

  useEffect(() => {
    if (updateCount > 0) {
      events.reload();
      summary.reload();
    }
  }, [updateCount]);

  const counters = occupancy || {
    total: spaces.length,
    occupied: countByStatus(spaces, 'OCCUPIED'),
    free: countByStatus(spaces, 'FREE'),
    maintenance: countByStatus(spaces, 'MAINTENANCE'),
  };

  const eventRows = (events.data || []).map((event, index) => ({ ...event, rowId: `${event.occurredAt}-${index}` }));

  const eventColumns = [
    { key: 'type', header: es.dashboard.event, render: (row) => es.eventTypes[row.type] },
    { key: 'spaceCode', header: es.dashboard.space },
    { key: 'plate', header: es.dashboard.plate, render: (row) => row.plate || es.common.notAvailable },
    { key: 'occurredAt', header: es.dashboard.time, render: (row) => formatTime(row.occurredAt) },
  ];

  return (
    <>
      <h1 className="text-xl font-semibold text-slate-900">{es.dashboard.title}</h1>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12 xl:items-start">
        <div className="space-y-6 xl:col-span-8">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <KpiCard label={es.dashboard.occupied} value={counters.occupied} tone="red" />
            <KpiCard label={es.dashboard.free} value={counters.free} tone="green" />
            {isAdmin ? (
              <KpiCard
                label={es.dashboard.revenueToday}
                value={formatMoney(summary.data?.today.total ?? 0)}
                hint={`${summary.data?.today.invoices ?? 0} ${es.dashboard.invoicesToday}`}
                tone="indigo"
              />
            ) : (
              <KpiCard label={es.dashboard.total} value={counters.total} />
            )}
            <KpiCard label={es.dashboard.maintenance} value={counters.maintenance} />
          </div>

          <Card
            title={es.dashboard.map}
            actions={
              <div className="flex items-center gap-3 text-xs text-slate-600">
                {['FREE', 'OCCUPIED', 'MAINTENANCE'].map((status) => (
                  <span key={status} className="flex items-center gap-1.5">
                    <span className="h-3 w-3 rounded-sm" style={{ backgroundColor: SPACE_COLORS[status] }} />
                    {es.status[status]}
                  </span>
                ))}
              </div>
            }
          >
            <ParkingMap
              spaces={spaces}
              onSelectFreeSpace={(space) => navigate('/operation', { state: { spaceId: space.id } })}
            />
            <p className="mt-3 text-xs text-slate-500">{es.dashboard.clickFreeSpace}</p>
          </Card>
        </div>

        <div className="xl:col-span-4">
          <Card title={es.dashboard.recentEvents} className="flex flex-col">
            <ErrorMessage error={events.error} onRetry={events.reload} />
            <div className="max-h-[620px] overflow-y-auto pr-1">
              <Table columns={eventColumns} rows={eventRows} rowKey="rowId" />
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
