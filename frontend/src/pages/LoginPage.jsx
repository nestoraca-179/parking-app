import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import es from '../i18n/es.js';
import { useAuth } from '../context/AuthContext.jsx';
import Button from '../components/Button.jsx';
import { Field, TextInput } from '../components/Field.jsx';
import { ErrorMessage } from '../components/States.jsx';

export default function LoginPage() {
  const { token, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  if (token) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await login(username, password);
      navigate(location.state?.from?.pathname || '/', { replace: true });
    } catch (requestError) {
      setError(requestError);
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-5 rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">{es.login.title}</h1>
          <p className="mt-1 text-sm text-slate-500">{es.login.subtitle}</p>
        </div>
        <ErrorMessage error={error} />
        <Field label={es.login.username}>
          <TextInput
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            autoComplete="username"
            autoFocus
            required
          />
        </Field>
        <Field label={es.login.password}>
          <TextInput
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            required
          />
        </Field>
        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? es.login.submitting : es.login.submit}
        </Button>
      </form>
    </div>
  );
}
