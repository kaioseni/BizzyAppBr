import { useContext } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Alert } from "react-native";
import { User, Wrench, Settings, Users, Info, FileChartColumnIncreasing, BookCheck } from "lucide-react-native";
import { ThemeContext } from "../contexts/ThemeContext";
import { AuthContext } from "../contexts/AuthContext";
import { lightTheme, darkTheme } from "../utils/themes";

const { width, height } = Dimensions.get("window");
const APP_BLUE = "#329de4";

export default function MoreScreen({ navigation }) {
  const { effectiveTheme } = useContext(ThemeContext); 
  const { logout } = useContext(AuthContext);

  const currentTheme = effectiveTheme === "dark" ? darkTheme : lightTheme;

  const menuItems = [
    { label: "Perfil", icon: User, screen: "Profile" },
    { label: "Colaboradores", icon: Users, screen: "CollaboratorsScreen" },
    { label: "Configurações", icon: Settings, screen: "ThemeSettingsScreen" },
    { label: "Relatório", icon: FileChartColumnIncreasing, screen: "ClientsScreen" },
    { label: "Serviços", icon: Wrench, screen: "ServicesScreen" },
    { label: "Finalizados", icon: BookCheck, screen: "FinishedScreen" },
    { label: "Sobre", icon: Info, screen: "About" },
  ];

  const handleLogoutPress = () => {
    Alert.alert(
      "Sair do aplicativo",
      "Tem certeza que deseja sair?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Sair",
          style: "destructive",
          onPress: async () => {
            await logout();
            navigation.reset({ index: 0, routes: [{ name: "LoginScreen" }] });
          }
        }
      ],
      { cancelable: true }
    );
  };

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

      <TouchableOpacity
        style={[styles.logoutButton, { backgroundColor: "#e53935" }]}
        onPress={handleLogoutPress}
      >
        <Text style={{ color: "#fff", fontWeight: "bold", fontSize: width * 0.045 }}>
          Sair
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    padding: width * 0.06, 
    paddingTop: height * 0.08 
  },
  title: { 
    fontSize: width * 0.06, 
    fontWeight: "bold", 
    marginBottom: 20, 
    textAlign: "center" 
  },
  menuGrid: { 
    flexDirection: "row", 
    flexWrap: "wrap", 
    justifyContent: "space-around", 
    marginTop: 10 
  },
  menuItem: {
    width: width * 0.32,
    height: width * 0.32,
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
    textAlign: "center" 
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 12,
    marginHorizontal: 20,
  },
});
