import { useContext, useState, useEffect } from "react";
import { Eye, EyeOff } from "lucide-react-native";
import { TextInput, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Dimensions, TouchableOpacity, Image, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Picker } from "@react-native-picker/picker";
import Toast from "react-native-toast-message";
import { MaskedTextInput } from "react-native-mask-text";
import { AuthContext } from "../contexts/AuthContext";
import { ThemeContext } from "../contexts/ThemeContext";
import { lightTheme, darkTheme } from "../utils/themes";
import { db } from "../firebase/firebaseConfig";
import { collection, getDocs } from "firebase/firestore";
import { buscarEnderecoPorCEP } from "../services/cep";

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
    cep: "",
    logradouro: "",
    bairro: "",
    cidade: "",
    estado: "",
    numero: "",
    complemento: "",
  });
  const [loadingRegister, setLoadingRegister] = useState(false);

  const [showPassword, setShowPassword] = useState(false);

  const handleEnderecoChange = (field, value) =>
    setEndereco((prev) => ({ ...prev, [field]: value }));

  const showToast = (type, title, message) => {
    Toast.show({ type, text1: title, text2: message });
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
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
    return true;
  };

  const handleRegister = async () => {
    if (!validateFields()) return;

    setLoadingRegister(true);
    try {
      await register(email, password, {
        nomeEstabelecimento,
        telefone,
        logo,
        ramoAtividade,
        ...endereco,
      });
      showToast("success", "Sucesso!", "Usuário criado com sucesso 🎉");
      await promptEnableBiometrics();
      navigation.navigate("MainTabs", { screen: "Home" });
    } catch (error) {
      let message = "Ocorreu um erro no cadastro.";
      switch (error.code) {
        case "auth/email-already-in-use":
          message = "Este e-mail já está em uso.";
          break;
        case "auth/invalid-email":
          message = "E-mail inválido.";
          break;
        case "auth/password-does-not-meet-requirements":
          message = "A senha não atende os critérios mínimos.";
          break;
        default:
          message = error.message;
      }
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
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: currentTheme.background }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 60 : 0}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
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

        <View
          style={[
            styles.pickerContainer,
            { borderColor: currentTheme.primary, backgroundColor: currentTheme.background },
          ]}
        >
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
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            style={[styles.inputPassword, { color: currentTheme.text }]}
            placeholderTextColor={currentTheme.text + "99"}
          />
          <TouchableOpacity onPress={() => setShowPassword((prev) => !prev)}>
            {showPassword ? (
              <Eye size={20} color="#3498db" /> 
            ) : (
              <EyeOff size={20} color="#3498db" /> 
            )}
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.botao, { backgroundColor: loadingRegister ? "#7fbdea" : currentTheme.primary }]}
          onPress={handleRegister}
          activeOpacity={0.8}
          disabled={loadingRegister}
        >
          <Text style={styles.textoBotao}>
            {loadingRegister ? "Cadastrando..." : "Cadastrar"}
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
    alignItems: "center",
    paddingVertical: height * 0.08,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 15,
    width: width * 0.9,
  },
  botao: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    width: width * 0.9,
    marginTop: 10,
  },
  textoBotao: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  imageContainer: {
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
  imagePlaceholder: {
    textAlign: "center",
  },
  pickerContainer: {
    width: width * 0.9,
    height: 60,
    borderWidth: 1,
    borderRadius: 8,
    justifyContent: "center",
    marginBottom: 15,
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 50,
    width: width * 0.9,
    marginBottom: 15,
  },
  inputPassword: {
    flex: 1,
    fontSize: 16,
  },

});
