import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from "react-native";
import { User, Calendar, Settings, Users, Info } from "lucide-react-native";

const { width, height } = Dimensions.get("window");

export default function MoreScreen({ navigation }) {
  const menuItems = [
    { label: "Perfil", icon: User, screen: "Profile" },
    { label: "Agendamentos", icon: Calendar, screen: "AppointmentsScreen" },
    { label: "Colaboradores", icon: Users, screen: "Notifications" },
    { label: "Configurações", icon: Settings, screen: "Settings" },
    { label: "Sobre", icon: Info, screen: "About" },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mais opções</Text>

      <View style={styles.menuGrid}>
        {menuItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <TouchableOpacity
              key={index}
              style={styles.menuItem}
              onPress={() => navigation.navigate(item.screen)}
            >
              <Icon size={28} color="#329de4" />
              <Text style={styles.menuText}>{item.label}</Text>
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
    backgroundColor: "#fff",
    padding: width * 0.06,
    paddingTop: height * 0.08,
  },
  title: {
    fontSize: width * 0.06,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#333",
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
    backgroundColor: "#f5f9ff",
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
    color: "#329de4",
    textAlign: "center",
  },
});
