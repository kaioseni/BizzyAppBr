import { useState, useContext } from "react";
import { View, Text, TextInput, TouchableOpacity, Image, StyleSheet } from "react-native";
import * as ImagePicker from "expo-image-picker";
import Toast from "react-native-toast-message";
import { AuthContext } from "../contexts/AuthContext";
import { createCollaborator } from "../services/collaborators";

export default function CreateCollaboratorScreen({ navigation }) {
  const [nome, setNome] = useState("");
  const [foto, setFoto] = useState(null);
  const { user } = useContext(AuthContext);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
    });

    if (!result.canceled) {
      setFoto(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (!nome.trim()) {
      Toast.show({ type: "error", text1: "O nome é obrigatório" });
      return;
    }

    try {
      await createCollaborator({
        nome,
        fotoUri: foto,
        idEstabelecimento: user.uid,
      });

      Toast.show({ type: "success", text1: "Colaborador cadastrado com sucesso!" });
      setNome("");
      setFoto(null);

      navigation.goBack();
    } catch (error) {
      Toast.show({ type: "error", text1: "Erro ao salvar", text2: error.message });
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Novo Colaborador</Text>

      <TextInput
        style={styles.input}
        placeholder="Nome do colaborador"
        value={nome}
        onChangeText={setNome}
      />

      <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
        {foto ? (
          <Image source={{ uri: foto }} style={styles.image} />
        ) : (
          <Text style={{ color: "#777" }}>Selecionar Foto (opcional)</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={handleSave}>
        <Text style={styles.buttonText}>Salvar</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
    color: "#329de4",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    fontSize: 16,
  },
  imagePicker: {
    height: 120,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    marginBottom: 20,
    backgroundColor: "#f9f9f9",
  },
  image: {
    width: "100%",
    height: "100%",
    borderRadius: 8,
  },
  button: {
    backgroundColor: "#329de4",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});
