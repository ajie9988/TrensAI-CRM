import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
  timeout: 10000,
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("auth_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authService = {
  login: (email: string, password: string) =>
    api.post("/api/v1/auth/login", { email, password }),
  register: (data: any) =>
    api.post("/api/v1/auth/register", data),
  logout: () =>
    api.post("/api/v1/auth/logout"),
  getCurrentUser: () =>
    api.get("/api/v1/auth/me"),
};

export const chatService = {
  getConversations: (deviceId: number) =>
    api.get("/api/v1/chat/conversations", { params: { device_id: deviceId } }),
  getMessages: (conversationId: number, limit = 50) =>
    api.get(`/api/v1/chat/conversations/${conversationId}/messages`, {
      params: { limit },
    }),
  sendMessage: (conversationId: number, content: string, type = "text") =>
    api.post(`/api/v1/chat/conversations/${conversationId}/messages`, {
      content,
      type,
    }),
};

export const contactService = {
  getContacts: (page = 1, limit = 50) =>
    api.get("/api/v1/contacts", { params: { page, limit } }),
  getContact: (id: number) =>
    api.get(`/api/v1/contacts/${id}`),
  createContact: (data: any) =>
    api.post("/api/v1/contacts", data),
  updateContact: (id: number, data: any) =>
    api.put(`/api/v1/contacts/${id}`, data),
  deleteContact: (id: number) =>
    api.delete(`/api/v1/contacts/${id}`),
};

export const flowService = {
  getFlows: (page = 1) =>
    api.get("/api/v1/flows", { params: { page } }),
  getFlow: (id: number) =>
    api.get(`/api/v1/flows/${id}`),
  createFlow: (data: any) =>
    api.post("/api/v1/flows", data),
  updateFlow: (id: number, data: any) =>
    api.put(`/api/v1/flows/${id}`, data),
  executeFlow: (id: number, contactId: number) =>
    api.post(`/api/v1/flows/${id}/execute`, { contact_id: contactId }),
};

export const broadcastService = {
  getBroadcasts: (page = 1) =>
    api.get("/api/v1/broadcasts", { params: { page } }),
  createBroadcast: (data: any) =>
    api.post("/api/v1/broadcasts", data),
  updateBroadcast: (id: number, data: any) =>
    api.put(`/api/v1/broadcasts/${id}`, data),
  deleteBroadcast: (id: number) =>
    api.delete(`/api/v1/broadcasts/${id}`),
  sendBroadcast: (id: number) =>
    api.post(`/api/v1/broadcasts/${id}/send`),
};

export const deviceService = {
  getDevices: () =>
    api.get("/api/v1/devices"),
  createDevice: (data: any) =>
    api.post("/api/v1/devices", data),
  deleteDevice: (id: number) =>
    api.delete(`/api/v1/devices/${id}`),
  reconnectDevice: (id: number) =>
    api.post(`/api/v1/devices/${id}/reconnect`),
  getQRCode: (id: number) =>
    api.get(`/api/v1/devices/${id}/qr`),
};

export const analyticsService = {
  getOverview: () =>
    api.get("/api/v1/analytics/overview"),
  getMessageStats: (period = "7days") =>
    api.get("/api/v1/analytics/messages", { params: { period } }),
};

export const userService = {
  getUsers: () =>
    api.get("/api/v1/users"),
  createUser: (data: any) =>
    api.post("/api/v1/users", data),
  updateUser: (id: number, data: any) =>
    api.put(`/api/v1/users/${id}`, data),
  deleteUser: (id: number) =>
    api.delete(`/api/v1/users/${id}`),
  changeRole: (id: number, role: string) =>
    api.put(`/api/v1/users/${id}/role`, { role }),
};

export const settingsService = {
  getSettings: () =>
    api.get("/api/v1/settings"),
  updateSettings: (data: any) =>
    api.put("/api/v1/settings", data),
};

export const aiService = {
  getConfigs: () =>
    api.get("/api/v1/ai/configs"),
  createConfig: (data: any) =>
    api.post("/api/v1/ai/configs", data),
  updateConfig: (id: number, data: any) =>
    api.put(`/api/v1/ai/configs/${id}`, data),
  deleteConfig: (id: number) =>
    api.delete(`/api/v1/ai/configs/${id}`),
  toggleActive: (id: number) =>
    api.post(`/api/v1/ai/configs/${id}/toggle-active`),
  getProviders: () =>
    api.get("/api/v1/ai/providers"),
};

export default api;
