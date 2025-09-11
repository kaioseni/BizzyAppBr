import { useContext } from "react";
import { View, Text, Button } from "react-native";
import { ThemeContext } from "../contexts/ThemeContext";

export default function ThemeSettingsScreen() {
  const { theme, changeTheme } = useContext(ThemeContext);

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text>Tema atual: {theme}</Text>
      <Button title="Claro" onPress={() => changeTheme("light")} />
      <Button title="Escuro" onPress={() => changeTheme("dark")} />
      <Button title="Baseado no sistema" onPress={() => changeTheme(Appearance.getColorScheme())} />
    </View>
  );
}
