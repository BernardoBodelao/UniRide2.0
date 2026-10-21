import { apiRequest } from "./api";

export const profileService = {
  get: () => apiRequest("/profile"),
  save: (payload) => apiRequest("/profile", { method: "PUT", body: JSON.stringify(payload) }),
  rides: () => apiRequest("/profile/rides"),
};
