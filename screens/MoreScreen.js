import { useContext } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from "react-native";
import { User, Wrench, Settings, Users, Info, FileChartColumnIncreasing, BookCheck } from "lucide-react-native";
import { ThemeContext } from "../contexts/ThemeContext";

const { width, height } = Dimensions.get("window");
const APP_BLUE = "#329de4";

export default function MoreScreen({ navigation }) {
  const { theme } = useContext(ThemeContext);

  const currentTheme =
    theme === "dark"
      ? {
        background: "#121212",
        card: "#1e1e1e",
        text: "#fff",
        textSecondary: "#ccc",
      }
      : {
        background: "#fff",
        card: "#f5f9ff",
        text: "#333",
        textSecondary: "#777",
      };

  const menuItems = [
    { label: "Perfil", icon: User, screen: "Profile" },
    { label: "Colaboradores", icon: Users, screen: "CollaboratorsScreen" },
    { label: "Configurações", icon: Settings, screen: "ThemeSettingsScreen" },
    { label: "Relatório", icon: FileChartColumnIncreasing, screen: "ClientsScreen" },
    { label: "Serviços", icon: Wrench, screen: "ServicesScreen" },
    { label: "Finalizados", icon: BookCheck, screen: "FinishedScreen" },
    { label: "Sobre", icon: Info, screen: "About" },
  ];

  return (
    <View style={[styles.container, { backgroundColor: currentTheme.background }]}>
      <Text style={[styles.title, { color: currentTheme.text }]}>Mais opções</Text>

      <View style={styles.menuGrid}>
        {menuItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <TouchableOpacity
              key={index}
              style={[styles.menuItem, { backgroundColor: currentTheme.card }]}
              onPress={() => navigation.navigate(item.screen)}
            >
              <Icon size={28} color={APP_BLUE} />
              <Text style={[styles.menuText, { color: APP_BLUE }]}>{item.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: width * 0.06,
    paddingTop: height * 0.08,
  },
  title: {
    fontSize: width * 0.06,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  menuGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-around",
    marginTop: 10,
  },
  menuItem: {
    width: width * 0.35,
    height: width * 0.35,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  menuText: {
    marginTop: 8,
    fontSize: width * 0.04,
    fontWeight: "500",
    textAlign: "center",
  },
});
