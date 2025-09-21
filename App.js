import { ActivityIndicator, StyleSheet, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState, useContext } from "react";
import { NavigationContainer, DarkTheme as RNDarkTheme, DefaultTheme as RNLightTheme } from "@react-navigation/native";
import AppRoutes from "./routes/AppRoutes";
import { AuthProvider } from "./contexts/AuthContext";
import Toast from "react-native-toast-message";
import { getToastConfig } from "./utils/toastConfig";
import { ThemeProvider, ThemeContext } from "./contexts/ThemeContext";
import * as SystemUI from "expo-system-ui";
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

  return (
    <ThemeProvider>
      <InnerApp
        loading={loading}
        setLoading={setLoading}
        viewOnboarding={viewOnboarding}
        setViewOnboarding={setViewOnboarding}
        lockEnabled={lockEnabled}
        setLockEnabled={setLockEnabled}
      />
    </ThemeProvider>
  );
}

function InnerApp({ loading, setLoading, viewOnboarding, setViewOnboarding, lockEnabled, setLockEnabled }) {
  const { effectiveTheme } = useContext(ThemeContext);
  const currentTheme = effectiveTheme === "dark" ? darkTheme : lightTheme;

   
  useEffect(() => {
    const background = currentTheme.background;
    SystemUI.setBackgroundColorAsync(background);
  }, [currentTheme]);

  
  useEffect(() => {
    const initApp = async () => {
      try {
        const onboarding = await AsyncStorage.getItem("@viewedOnboarding");
        if (onboarding !== null) setViewOnboarding(true);

        const useBio = await AsyncStorage.getItem("useBiometrics");
        const savedUid = await AsyncStorage.getItem("uid");
        if (savedUid || useBio === "true") setLockEnabled(true);
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
    <NavigationContainer theme={effectiveTheme === "dark" ? RNDarkTheme : RNLightTheme}>
      <AuthProvider>
        <AppRoutes viewOnboarding={viewOnboarding} lockEnabled={lockEnabled} />
        <Toast config={getToastConfig(currentTheme)} />
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
