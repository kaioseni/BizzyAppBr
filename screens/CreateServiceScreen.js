import { useState, useContext } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { db } from "../firebase/firebaseConfig";
import { doc, setDoc, collection } from "firebase/firestore";
import { AuthContext } from "../contexts/AuthContext";
import { ThemeContext } from "../contexts/ThemeContext";
import Toast from "react-native-toast-message";

const lightTheme = {
  background: "#FFFFFF",
  text: "#000000",
  primary: "#329de4",
  card: "#F5F5F5",
};

const darkTheme = {
  background: "#121212",
  text: "#FFFFFF",
  primary: "#329de4",
  card: "#1F1F1F",
};

export default function CreateServiceScreen({ navigation }) {
  const { user } = useContext(AuthContext);
  const { theme } = useContext(ThemeContext);
  const themeColors = theme === "dark" ? darkTheme : lightTheme;

  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");

  const handleSave = async () => {
    if (!nome || !descricao) {
      Toast.show({ type: "error", text1: "Preencha todos os campos" });
      return;
    }

    try {
      if (!user?.uid) {
        Toast.show({ type: "error", text1: "Usuário não encontrado" });
        return;
      }

      const servicosCriadosRef = collection(db, "users", user.uid, "servicosCriados");
      const idServico = nome.replace(/\s+/g, "").toLowerCase();
      const servicoRef = doc(servicosCriadosRef, idServico);

      await setDoc(servicoRef, {
        nome,
        descricao,
        favorito: false,
        createdAt: new Date(),
      });

      Toast.show({ type: "success", text1: "Serviço criado com sucesso!" });
      navigation.goBack();
    } catch (error) {
      console.log("Erro ao criar serviço:", error);
      Toast.show({ type: "error", text1: "Erro ao criar serviço" });
    }
  };

return (
  <KeyboardAvoidingView
    style={{ flex: 1, backgroundColor: themeColors.background }}
    behavior={Platform.OS === "ios" ? "padding" : "height"}
    keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
  >
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.title, { color: themeColors.primary }]}>Novo Serviço</Text>

      <TextInput
        style={[
          styles.input,
          { backgroundColor: themeColors.card, borderColor: themeColors.primary, color: themeColors.text },
        ]}
        placeholder="Nome do Serviço"
        placeholderTextColor={themeColors.text + "99"}
        value={nome}
        onChangeText={setNome}
      />

      <TextInput
        style={[
          styles.input,
          { backgroundColor: themeColors.card, borderColor: themeColors.primary, color: themeColors.text, height: 120, textAlignVertical: "top" },
        ]}
        placeholder="Descrição do Serviço"
        placeholderTextColor={themeColors.text + "99"}
        value={descricao}
        onChangeText={setDescricao}
        multiline
      />

      <TouchableOpacity style={[styles.btn, { backgroundColor: themeColors.primary }]} onPress={handleSave}>
        <Text style={[styles.btnText, { color: "#FFF" }]}>Salvar</Text>
      </TouchableOpacity>
    </ScrollView>
  </KeyboardAvoidingView>
);
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "center"
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center"
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 16,
    fontSize: 16,
  },
  btn: {
    padding: 15,
    borderRadius: 8,
    alignItems: "center"
  },
  btnText: { fontWeight: "bold" },
});
