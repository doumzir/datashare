const API_URL = 'http://localhost:3000';
const TOKEN_KEY = 'datashare_token';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function saveToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeToken() {
  localStorage.removeItem(TOKEN_KEY);
}

function authHeaders(): HeadersInit {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handleResponse(res: Response) {
  const data = await res.json();
  if (!res.ok) throw data;
  return data;
}

// Auth
export async function apiRegister(email: string, password: string) {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return handleResponse(res);
}

export async function apiLogin(email: string, password: string) {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return handleResponse(res);
}

// Files
export async function apiGetMyFiles(tag?: string) {
  const url = tag
    ? `${API_URL}/files/my?tag=${encodeURIComponent(tag)}`
    : `${API_URL}/files/my`;
  const res = await fetch(url, { headers: authHeaders() });
  return handleResponse(res);
}

export async function apiGetFile(token: string) {
  const res = await fetch(`${API_URL}/files/${token}`);
  return handleResponse(res);
}

export async function apiDeleteFile(id: string) {
  const res = await fetch(`${API_URL}/files/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  return handleResponse(res);
}

export async function apiVerifyPassword(token: string, password: string) {
  const res = await fetch(`${API_URL}/files/${token}/verify-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  });
  return handleResponse(res);
}

export function getDownloadUrl(token: string) {
  return `${API_URL}/files/${token}/download`;
}
