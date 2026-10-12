import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { login as loginRequest } from '../api/authApi.js';
import { clearSession, getStoredToken, getStoredUser, storeSession } from '../api/http.js';
import { isTokenExpired } from '../utils/format.js';

const AuthContext = createContext(null);

function loadInitialSession() {
  const token = getStoredToken();
  if (!token || isTokenExpired(token)) {
    clearSession();
    return { token: null, user: null };
  }
  return { token, user: getStoredUser() };
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(loadInitialSession);

  const login = useCallback(async (username, password) => {
    const result = await loginRequest(username, password);
    storeSession(result.token, result.user);
    setSession({ token: result.token, user: result.user });
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setSession({ token: null, user: null });
  }, []);

  const value = useMemo(
    () => ({
      token: session.token,
      user: session.user,
      isAdmin: session.user?.role === 'ADMIN',
      login,
      logout,
    }),
    [session, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
