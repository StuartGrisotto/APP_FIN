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
  primary: 'hsl(160, 84%, 39%)',
  primarySoft: 'rgba(74, 222, 128, 0.12)',
  background: '#0B0B0C',
  backgroundElevated: '#121214',
  foreground: '#E4E4E7',
  foregroundSoft: '#A1A1AA',
  surface: '#121214',
  surfaceSoft: '#1A1A1D',
  card: '#121214',
  muted: '#2A2A2E',
  border: '#232326',
  textPrimary: '#E4E4E7',
  textSecondary: '#A1A1AA',
  textMuted: '#8A8A94',
  accentBlue: '#60A5FA',
  accentGreen: '#4ADE80',
  accentRed: '#F87171',
  accentOrange: '#FB923C',
  success: '#34D399',
  successSoft: 'rgba(52, 211, 153, 0.12)',
  destructive: '#F87171',
  destructiveSoft: 'rgba(248, 113, 113, 0.12)',
  chartIncome: '#34D399',
  chartExpense: '#F87171',
  white: '#FFFFFF',
};

export const getThemeColors = (mode: ThemeMode): ThemeColors =>
  mode === 'dark' ? darkColors : lightColors;
