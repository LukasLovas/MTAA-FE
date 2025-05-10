// contexts/ThemeContext.tsx
import React, { createContext, useState, useEffect, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LightTheme, DarkTheme } from "../theme";

export const ThemeContext = createContext<{
  theme: typeof LightTheme;
  toggleTheme: () => void;
}>({
  theme: LightTheme,
  toggleTheme: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState(LightTheme);

  useEffect(() => {
    (async () => {
      const stored = await AsyncStorage.getItem("appTheme");
      if (stored === "dark") {
        setTheme(DarkTheme);
      } else {
        setTheme(LightTheme);
      }
    })();
  }, []);

  const toggleTheme = async () => {
    const next = theme.dark ? LightTheme : DarkTheme;
    setTheme(next);
    await AsyncStorage.setItem("appTheme", next.dark ? "dark" : "light");
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
