import {
  ACCESS_TOKEN_KEY,
  apiRequest,
  clearAccessToken,
  setAccessToken,
} from "../../lib/api/httpClient";
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

function storeSessionUser(user, rememberSession) {
  if (!user.id) return;
  // The mock-only capabilities still run beside authenticated backend data in
  // production. Keep a minimal, non-secret identity so those mock handlers can
  // enforce their own role checks without replacing the real access token.
  const session = {
    userId: user.id,
    user: {
      id: user.id,
      role: user.role,
      status: user.status,
      name: user.name,
      email: user.email,
    },
  };
  let storage;
  if (rememberSession !== undefined) {
    storage = rememberSession ? localStorage : sessionStorage;
  } else {
    const hasTemporarySession = sessionStorage.getItem(ACCESS_TOKEN_KEY) || sessionStorage.getItem(SESSION_KEY);
    storage = hasTemporarySession ? sessionStorage : localStorage;
  }
  const otherStorage = storage === localStorage ? sessionStorage : localStorage;
  storage.setItem(SESSION_KEY, JSON.stringify(session));
  otherStorage.removeItem(SESSION_KEY);
}

export const authService = {
  async login(credentials) {
    const body = isRealApi
      ? { identifier: credentials.email ?? credentials.identifier, password: credentials.password }
      : credentials;
    const response = await apiRequest({ path: "/auth/login", method: "POST", body });
    const accessToken = pickAccessToken(response);
    const rememberSession = credentials.rememberSession !== false;
    if (isRealApi && accessToken) setAccessToken(accessToken, rememberSession);
    const loginUser = pickUser(response);
    // The backend login response has username/role but no user ID. A role-only
    // object cannot identify a session; hydrate it from the authenticated
    // profile endpoint before letting the app mount user-scoped queries.
    const user = isRealApi
      ? (loginUser?.id ? loginUser : await this.restore())
      : loginUser;
    if (!user) throw new Error("Backend chưa trả thông tin tài khoản sau khi đăng nhập.");
    storeSessionUser(user, rememberSession);
    return user;
  },
  async registerParent(credentials) {
    const response = await apiRequest({ path: "/auth/register/parent", method: "POST", body: credentials });
    return pickUser(response) || response;
  },
  registerChildAccount({ username, password, nickName }) {
    return apiRequest({
      path: "/auth/register/child",
      method: "POST",
      body: { username: username?.trim(), password, nickName: nickName?.trim() },
      forceReal: true,
    });
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
  async resetPassword({ email, token, newPassword }) {
    return apiRequest({
      path: "/auth/reset-password",
      method: "POST",
      body: { email, token, newPassword },
    });
  },
  async changePassword({ currentPassword, newPassword }) {
    return apiRequest({
      path: "/auth/change-password",
      method: "POST",
      body: { currentPassword, newPassword },
    });
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
    sessionStorage.removeItem(SESSION_KEY);
    try {
      await apiRequest({ path: "/auth/logout", method: "POST" });
    } finally {
      localStorage.removeItem(SESSION_KEY);
      sessionStorage.removeItem(SESSION_KEY);
      clearAccessToken();
    }
  },
};
