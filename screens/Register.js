import { useContext, useState } from "react";
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  TouchableOpacity,
  Image,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { MaskedTextInput } from "react-native-mask-text";
import { AuthContext } from "../contexts/AuthContext";
import { buscarEnderecoPorCEP } from "../services/cep";

const { width } = Dimensions.get("window");

export default function Register() {
  const { register } = useContext(AuthContext);

  const [logo, setLogo] = useState(null);
  const [nomeEstabelecimento, setNomeEstabelecimento] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [cep, setCEP] = useState("");
  const [logradouro, setLogradouro] = useState("");
  const [bairro, setBairro] = useState("");
  const [cidade, setCidade] = useState("");
  const [estado, setEstado] = useState("");
  const [numero, setNumero] = useState("");
  const [complemento, setComplemento] = useState("");


  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled) {
      setLogo(result.assets[0].uri);
    }
  };

  const handleBuscarCEP = async () => {
    if (cep.replace(/\D/g, "").length < 8) {
      alert("Digite um CEP válido!");
      return;
    }

    try {
      const endereco = await buscarEnderecoPorCEP(cep);
      setLogradouro(endereco.logradouro);
      setBairro(endereco.bairro);
      setCidade(endereco.cidade);
      setEstado(endereco.estado);
    } catch (error) {
      alert(error.message);
    }
  };

  const handleRegister = async () => {
    try {
      await register(email, password, {
        nomeEstabelecimento,
        telefone,
        logo,
        cep,
        logradouro,
        bairro,
        cidade,
        estado,
        numero,
        complemento,
      });
      alert("Usuário criado com sucesso!");
    } catch (error) {
      alert("Erro: " + error.message);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 60 : 0}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <TouchableOpacity onPress={pickImage} style={styles.imageContainer}>
          {logo ? (
            <Image source={{ uri: logo }} style={styles.logo} />
          ) : (
            <Text style={styles.imagePlaceholder}>Selecionar logotipo</Text>
          )}
        </TouchableOpacity>

        <TextInput
          placeholder="Nome do Estabelecimento"
          value={nomeEstabelecimento}
          onChangeText={setNomeEstabelecimento}
          style={[styles.input, { width: width * 0.9 }]}
        />

        <MaskedTextInput
          mask="55 (99) 9 9999-9999"
          keyboardType="phone-pad"
          placeholder="Telefone"
          value={telefone}
          onChangeText={setTelefone}
          style={[styles.input, { width: width * 0.9 }]}
        />

        <TextInput
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          style={[styles.input, { width: width * 0.9 }]}
        />

        <TextInput
          placeholder="Senha"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={[styles.input, { width: width * 0.9 }]}
        />

        <MaskedTextInput
          mask="99999-999"
          keyboardType="number-pad"
          placeholder="CEP"
          value={cep}
          onChangeText={setCEP}
          onEndEditing={handleBuscarCEP}
          style={[styles.input, { width: width * 0.9 }]}
        />

        <TextInput
          placeholder="Logradouro"
          value={logradouro}
          onChangeText={setLogradouro}
          style={[styles.input, { width: width * 0.9 }]}
        />
        <TextInput
          placeholder="Bairro"
          value={bairro}
          onChangeText={setBairro}
          style={[styles.input, { width: width * 0.9 }]}
        />
        <TextInput
          placeholder="Cidade"
          value={cidade}
          onChangeText={setCidade}
          style={[styles.input, { width: width * 0.9 }]}
        />
        <TextInput
          placeholder="Estado"
          value={estado}
          onChangeText={setEstado}
          style={[styles.input, { width: width * 0.9 }]}
        />
        <TextInput
          placeholder="Número"
          value={numero}
          onChangeText={setNumero}
          keyboardType="number-pad"
          style={[styles.input, { width: width * 0.9 }]}
        />
        <TextInput
          placeholder="Complemento"
          value={complemento}
          onChangeText={setComplemento}
          style={[styles.input, { width: width * 0.9 }]}
        />

        <TouchableOpacity style={styles.botao} onPress={handleRegister}>
          <Text style={styles.textoBotao}>Cadastrar</Text>
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
    paddingVertical: 30,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 15,
  },
  botao: {
    backgroundColor: '#329de4ff',
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
    color: "#999",
    textAlign: "center",
  },
});
