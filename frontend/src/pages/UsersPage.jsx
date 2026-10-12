import { useState } from 'react';
import es from '../i18n/es.js';
import { useAuth } from '../context/AuthContext.jsx';
import useAsync from '../hooks/useAsync.js';
import { createUser, deactivateUser, listUsers, updateUser } from '../api/authApi.js';
import Badge from '../components/Badge.jsx';
import Button from '../components/Button.jsx';
import Card from '../components/Card.jsx';
import { Field, SelectInput, TextInput } from '../components/Field.jsx';
import Modal from '../components/Modal.jsx';
import Table from '../components/Table.jsx';
import { ErrorMessage, LoadingState } from '../components/States.jsx';
import { BADGE_TONES, ROLES } from '../utils/constants.js';
import { formatDateTime } from '../utils/format.js';

const EMPTY_USER = { username: '', fullName: '', role: ROLES.OPERATOR, active: true };

function UserFormModal({ user, onClose, onSaved }) {
  const isEditing = Boolean(user.id);
  const [form, setForm] = useState({
    username: user.username,
    fullName: user.fullName,
    role: user.role,
    password: '',
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
        const payload = { fullName: form.fullName, role: form.role };
        if (form.password) {
          payload.password = form.password;
        }
        await updateUser(user.id, payload);
      } else {
        await createUser({
          username: form.username,
          fullName: form.fullName,
          role: form.role,
          password: form.password,
        });
      }
      onSaved();
    } catch (requestError) {
      setError(requestError);
      setSubmitting(false);
    }
  };

  return (
    <Modal open title={isEditing ? es.users.editTitle : es.users.createTitle} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <ErrorMessage error={error} />
        <Field label={es.users.username}>
          <TextInput value={form.username} onChange={setField('username')} disabled={isEditing} required />
        </Field>
        <Field label={es.users.fullName}>
          <TextInput value={form.fullName} onChange={setField('fullName')} maxLength={100} required />
        </Field>
        <Field label={es.users.role}>
          <SelectInput value={form.role} onChange={setField('role')}>
            {Object.values(ROLES).map((role) => (
              <option key={role} value={role}>
                {es.roles[role]}
              </option>
            ))}
          </SelectInput>
        </Field>
        <Field label={es.users.password} hint={isEditing ? es.users.newPasswordHint : es.users.passwordHint}>
          <TextInput
            type="password"
            value={form.password}
            onChange={setField('password')}
            autoComplete="new-password"
            required={!isEditing}
          />
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

function DeactivateModal({ user, onClose, onDone }) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleConfirm = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await deactivateUser(user.id);
      onDone();
    } catch (requestError) {
      setError(requestError);
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open
      title={es.users.deactivateTitle}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            {es.common.cancel}
          </Button>
          <Button variant="danger" onClick={handleConfirm} disabled={submitting}>
            {es.users.deactivate}
          </Button>
        </>
      }
    >
      <ErrorMessage error={error} />
      <p className="text-sm text-slate-600">{`${es.users.confirmDeactivate} (${user.username})`}</p>
    </Modal>
  );
}

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const users = useAsync(() => listUsers(), []);
  const [editing, setEditing] = useState(null);
  const [deactivating, setDeactivating] = useState(null);
  const [actionError, setActionError] = useState(null);

  const handleActivate = async (row) => {
    setActionError(null);
    try {
      await updateUser(row.id, { active: true });
      users.reload();
    } catch (requestError) {
      setActionError(requestError);
    }
  };

  const columns = [
    { key: 'username', header: es.users.username },
    { key: 'fullName', header: es.users.fullName },
    { key: 'role', header: es.users.role, render: (row) => es.roles[row.role] },
    {
      key: 'active',
      header: es.users.status,
      render: (row) => (
        <Badge tone={row.active ? BADGE_TONES.ACTIVE : BADGE_TONES.INACTIVE}>
          {row.active ? es.status.ACTIVE : es.status.INACTIVE}
        </Badge>
      ),
    },
    { key: 'createdAt', header: es.users.createdAt, render: (row) => formatDateTime(row.createdAt) },
    {
      key: 'actions',
      header: es.common.actions,
      render: (row) => (
        <div className="flex gap-1">
          <Button variant="ghost" onClick={() => setEditing(row)}>
            {es.common.edit}
          </Button>
          {row.active ? (
            <Button variant="ghost" disabled={row.id === currentUser?.id} onClick={() => setDeactivating(row)}>
              {es.users.deactivate}
            </Button>
          ) : (
            <Button variant="ghost" onClick={() => handleActivate(row)}>
              {es.users.activate}
            </Button>
          )}
        </div>
      ),
    },
  ];

  const closeAndReload = () => {
    setEditing(null);
    setDeactivating(null);
    users.reload();
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900">{es.users.title}</h1>
        <Button onClick={() => setEditing(EMPTY_USER)}>{es.users.create}</Button>
      </div>
      <Card>
        <ErrorMessage error={users.error || actionError} onRetry={users.reload} />
        {users.loading && !users.data ? <LoadingState /> : <Table columns={columns} rows={users.data || []} rowKey="id" />}
      </Card>
      {editing && <UserFormModal user={editing} onClose={() => setEditing(null)} onSaved={closeAndReload} />}
      {deactivating && <DeactivateModal user={deactivating} onClose={() => setDeactivating(null)} onDone={closeAndReload} />}
    </>
  );
}
