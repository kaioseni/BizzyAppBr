import { useState, useContext } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Dimensions, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from "react-native";
import Toast from "react-native-toast-message";
import { AuthContext } from "../contexts/AuthContext";
import { ThemeContext } from "../contexts/ThemeContext";
import { lightTheme, darkTheme } from "../utils/themes";

const { width, height } = Dimensions.get("window");
const APP_BLUE = "#329de4";

export default function ForgotPassword({ navigation }) {
  const { resetPassword } = useContext(AuthContext);
  const { theme } = useContext(ThemeContext);
  const currentTheme = theme === "dark" ? darkTheme : lightTheme;

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handlePasswordReset = async () => {
    if (!email) {
      Toast.show({ type: "error", text1: "Aviso!", text2: "Informe o e-mail para recuperar a senha." });
      return;
    }

    setLoading(true);
    try {
      await resetPassword(email);
      Toast.show({ type: "success", text1: "E-mail enviado!", text2: "Verifique sua caixa de entrada." });
    } catch (error) {
      let message = "";
      if (error.code === "auth/user-not-found") message = "Usuário não encontrado.";
      else if (error.code === "auth/invalid-email") message = "E-mail inválido.";
      else message = error.message;

      Toast.show({ type: "error", text1: "Erro", text2: message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: currentTheme.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        <Text style={[styles.title, { color: APP_BLUE }]}>Recuperar Senha 🔑</Text>

        <TextInput
          placeholder="Digite seu e-mail"
          placeholderTextColor={theme === "dark" ? "#ccc" : "#999"}
          style={[styles.input, {
            color: theme === "dark" ? "#fff" : "#333",
            borderColor: APP_BLUE,
            backgroundColor: currentTheme.card
          }]}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />


        <TouchableOpacity
          style={[styles.button, { backgroundColor: APP_BLUE }]}
          onPress={handlePasswordReset}
          activeOpacity={0.8}
          disabled={loading}
        >
          {loading ? (
            <View style={{ flexDirection: "row", justifyContent: "center", alignItems: "center" }}>
              <ActivityIndicator color="#fff" style={{ marginRight: 10 }} />
              <Text style={styles.buttonText}>Enviando...</Text>
            </View>
          ) : (
            <Text style={styles.buttonText}>Redefinir Senha</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate("LoginScreen")}>
          <Text style={[styles.backText, { color: APP_BLUE }]}>Voltar para Login</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: width * 0.08,
    paddingVertical: height * 0.08
  },
  title: {
    fontSize: width * 0.065,
    fontWeight: "600",
    marginBottom: 40,
    textAlign: "center"
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 15,
    fontSize: 16,
    marginBottom: 20
  },
  button: {
    paddingVertical: 15,
    borderRadius: 10,
    marginBottom: 20,
    alignItems: "center"
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold"
  },
  backText: {
    fontSize: 14,
    textAlign: "center",
    marginTop: 10
  },
});
