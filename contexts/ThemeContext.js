import React, { createContext, useState, useEffect } from "react";
import { Appearance } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(null);
  const [systemTheme, setSystemTheme] = useState(null);

  const loadTheme = async () => {
    const savedTheme = await AsyncStorage.getItem("@appTheme");
    setTheme(savedTheme || "system");

    const currentSystemTheme = Appearance.getColorScheme() || "light";
    setSystemTheme(currentSystemTheme);
  };

  useEffect(() => {
    loadTheme();

    const listener = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemTheme(colorScheme || "light");
    });

    return () => listener.remove();
  }, []);

  const changeTheme = async (newTheme) => {
    setTheme(newTheme);
    await AsyncStorage.setItem("@appTheme", newTheme);
  };

  if (!theme || !systemTheme) return null;

  const effectiveTheme = theme === "system" ? systemTheme : theme;

  return (
    <ThemeContext.Provider value={{ theme, effectiveTheme, changeTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
