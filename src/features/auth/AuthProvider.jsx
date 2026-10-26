import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { authService, isRealApi } from "./authService";
import { ACCESS_TOKEN_KEY, hasAccessToken, refreshAccessTokenIfNeeded } from "../../lib/api/httpClient";
import { getTokenPair } from "../../lib/api/authTokenStorage";
import { normalizeApiError } from "../../lib/api/errors";
import { SESSION_KEY } from "../../mocks/mockServer";

import { AuthContext } from "./AuthContext";

export default function AuthProvider({ children }) {
  const queryClient = useQueryClient();
  const restoreSessionRef = useRef(null);
  const cancelRestoreRef = useRef(null);
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
      } catch (error) {
        if (active && revision === restoreRevision) {
          const isInvalidSession = [401, 423].includes(error?.status) || (isRealApi && !hasAccessToken());
          const cachedUser = isInvalidSession ? null : authService.getCachedUser();
          if (cachedUser) {
            setSession({ status: "authenticated", user: cachedUser });
          } else if (isInvalidSession || !isRealApi) {
            setSession({ status: "anonymous", user: null });
          } else {
            setSession({ status: "error", user: null });
          }
        }
      }
    }

    restoreSessionRef.current = () => restoreSession(true);
    cancelRestoreRef.current = () => { restoreRevision += 1; };

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
      restoreSessionRef.current = null;
      cancelRestoreRef.current = null;
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

  useEffect(() => {
    if (session.status !== "authenticated") return undefined;

    let refreshing = false;
    async function refreshIfNeeded() {
      if (refreshing) return;
      refreshing = true;
      try {
        await refreshAccessTokenIfNeeded();
      } catch {
        // Keep the current UI through transient network failures; the regular
        // API request path will retry refresh if the access token expires.
      } finally {
        refreshing = false;
      }
    }
    function refreshWhenVisible() {
      if (document.visibilityState === "visible") void refreshIfNeeded();
    }

    const timer = window.setInterval(refreshIfNeeded, 60_000);
    window.addEventListener("focus", refreshIfNeeded);
    document.addEventListener("visibilitychange", refreshWhenVisible);
    void refreshIfNeeded();

    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", refreshIfNeeded);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, [session.status]);

  const login = useCallback(async (credentials) => {
    cancelRestoreRef.current?.();
    const previousPair = getTokenPair();
    try {
      const user = credentials.loginType === "child"
        ? await authService.loginChild(credentials)
        : await authService.login(credentials);
      queryClient.clear();
      setSession({ status: "authenticated", user });
      return user;
    } catch (error) {
      const currentPair = getTokenPair();
      if (previousPair?.accessToken !== currentPair?.accessToken || previousPair?.sessionId !== currentPair?.sessionId) {
        queryClient.clear();
        setSession({ status: "anonymous", user: null });
      }
      throw normalizeApiError(error);
    }
  }, [queryClient]);

  const loginChild = useCallback(
    (credentials) => login({ ...credentials, loginType: "child" }),
    [login],
  );

  const logout = useCallback(async () => {
    cancelRestoreRef.current?.();
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

  const retryRestore = useCallback(() => {
    if (restoreSessionRef.current) void restoreSessionRef.current();
  }, []);

  const value = useMemo(
    () => ({ ...session, login, loginChild, logout, retryRestore }),
    [login, loginChild, logout, retryRestore, session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
