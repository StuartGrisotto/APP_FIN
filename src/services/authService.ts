import * as LocalAuthentication from 'expo-local-authentication';
import { mockUser } from '../mocks/financeData';
import { User } from '../types/finance';

const wait = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const authService = {
  async unlockWithBiometrics(): Promise<{ token: string; user: User }> {
    await wait(150);

    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    if (!hasHardware) {
      throw new Error('Este dispositivo nao possui hardware de biometria.');
    }

    const enrolled = await LocalAuthentication.isEnrolledAsync();
    if (!enrolled) {
      throw new Error('Nenhuma biometria cadastrada no dispositivo.');
    }

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Acesse o Fluxo Financeiro',
      cancelLabel: 'Cancelar',
      disableDeviceFallback: false,
    });

    if (!result.success) {
      if (result.error === 'user_cancel' || result.error === 'system_cancel') {
        throw new Error('Autenticacao cancelada.');
      }

      throw new Error('Nao foi possivel validar a biometria.');
    }

    return {
      token: `biometric-session-${Date.now()}`,
      user: mockUser,
    };
  },

  async logout(): Promise<void> {
    await wait(120);
  },
};
