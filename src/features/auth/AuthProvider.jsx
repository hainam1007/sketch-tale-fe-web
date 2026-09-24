import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { authService } from "./authService";
import { normalizeApiError } from "../../lib/api/errors";

const AuthContext = createContext(null);

export default function AuthProvider({ children }) {
  const queryClient = useQueryClient();
  const [session, setSession] = useState({ status: "loading", user: null });

  useEffect(() => {
    let active = true;
    authService
      .restore()
      .then((user) => {
        if (active) setSession({ status: "authenticated", user });
      })
      .catch(() => {
        if (active) setSession({ status: "anonymous", user: null });
      });
    return () => {
      active = false;
    };
  }, []);

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
    await authService.logout();
    queryClient.clear();
    setSession({ status: "anonymous", user: null });
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
