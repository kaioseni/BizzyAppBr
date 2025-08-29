import { useEffect, useState } from "react";
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Dimensions, ActivityIndicator, Image } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db } from "../firebase/firebaseConfig";
import Toast from "react-native-toast-message";

const { width, height } = Dimensions.get("window");
const storage = getStorage();

export default function EditCollaboratorScreen({ route, navigation }) {
  const { collaboratorId } = route.params;
  const [nome, setNome] = useState("");
  const [foto, setFoto] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchCollaborator = async () => {
      try {
        const ref = doc(db, "colaboradores", collaboratorId);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const data = snap.data();
          setNome(data.nome || "");
          setFoto(data.foto || null);
        }
      } catch (error) {
        console.error("Erro ao carregar colaborador:", error);
        Toast.show({ type: "error", text1: "Erro ao carregar colaborador" });
      } finally {
        setLoading(false);
      }
    };

    fetchCollaborator();
  }, [collaboratorId]);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
    });

    if (!result.canceled) {
      setFoto(result.assets[0].uri);
    }
  };

  const uploadImage = async (uri, path) => {
    const response = await fetch(uri);
    const blob = await response.blob();
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, blob);
    return await getDownloadURL(storageRef);
  };

  const handleSave = async () => {
    if (!nome.trim()) {
      Toast.show({ type: "error", text1: "O nome não pode ser vazio" });
      return;
    }

    setSaving(true);
    try {
      let fotoUrl = foto;

      if (foto && foto.startsWith("file:")) {
        fotoUrl = await uploadImage(
          foto,
          `colaboradores/${collaboratorId}.jpg`
        );
      }

      const ref = doc(db, "colaboradores", collaboratorId);
      await updateDoc(ref, { nome, foto: fotoUrl });

      Toast.show({ type: "success", text1: "Colaborador atualizado" });
      navigation.goBack();
    } catch (error) {
      console.error("Erro ao atualizar colaborador:", error);
      Toast.show({ type: "error", text1: "Erro ao atualizar colaborador" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#329de4" />
        <Text>Carregando colaborador...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={pickImage} style={styles.imageWrapper}>
        {foto ? (
          <Image source={{ uri: foto }} style={styles.image} />
        ) : (
          <Text style={styles.imagePlaceholder}>Selecionar foto</Text>
        )}
      </TouchableOpacity>

      <Text style={styles.label}>Nome do colaborador</Text>
      <TextInput
        value={nome}
        onChangeText={setNome}
        style={styles.input}
        placeholder="Digite o nome"
      />

      <TouchableOpacity
        style={[styles.button, saving && { opacity: 0.7 }]}
        onPress={handleSave}
        disabled={saving}
      >
        <Text style={styles.buttonText}>
          {saving ? "Salvando..." : "Salvar alterações"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: width * 0.05,
    backgroundColor: "#fff",
  },
  label: {
    fontSize: width * 0.04,
    marginBottom: 8,
    fontWeight: "500",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    fontSize: width * 0.045,
  },
  button: {
    backgroundColor: "#329de4",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: width * 0.045,
    fontWeight: "600",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  imageWrapper: {
    alignSelf: "center",
    marginBottom: 20,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#e0f0ff",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  imagePlaceholder: {
    color: "#329de4",
    fontSize: 14,
  },
});
