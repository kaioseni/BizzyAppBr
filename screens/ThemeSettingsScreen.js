import React, { useContext } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { ThemeContext } from "../contexts/ThemeContext";
import { lightTheme, darkTheme } from "../utils/themes";

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
          },
        ]}
        onPress={() => changeTheme(value)}
      >
        <Text
          style={[
            styles.buttonText,
            { color: isActive ? currentTheme.buttonText : currentTheme.text },
          ]}
        >
          {title}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: currentTheme.background }]}>
      <Text style={[styles.title, { color: currentTheme.text }]}>
        Tema atual: {theme === "system" ? `Baseado no sistema (${effectiveTheme})` : theme}
      </Text>
      <ButtonOption title="Claro" value="light" />
      <ButtonOption title="Escuro" value="dark" />
      <ButtonOption title="Baseado no sistema" value="system" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 30,
  },
  button: {
    width: "80%",
    paddingVertical: 14,
    borderRadius: 10,
    marginVertical: 8,
    alignItems: "center",
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
