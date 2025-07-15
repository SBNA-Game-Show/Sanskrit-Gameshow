import axios from 'axios';

const API = axios.create({ baseURL: 'http://localhost:5050/api' });

API.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const submitAnswer = (data: { questionId: string; answer: string }) =>
  API.post('/response/submit', data);

export const getScores = () => API.get('/response/scores');
