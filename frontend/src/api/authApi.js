import http from './http.js';

export async function login(username, password) {
  const response = await http.post('/auth/login', { username, password });
  return response.data;
}

export async function getProfile() {
  const response = await http.get('/auth/me');
  return response.data;
}

export async function listUsers() {
  const response = await http.get('/auth/users');
  return response.data;
}

export async function createUser(payload) {
  const response = await http.post('/auth/users', payload);
  return response.data;
}

export async function updateUser(id, payload) {
  const response = await http.put(`/auth/users/${id}`, payload);
  return response.data;
}

export async function deactivateUser(id) {
  const response = await http.delete(`/auth/users/${id}`);
  return response.data;
}
