import es from '../i18n/es.js';
import { translateError } from '../utils/format.js';
import Button from './Button.jsx';

export function LoadingState() {
  return <p className="py-8 text-center text-sm text-slate-500">{es.common.loading}</p>;
}

export function ErrorMessage({ error, onRetry = null }) {
  if (!error) {
    return null;
  }
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      <span>{translateError(error)}</span>
      {onRetry && (
        <Button variant="secondary" onClick={onRetry}>
          {es.common.retry}
        </Button>
      )}
    </div>
  );
}

export function SuccessMessage({ children }) {
  return <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{children}</div>;
}
