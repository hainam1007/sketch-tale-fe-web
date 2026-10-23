import { apiRequest, clearAccessToken } from "../../lib/api/httpClient";
import { getTokenPair, setTokenPair } from "../../lib/api/authTokenStorage";
import { ApiError } from "../../lib/api/errors";
import { SESSION_KEY } from "../../mocks/mockServer";

export const isRealApi = import.meta.env.VITE_API_MODE === "real";

function pickUser(payload) {
  const candidate = payload?.user ?? payload?.data?.user ?? payload?.data ?? payload;
  if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) return null;
  if (!candidate.id && !candidate.userId && !candidate.email && !candidate.username && !candidate.role) return null;

  const tokenFields = new Set(["token", "refreshToken", "accessToken", "access_token", "refresh_token", "jwt", "jwtToken"]);
  const safeCandidate = Object.fromEntries(Object.entries(candidate).filter(([key]) => !tokenFields.has(key)));
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
    ...safeCandidate,
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

function pickRefreshToken(payload) {
  return payload?.refreshToken ?? payload?.refresh_token ?? payload?.data?.refreshToken ?? payload?.data?.refresh_token;
}

function storeSessionUser(user, rememberSession) {
  if (!user.id) return;
  // Mock-backed features use this minimal identity alongside the real API session.
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
    storage = getTokenPair()?.rememberSession === false || sessionStorage.getItem(SESSION_KEY)
      ? sessionStorage
      : localStorage;
  }
  const otherStorage = storage === localStorage ? sessionStorage : localStorage;
  storage.setItem(SESSION_KEY, JSON.stringify(session));
  otherStorage.removeItem(SESSION_KEY);
}

function publicRequest(options) {
  return apiRequest({ ...options, skipAuth: true, skipRefresh: true });
}

export const authService = {
  async login(credentials) {
    const isChildLogin = credentials.loginType === "child";
    const body = isRealApi
      ? isChildLogin
        ? { username: credentials.username ?? credentials.identifier, password: credentials.password }
        : { identifier: credentials.email ?? credentials.identifier, password: credentials.password }
      : credentials;
    const response = await publicRequest({
      path: isRealApi && isChildLogin ? "/auth/login/child" : "/auth/login",
      method: "POST",
      body,
    });
    // Keep successful sign-ins across browser restarts so users do not have to
    // log in again on their next visit.
    const rememberSession = true;
    if (isRealApi) {
      const accessToken = pickAccessToken(response);
      const refreshToken = pickRefreshToken(response);
      if (!accessToken || !refreshToken) {
        throw new ApiError({
          status: 502,
          code: "AUTH_TOKEN_PAIR_MISSING",
          message: "Backend chưa trả đủ access token và refresh token.",
        });
      }
      setTokenPair({ accessToken, refreshToken }, rememberSession);
      localStorage.removeItem(SESSION_KEY);
      sessionStorage.removeItem(SESSION_KEY);
    }

    const loginUser = pickUser(response);
    // The documented login response may omit the user ID, so hydrate from profile.
    let user;
    try {
      user = isRealApi
        ? (loginUser?.id ? loginUser : await this.restore())
        : loginUser;
    } catch (error) {
      if ([401, 423].includes(error?.status)) {
        clearAccessToken();
        localStorage.removeItem(SESSION_KEY);
        sessionStorage.removeItem(SESSION_KEY);
      }
      throw error;
    }
    if (!user) throw new Error("Backend chưa trả thông tin tài khoản sau khi đăng nhập.");
    storeSessionUser(user, rememberSession);
    return user;
  },
  async loginChild(credentials) {
    if (!isRealApi) {
      throw new ApiError({
        status: 501,
        code: "CHILD_LOGIN_UNAVAILABLE_IN_MOCK_MODE",
        message: "Đăng nhập tài khoản trẻ em chỉ khả dụng khi kết nối Backend.",
      });
    }
    return this.login({ ...credentials, loginType: "child" });
  },
  async registerParent(credentials) {
    const response = await publicRequest({ path: "/auth/register/parent", method: "POST", body: credentials });
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
    return publicRequest({ path: `/auth/confirm-email?${query.toString()}` });
  },
  async confirmEmailWithBody({ email, token }) {
    return publicRequest({ path: "/auth/confirm-email", method: "POST", body: { email, token } });
  },
  async resendConfirmationEmail(email) {
    return publicRequest({ path: "/auth/resend-confirmation-email", method: "POST", body: { email } });
  },
  async forgotPassword(email) {
    return publicRequest({ path: "/auth/forgot-password", method: "POST", body: { email } });
  },
  async resetPassword({ email, token, newPassword }) {
    return publicRequest({
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
  getCachedUser() {
    for (const storage of [sessionStorage, localStorage]) {
      try {
        const cached = JSON.parse(storage.getItem(SESSION_KEY) || "null")?.user;
        if (cached?.id && cached?.role) return cached;
      } catch {
        storage.removeItem(SESSION_KEY);
      }
    }
    return null;
  },
  async currentRole() {
    return apiRequest({ path: "/auth/current-role" });
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
