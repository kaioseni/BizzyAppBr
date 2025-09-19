import { useState, useContext } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Dimensions } from "react-native";
import { AuthContext } from "../contexts/AuthContext";
import { ThemeContext } from "../contexts/ThemeContext";
import Toast from "react-native-toast-message";
import { updateServico } from "../services/servicesService";

const { width } = Dimensions.get("window");

export default function EditServiceScreen({ route, navigation }) {
  const { servico } = route.params;
  const { user } = useContext(AuthContext);
  const { effectiveTheme } = useContext(ThemeContext);  

  const colors = effectiveTheme === "dark"
    ? { background: "#121212", text: "#f5f5f5", card: "#1e1e1e", border: "#444" }
    : { background: "#fff", text: "#333", card: "#f9f9f9", border: "#ccc" };

  const [nome, setNome] = useState(servico?.nome || "");
  const [descricao, setDescricao] = useState(servico?.descricao || "");

  const handleSave = async () => {
    if (!servico?.id) return;

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
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.label, { color: colors.text }]}>Nome do Serviço</Text>
      <TextInput
        style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
        value={nome}
        onChangeText={setNome}
        placeholder="Digite o nome do serviço"
        placeholderTextColor={colors.text + "88"}  
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
        placeholderTextColor={colors.text + "88"} 
        multiline
        numberOfLines={4}
      />

      <TouchableOpacity style={[styles.button, { backgroundColor: "#329de4" }]} onPress={handleSave}>
        <Text style={styles.buttonText}>Salvar</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: width * 0.05,
    justifyContent: "center",
  },
  label: {
    fontSize: width * 0.04,
    fontWeight: "600",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: width * 0.04,
    marginBottom: 15,
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  button: {
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: {
    color: "#fff",
    fontSize: width * 0.045,
    fontWeight: "600",
  },
});
