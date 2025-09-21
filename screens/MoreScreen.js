import React, { useContext } from "react";
import { SafeAreaView, ScrollView, View, Text, TouchableOpacity, StyleSheet, Dimensions, Alert } from "react-native";
import { User, Wrench, Settings, Users, Info, FileChartColumnIncreasing, BookCheck, LogOut  } from "lucide-react-native";
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
    <SafeAreaView style={[styles.container, { backgroundColor: currentTheme.background }]}>
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "center",
          paddingHorizontal: width * 0.06,
          paddingBottom: height * 0,
        }}
      >
        <Text style={[styles.title, { color: currentTheme.text, fontSize: width * 0.05 }]}>Mais opções</Text>

        <View style={styles.menuGrid}>
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <TouchableOpacity
                key={index}
                style={[styles.menuItem, { backgroundColor: currentTheme.card }]}
                onPress={() => navigation.navigate(item.screen)}
              >
                <Icon size={width * 0.07} color={APP_BLUE} />
                <Text style={[styles.menuText, { color: APP_BLUE, fontSize: width * 0.04 }]}>{item.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <TouchableOpacity
        style={{
          position: "absolute",
          bottom: height * 0.03,
          right: width * 0.05,
          width: width * 0.14,
          height: width * 0.14,
          borderRadius: (width * 0.14) / 2,
          backgroundColor: "#e53935",
          justifyContent: "center",
          alignItems: "center",
          elevation: 5,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.3,
          shadowRadius: 3,
        }}
        onPress={handleLogoutPress}
      >
       <LogOut color={"#FFFFFF"}/>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    fontWeight: "bold",
    marginBottom: height * 0.03,
    textAlign: "center"
  },
  menuGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-around",
  },
  menuItem: {
    width: width * 0.32,
    height: width * 0.32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: height * 0.025,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  menuText: {
    marginTop: height * 0.01,
    fontWeight: "500",
    textAlign: "center"
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
  },
});
