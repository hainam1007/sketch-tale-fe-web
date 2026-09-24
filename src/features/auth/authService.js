import { apiRequest } from "../../lib/api/httpClient";
import { SESSION_KEY } from "../../mocks/mockServer";

export const authService = {
  async login(credentials) {
    const response = await apiRequest({ path: "/auth/login", method: "POST", body: credentials });
    localStorage.setItem(SESSION_KEY, JSON.stringify({ userId: response.user.id }));
    return response.user;
  },
  async restore() {
    const response = await apiRequest({ path: "/auth/me" });
    return response.user;
  },
  async logout() {
    localStorage.removeItem(SESSION_KEY);
    try {
      await apiRequest({ path: "/auth/logout", method: "POST" });
    } finally {
      localStorage.removeItem(SESSION_KEY);
    }
  },
};
