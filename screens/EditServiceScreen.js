import { useState, useContext } from "react";
import { Text, TextInput, TouchableOpacity, StyleSheet, Dimensions, SafeAreaView, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from "react-native";
import Toast from "react-native-toast-message";
import { AuthContext } from "../contexts/AuthContext";
import { ThemeContext } from "../contexts/ThemeContext";
import { updateServico } from "../services/servicesService";

const { width, height } = Dimensions.get("window");
const APP_BLUE = "#329de4";

export default function EditServiceScreen({ route, navigation }) {
  const { servico } = route.params;
  const { user } = useContext(AuthContext);
  const { effectiveTheme } = useContext(ThemeContext);

  const colors =
    effectiveTheme === "dark"
      ? { background: "#121212", text: "#f5f5f5", card: "#1e1e1e", border: "#444", placeholder: "#888" }
      : { background: "#fff", text: "#333", card: "#f9f9f9", border: "#ccc", placeholder: "#aaa" };

  const [nome, setNome] = useState(servico?.nome || "");
  const [descricao, setDescricao] = useState(servico?.descricao || "");
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!servico?.id) return;

    setLoading(true);
    try {
      const servicoAtualizado = {
        ...servico,
        nome,
        descricao,
        tipo: "personalizado",
      };

      await updateServico(user.uid, servicoAtualizado);

      Toast.show({
        type: "success",
        text1: "Serviço atualizado",
        text2: `"${nome}" foi salvo como personalizado.`,
      });

      navigation.goBack();
    } catch (error) {
      console.error("Erro ao salvar serviço:", error);
      Toast.show({ type: "error", text1: "Erro ao salvar serviço" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? height * 0.08 : 0}
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,  
            justifyContent: "center",  
            paddingHorizontal: width * 0.05,
            paddingBottom: height * 0.2,  
          }}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={[styles.label, { color: colors.text }]}>Nome do Serviço</Text>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: colors.card, borderColor: colors.border, color: colors.text },
            ]}
            value={nome}
            onChangeText={setNome}
            placeholder="Digite o nome do serviço"
            placeholderTextColor={colors.placeholder}
          />

          <Text style={[styles.label, { color: colors.text }]}>Descrição</Text>
          <TextInput
            style={[
              styles.input,
              styles.textArea,
              { backgroundColor: colors.card, borderColor: colors.border, color: colors.text },
            ]}
            value={descricao}
            onChangeText={setDescricao}
            placeholder="Digite a descrição do serviço"
            placeholderTextColor={colors.placeholder}
            multiline
          />
        </ScrollView>


        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSave}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={[styles.buttonText, { fontSize: Math.min(width * 0.045, 16) }]}>
              Salvar
            </Text>
          )}
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  label: {
    fontSize: Math.min(width * 0.045, 16),
    fontWeight: "600",
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderRadius: width * 0.02,
    padding: width * 0.035,
    fontSize: Math.min(width * 0.042, 16),
    marginBottom: 15,
  },
  textArea: {
    minHeight: height * 0.15,
    textAlignVertical: "top",
  },
  saveButton: {
    position: "absolute",
    bottom: height * 0.08,
    left: width * 0.05,
    right: width * 0.05,
    backgroundColor: APP_BLUE,
    paddingVertical: height * 0.02,
    borderRadius: width * 0.02,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
  },
});
