import { useEffect, useMemo, useState } from 'react';
import { useLocation, useOutletContext } from 'react-router-dom';
import es from '../i18n/es.js';
import useAsync from '../hooks/useAsync.js';
import { createEntry, createExit, getQuote, listRates, listTickets } from '../api/parkingApi.js';
import Button from '../components/Button.jsx';
import Card from '../components/Card.jsx';
import { Field, SelectInput, TextInput } from '../components/Field.jsx';
import Modal from '../components/Modal.jsx';
import Table from '../components/Table.jsx';
import { ErrorMessage, LoadingState, SuccessMessage } from '../components/States.jsx';
import { VEHICLE_TYPES } from '../utils/constants.js';
import { formatDateTime, formatMinutes, formatMoney } from '../utils/format.js';

function EntryForm({ spaces, vehicleTypes, preselectedSpaceId, onRegistered }) {
  const preselected = spaces.find((space) => space.id === preselectedSpaceId);
  const [plate, setPlate] = useState('');
  const [vehicleType, setVehicleType] = useState(preselected?.vehicleType || 'CAR');
  const [spaceId, setSpaceId] = useState(preselected ? String(preselected.id) : '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [created, setCreated] = useState(null);

  useEffect(() => {
    if (preselected) {
      if (preselected.vehicleType) {
        setVehicleType(preselected.vehicleType);
      }
      setSpaceId(String(preselected.id));
    }
  }, [preselected?.id]);

  const freeSpaces = useMemo(
    () => spaces.filter((space) => space.status === 'FREE'),
    [spaces]
  );

  const handleVehicleTypeChange = (event) => {
    setVehicleType(event.target.value);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setCreated(null);
    try {
      const payload = { plate, vehicleType };
      if (spaceId) {
        payload.spaceId = Number(spaceId);
      }
      const ticket = await createEntry(payload);
      setCreated(ticket);
      setPlate('');
      setSpaceId('');
      onRegistered();
    } catch (requestError) {
      setError(requestError);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card title={es.operation.entryTitle}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <ErrorMessage error={error} />
        {created && (
          <SuccessMessage>
            {`${es.operation.entrySuccess}: ${created.plate} · ${es.operation.assignedSpace} ${created.spaceCode}`}
          </SuccessMessage>
        )}
        <Field label={es.operation.plate}>
          <TextInput
            value={plate}
            onChange={(event) => setPlate(event.target.value.toUpperCase())}
            placeholder={es.operation.platePlaceholder}
            maxLength={10}
            required
          />
        </Field>
        <Field label={es.operation.vehicleType}>
          <SelectInput value={vehicleType} onChange={handleVehicleTypeChange}>
            {vehicleTypes.map((type) => (
              <option key={type} value={type}>
                {es.vehicleTypes[type] || type}
              </option>
            ))}
          </SelectInput>
        </Field>
        <Field label={es.operation.space}>
          <SelectInput value={spaceId} onChange={(event) => setSpaceId(event.target.value)}>
            <option value="">{es.operation.autoAssign}</option>
            {freeSpaces.map((space) => (
              <option key={space.id} value={space.id}>
                {space.code}
              </option>
            ))}
          </SelectInput>
        </Field>
        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? es.operation.registering : es.operation.registerEntry}
        </Button>
      </form>
    </Card>
  );
}

function ExitModal({ ticket, onClose, onCompleted }) {
  const quote = useAsync(() => getQuote(ticket.id), [ticket.id]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const handleConfirm = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const exit = await createExit({ ticketId: ticket.id });
      setResult(exit);
      onCompleted();
    } catch (requestError) {
      setError(requestError);
    } finally {
      setSubmitting(false);
    }
  };

  if (result) {
    return (
      <Modal
        open
        title={es.operation.exitSuccess}
        onClose={onClose}
        footer={<Button onClick={onClose}>{es.common.close}</Button>}
      >
        <dl className="space-y-2 text-sm">
          <Row label={es.operation.plate} value={result.plate} />
          <Row label={es.operation.invoiceNumber} value={result.invoiceNumber} />
          <Row label={es.operation.elapsed} value={formatMinutes(result.totalMinutes)} />
          <Row label={es.operation.subtotal} value={formatMoney(result.invoice.subtotal)} />
          <Row label={es.operation.tax} value={formatMoney(result.invoice.tax)} />
          <Row label={es.operation.total} value={formatMoney(result.invoice.total)} strong />
        </dl>
      </Modal>
    );
  }

  return (
    <Modal
      open
      title={`${es.operation.exitTitle} · ${ticket.plate}`}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            {es.common.cancel}
          </Button>
          <Button onClick={handleConfirm} disabled={submitting || quote.loading || Boolean(quote.error)}>
            {submitting ? es.operation.processing : es.operation.confirmExit}
          </Button>
        </>
      }
    >
      {quote.loading && <LoadingState />}
      <ErrorMessage error={quote.error} onRetry={quote.reload} />
      <ErrorMessage error={error} />
      {quote.data && (
        <>
          <dl className="space-y-2 text-sm">
            <Row label={es.operation.entryAt} value={formatDateTime(quote.data.entryAt)} />
            <Row label={es.operation.elapsed} value={formatMinutes(quote.data.totalMinutes)} />
            <Row label={es.operation.amountDue} value={formatMoney(quote.data.fee)} strong />
          </dl>
          <p className="text-xs text-slate-500">{es.operation.quoteNote}</p>
        </>
      )}
    </Modal>
  );
}

