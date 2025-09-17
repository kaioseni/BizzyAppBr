// App.js
import { ActivityIndicator, StyleSheet, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import AppRoutes from "./routes/AppRoutes";
import { AuthProvider } from "./contexts/AuthContext";
import Toast from "react-native-toast-message";
import { getToastConfig } from "./utils/toastConfig";
import { ThemeProvider, ThemeContext } from "./contexts/ThemeContext";
import { StatusBar } from "expo-status-bar";
import { lightTheme, darkTheme } from "./utils/themes";

const Loading = () => (
  <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
    <ActivityIndicator size="large" />
  </View>
);

export default function App() {
  const [loading, setLoading] = useState(true);
  const [viewOnboarding, setViewOnboarding] = useState(false);
  const [lockEnabled, setLockEnabled] = useState(false);

  useEffect(() => {
    const initApp = async () => {
      try {
        // Check onboarding
        const onboarding = await AsyncStorage.getItem("@viewedOnboarding");
        if (onboarding !== null) setViewOnboarding(true);

        // Check biometrics
        const useBio = await AsyncStorage.getItem("useBiometrics");
        if (useBio === "true") setLockEnabled(true);
      } catch (err) {
        console.log("Erro ao inicializar app:", err);
      } finally {
        setLoading(false);
      }
    };

    initApp();
  }, []);

  if (loading) return <Loading />;

  return (
    <NavigationContainer>
      <AuthProvider>
        <ThemeProvider>
          <ThemeContext.Consumer>
            {({ theme }) => {
              const currentTheme = theme === "dark" ? darkTheme : lightTheme;

              return (
                <>
                  <StatusBar
                    style={theme === "dark" ? "light" : "dark"}
                    backgroundColor={currentTheme.background}
                  />
                  <AppRoutes
                    viewOnboarding={viewOnboarding}
                    lockEnabled={lockEnabled}
                  />
                  <Toast config={getToastConfig(currentTheme)} />
                </>
              );
            }}
          </ThemeContext.Consumer>
        </ThemeProvider>
      </AuthProvider>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
});
