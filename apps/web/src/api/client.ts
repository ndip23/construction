import axios from 'axios';
import toast from 'react-hot-toast';

const apiClient = axios.create({
  // ✅ FIXED: Using HTTPS and CloudFront
  baseURL: import.meta.env.VITE_API_URL || 'https://d12e8wwao0hlhx.cloudfront.net/api/v1',
});

// 1. REQUEST INTERCEPTOR: Inject Token
apiClient.interceptors.request.use((config) => {
  let token = localStorage.getItem('token');
  // Self-heal: a worker-portal token must NEVER be used in the manager app.
  // (If one leaked into 'token', drop it so the user is re-authenticated cleanly.)
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload?.role === 'worker') {
        localStorage.removeItem('token');
        token = null;
      }
    } catch { /* not a decodable JWT — leave as-is */ }
  }
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // Let the browser set multipart boundary for file uploads
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }
  return config;
});

// 2. RESPONSE INTERCEPTOR: Global Notifications
apiClient.interceptors.response.use(
  (response) => {
    // Only show success toast if the backend sends a specific "message" 
    // and it's a data-changing request (POST, PUT, DELETE)
    const isDataChange = ['post', 'put', 'delete'].includes(response.config.method || '');
    
    if (isDataChange && response.data?.message) {
      toast.success(response.data.message);
    }
    
    return response;
  },
  (error) => {
    // Handle Network Errors (Server offline)
    if (!error.response) {
      toast.error("Cpromark Server is unreachable. Check your connection.");
      return Promise.reject(error);
    }

    const message = error.response?.data?.message || 'Action failed';
    const status = error.response?.status;

    // Handle Expired or Invalid Tokens
    if (status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('cpromark-storage');
      // Only redirect if not already on login page
      if (!window.location.pathname.includes('/login')) {
        toast.error("Session expired. Please log in again.");
        window.location.href = '/login';
      }
    } else {
      // Show error toast for everything else (400, 403, 500)
      if ((error.config as any)?.skipErrorToast !== true) {
        toast.error(message);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;