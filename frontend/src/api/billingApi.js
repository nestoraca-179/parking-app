import http from './http.js';

export async function listInvoices(params) {
  const response = await http.get('/billing/invoices', { params });
  return response.data;
}

export async function getSummaryReport() {
  const response = await http.get('/billing/reports/summary');
  return response.data;
}

export async function getDailyReport(params) {
  const response = await http.get('/billing/reports/daily', { params });
  return response.data;
}

export async function getVehicleTypeReport(params) {
  const response = await http.get('/billing/reports/by-vehicle-type', { params });
  return response.data;
}

export async function getOperatorReport(params) {
  const response = await http.get('/billing/reports/by-operator', { params });
  return response.data;
}
