import { ACCESS_TOKEN_KEY, apiRequest } from "../../lib/api/httpClient";
import { SESSION_KEY } from "../../mocks/mockServer";

export const isRealApi = import.meta.env.VITE_API_MODE === "real";

function pickUser(payload) {
  const candidate = payload?.user ?? payload?.data?.user ?? payload?.data ?? payload;
  if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) return null;
  if (!candidate.id && !candidate.userId && !candidate.email && !candidate.username && !candidate.role) return null;

  const rawRole = candidate.role ?? candidate.roleName ?? candidate.roles?.[0]?.name ?? candidate.roles?.[0];
  const roleValue = String(rawRole || "").toLowerCase().replace(/[\s-]/g, "_");
  const role = {
    parent: "parent",
    parents: "parent",
    child: "child",
    children: "child",
    contentmanager: "content_manager",
    content_manager: "content_manager",
    admin: "admin",
  }[roleValue] || rawRole;

  return {
    ...candidate,
    id: candidate.id ?? candidate.userId,
    name: candidate.name ?? candidate.username ?? candidate.email ?? "SketchTale user",
    email: candidate.email ?? "",
    role,
  };
}

function pickAccessToken(payload) {
  if (typeof payload === "string") return payload;
  return payload?.token ?? payload?.accessToken ?? payload?.access_token ?? payload?.jwt ?? payload?.jwtToken ?? payload?.data?.token ?? payload?.data?.accessToken ?? payload?.data?.access_token;
}

function storeSessionUser(user) {
  if (!user.id) return;
  const session = { userId: user.id };
  if (import.meta.env.DEV) {
    session.user = {
      id: user.id,
      role: user.role,
      status: user.status,
      name: user.name,
      email: user.email,
    };
  }
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export const authService = {
  async login(credentials) {
    const body = isRealApi
      ? { identifier: credentials.email ?? credentials.identifier, password: credentials.password }
      : credentials;
    const response = await apiRequest({ path: "/auth/login", method: "POST", body });
    const accessToken = pickAccessToken(response);
    if (isRealApi && accessToken) localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    const user = pickUser(response) || (isRealApi ? await this.restore() : null);
    if (!user) throw new Error("Backend chưa trả thông tin tài khoản sau khi đăng nhập.");
    storeSessionUser(user);
    return user;
  },
  async registerParent(credentials) {
    const response = await apiRequest({ path: "/auth/register/parent", method: "POST", body: credentials });
    return pickUser(response) || response;
  },
  async confirmEmail({ email, token }) {
    const query = new URLSearchParams({ email, token });
    return apiRequest({ path: `/auth/confirm-email?${query.toString()}` });
  },
  async resendConfirmationEmail(email) {
    return apiRequest({ path: "/auth/resend-confirmation-email", method: "POST", body: { email } });
  },
  async forgotPassword(email) {
    return apiRequest({ path: "/auth/forgot-password", method: "POST", body: { email } });
  },
  async restore() {
    const response = await apiRequest({ path: isRealApi ? "/auth/profile" : "/auth/me" });
    const user = pickUser(response);
    if (!user) throw new Error("Không tìm thấy phiên đăng nhập.");
    storeSessionUser(user);
    return user;
  },
  async logout() {
    localStorage.removeItem(SESSION_KEY);
    try {
      await apiRequest({ path: "/auth/logout", method: "POST" });
    } finally {
      localStorage.removeItem(SESSION_KEY);
      localStorage.removeItem(ACCESS_TOKEN_KEY);
    }
  },
};
