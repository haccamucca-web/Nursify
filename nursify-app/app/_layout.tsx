import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
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
  const [theme, setTheme] = useState<Theme>(systemColorScheme === 'dark' ? 'dark' : 'light');

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
