import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { BottomTabs, TabKey } from './components/BottomTabs';
import { AuthProvider, useAuth } from './context/AuthContext';
import { FinanceProvider } from './context/FinanceContext';
import { ThemeProvider, useAppTheme } from './context/ThemeContext';
import { DashboardScreen } from './screens/DashboardScreen';
import { LoginScreen } from './screens/LoginScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { TransactionsScreen } from './screens/TransactionsScreen';

const MainApp = () => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  return (
    <FinanceProvider>
      <AuthenticatedArea />
    </FinanceProvider>
  );
};

const AuthenticatedArea = () => {
  const [tab, setTab] = useState<TabKey>('home');
  const { colors, mode } = useAppTheme();

  return (
    <View style={[styles.wrapper, { backgroundColor: colors.background }]}> 
      <View style={styles.content}>
        {tab === 'home' && <DashboardScreen onOpenSettings={() => setTab('settings')} />}
        {tab === 'transactions' && <TransactionsScreen />}
        {tab === 'settings' && <SettingsScreen onBackToHome={() => setTab('home')} />}
      </View>

      <BottomTabs current={tab} onChange={setTab} />
      <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
    </View>
  );
};

export default function AppRoot() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <MainApp />
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
});
