import React, { createContext, useState, useEffect } from "react";
import { Appearance } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState("light"); // padrão light

  useEffect(() => {
    const loadTheme = async () => {
      const savedTheme = await AsyncStorage.getItem("@appTheme");
      if (savedTheme) {
        setTheme(savedTheme);
      } else {
        const systemTheme = Appearance.getColorScheme(); // light ou dark
        setTheme(systemTheme || "light");
      }
    };

    loadTheme();
  }, []);

  const changeTheme = async (newTheme) => {
    setTheme(newTheme);
    await AsyncStorage.setItem("@appTheme", newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, changeTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
