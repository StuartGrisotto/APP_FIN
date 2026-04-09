export type ThemeMode = 'light' | 'dark';

export interface ThemeColors {
  primary: string;
  primarySoft: string;
  background: string;
  backgroundElevated: string;
  foreground: string;
  foregroundSoft: string;
  surface: string;
  surfaceSoft: string;
  card: string;
  muted: string;
  border: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  accentBlue: string;
  accentGreen: string;
  accentRed: string;
  accentOrange: string;
  success: string;
  successSoft: string;
  destructive: string;
  destructiveSoft: string;
  chartIncome: string;
  chartExpense: string;
  white: string;
}

export const lightColors: ThemeColors = {
  primary: 'hsl(158, 45%, 45%)',
  primarySoft: 'hsl(158, 60%, 92%)',
  background: 'hsl(220, 25%, 96%)',
  backgroundElevated: 'hsl(220, 25%, 98%)',
  foreground: 'hsl(222, 30%, 18%)',
  foregroundSoft: 'hsl(220, 20%, 35%)',
  surface: 'hsl(0, 0%, 100%)',
  surfaceSoft: 'hsl(220, 18%, 94%)',
  card: 'hsl(0, 0%, 100%)',
  muted: 'hsl(220, 18%, 94%)',
  border: 'hsl(220, 16%, 88%)',
  textPrimary: 'hsl(222, 30%, 18%)',
  textSecondary: 'hsl(220, 20%, 35%)',
  textMuted: 'hsl(220, 14%, 50%)',
  accentBlue: 'hsl(213, 90%, 56%)',
  accentGreen: 'hsl(158, 45%, 45%)',
  accentRed: 'hsl(0, 65%, 55%)',
  accentOrange: '#FF9C3D',
  success: 'hsl(145, 50%, 42%)',
  successSoft: 'hsl(145, 65%, 92%)',
  destructive: 'hsl(0, 65%, 55%)',
  destructiveSoft: 'hsl(0, 70%, 94%)',
  chartIncome: 'hsl(145, 50%, 42%)',
  chartExpense: 'hsl(0, 65%, 55%)',
  white: '#FFFFFF',
};

export const darkColors: ThemeColors = {
  primary: '#121214c9',
  primarySoft: 'rgba(255, 255, 255, 0.06)',

  background: '#19191B',
  backgroundElevated: '#202024',

  foreground: '#F5F5F5',
  foregroundSoft: '#C7C7CC',

  surface: '#121214c9',
  surfaceSoft: '#1C1C1F',
  card: '#161618',
  muted: '#2A2A2E',
  border: '#ffffff1f',

  textPrimary: '#FDFDFD',
  textSecondary: '#B0B0B8',
  textMuted: '#8A8A94',

  accentBlue: '#EAEAEA',
  accentGreen: '#BDBDBD',
  accentRed: '#8F8F95',
  accentOrange: '#5C5C61',

  success: '#00ff22c9',
  successSoft: 'rgba(52, 211, 153, 0.12)',
  destructive: '#fa4c4cbb',
  destructiveSoft: 'rgba(248, 113, 113, 0.12)',

  chartIncome: '#01a017fd',
  chartExpense: 'rgb(168, 3, 3)',

  white: '#FFFFFF',
};

export const getThemeColors = (mode: ThemeMode): ThemeColors =>
  mode === 'dark' ? darkColors : lightColors;
