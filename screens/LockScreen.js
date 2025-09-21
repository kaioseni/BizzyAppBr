import React, { useContext, useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Image, Dimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AuthContext } from "../contexts/AuthContext";
import * as LocalAuthentication from "expo-local-authentication";
import { ThemeContext } from "../contexts/ThemeContext";

const { width, height } = Dimensions.get("window");

export default function LockScreen({ navigation }) {
  const { initBiometric } = useContext(AuthContext);
  const { effectiveTheme } = useContext(ThemeContext);

  const colors = effectiveTheme === "dark"
    ? { background: "#121212", text: "#fff", card: "#1f1f1f", button: "#329de4" }
    : { background: "#fff", text: "#333", card: "#f9f9f9", button: "#329de4" };

  const [loading, setLoading] = useState(true);
  const [biometricAvailable, setBiometricAvailable] = useState(false);

  useEffect(() => {
    const authenticate = async () => {
      try {
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const enrolled = await LocalAuthentication.isEnrolledAsync();
        setBiometricAvailable(hasHardware && enrolled);

        if (hasHardware && enrolled) {
          const success = await initBiometric();
          if (success) {
            navigation.replace("MainTabs");
            return;
          }
        }

        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: "Desbloqueie o app",
          fallbackLabel: "Cancelar",
          disableDeviceFallback: false,
        });

        if (result.success) {
          navigation.replace("MainTabs");
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.log("Erro na autenticação:", error);
        setLoading(false);
      }
    };

    authenticate();
  }, []);

  const fallbackToPassword = async () => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Use a senha do dispositivo",
        fallbackLabel: "Cancelar",
        disableDeviceFallback: false,
      });

      if (result.success) {
        navigation.replace("MainTabs");
      } else {
        Alert.alert("Falha na autenticação", "Não foi possível desbloquear o app.");
      }
    } catch (error) {
      console.log("Erro fallbackToPassword:", error);
      Alert.alert("Falha na autenticação", "Não foi possível desbloquear o app.");
    }
  };

  if (loading)
    return (
      <SafeAreaView style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.text} />
      </SafeAreaView>
    );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <View style={styles.centerContent}>
        <Image
          source={require("../assets/LOGO_BIZZYAPP_ICON_ID_1.png")}
          style={[styles.logo, { width: width * 0.4, height: width * 0.4, maxWidth: 200, maxHeight: 200 }]}
          resizeMode="contain"
        />
        <Text style={[styles.text, { color: colors.text, fontSize: Math.min(width * 0.05, 24) }]}>
          Desbloqueie o app
        </Text>
      </View>

      <View style={styles.bottomContent}>
        <TouchableOpacity
          style={[
            styles.button,
            {
              paddingVertical: height * 0.02,
              minWidth: width * 0.55,
              backgroundColor: colors.button,
              marginBottom: height * 0.02,  
            },
          ]}
          onPress={biometricAvailable ? fallbackToPassword : async () => {
            try {
              const result = await LocalAuthentication.authenticateAsync({
                promptMessage: "Desbloqueie o app",
                fallbackLabel: "Cancelar",
                disableDeviceFallback: false,
              });
              navigation.replace("MainTabs");
            } catch {
              navigation.replace("MainTabs");
            }
          }}
        >
          <Text style={[styles.buttonText, { fontSize: Math.min(width * 0.045, 18) }]}>
            Desbloquear
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    flex: 1,
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: "5%",
    paddingVertical: "3%",
  },
  centerContent: {
    justifyContent: "center",
    alignItems: "center",
    flex: 1,
  },
  bottomContent: {
    width: "100%",
    alignItems: "center",
  },
  logo: {
    marginBottom: "5%",
  },
  text: {
    marginBottom: "3%",
    textAlign: "center",
    fontWeight: "600",
  },
  button: {
    borderRadius: 10,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    marginHorizontal: "5%",
  },
});
