import { appCredentials } from '../config/appCredentials';
import { mockUser } from '../mocks/financeData';
import { LoginPayload, User } from '../types/finance';

const wait = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const authService = {
  async login(payload: LoginPayload): Promise<{ token: string; user: User }> {
    await wait(900);

    const isValidEmail =
      payload.email.trim().toLowerCase() === appCredentials.email.toLowerCase();
    const isValidPassword = payload.password === appCredentials.password;

    if (!isValidEmail || !isValidPassword) {
      throw new Error('Credenciais invalidas. Verifique e tente novamente.');
    }

    return {
      token: 'fixed-login-session-token',
      user: mockUser,
    };
  },

  async logout(): Promise<void> {
    await wait(300);
  },
};
