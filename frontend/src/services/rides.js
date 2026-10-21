import { apiRequest } from "./api";

export const ridesService = {
  list: ({ from = "", to = "", limit = 20, offset = 0 } = {}) => {
    const params = new URLSearchParams({ from, to, limit, offset });
    return apiRequest(`/rides?${params}`);
  },
  create: (payload) => apiRequest("/rides", { method: "POST", body: JSON.stringify(payload) }),
  join: (id) => apiRequest(`/rides/${id}/join`, { method: "POST" }),
  leave: (id) => apiRequest(`/rides/${id}/leave`, { method: "DELETE" }),
  remove: (id) => apiRequest(`/rides/${id}`, { method: "DELETE" }),
};
