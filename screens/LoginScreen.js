import React, { useState, useContext, useEffect } from "react";
import { Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, View, Dimensions } from "react-native";
import Toast from "react-native-toast-message";
import { Eye, EyeOff } from "lucide-react-native";
import { AuthContext } from "../contexts/AuthContext";
import { ThemeContext } from "../contexts/ThemeContext";
import { lightTheme, darkTheme } from "../utils/themes";
import { SafeAreaView } from "react-native-safe-area-context";

const { width, height } = Dimensions.get("window");

export default function LoginScreen({ navigation }) {
  const { effectiveTheme } = useContext(ThemeContext);
  const currentTheme = effectiveTheme === "light" ? lightTheme : darkTheme;

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { promptEnableBiometrics, initBiometric, login } = useContext(AuthContext);

  useEffect(() => {
    const checkBio = async () => {
      const success = await initBiometric();
      if (success) {
        showToast("success", "Login realizado!", "Autenticado via biometria 👆");
        navigation.navigate("MainTabs", { screen: "Home" });
      }
    };
    checkBio();
  }, []);

  const handleLogin = async () => {
    if (!email || !senha) {
      showToast("error", "Erro", "Preencha todos os campos");
      return;
    }

    setLoading(true);
    try {
      const currentUser = await login(email, senha);
      showToast("success", "Login realizado!", "Bem-vindo de volta 👋");
      await promptEnableBiometrics(currentUser.uid);
      navigation.navigate("MainTabs", { screen: "Home" });
    } catch (error) {
      handleAuthError(error);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = () => navigation.navigate("ForgotPassword");

  const showToast = (type, title, message) => {
    Toast.show({ type, text1: title, text2: message });
  };

  const handleAuthError = (error) => {
    let message = "";
    switch (error.code) {
      case "auth/user-not-found":
        message = "Usuário não encontrado. Cadastre-se primeiro.";
        break;
      case "auth/invalid-credential":
        message = "Senha incorreta.";
        break;
      case "auth/invalid-email":
        message = "E-mail inválido.";
        break;
      default:
        message = error.message;
    }
    showToast("error", "Erro", message);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: currentTheme.background }} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? height * 0.08 : 0}
      >
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <Text style={[styles.title, { color: currentTheme.primary }]}>
            Bem-vindo de volta 👋
          </Text>

          <TextInput
            placeholder="E-mail"
            placeholderTextColor={currentTheme.text + "99"}
            style={[styles.input, { borderColor: currentTheme.primary, color: currentTheme.text }]}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <View style={[styles.passwordContainer, { borderColor: currentTheme.primary }]}>
            <TextInput
              placeholder="Senha"
              placeholderTextColor={currentTheme.text + "99"}
              style={[styles.passwordInput, { color: currentTheme.text }]}
              value={senha}
              onChangeText={setSenha}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton}>
              {showPassword ? (
                <EyeOff size={width * 0.055} color={currentTheme.primary} />
              ) : (
                <Eye size={width * 0.055} color={currentTheme.primary} />
              )}
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.button, { backgroundColor: currentTheme.primary }]}
            onPress={handleLogin}
            activeOpacity={0.8}
            disabled={loading}
          >
            <Text style={[styles.buttonText, { fontSize: Math.min(width * 0.045, 18) }]}>
              {loading ? "Entrando..." : "Entrar"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate("Register")}>
            <Text style={[styles.registerText, { color: currentTheme.text, fontSize: Math.min(width * 0.04, 15) }]}>
              Ainda não tem conta?{" "}
              <Text style={[styles.registerLink, { color: currentTheme.primary }]}>
                Cadastre-se
              </Text>
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handlePasswordReset}>
            <Text style={[styles.forgotPasswordText, { color: currentTheme.primary }]}>
              Esqueci minha senha
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: "center",
    paddingVertical: height * 0.06,
    paddingHorizontal: width * 0.07,
  },
  title: {
    fontSize: Math.min(width * 0.06, 24),
    fontWeight: "600",
    marginBottom: height * 0.04,
    textAlign: "center",
  },
  input: {
    height: height * 0.065,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: width * 0.04,
    fontSize: Math.min(width * 0.042, 16),
    marginBottom: height * 0.02,
    width: "100%",
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: width * 0.04,
    marginBottom: height * 0.02,
    height: height * 0.065,
  },
  passwordInput: {
    flex: 1,
    fontSize: Math.min(width * 0.042, 16),
    height: "100%",
  },
  eyeButton: {
    marginLeft: width * 0.02,
    padding: 4,
  },
  forgotPasswordText: {
    fontSize: Math.min(width * 0.04, 14),
    textAlign: "center",
    marginTop: height * 0.01,
    marginBottom: height * 0.025,
  },
  button: {
    paddingVertical: height * 0.02,
    borderRadius: 10,
    marginTop: height * 0.015,
    marginBottom: height * 0.03,
    width: "100%",
  },
  buttonText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "bold",
  },
  registerText: {
    textAlign: "center",
    marginBottom: height * 0.015,
  },
  registerLink: {
    fontWeight: "600",
  },
});
