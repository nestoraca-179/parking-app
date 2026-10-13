import { useState } from 'react';
import es from '../i18n/es.js';
import useAsync from '../hooks/useAsync.js';
import { createSpace, deleteSpace, listSpaces, updateSpace } from '../api/parkingApi.js';
import Badge from '../components/Badge.jsx';
import Button from '../components/Button.jsx';
import Card from '../components/Card.jsx';
import { Field, SelectInput, TextInput } from '../components/Field.jsx';
import Modal from '../components/Modal.jsx';
import Table from '../components/Table.jsx';
import { ErrorMessage, LoadingState } from '../components/States.jsx';
import { BADGE_TONES, EDITABLE_SPACE_STATUSES } from '../utils/constants.js';

const EMPTY_FORM = { code: '', zone: '', rowIndex: 0, colIndex: 0, status: 'FREE' };

function SpaceFormModal({ space, onClose, onSaved }) {
  const isEditing = Boolean(space.id);
  const [form, setForm] = useState({
    code: space.code,
    zone: space.zone,
    rowIndex: space.rowIndex,
    colIndex: space.colIndex,
    status: space.status === 'OCCUPIED' ? 'FREE' : space.status,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const locked = space.status === 'OCCUPIED';

  const setField = (name) => (event) => setForm({ ...form, [name]: event.target.value });

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    const payload = {
      code: form.code,
      zone: form.zone,
      rowIndex: Number(form.rowIndex),
      colIndex: Number(form.colIndex),
    };
    if (!locked) {
      payload.status = form.status;
    }
    try {
      if (isEditing) {
        await updateSpace(space.id, payload);
      } else {
        await createSpace(payload);
      }
      onSaved();
    } catch (requestError) {
      setError(requestError);
      setSubmitting(false);
    }
  };

  return (
    <Modal open title={isEditing ? es.spaces.editTitle : es.spaces.createTitle} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <ErrorMessage error={error} />
        <div className="grid grid-cols-2 gap-4">
          <Field label={es.spaces.code}>
            <TextInput value={form.code} onChange={setField('code')} maxLength={10} required />
          </Field>
          <Field label={es.spaces.zone}>
            <TextInput value={form.zone} onChange={setField('zone')} maxLength={1} required />
          </Field>
          <Field label={es.spaces.row}>
            <TextInput type="number" min="0" value={form.rowIndex} onChange={setField('rowIndex')} required />
          </Field>
          <Field label={es.spaces.column}>
            <TextInput type="number" min="0" value={form.colIndex} onChange={setField('colIndex')} required />
          </Field>
        </div>
        <Field label={es.spaces.status}>
          <SelectInput value={form.status} onChange={setField('status')} disabled={locked}>
            {EDITABLE_SPACE_STATUSES.map((status) => (
              <option key={status} value={status}>
                {es.status[status]}
              </option>
            ))}
          </SelectInput>
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

function DeleteSpaceModal({ space, onClose, onDeleted }) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleDelete = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await deleteSpace(space.id);
      onDeleted();
    } catch (requestError) {
      setError(requestError);
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open
      title={es.spaces.deleteTitle}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            {es.common.cancel}
          </Button>
          <Button variant="danger" onClick={handleDelete} disabled={submitting}>
            {es.common.delete}
          </Button>
        </>
      }
    >
      <ErrorMessage error={error} />
      <p className="text-sm text-slate-600">{`${es.spaces.confirmDelete} (${space.code})`}</p>
    </Modal>
  );
}

export default function SpacesPage() {
  const spaces = useAsync(() => listSpaces(), []);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const columns = [
    { key: 'code', header: es.spaces.code },
    { key: 'zone', header: es.spaces.zone },
    { key: 'rowIndex', header: es.spaces.row },
    { key: 'colIndex', header: es.spaces.column },
    {
      key: 'vehicleType',
      header: es.spaces.vehicleType,
      render: (row) => (row.status === 'OCCUPIED' ? es.vehicleTypes[row.vehicleType] || row.vehicleType : es.common.notAvailable),
    },
    {
      key: 'status',
      header: es.spaces.status,
      render: (row) => <Badge tone={BADGE_TONES[row.status]}>{es.status[row.status]}</Badge>,
    },
    { key: 'plate', header: es.spaces.plate, render: (row) => row.plate || es.common.notAvailable },
    {
      key: 'actions',
      header: es.common.actions,
      render: (row) => (
        <div className="flex gap-1">
          <Button variant="ghost" onClick={() => setEditing(row)}>
            {es.common.edit}
          </Button>
          <Button variant="ghost" onClick={() => setDeleting(row)}>
            {es.common.delete}
          </Button>
        </div>
      ),
    },
  ];

  const closeAndReload = () => {
    setEditing(null);
    setDeleting(null);
    spaces.reload();
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900">{es.spaces.title}</h1>
        <Button onClick={() => setEditing(EMPTY_FORM)}>{es.spaces.create}</Button>
      </div>
      <Card>
        <ErrorMessage error={spaces.error} onRetry={spaces.reload} />
        {spaces.loading && !spaces.data ? <LoadingState /> : <Table columns={columns} rows={spaces.data || []} rowKey="id" />}
      </Card>
      {editing && <SpaceFormModal space={editing} onClose={() => setEditing(null)} onSaved={closeAndReload} />}
      {deleting && <DeleteSpaceModal space={deleting} onClose={() => setDeleting(null)} onDeleted={closeAndReload} />}
    </>
  );
}
