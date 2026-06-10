import axios from 'axios';

const BASE_URL = import.meta.env.PROD ? 'https://nexusdfi-backend-741401327113.us-central1.run.app' : (import.meta.env.VITE_API_URL || 'http://localhost:8000');

const api = axios.create({
  baseURL: `${BASE_URL}/api`,
  headers: { 'Content-Type': 'application/json' },
  timeout: 20000, // 20 second global timeout
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('nexus_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 - clear token and redirect to login
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const originalRequest = err.config;
    if (err.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      localStorage.removeItem('nexus_token');
      localStorage.removeItem('nexus_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;

// ── Auth ────────────────────────────────────────────────
export const authApi = {
  login:    (username: string, password: string) =>
    api.post('/auth/login', { username, password }),
  register: (username: string, password: string) =>
    api.post('/auth/register', { username, password }),
  me:       () => api.get('/auth/me'),
};

// ── Cases ───────────────────────────────────────────────
export const casesApi = {
  list:   (params?: Record<string, string>) => api.get('/cases', { params }),
  get:    (id: number) => api.get(`/cases/${id}`),
  create: (data: object) => api.post('/cases', data),
  update: (id: number, data: object) => api.put(`/cases/${id}`, data),
  delete: (id: number) => api.delete(`/cases/${id}`),
  stats:  () => api.get('/cases/dashboard/stats'),
};

// ── Evidence ────────────────────────────────────────────
export const evidenceApi = {
  list:   (caseId: number) => api.get(`/evidence/case/${caseId}`),
  listAll: () => api.get('/evidence/all'),
  upload: (caseId: number, file: File, onProgress?: (pct: number) => void) => {
    const fd = new FormData();
    fd.append('file', file);
    return api.post(`/evidence/upload/${caseId}`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 120000, // 2 min for large uploads
      onUploadProgress: (evt) => {
        if (onProgress && evt.total) {
          onProgress(Math.round((evt.loaded * 100) / evt.total));
        }
      },
    });
  },
  delete: (id: number) => api.delete(`/evidence/${id}`),
};

// ── Analysis ────────────────────────────────────────────
export const analysisApi = {
  runImageForensics: (evidenceId: number) =>
    api.post(`/analysis/image-forensics/${evidenceId}`, {}, { timeout: 60000 }),
  runDeepfake:       (evidenceId: number) =>
    api.post(`/analysis/deepfake/${evidenceId}`, {}, { timeout: 60000 }),
  runLogAnalysis:    (evidenceId: number) =>
    api.post(`/analysis/log-analysis/${evidenceId}`, {}, { timeout: 60000 }),
  getResult:         (evidenceId: number) =>
    api.get(`/analysis/result/${evidenceId}`),
  generateReport:    (caseId: number) =>
    api.get(`/analysis/report/${caseId}`, { responseType: 'blob', timeout: 60000 }),
  askAssistant:      (question: string, context: string, apiKey?: string, persona?: string, provider?: string) =>
    api.post('/analysis/assistant', { question, context, persona }, {
      timeout: 30000,
      headers: {
        ...(apiKey ? { 'x-api-key': apiKey } : {}),
        ...(provider ? { 'x-ai-provider': provider } : {}),
      },
    }),
  analyzeText:       (text: string, apiKey?: string, provider?: string) =>
    api.post('/analysis/text-analyze', { text }, {
      timeout: 30000,
      headers: {
        ...(apiKey ? { 'x-api-key': apiKey } : {}),
        ...(provider ? { 'x-ai-provider': provider } : {}),
      },
    }),
  caseSummary:       (caseId: number, apiKey?: string, provider?: string) =>
    api.get(`/analysis/case-summary/${caseId}`, {
      timeout: 30000,
      headers: {
        ...(apiKey ? { 'x-api-key': apiKey } : {}),
        ...(provider ? { 'x-ai-provider': provider } : {}),
      },
    }),
  getStats:          () =>
    api.get('/analysis/stats'),
};
