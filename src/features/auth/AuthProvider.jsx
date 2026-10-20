import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { authService, isRealApi } from "./authService";
import { ACCESS_TOKEN_KEY, hasAccessToken } from "../../lib/api/httpClient";
import { normalizeApiError } from "../../lib/api/errors";
import { SESSION_KEY } from "../../mocks/mockServer";

const AuthContext = createContext(null);

export default function AuthProvider({ children }) {
  const queryClient = useQueryClient();
  const [session, setSession] = useState(() =>
    isRealApi && !hasAccessToken()
      ? { status: "anonymous", user: null }
      : { status: "loading", user: null },
  );

  useEffect(() => {
    let active = true;
    let restoreRevision = 0;

    async function restoreSession(clearCache = false) {
      const revision = ++restoreRevision;
      if (clearCache) queryClient.clear();
      if (isRealApi && !hasAccessToken()) {
        setSession({ status: "anonymous", user: null });
        return;
      }

      setSession({ status: "loading", user: null });
      try {
        const user = await authService.restore();
        if (active && revision === restoreRevision && (!isRealApi || hasAccessToken())) {
          setSession({ status: "authenticated", user });
        }
      } catch {
        if (active && revision === restoreRevision) {
          setSession({ status: "anonymous", user: null });
        }
      }
    }

    function handleStorage(event) {
      const sessionKey = isRealApi ? ACCESS_TOKEN_KEY : SESSION_KEY;
      if (event.key !== sessionKey && event.key !== null) return;
      void restoreSession(true);
    }

    if (!isRealApi || hasAccessToken()) void restoreSession();
    window.addEventListener("storage", handleStorage);
    return () => {
      active = false;
      restoreRevision += 1;
      window.removeEventListener("storage", handleStorage);
    };
  }, [queryClient]);

  useEffect(() => {
    function handleInvalidSession() {
      queryClient.clear();
      setSession({ status: "anonymous", user: null });
    }
    window.addEventListener("sketchtale:auth-invalid", handleInvalidSession);
    return () => window.removeEventListener("sketchtale:auth-invalid", handleInvalidSession);
  }, [queryClient]);

  const login = useCallback(async (credentials) => {
    try {
      const user = await authService.login(credentials);
      setSession({ status: "authenticated", user });
      return user;
    } catch (error) {
      throw normalizeApiError(error);
    }
  }, []);

  const logout = useCallback(async () => {
    let serverLogoutSucceeded = true;
    try {
      await authService.logout();
    } catch {
      serverLogoutSucceeded = false;
    } finally {
      queryClient.clear();
      setSession({ status: "anonymous", user: null });
    }
    return serverLogoutSucceeded;
  }, [queryClient]);

  const value = useMemo(
    () => ({ ...session, login, logout }),
    [login, logout, session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth phải được dùng bên trong AuthProvider.");
  return value;
}
