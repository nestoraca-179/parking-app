import http from './http.js';

export async function listSpaces(params) {
  const response = await http.get('/parking/spaces', { params });
  return response.data;
}

export async function createSpace(payload) {
  const response = await http.post('/parking/spaces', payload);
  return response.data;
}

export async function updateSpace(id, payload) {
  const response = await http.put(`/parking/spaces/${id}`, payload);
  return response.data;
}

export async function deleteSpace(id) {
  await http.delete(`/parking/spaces/${id}`);
}

export async function listRates() {
  const response = await http.get('/parking/rates');
  return response.data;
}

export async function createRate(payload) {
  const response = await http.post('/parking/rates', payload);
  return response.data;
}

export async function updateRate(vehicleType, payload) {
  const response = await http.put(`/parking/rates/${vehicleType}`, payload);
  return response.data;
}

export async function listTickets(params) {
  const response = await http.get('/parking/tickets', { params });
  return response.data;
}

export async function getQuote(ticketId) {
  const response = await http.get(`/parking/tickets/${ticketId}/quote`);
  return response.data;
}

export async function createEntry(payload) {
  const response = await http.post('/parking/entries', payload);
  return response.data;
}

export async function createExit(payload) {
  const response = await http.post('/parking/exits', payload);
  return response.data;
}
