// contexts/ThemeContext.tsx - aktualizovaný s vlastným typom Theme
import React, { createContext, useState, useEffect, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LightTheme, DarkTheme, HighContrastTheme, Theme } from "../theme";

export type ThemeMode = 'light' | 'dark' | 'highContrast';

// Aktualizovaný typ pre context s vlastným typom Theme
export const ThemeContext = createContext<{
  theme: Theme;
  toggleTheme: () => void;
  setThemeMode: (mode: ThemeMode) => void;
  themeMode: ThemeMode;
}>({
  theme: LightTheme,
  toggleTheme: () => {},
  setThemeMode: () => {},
  themeMode: 'light',
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(LightTheme);
  const [themeMode, setThemeModeState] = useState<ThemeMode>('light');

  useEffect(() => {
    (async () => {
      const stored = await AsyncStorage.getItem("appTheme");
      if (stored === "dark") {
        setTheme(DarkTheme);
        setThemeModeState('dark');
      } else if (stored === "highContrast") {
        setTheme(HighContrastTheme);
        setThemeModeState('highContrast');
      } else {
        setTheme(LightTheme);
        setThemeModeState('light');
      }
    })();
  }, []);

  const toggleTheme = async () => {
    let next;
    let nextMode: ThemeMode;
    
    if (themeMode === 'light') {
      next = DarkTheme;
      nextMode = 'dark';
    } else if (themeMode === 'dark') {
      next = LightTheme;
      nextMode = 'light';
    } else {
      // Ak je highContrast, prejdeme na light
      next = LightTheme;
      nextMode = 'light';
    }
    
    setTheme(next);
    setThemeModeState(nextMode);
    await AsyncStorage.setItem("appTheme", nextMode);
  };

  const setThemeMode = async (mode: ThemeMode) => {
    let newTheme;
    switch (mode) {
      case 'light':
        newTheme = LightTheme;
        break;
      case 'dark':
        newTheme = DarkTheme;
        break;
      case 'highContrast':
        newTheme = HighContrastTheme;
        break;
      default:
        newTheme = LightTheme;
    }
    
    setTheme(newTheme);
    setThemeModeState(mode);
    await AsyncStorage.setItem("appTheme", mode);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setThemeMode, themeMode }}>
      {children}
    </ThemeContext.Provider>
  );
}