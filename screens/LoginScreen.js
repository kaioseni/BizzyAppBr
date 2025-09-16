import React, { useState, useContext, useEffect } from "react";
import { Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, View } from "react-native";
import Toast from "react-native-toast-message";
import { Eye, EyeOff } from "lucide-react-native";
import { AuthContext } from "../contexts/AuthContext";
import { ThemeContext } from "../contexts/ThemeContext";
import { lightTheme, darkTheme } from "../utils/themes";

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
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: currentTheme.background }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
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
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            style={styles.eyeButton}
          >
            {showPassword ? (
              <EyeOff size={22} color={currentTheme.primary} />
            ) : (
              <Eye size={22} color={currentTheme.primary} />
            )}
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: currentTheme.primary }]}
          onPress={handleLogin}
          activeOpacity={0.8}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? "Entrando..." : "Entrar"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate("Register")}>
          <Text style={[styles.registerText, { color: currentTheme.text }]}>
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
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 30,
    paddingVertical: 60,
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
    marginBottom: 30,
    textAlign: "center",
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 15,
    fontSize: 16,
    marginBottom: 10,
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 10,
    height: 50,
  },
  passwordInput: {
    flex: 1,
    fontSize: 16,
    height: "100%",
  },
  eyeButton: {
    marginLeft: 10,
    padding: 4,
  },
  forgotPasswordText: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 20,
    paddingVertical: 12,
  },
  button: {
    paddingVertical: 15,
    borderRadius: 10,
    marginTop: 10,
    marginBottom: 25,
  },
  buttonText: {
    color: "#fff",
    textAlign: "center",
    fontSize: 16,
    fontWeight: "bold",
  },
  registerText: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 10,
  },
  registerLink: {
    fontWeight: "600",
  },
});
