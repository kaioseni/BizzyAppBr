import React, { useContext, useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Image, Dimensions } from "react-native";
import { AuthContext } from "../contexts/AuthContext";
import * as LocalAuthentication from 'expo-local-authentication';
import { ThemeContext } from "../contexts/ThemeContext";
import { lightTheme, darkTheme } from "../utils/themes";

const { width, height } = Dimensions.get("window");

export default function LockScreen({ navigation }) {
  const { initBiometric } = useContext(AuthContext);
  const { theme } = useContext(ThemeContext);
  const currentTheme = theme === "dark" ? darkTheme : lightTheme;

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const authenticate = async () => {
      const success = await initBiometric();
      if (success) {
        navigation.replace("MainTabs");
      } else {
        setLoading(false);
      }
    };
    authenticate();
  }, []);

  const fallbackToPassword = async () => {
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
  };

  if (loading) return (
    <View style={[styles.container, { backgroundColor: currentTheme.background }]}>
      <ActivityIndicator size="large" color={currentTheme.text} />
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: currentTheme.background }]}>
      <View style={styles.centerContent}>
        <Image 
          source={require("../assets/LOGO_BIZZYAPP_ICON_ID_1.png")}
          style={[styles.logo, { width: width * 0.4, height: width * 0.4 }]}
          resizeMode="contain"
        />
        <Text style={[styles.text, { color: currentTheme.text, fontSize: width * 0.05 }]}>
          Desbloqueie o app
        </Text>
      </View>

      <View style={styles.bottomContent}>
        <TouchableOpacity 
          style={[styles.button, { paddingVertical: height * 0.02, minWidth: width * 0.5 }]} 
          onPress={fallbackToPassword}
        >
          <Text style={[styles.buttonText, { fontSize: width * 0.045 }]}>
            Usar senha do dispositivo
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    justifyContent: "space-between",  
    alignItems: "center", 
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  centerContent: {
    justifyContent: "center",
    alignItems: "center",
    flex: 1,  
  },
  bottomContent: {
    width: "100%",
    alignItems: "center",
    marginBottom: 10, 
  },
  logo: {
    marginBottom: height * 0.05,
  },
  text: { 
    marginBottom: height * 0.03, 
    textAlign: "center",
    fontWeight: "600",
  },
  button: { 
    backgroundColor: "#2196F3", 
    borderRadius: 10, 
    alignItems: "center",
  },
  buttonText: { 
    color: "#fff", 
    fontWeight: "bold",
    marginHorizontal: width * 0.05,
  },
});
