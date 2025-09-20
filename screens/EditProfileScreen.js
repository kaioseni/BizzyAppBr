import { useState, useContext } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, ActivityIndicator, Dimensions, Platform } from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import Toast from "react-native-toast-message";
import { MaskedTextInput } from "react-native-mask-text";
import { ThemeContext } from "../contexts/ThemeContext";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";

const APP_BLUE = "#329de4";
const CLOUDINARY_CLOUD_NAME = "dol0wheky";
const CLOUDINARY_UPLOAD_PRESET = "colaboradores";

const { width } = Dimensions.get("window");

export default function EditProfileScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { effectiveTheme } = useContext(ThemeContext);

  const currentTheme =
    effectiveTheme === "dark"
      ? { background: "#121212", text: "#fff", placeholder: "#aaa", border: "#333" }
      : { background: "#fff", text: "#333", placeholder: "#888", border: "#ccc" };

  const estabelecimento = route.params?.estabelecimento;
  const estabelecimentoId = route.params?.id;

  const [nomeEstabelecimento, setNomeEstabelecimento] = useState(
    estabelecimento?.nomeEstabelecimento || ""
  );
  const [telefone, setTelefone] = useState(estabelecimento?.telefone || "");
  const [logradouro, setLogradouro] = useState(estabelecimento?.logradouro || "");
  const [numero, setNumero] = useState(estabelecimento?.numero || "");
  const [complemento, setComplemento] = useState(estabelecimento?.complemento || "");
  const [bairro, setBairro] = useState(estabelecimento?.bairro || "");
  const [cidade, setCidade] = useState(estabelecimento?.cidade || "");
  const [estado, setEstado] = useState(estabelecimento?.estado || "");
  const [cep, setCep] = useState(estabelecimento?.cep || "");
  const [logo, setLogo] = useState(estabelecimento?.logo || null);
  const [loading, setLoading] = useState(false);

  const showToast = (type, title, message) => {
    Toast.show({ type, text1: title, text2: message });
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) setLogo(result.assets[0].uri);
  };

  const uploadImageToCloudinary = async (logoUri) => {
    const formData = new FormData();
    formData.append("file", { uri: logoUri, type: "image/jpeg", name: "logo.jpg" });
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

    try {
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        { method: "POST", body: formData }
      );
      const data = await res.json();
      if (!data.secure_url) throw new Error(JSON.stringify(data));
      return data.secure_url;
    } catch (err) {
      console.error("Erro upload Cloudinary:", err);
      throw err;
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      let logoUrl = estabelecimento?.logo;
      if (logo && logo !== estabelecimento?.logo) {
        logoUrl = await uploadImageToCloudinary(logo);
      }

      const refDoc = doc(db, "estabelecimentos", estabelecimentoId);
      await updateDoc(refDoc, {
        nomeEstabelecimento,
        telefone,
        logradouro,
        numero,
        complemento,
        bairro,
        cidade,
        estado,
        cep,
        logo: logoUrl,
      });

      showToast("success", "Sucesso!", "Perfil atualizado com sucesso 🎉");
      navigation.goBack();
    } catch (error) {
      console.error("Erro ao salvar:", error);
      showToast("error", "Erro", "Não foi possível atualizar o perfil.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: currentTheme.background }}>
      <KeyboardAwareScrollView
        contentContainerStyle={styles.container}
        extraScrollHeight={20}
        enableOnAndroid={true}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity onPress={pickImage} style={styles.logoContainer}>
          {logo ? (
            <Image source={{ uri: logo }} style={styles.logo} />
          ) : (
            <Text style={[styles.logoPlaceholderText, { color: APP_BLUE }]}>
              Selecionar Imagem
            </Text>
          )}
        </TouchableOpacity>

        <TextInput
          style={[styles.input, { borderColor: currentTheme.border, color: currentTheme.text }]}
          placeholder="Nome do Estabelecimento"
          placeholderTextColor={currentTheme.placeholder}
          value={nomeEstabelecimento}
          onChangeText={setNomeEstabelecimento}
        />

        <MaskedTextInput
          mask="55 (99) 9 9999-9999"
          keyboardType="phone-pad"
          placeholder="Telefone"
          placeholderTextColor={currentTheme.placeholder}
          value={telefone}
          onChangeText={setTelefone}
          style={[styles.input, { borderColor: currentTheme.border, color: currentTheme.text }]}
        />

        <MaskedTextInput
          mask="99999-999"
          keyboardType="number-pad"
          placeholder="CEP"
          placeholderTextColor={currentTheme.placeholder}
          value={cep}
          onChangeText={setCep}
          style={[styles.input, { borderColor: currentTheme.border, color: currentTheme.text }]}
        />

        {["logradouro", "bairro", "cidade", "estado", "numero", "complemento"].map((field) => (
          <TextInput
            key={field}
            placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
            value={{ logradouro, bairro, cidade, estado, numero, complemento }[field]}
            onChangeText={(v) => {
              if (field === "logradouro") setLogradouro(v);
              if (field === "bairro") setBairro(v);
              if (field === "cidade") setCidade(v);
              if (field === "estado") setEstado(v);
              if (field === "numero") setNumero(v);
              if (field === "complemento") setComplemento(v);
            }}
            keyboardType={field === "numero" ? "number-pad" : "default"}
            style={[styles.input, { borderColor: currentTheme.border, color: currentTheme.text }]}
            placeholderTextColor={currentTheme.placeholder}
          />
        ))}
      </KeyboardAwareScrollView>
      <View style={{ height: 80 }} />
      <TouchableOpacity
        style={styles.floatingSaveButton}
        onPress={handleSave}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.saveButtonText}>Salvar Alterações</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 20,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  input: {
    width: "100%",
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 15,
  },
  logoContainer: {
    width: width * 0.5,
    height: width * 0.5,
    borderRadius: (width * 0.5) / 2,
    backgroundColor: "#cbcbcbff",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    overflow: "hidden",
  },
  logo: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  logoPlaceholderText: {
    textAlign: "center",
    fontWeight: "600",
  },
  floatingSaveButton: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    height: 50,
    borderRadius: 10,
    backgroundColor: APP_BLUE,
    alignItems: "center",
    justifyContent: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  saveButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});
