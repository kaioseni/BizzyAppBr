import React, { useContext } from "react";
import { SafeAreaView, View, Text, TouchableOpacity, StyleSheet, Dimensions } from "react-native";
import { ThemeContext } from "../contexts/ThemeContext";
import { lightTheme, darkTheme } from "../utils/themes";

const { width, height } = Dimensions.get("window");

export default function ThemeSettingsScreen() {
  const { theme, effectiveTheme, changeTheme } = useContext(ThemeContext);

  const currentTheme = effectiveTheme === "light" ? lightTheme : darkTheme;

  const ButtonOption = ({ title, value }) => {
    const isActive = value === "system" ? theme === "system" : theme === value;

    return (
      <TouchableOpacity
        style={[
          styles.button,
          {
            backgroundColor: isActive
              ? currentTheme.button
              : currentTheme.inputBackground,
            paddingVertical: height * 0.02,
            width: width * 0.8,
          },
        ]}
        onPress={() => changeTheme(value)}
      >
        <Text
          style={[
            styles.buttonText,
            {
              color: isActive ? currentTheme.buttonText : currentTheme.text,
              fontSize: Math.min(width * 0.045, 18),
            },
          ]}
        >
          {title}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: currentTheme.background }]}
      edges={["top", "bottom"]}
    >
      <Text
        style={[
          styles.title,
          { color: currentTheme.text, fontSize: Math.min(width * 0.05, 22), marginBottom: height * 0.04 },
        ]}
      >
        Tema atual: {theme === "system" ? `Baseado no sistema (${effectiveTheme})` : theme}
      </Text>
      <ButtonOption title="Claro" value="light" />
      <ButtonOption title="Escuro" value="dark" />
      <ButtonOption title="Baseado no sistema" value="system" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: "5%",
    justifyContent: "center",
  },
  title: {
    fontWeight: "600",
    textAlign: "center",
  },
  button: {
    borderRadius: 10,
    marginVertical: height * 0.01,
    alignItems: "center",
  },
  buttonText: {
    fontWeight: "600",
  },
});
