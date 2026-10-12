import http from './http.js';

export async function getOccupancy(minutes) {
  const response = await http.get('/realtime/occupancy', { params: { minutes } });
  return response.data;
}

export async function listEvents(limit) {
  const response = await http.get('/realtime/events', { params: { limit } });
  return response.data;
}
