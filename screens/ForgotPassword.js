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
  const { effectiveTheme } = useContext(ThemeContext);
  const currentTheme = effectiveTheme === "dark" ? darkTheme : lightTheme;

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handlePasswordReset = async () => {
    if (!email) {
      Toast.show({
        type: "error",
        text1: "Aviso!",
        text2: "Informe o e-mail para recuperar a senha.",
      });
      return;
    }

    setLoading(true);
    try {
      await resetPassword(email);
      Toast.show({
        type: "success",
        text1: "E-mail enviado!",
        text2: "Verifique sua caixa de entrada.",
      });
      navigation.goBack();  
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
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? height * 0.1 : 0}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ alignItems: "center", marginBottom: height * 0.04 }}>
          <Text style={[styles.title, { color: APP_BLUE }]}>
            Recuperar Senha 🔑
          </Text>
        </View>

        <TextInput
          placeholder="Digite seu e-mail"
          placeholderTextColor={currentTheme.textSecondary}
          style={[
            styles.input,
            {
              color: currentTheme.text,
              borderColor: APP_BLUE,
              backgroundColor: currentTheme.card,
            },
          ]}
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
            <View style={styles.loadingWrapper}>
              <ActivityIndicator color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.buttonText}>Enviando...</Text>
            </View>
          ) : (
            <Text style={styles.buttonText}>Redefinir Senha</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={[styles.backText, { color: APP_BLUE }]}>
            Voltar para Login
          </Text>
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
    paddingVertical: height * 0.05,
  },
  title: {
    fontSize: width * 0.07,
    fontWeight: "600",
    textAlign: "center",
  },
  input: {
    height: height * 0.065,
    borderWidth: 1,
    borderRadius: width * 0.025,
    paddingHorizontal: width * 0.04,
    fontSize: width * 0.04,
    marginBottom: height * 0.025,
  },
  button: {
    paddingVertical: height * 0.02,
    borderRadius: width * 0.025,
    marginBottom: height * 0.02,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: width * 0.045,
    fontWeight: "bold",
  },
  backText: {
    fontSize: width * 0.04,
    textAlign: "center",
    marginTop: height * 0.015,
  },
  loadingWrapper: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
});
