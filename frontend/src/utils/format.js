import es from '../i18n/es.js';

export function translateError(error) {
  const status = error?.response?.status;
  const code = error?.response?.data?.error;
  if (code && es.errors[code]) {
    return es.errors[code];
  }
  if (status === 429 || status === 503) {
    return es.errors.TOO_MANY_REQUESTS;
  }
  if (!error?.response) {
    return es.errors.NETWORK_ERROR;
  }
  return es.errors.UNKNOWN;
}

export function formatDateTime(value) {
  if (!value) {
    return es.common.notAvailable;
  }
  return new Date(value).toLocaleString('es', { dateStyle: 'short', timeStyle: 'short' });
}

export function formatTime(value) {
  if (!value) {
    return es.common.notAvailable;
  }
  return new Date(value).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export function formatMoney(value) {
  if (value === null || value === undefined) {
    return es.common.notAvailable;
  }
  return `${es.common.currencySymbol} ${Number(value).toFixed(2)}`;
}

export function formatMinutes(totalMinutes) {
  if (totalMinutes === null || totalMinutes === undefined) {
    return es.common.notAvailable;
  }
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) {
    return `${minutes} ${es.common.minutesShort}`;
  }
  return `${hours} ${es.common.hoursShort} ${minutes} ${es.common.minutesShort}`;
}

export function toDateInputValue(date) {
  return date.toISOString().slice(0, 10);
}

export function isTokenExpired(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return !payload.exp || payload.exp * 1000 <= Date.now();
  } catch (error) {
    return true;
  }
}
