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
  primary: '#494ce4bb',
  primarySoft: 'rgba(124, 108, 242, 0)',

  background: '#0E1117',
  backgroundElevated: '#202B3B',

  foreground: '#EEF3FF',
  foregroundSoft: '#B2BED1',

  surface: '#141A23',
  surfaceSoft: '#1A2230',
  card: '#1A2230',
  muted: '#202B3B',
  border: 'rgba(173, 188, 214, 0.18)',

  textPrimary: '#EEF3FF',
  textSecondary: '#B2BED1',
  textMuted: '#7D889B',

  accentBlue: '#7C6CF2',
  accentGreen: '#3FAF7A',
  accentRed: '#C95B6D',
  accentOrange: '#D09A63',

  success: '#3FAF7A',
  successSoft: 'rgba(63, 175, 122, 0.18)',
  destructive: '#fa4c4cbb',
  destructiveSoft: 'rgba(201, 91, 109, 0.18)',

  chartIncome: '#46BE89',
  chartExpense:'#fa4c4cbb',

  white: '#FFFFFF',
};

export const getThemeColors = (mode: ThemeMode): ThemeColors =>
  mode === 'dark' ? darkColors : lightColors;
