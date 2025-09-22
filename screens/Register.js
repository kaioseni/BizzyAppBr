import { useContext, useState, useEffect } from "react";
import { Eye, EyeOff } from "lucide-react-native";
import {
  TextInput, Text, StyleSheet, ScrollView, KeyboardAvoidingView,
  Platform, Dimensions, TouchableOpacity, Image, View
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Picker } from "@react-native-picker/picker";
import Toast from "react-native-toast-message";
import { MaskedTextInput } from "react-native-mask-text";
import { SafeAreaView } from "react-native-safe-area-context";

import { AuthContext } from "../contexts/AuthContext";
import { ThemeContext } from "../contexts/ThemeContext";
import { lightTheme, darkTheme } from "../utils/themes";
import { db } from "../firebase/firebaseConfig";
import { collection, getDocs } from "firebase/firestore";
import { buscarEnderecoPorCEP } from "../services/cep";

const CLOUDINARY_CLOUD_NAME = "dol0wheky";
const CLOUDINARY_UPLOAD_PRESET = "colaboradores";

const { width, height } = Dimensions.get("window");

export default function Register({ navigation }) {
  const { register, promptEnableBiometrics } = useContext(AuthContext);
  const { effectiveTheme } = useContext(ThemeContext);
  const currentTheme = effectiveTheme === "light" ? lightTheme : darkTheme;

  const [logo, setLogo] = useState(null);
  const [nomeEstabelecimento, setNomeEstabelecimento] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [ramoAtividade, setRamoAtividade] = useState("");
  const [opcoesRamo, setOpcoesRamo] = useState([]);
  const [endereco, setEndereco] = useState({
    cep: "", logradouro: "", bairro: "", cidade: "", estado: "", numero: "", complemento: "",
  });
  const [loadingRegister, setLoadingRegister] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

   
  const [senhaStatus, setSenhaStatus] = useState({
    minLength: false,
    hasUpperCase: false,
    hasLowerCase: false,
    hasNumber: false,
    hasSpecialChar: false,
  }); 

  const [senhaFocused, setSenhaFocused] = useState(false);

  const senhaRegras = {
    minLength: (senha) => senha.length >= 8,
    hasUpperCase: (senha) => /[A-Z]/.test(senha),
    hasLowerCase: (senha) => /[a-z]/.test(senha),
    hasNumber: (senha) => /\d/.test(senha),
    hasSpecialChar: (senha) => /[!@#$%^&*(),.?":{}|<>]/.test(senha),
  };

  const handleEnderecoChange = (field, value) =>
    setEndereco((prev) => ({ ...prev, [field]: value }));

  const showToast = (type, title, message) => {
    Toast.show({ type, text1: title, text2: message });
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
    });
    if (!result.canceled) setLogo(result.assets[0].uri);
  };

  const handleBuscarCEP = async () => {
    const { cep } = endereco;
    if (cep.replace(/\D/g, "").length < 8) {
      return showToast("error", "CEP inválido", "Digite um CEP válido!");
    }
    try {
      const data = await buscarEnderecoPorCEP(cep);
      setEndereco((prev) => ({
        ...prev,
        logradouro: data.logradouro,
        bairro: data.bairro,
        cidade: data.cidade,
        estado: data.estado,
      }));
    } catch (error) {
      showToast("error", "Erro ao buscar CEP", error.message);
    }
  };

  const validateFields = () => {
    if (!nomeEstabelecimento || !telefone || !email || !password) {
      showToast("error", "Campos obrigatórios", "Preencha todos os campos");
      return false;
    }
    if (!ramoAtividade) {
      showToast("error", "Ramo de atividade", "Selecione uma opção");
      return false;
    }
    const todasRegrasOk = Object.values(senhaStatus).every((v) => v === true);
    if (!todasRegrasOk) {
      showToast("error", "Senha fraca", "Sua senha não atende a todos os requisitos.");
      return false;
    }
    return true;
  };

  const uploadImageToCloudinary = async (logoUri) => {
    const formData = new FormData();
    formData.append("file", { uri: logoUri, type: "image/jpeg", name: "logo.jpg" });
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

    const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
      method: "POST",
      body: formData,
    });
    const data = await res.json();
    if (!data.secure_url) throw new Error(JSON.stringify(data));
    return data.secure_url;
  };

  const handlePasswordChange = (senha) => {
    setPassword(senha);
    setSenhaStatus({
      minLength: senhaRegras.minLength(senha),
      hasUpperCase: senhaRegras.hasUpperCase(senha),
      hasLowerCase: senhaRegras.hasLowerCase(senha),
      hasNumber: senhaRegras.hasNumber(senha),
      hasSpecialChar: senhaRegras.hasSpecialChar(senha),
    });
  };

  const handleRegister = async () => {
    if (!validateFields()) return;
    setLoadingRegister(true);

    try {
      await register(
        email,
        password,
        { nomeEstabelecimento, telefone, logo, ramoAtividade, ...endereco },
        uploadImageToCloudinary
      );

      showToast("success", "Sucesso!", "Usuário criado com sucesso 🎉");
      await promptEnableBiometrics();
      navigation.navigate("MainTabs", { screen: "Home" });
    } catch (error) {
      const message = error.message || "Erro no cadastro.";
      showToast("error", "Erro no cadastro", message);
    } finally {
      setLoadingRegister(false);
    }
  };

  useEffect(() => {
    const fetchRamos = async () => {
      try {
        const snapshot = await getDocs(collection(db, "ramosDeAtividade"));
        const lista = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setOpcoesRamo(lista);
      } catch (err) {
        console.error("Erro ao carregar ramos:", err);
        showToast("error", "Erro", "Não foi possível carregar os ramos de atividade");
      }
    };
    fetchRamos();
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: currentTheme.background }} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? height * 0.08 : 0}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity onPress={pickImage} style={styles.imageContainer}>
            {logo ? (
              <Image source={{ uri: logo }} style={styles.logo} />
            ) : (
              <Text style={[styles.imagePlaceholder, { color: currentTheme.text }]}>
                Selecionar logotipo
              </Text>
            )}
          </TouchableOpacity>

          <TextInput
            placeholder="Nome do Estabelecimento"
            value={nomeEstabelecimento}
            onChangeText={setNomeEstabelecimento}
            style={[styles.input, { color: currentTheme.text, borderColor: currentTheme.primary }]}
            placeholderTextColor={currentTheme.text + "99"}
          />

          <MaskedTextInput
            mask="55 (99) 9 9999-9999"
            keyboardType="phone-pad"
            placeholder="Telefone"
            value={telefone}
            onChangeText={setTelefone}
            style={[styles.input, { color: currentTheme.text, borderColor: currentTheme.primary }]}
            placeholderTextColor={currentTheme.text + "99"}
          />

          <View style={[styles.pickerContainer, { borderColor: currentTheme.primary }]}>
            <Picker
              selectedValue={ramoAtividade}
              onValueChange={setRamoAtividade}
              style={{ width: "100%", height: "100%", color: currentTheme.text }}
              dropdownIconColor={currentTheme.text}
            >
              <Picker.Item label="Selecione o ramo de atividade" value="" enabled={false} />
              {opcoesRamo.map((ramo) => (
                <Picker.Item key={ramo.id} label={ramo.Nome} value={ramo.id} />
              ))}
            </Picker>
          </View>

          <MaskedTextInput
            mask="99999-999"
            keyboardType="number-pad"
            placeholder="CEP"
            value={endereco.cep}
            onChangeText={(v) => handleEnderecoChange("cep", v)}
            onEndEditing={handleBuscarCEP}
            style={[styles.input, { color: currentTheme.text, borderColor: currentTheme.primary }]}
            placeholderTextColor={currentTheme.text + "99"}
          />

          {["logradouro", "bairro", "cidade", "estado", "numero", "complemento"].map((field) => (
            <TextInput
              key={field}
              placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
              value={endereco[field]}
              onChangeText={(v) => handleEnderecoChange(field, v)}
              keyboardType={field === "numero" ? "number-pad" : "default"}
              style={[styles.input, { color: currentTheme.text, borderColor: currentTheme.primary }]}
              placeholderTextColor={currentTheme.text + "99"}
            />
          ))}

          <TextInput
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            style={[styles.input, { color: currentTheme.text, borderColor: currentTheme.primary }]}
            placeholderTextColor={currentTheme.text + "99"}
          />
 
          <View style={[styles.passwordContainer, { borderColor: currentTheme.primary }]}>
            <TextInput
              placeholder="Senha"
              value={password}
              onChangeText={handlePasswordChange}
              secureTextEntry={!showPassword}
              style={[styles.inputPassword, { color: currentTheme.text }]}
              placeholderTextColor={currentTheme.text + "99"}
              onFocus={() => setSenhaFocused(true)}
              onBlur={() => setSenhaFocused(false)}
            />
            <TouchableOpacity onPress={() => setShowPassword((prev) => !prev)}>
              {showPassword ? (
                <Eye size={width * 0.05} color={currentTheme.primary} />
              ) : (
                <EyeOff size={width * 0.05} color={currentTheme.primary} />
              )}
            </TouchableOpacity>
          </View>
 
          {senhaFocused && (
            <View style={{ width: width * 0.9, marginBottom: height * 0.02 }}>
              {Object.entries(senhaStatus).map(([key, valid]) => {
                let label;
                switch (key) {
                  case "minLength": label = "Mínimo 8 caracteres"; break;
                  case "hasUpperCase": label = "Uma letra maiúscula"; break;
                  case "hasLowerCase": label = "Uma letra minúscula"; break;
                  case "hasNumber": label = "Um número"; break;
                  case "hasSpecialChar": label = "Um caractere especial"; break;
                }
                return (
                  <Text
                    key={key}
                    style={{ color: valid ? "green" : "red", fontSize: Math.min(width * 0.035, 14) }}
                  >
                    {valid ? "✔" : "✖"} {label}
                  </Text>
                );
              })}
            </View>
          )}

          <TouchableOpacity
            style={[styles.botao, { backgroundColor: loadingRegister ? "#7fbdea" : currentTheme.primary }]}
            onPress={handleRegister}
            activeOpacity={0.8}
            disabled={loadingRegister}
          >
            <Text style={[styles.textoBotao, { fontSize: Math.min(width * 0.045, 18) }]}>
              {loadingRegister ? "Cadastrando..." : "Cadastrar"}
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
    alignItems: "center",
    paddingVertical: height * 0.06,
    paddingHorizontal: width * 0.05,
  },
  input: {
    height: height * 0.065,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: width * 0.04,
    marginBottom: height * 0.02,
    width: width * 0.9,
    fontSize: Math.min(width * 0.042, 16),
  },
  botao: {
    paddingVertical: height * 0.02,
    borderRadius: 8,
    alignItems: "center",
    width: width * 0.9,
    marginTop: height * 0.015,
  },
  textoBotao: {
    color: "#fff",
    fontWeight: "bold",
  },
  imageContainer: {
    width: width * 0.45,
    height: width * 0.45,
    borderRadius: (width * 0.45) / 2,
    backgroundColor: "#cbcbcbff",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: height * 0.03,
    overflow: "hidden",
  },
  logo: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  imagePlaceholder: {
    textAlign: "center",
    fontSize: Math.min(width * 0.04, 16),
  },
  pickerContainer: {
    width: width * 0.9,
    height: height * 0.065,
    borderWidth: 1,
    borderRadius: 8,
    justifyContent: "center",
    marginBottom: height * 0.02,
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: width * 0.04,
    height: height * 0.065,
    width: width * 0.9,
    marginBottom: height * 0.02,
  },
  inputPassword: {
    flex: 1,
    fontSize: Math.min(width * 0.042, 16),
  },
});
