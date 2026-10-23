export const ACCESS_TOKEN_KEY = "sketchtale.access-token.v1";
export const REFRESH_TOKEN_KEY = "sketchtale.refresh-token.v1";
const SESSION_ID_KEY = "sketchtale.auth-session-id.v1";

function getStoragePair(storage) {
  const accessToken = storage.getItem(ACCESS_TOKEN_KEY);
  if (!accessToken) return null;
  return {
    accessToken,
    refreshToken: storage.getItem(REFRESH_TOKEN_KEY),
    sessionId: storage.getItem(SESSION_ID_KEY),
    rememberSession: storage === localStorage,
  };
}

export function getTokenPair() {
  return getStoragePair(localStorage) || getStoragePair(sessionStorage);
}

export function getAccessToken() {
  return getTokenPair()?.accessToken || null;
}

export function hasAccessToken() {
  return Boolean(getAccessToken());
}

export function setTokenPair({ accessToken, refreshToken }, rememberSession = true, sessionId) {
  if (!accessToken || !refreshToken) {
    throw new Error("Cặp access token và refresh token chưa đầy đủ.");
  }

  clearTokens();
  const storage = rememberSession ? localStorage : sessionStorage;
  const activeSessionId = sessionId === undefined
    ? (globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`)
    : sessionId;
  storage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  if (activeSessionId) storage.setItem(SESSION_ID_KEY, activeSessionId);
  // Write access last so other tabs restore only after the pair is available.
  storage.setItem(ACCESS_TOKEN_KEY, accessToken);
}

export function clearTokens() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(SESSION_ID_KEY);
  sessionStorage.removeItem(ACCESS_TOKEN_KEY);
  sessionStorage.removeItem(REFRESH_TOKEN_KEY);
  sessionStorage.removeItem(SESSION_ID_KEY);
}
