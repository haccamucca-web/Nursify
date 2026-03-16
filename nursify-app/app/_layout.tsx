import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme, Platform } from 'react-native';
import { Stack } from 'expo-router';
import Colors from '../constants/Colors';
import Toast from 'react-native-toast-message';

type Theme = 'light' | 'dark';

export const ThemeContext = createContext<{
  theme: Theme;
  toggleTheme: () => void;
  colors: typeof Colors.light;
}>({
  theme: 'dark',
  toggleTheme: () => {},
  colors: Colors.dark,
});

export function useTheme() {
  return useContext(ThemeContext);
}

export default function RootLayout() {
  const systemColorScheme = useColorScheme();
  
  // Safely get initial theme from localStorage if on Web
  const getInitialTheme = (): Theme => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const stored = window.localStorage.getItem('nursify_theme');
      if (stored === 'light' || stored === 'dark') return stored;
    }
    return systemColorScheme === 'dark' ? 'dark' : 'light';
  };

  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  // Apply theme to DOM and save strictly on change
  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const root = window.document.documentElement;
      
      // Inject CSS variables for Markdown/NativeWind compatibility
      if (theme === 'dark') {
        root.classList.remove('light');
        root.classList.add('dark');
        root.style.setProperty('--bg-color', '#000000');
        root.style.setProperty('--text-color', '#F5F5F5');
        root.style.setProperty('--card-color', '#1A1A1A');
        root.style.setProperty('--primary-color', '#00E5FF');
        root.style.setProperty('--border-color', '#334155');
      } else {
        root.classList.remove('dark');
        root.classList.add('light');
        root.style.setProperty('--bg-color', '#FFFFFF');
        root.style.setProperty('--text-color', '#1A1A1A');
        root.style.setProperty('--card-color', '#F0F2F5');
        root.style.setProperty('--primary-color', '#0B7BC1');
        root.style.setProperty('--border-color', '#e2e8f0');
      }
      
      // Smooth transition
      root.style.transition = 'background-color 0.3s ease, color 0.3s ease';
      document.body.style.transition = 'background-color 0.3s ease, color 0.3s ease';

      window.localStorage.setItem('nursify_theme', theme);
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const colors = theme === 'dark' ? Colors.dark : Colors.light;

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, colors }}>
      <Stack screenOptions={{
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerTintColor: colors.textMain,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        contentStyle: {
          backgroundColor: colors.background,
        },
        headerShadowVisible: false,
      }}>
        <Stack.Screen name="index" options={{ title: 'Nursify Home' }} />
        <Stack.Screen name="guida" options={{ title: 'Guida Introduttiva', presentation: 'modal' }} />
        <Stack.Screen name="summary" options={{ title: 'Risultato Riassunto' }} />
      </Stack>
      <Toast />
    </ThemeContext.Provider>
  );
}
