import axios from 'axios';

// Dedicated client for the worker portal — uses 'workerToken' so it never
// touches the manager session's 'token' in localStorage.
const workerClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://Pressing-prod-env.eba-3f9xgw3m.eu-north-1.elasticbeanstalk.com/api/v1',
});

workerClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('workerToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

workerClient.interceptors.response.use(
  (r) => r,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('workerToken');
      localStorage.removeItem('workerProfile');
      if (!window.location.pathname.startsWith('/worker/login')) {
        window.location.href = '/worker/login';
      }
    }
    return Promise.reject(error);
  }
);

export default workerClient;