import { useState } from 'react';
import es from '../i18n/es.js';
import useAsync from '../hooks/useAsync.js';
import { listTickets } from '../api/parkingApi.js';
import Badge from '../components/Badge.jsx';
import Card from '../components/Card.jsx';
import { SelectInput, TextInput } from '../components/Field.jsx';
import Table from '../components/Table.jsx';
import { ErrorMessage, LoadingState } from '../components/States.jsx';
import { BADGE_TONES } from '../utils/constants.js';
import { formatDateTime, formatMinutes, formatMoney } from '../utils/format.js';

export default function TicketsPage() {
  const [status, setStatus] = useState('');
  const [plate, setPlate] = useState('');
  const tickets = useAsync(
    () => listTickets({ status: status || undefined, plate: plate || undefined }),
    [status, plate]
  );

  const columns = [
    { key: 'plate', header: es.tickets.plate },
    { key: 'vehicleType', header: es.tickets.vehicleType, render: (row) => es.vehicleTypes[row.vehicleType] },
    { key: 'spaceCode', header: es.tickets.space, render: (row) => row.spaceCode || es.common.notAvailable },
    { key: 'entryAt', header: es.tickets.entryAt, render: (row) => formatDateTime(row.entryAt) },
    { key: 'exitAt', header: es.tickets.exitAt, render: (row) => formatDateTime(row.exitAt) },
    { key: 'totalMinutes', header: es.tickets.minutes, render: (row) => formatMinutes(row.totalMinutes) },
    { key: 'fee', header: es.tickets.fee, render: (row) => formatMoney(row.fee) },
    {
      key: 'status',
      header: es.tickets.status,
      render: (row) => <Badge tone={BADGE_TONES[row.status]}>{es.status[row.status]}</Badge>,
    },
    { key: 'invoiceNumber', header: es.tickets.invoice, render: (row) => row.invoiceNumber || es.common.notAvailable },
  ];

  return (
    <>
      <h1 className="text-xl font-semibold text-slate-900">{es.tickets.title}</h1>
      <Card
        actions={
          <div className="flex gap-2">
            <TextInput
              value={plate}
              onChange={(event) => setPlate(event.target.value.toUpperCase())}
              placeholder={es.tickets.plate}
              className="w-36 rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
            />
            <SelectInput
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
            >
              <option value="">{es.common.all}</option>
              <option value="OPEN">{es.status.OPEN}</option>
              <option value="CLOSED">{es.status.CLOSED}</option>
            </SelectInput>
          </div>
        }
      >
        <ErrorMessage error={tickets.error} onRetry={tickets.reload} />
        {tickets.loading && !tickets.data ? <LoadingState /> : <Table columns={columns} rows={tickets.data || []} rowKey="id" />}
      </Card>
    </>
  );
}
