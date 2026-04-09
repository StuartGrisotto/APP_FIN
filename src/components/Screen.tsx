import { PropsWithChildren } from 'react';
import {
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  View,
} from 'react-native';
import { useAppTheme } from '../context/ThemeContext';
import { spacing } from '../theme/tokens';

interface ScreenProps extends PropsWithChildren {
  scrollable?: boolean;
}

export const Screen = ({ children, scrollable = true }: ScreenProps) => {
  const { colors } = useAppTheme();
  const styles = createStyles(colors);

  const topPadding =
    Platform.OS === 'android'
      ? (StatusBar.currentHeight ?? 0) + spacing.md
      : spacing.lg;

  if (!scrollable) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={[styles.container, { paddingTop: topPadding }]}>{children}</View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.container, { paddingTop: topPadding }]}
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  );
};

const createStyles = (colors: { background: string }) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scroll: {
      flex: 1,
      backgroundColor: colors.background,
    },
    container: {
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.xxxl,
      gap: spacing.lg,
    },
  });
