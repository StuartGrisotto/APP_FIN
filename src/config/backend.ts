import { Platform } from 'react-native';
import Constants from 'expo-constants';

const fromEnv = process.env.EXPO_PUBLIC_BACKEND_URL?.trim();

const readExpoHost = (): string | null => {
  const hostCandidates = [
    (Constants.expoConfig as { hostUri?: string } | null)?.hostUri,
    (Constants as unknown as { manifest2?: { extra?: { expoClient?: { hostUri?: string } } } })
      ?.manifest2?.extra?.expoClient?.hostUri,
  ];

  for (const candidate of hostCandidates) {
    if (!candidate || typeof candidate !== 'string') {
      continue;
    }

    const clean = candidate.replace(/^https?:\/\//, '');
    const [host] = clean.split(':');
    if (host) {
      return host;
    }
  }

  return null;
};

const inferDefaultBackendUrl = () => {
  const expoHost = readExpoHost();
  if (expoHost) {
    return `http://${expoHost}:8080`;
  }

  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:8080';
  }

  return 'http://localhost:8080';
};

export const backendBaseUrl = fromEnv && fromEnv.length > 0 ? fromEnv : inferDefaultBackendUrl();
