const API_BASE = '/api';

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('sugar_erp_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export async function apiRequest<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const customHeaders = options.headers ? (options.headers as Record<string, string>) : {};
  const config: RequestInit = {
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...customHeaders,
    },
  };

  const response = await fetch(url, config);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data && data.error ? data.error : `HTTP error ${response.status}`;
    throw new Error(errorMsg);
  }

  return data as T;
}

// API methods
export const api = {
  // Auth
  login: (credentials: { username: string; password: string }) =>
    apiRequest('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  getMe: () => apiRequest('/auth/me'),
  changePassword: (data: any) =>
    apiRequest('/auth/change-password', { method: 'POST', body: JSON.stringify(data) }),
  getSwitchableUsers: () => apiRequest<{ users: any[] }>('/auth/switchable-users'),
  quickSwitch: (params: { userId?: number; username?: string }) =>
    apiRequest<{ message: string; token: string; user: any }>('/auth/quick-switch', {
      method: 'POST',
      body: JSON.stringify(params),
    }),

  // Plants
  getPlants: () => apiRequest('/plants'),
  getPlant: (id: number | string) => apiRequest(`/plants/${id}`),
  createPlant: (data: any) =>
    apiRequest('/plants', { method: 'POST', body: JSON.stringify(data) }),
  updatePlant: (id: number | string, data: any) =>
    apiRequest(`/plants/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deletePlant: (id: number | string) =>
    apiRequest(`/plants/${id}`, { method: 'DELETE' }),

  // Seasons
  getSeasons: () => apiRequest('/sugar-seasons'),
  createSeason: (data: any) =>
    apiRequest('/sugar-seasons', { method: 'POST', body: JSON.stringify(data) }),
  updateSeason: (id: number | string, data: any) =>
    apiRequest(`/sugar-seasons/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  setCurrentSeason: (season_name: string) =>
    apiRequest('/sugar-seasons/set-current', { method: 'POST', body: JSON.stringify({ season_name }) }),
  deleteSeason: (id: number | string) =>
    apiRequest(`/sugar-seasons/${id}`, { method: 'DELETE' }),

  // Production
  getProduction: (plantId: number | string, season: string, month: string) =>
    apiRequest(`/production?plantId=${plantId}&season=${season}&month=${month}`),
  getAllPlantsProduction: (season: string, month: string) =>
    apiRequest(`/production?all=true&season=${season}&month=${month}`),
  saveProduction: (data: any) =>
    apiRequest('/production', { method: 'POST', body: JSON.stringify(data) }),
  deleteProduction: (plantId: number | string, season: string, month: string) =>
    apiRequest(`/production?plantId=${plantId}&season=${season}&month=${month}`, { method: 'DELETE' }),

  // Diversions
  getDiversions: (plantId: number | string, season: string, month: string) =>
    apiRequest(`/diversions?plantId=${plantId}&season=${season}&month=${month}`),
  saveDiversions: (data: any) =>
    apiRequest('/diversions', { method: 'POST', body: JSON.stringify(data) }),

  // Dispatches
  getDispatches: (plantId: number | string, season: string, month: string, category?: string) => {
    let q = `/dispatches?plantId=${plantId}&season=${season}&month=${month}`;
    if (category) q += `&category=${category}`;
    return apiRequest(q);
  },
  saveDispatch: (data: any) =>
    apiRequest('/dispatches', { method: 'POST', body: JSON.stringify(data) }),
  deleteDispatch: (id: number | string) =>
    apiRequest(`/dispatches/${id}`, { method: 'DELETE' }),
  saveHsn: (data: any) =>
    apiRequest('/dispatches/hsn', { method: 'POST', body: JSON.stringify(data) }),

  // Imports / Exports
  getImportsExports: (plantId: number | string, season: string, month: string) =>
    apiRequest(`/imports-exports?plantId=${plantId}&season=${season}&month=${month}`),
  saveImportsExports: (data: any) =>
    apiRequest('/imports-exports', { method: 'POST', body: JSON.stringify(data) }),

  // Inventory
  getInventory: (plantId: number | string, season: string, month: string) =>
    apiRequest(`/inventory?plantId=${plantId}&season=${season}&month=${month}`),
  saveInventory: (data: any) =>
    apiRequest('/inventory', { method: 'POST', body: JSON.stringify(data) }),
  deleteInventory: (plantId: number | string, season: string, month: string) =>
    apiRequest(`/inventory?plantId=${plantId}&season=${season}&month=${month}`, { method: 'DELETE' }),

  // Packaging
  getPackaging: (plantId: number | string, season: string, month: string) =>
    apiRequest(`/packaging?plantId=${plantId}&season=${season}&month=${month}`),
  savePackaging: (data: any) =>
    apiRequest('/packaging', { method: 'POST', body: JSON.stringify(data) }),
  deletePackaging: (plantId: number | string, season: string, month: string) =>
    apiRequest(`/packaging?plantId=${plantId}&season=${season}&month=${month}`, { method: 'DELETE' }),

  // Cane Dues
  getCaneDues: (plantId: number | string, season: string, month: string) =>
    apiRequest(`/cane-dues?plantId=${plantId}&season=${season}&month=${month}`),
  saveCaneDues: (data: any) =>
    apiRequest('/cane-dues', { method: 'POST', body: JSON.stringify(data) }),
  deleteCaneDues: (plantId: number | string, season: string, month: string) =>
    apiRequest(`/cane-dues?plantId=${plantId}&season=${season}&month=${month}`, { method: 'DELETE' }),

  // P2 Reports
  getP2Reports: (plantId?: number | string, season?: string, month?: string, status?: string) => {
    const queryParts: string[] = [];
    if (plantId) queryParts.push(`plantId=${plantId}`);
    if (season) queryParts.push(`season=${season}`);
    if (month) queryParts.push(`month=${month}`);
    if (status) queryParts.push(`status=${status}`);
    const qs = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
    return apiRequest(`/p2-reports${qs}`);
  },
  getP2Report: (id: number | string) => apiRequest(`/p2-reports/${id}`),
  generateP2Draft: (plantId: number | string, season_name: string, month: string) =>
    apiRequest('/p2-reports/generate', { method: 'POST', body: JSON.stringify({ plantId, season_name, month }) }),
  generateP2Report: (data: { plantId: number | string; season_name: string; month: string }) =>
    apiRequest('/p2-reports/generate', { method: 'POST', body: JSON.stringify(data) }),
  validateP2Report: (id: number | string) =>
    apiRequest(`/p2-reports/${id}/validate`, { method: 'POST' }),
  submitP2ReportForReview: (id: number | string) =>
    apiRequest(`/p2-reports/${id}/submit-for-review`, { method: 'POST' }),
  approveP2Report: (id: number | string) =>
    apiRequest(`/p2-reports/${id}/approve`, { method: 'POST' }),
  rejectP2Report: (id: number | string, reason: string) =>
    apiRequest(`/p2-reports/${id}/reject`, { method: 'POST', body: JSON.stringify({ reason }) }),
  pushP2ReportToNSWS: (id: number | string) =>
    apiRequest(`/p2-reports/${id}/push-nsws`, { method: 'POST' }),

  // Dashboard
  getDashboardStats: (plantId?: number | string, season?: string, month?: string) => {
    const queryParts: string[] = [];
    if (plantId) queryParts.push(`plantId=${plantId}`);
    if (season) queryParts.push(`season=${season}`);
    if (month) queryParts.push(`month=${month}`);
    const qs = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
    return apiRequest(`/dashboard/stats${qs}`);
  },

  // Users
  getUsers: () => apiRequest('/users'),
  createUser: (data: any) =>
    apiRequest('/users', { method: 'POST', body: JSON.stringify(data) }),
  updateUser: (id: number | string, data: any) =>
    apiRequest(`/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  resetUserPassword: (id: number | string, password: string) =>
    apiRequest(`/users/${id}`, { method: 'PUT', body: JSON.stringify({ password }) }),
  updateUserStatus: (id: number | string, is_active: number) =>
    apiRequest(`/users/${id}`, { method: 'PUT', body: JSON.stringify({ is_active }) }),

  // Settings
  getSettings: () => apiRequest('/settings'),
  updateSettings: (data: any) =>
    apiRequest('/settings', { method: 'PUT', body: JSON.stringify(data) }),

  // Audit Logs
  getAuditLogs: (limit?: number) => apiRequest(`/audit-logs?limit=${limit ? limit : 50}`),
};