function Row({ label, value, strong = false }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-slate-500">{label}</dt>
      <dd className={strong ? 'text-base font-semibold text-slate-900' : 'font-medium text-slate-800'}>{value}</dd>
    </div>
  );
}

export default function OperationPage() {
  const { spaces } = useOutletContext();
  const location = useLocation();
  const rates = useAsync(() => listRates(), []);
  const [plateFilter, setPlateFilter] = useState('');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const openTickets = useAsync(() => listTickets({ status: 'OPEN', plate: plateFilter || undefined }), [plateFilter]);
  const vehicleTypes = useMemo(() => {
    const types = (rates.data || []).map((rate) => rate.vehicleType);
    return types.length > 0 ? types : VEHICLE_TYPES;
  }, [rates.data]);

  const columns = [
    { key: 'plate', header: es.operation.plate },
    { key: 'spaceCode', header: es.operation.space, render: (row) => row.spaceCode || es.common.notAvailable },
    { key: 'entryAt', header: es.operation.entryAt, render: (row) => formatDateTime(row.entryAt) },
    {
      key: 'actions',
      header: es.common.actions,
      render: (row) => (
        <Button variant="ghost" onClick={() => setSelectedTicket(row)}>
          {es.operation.registerExit}
        </Button>
      ),
    },
  ];

  return (
    <>
      <h1 className="text-xl font-semibold text-slate-900">{es.operation.title}</h1>
      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <EntryForm
            spaces={spaces}
            vehicleTypes={vehicleTypes}
            preselectedSpaceId={location.state?.spaceId}
            onRegistered={openTickets.reload}
          />
        </div>
        <div className="lg:col-span-3">
          <Card
            title={es.operation.openTickets}
            actions={
              <TextInput
                value={plateFilter}
                onChange={(event) => setPlateFilter(event.target.value.toUpperCase())}
                placeholder={es.operation.searchPlate}
                className="w-44 rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
              />
            }
          >
            <ErrorMessage error={openTickets.error} onRetry={openTickets.reload} />
            {openTickets.loading && !openTickets.data ? (
              <LoadingState />
            ) : (
              <Table
                columns={columns}
                rows={openTickets.data || []}
                rowKey="id"
                emptyText={es.operation.noOpenTickets}
              />
            )}
          </Card>
        </div>
      </div>
      {selectedTicket && (
        <ExitModal
          ticket={selectedTicket}
          onClose={() => setSelectedTicket(null)}
          onCompleted={openTickets.reload}
        />
      )}
    </>
  );
}
