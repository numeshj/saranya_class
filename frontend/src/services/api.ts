import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000/api'
});

api.interceptors.request.use(config => {
  const stored = localStorage.getItem('session');
  if (stored) {
    const { access } = JSON.parse(stored);
    if (access) config.headers.Authorization = `Bearer ${access}`;
  }
  return config;
});
