import { useState } from 'react';
import es from '../i18n/es.js';
import useAsync from '../hooks/useAsync.js';
import { createRate, listRates, updateRate } from '../api/parkingApi.js';
import Button from '../components/Button.jsx';
import Card from '../components/Card.jsx';
import { Field, TextInput } from '../components/Field.jsx';
import Modal from '../components/Modal.jsx';
import Table from '../components/Table.jsx';
import { ErrorMessage, LoadingState } from '../components/States.jsx';
import { formatMoney } from '../utils/format.js';

const EMPTY_RATE = {
  vehicleType: '',
  firstHour: '0.00',
  extraHour: '0.00',
  dailyCap: '0.00',
  graceMinutes: 10,
};

function RateFormModal({ rate, onClose, onSaved }) {
  const isEditing = Boolean(rate.id || (rate.vehicleType && rate.firstHour !== '0.00'));
  const [form, setForm] = useState({
    vehicleType: rate.vehicleType || '',
    firstHour: rate.firstHour,
    extraHour: rate.extraHour,
    dailyCap: rate.dailyCap,
    graceMinutes: rate.graceMinutes,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const setField = (name) => (event) => setForm({ ...form, [name]: event.target.value });

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      if (isEditing) {
        await updateRate(rate.vehicleType, {
          firstHour: form.firstHour,
          extraHour: form.extraHour,
          dailyCap: form.dailyCap,
          graceMinutes: Number(form.graceMinutes),
        });
      } else {
        await createRate({
          vehicleType: form.vehicleType.trim().toUpperCase(),
          firstHour: form.firstHour,
          extraHour: form.extraHour,
          dailyCap: form.dailyCap,
          graceMinutes: Number(form.graceMinutes),
        });
      }
      onSaved();
    } catch (requestError) {
      setError(requestError);
      setSubmitting(false);
    }
  };

  const modalTitle = isEditing
    ? `${es.rates.editTitle} · ${es.vehicleTypes[rate.vehicleType] || rate.vehicleType}`
    : es.rates.createTitle;

  return (
    <Modal open title={modalTitle} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <ErrorMessage error={error} />
        <Field label={es.rates.vehicleType}>
          <TextInput
            value={form.vehicleType}
            onChange={setField('vehicleType')}
            disabled={isEditing}
            placeholder="EJ: MOTORCYCLE, VAN, BICYCLE"
            maxLength={15}
            required
          />
        </Field>
        <Field label={es.rates.firstHour}>
          <TextInput type="number" min="0" step="0.01" value={form.firstHour} onChange={setField('firstHour')} required />
        </Field>
        <Field label={es.rates.extraHour}>
          <TextInput type="number" min="0" step="0.01" value={form.extraHour} onChange={setField('extraHour')} required />
        </Field>
        <Field label={es.rates.dailyCap}>
          <TextInput type="number" min="0" step="0.01" value={form.dailyCap} onChange={setField('dailyCap')} required />
        </Field>
        <Field label={es.rates.graceMinutes}>
          <TextInput type="number" min="0" max="1440" value={form.graceMinutes} onChange={setField('graceMinutes')} required />
        </Field>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            {es.common.cancel}
          </Button>
          <Button type="submit" disabled={submitting}>
            {es.common.save}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default function RatesPage() {
  const rates = useAsync(() => listRates(), []);
  const [editing, setEditing] = useState(null);

  const columns = [
    {
      key: 'vehicleType',
      header: es.rates.vehicleType,
      render: (row) => es.vehicleTypes[row.vehicleType] || row.vehicleType,
    },
    { key: 'firstHour', header: es.rates.firstHour, render: (row) => formatMoney(row.firstHour) },
    { key: 'extraHour', header: es.rates.extraHour, render: (row) => formatMoney(row.extraHour) },
    { key: 'dailyCap', header: es.rates.dailyCap, render: (row) => formatMoney(row.dailyCap) },
    { key: 'graceMinutes', header: es.rates.graceMinutes },
    {
      key: 'actions',
      header: es.common.actions,
      render: (row) => (
        <Button variant="ghost" onClick={() => setEditing(row)}>
          {es.common.edit}
        </Button>
      ),
    },
  ];

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900">{es.rates.title}</h1>
        <Button onClick={() => setEditing(EMPTY_RATE)}>{es.rates.create}</Button>
      </div>
      <Card>
        <ErrorMessage error={rates.error} onRetry={rates.reload} />
        {rates.loading && !rates.data ? <LoadingState /> : <Table columns={columns} rows={rates.data || []} rowKey="vehicleType" />}
      </Card>
      {editing && (
        <RateFormModal
          rate={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            rates.reload();
          }}
        />
      )}
    </>
  );
}
