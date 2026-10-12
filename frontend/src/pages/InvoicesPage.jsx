import { useState } from 'react';
import es from '../i18n/es.js';
import useAsync from '../hooks/useAsync.js';
import { listInvoices } from '../api/billingApi.js';
import Button from '../components/Button.jsx';
import Card from '../components/Card.jsx';
import { TextInput } from '../components/Field.jsx';
import Modal from '../components/Modal.jsx';
import Table from '../components/Table.jsx';
import { ErrorMessage, LoadingState } from '../components/States.jsx';
import { formatDateTime, formatMinutes, formatMoney } from '../utils/format.js';

const PAGE_SIZE = 10;

function DetailRow({ label, value }) {
  return (
    <div className="flex justify-between gap-4 text-sm">
      <dt className="text-slate-500">{label}</dt>
      <dd className="font-medium text-slate-800">{value}</dd>
    </div>
  );
}

export default function InvoicesPage() {
  const [page, setPage] = useState(0);
  const [plate, setPlate] = useState('');
  const [selected, setSelected] = useState(null);
  const invoices = useAsync(
    () => listInvoices({ page, size: PAGE_SIZE, plate: plate || undefined }),
    [page, plate]
  );

  const columns = [
    { key: 'number', header: es.invoices.number },
    { key: 'plate', header: es.invoices.plate },
    { key: 'vehicleType', header: es.invoices.vehicleType, render: (row) => es.vehicleTypes[row.vehicleType] },
    { key: 'exitAt', header: es.invoices.exitAt, render: (row) => formatDateTime(row.exitAt) },
    { key: 'totalMinutes', header: es.invoices.minutes, render: (row) => formatMinutes(row.totalMinutes) },
    { key: 'total', header: es.invoices.total, render: (row) => formatMoney(row.total) },
    { key: 'operatorName', header: es.invoices.operator },
  ];

  const data = invoices.data;

  const handlePlateChange = (event) => {
    setPlate(event.target.value.toUpperCase());
    setPage(0);
  };

  return (
    <>
      <h1 className="text-xl font-semibold text-slate-900">{es.invoices.title}</h1>
      <Card
        actions={
          <TextInput
            value={plate}
            onChange={handlePlateChange}
            placeholder={es.invoices.plate}
            className="w-36 rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
          />
        }
      >
        <ErrorMessage error={invoices.error} onRetry={invoices.reload} />
        {invoices.loading && !data ? (
          <LoadingState />
        ) : (
          <Table columns={columns} rows={data?.content || []} rowKey="id" onRowClick={setSelected} />
        )}
        {data && data.totalPages > 0 && (
          <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
            <span>{`${data.totalElements} ${es.invoices.totalResults}`}</span>
            <div className="flex items-center gap-3">
              <Button variant="secondary" disabled={page === 0} onClick={() => setPage(page - 1)}>
                {es.common.previous}
              </Button>
              <span>{`${es.common.page} ${page + 1} ${es.common.of} ${data.totalPages}`}</span>
              <Button variant="secondary" disabled={page + 1 >= data.totalPages} onClick={() => setPage(page + 1)}>
                {es.common.next}
              </Button>
            </div>
          </div>
        )}
      </Card>
      <Modal
        open={Boolean(selected)}
        title={selected ? `${es.invoices.detail} ${selected.number}` : ''}
        onClose={() => setSelected(null)}
        footer={<Button onClick={() => setSelected(null)}>{es.common.close}</Button>}
      >
        {selected && (
          <dl className="space-y-2">
            <DetailRow label={es.invoices.plate} value={selected.plate} />
            <DetailRow label={es.invoices.vehicleType} value={es.vehicleTypes[selected.vehicleType]} />
            <DetailRow label={es.invoices.entryAt} value={formatDateTime(selected.entryAt)} />
            <DetailRow label={es.invoices.exitAt} value={formatDateTime(selected.exitAt)} />
            <DetailRow label={es.invoices.minutes} value={formatMinutes(selected.totalMinutes)} />
            <DetailRow label={es.invoices.subtotal} value={formatMoney(selected.subtotal)} />
            <DetailRow label={es.invoices.tax} value={formatMoney(selected.tax)} />
            <DetailRow label={es.invoices.total} value={formatMoney(selected.total)} />
            <DetailRow label={es.invoices.operator} value={selected.operatorName} />
            <DetailRow label={es.invoices.created} value={formatDateTime(selected.createdAt)} />
          </dl>
        )}
      </Modal>
    </>
  );
}
