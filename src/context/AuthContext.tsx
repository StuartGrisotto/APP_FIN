import {
  createContext,
  PropsWithChildren,
  useContext,
  useMemo,
  useState,
} from 'react';
import { authService } from '../services/authService';
import { LoginPayload, User } from '../types/finance';

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loggingIn: boolean;
  loginError: string | null;
  login: (payload: LoginPayload) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: PropsWithChildren) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loggingIn, setLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const login = async (payload: LoginPayload) => {
    setLoggingIn(true);
    setLoginError(null);

    try {
      const data = await authService.login(payload);
      setUser(data.user);
      setToken(data.token);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Não foi possível entrar no momento.';
      setLoginError(message);
      throw error;
    } finally {
      setLoggingIn(false);
    }
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
    setToken(null);
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(token),
      loggingIn,
      loginError,
      login,
      logout,
    }),
    [loginError, loggingIn, token, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser utilizado dentro de AuthProvider');
  }

  return context;
};
