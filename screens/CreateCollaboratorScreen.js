import { useState, useContext, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, Image, StyleSheet, FlatList, ActivityIndicator } from "react-native";
import * as ImagePicker from "expo-image-picker";
import Toast from "react-native-toast-message";
import { AuthContext } from "../contexts/AuthContext";
import { createCollaborator } from "../services/collaborators";
import { fetchServicosRamoRealtime, fetchServicosImportadosRealtime, fetchServicosPersonalizadosRealtime, fetchRamoUsuario } from "../services/servicesService";
import { db } from "../firebase/firebaseConfig";
import { collection, onSnapshot, getDocs } from "firebase/firestore";
import { Download, Edit3, Layers, User as UserIcon, CheckSquare, Square } from "lucide-react-native";

export default function CreateCollaboratorScreen({ navigation }) {
  const { user } = useContext(AuthContext);

  const [nome, setNome] = useState("");
  const [foto, setFoto] = useState(null);

  const [ramoUsuario, setRamoUsuario] = useState(null);
  const [servicos, setServicos] = useState([]);
  const [loadingServicos, setLoadingServicos] = useState(true);

  const [preferencias, setPreferencias] = useState(new Set());

  useEffect(() => {
    if (!user?.uid) return;
    (async () => {
      const ramo = await fetchRamoUsuario(user.uid);
      setRamoUsuario(ramo);
    })();
  }, [user?.uid]);

  useEffect(() => {
    if (!user?.uid || !ramoUsuario) return;

    setLoadingServicos(true);
    const unsubscribes = [];

    const servicosPadraoTemp = [];
    const servicosImportadosTemp = [];
    const servicosPersonalizadosTemp = [];
    const servicosCriadosTemp = [];

    const mergeAllServicos = () => {
      setServicos([
        ...servicosPersonalizadosTemp.map((s) => ({
          ...s,
          tipo: "personalizado",
        })),
        ...servicosImportadosTemp.map((s) => ({ ...s, tipo: "importado" })),
        ...servicosCriadosTemp.map((s) => ({ ...s, tipo: "criado" })),
        ...servicosPadraoTemp.map((s) => ({ ...s, tipo: "padrao" })),
      ]);
      setLoadingServicos(false);
    };

    const unsubPadrao = fetchServicosRamoRealtime(ramoUsuario, async (padrao) => {
      const ocultosSnap = await getDocs(
        collection(db, "users", user.uid, "servicosOcultos")
      );
      const ocultosIds = new Set(ocultosSnap.docs.map((d) => d.id));

      servicosPadraoTemp.length = 0;
      servicosPadraoTemp.push(...padrao.filter((s) => !ocultosIds.has(s.id)));

      mergeAllServicos();
    });
    unsubscribes.push(unsubPadrao);

    const unsubPersonalizados = fetchServicosPersonalizadosRealtime(
      user.uid,
      (personalizados) => {
        servicosPersonalizadosTemp.length = 0;
        servicosPersonalizadosTemp.push(...personalizados);
        mergeAllServicos();
      }
    );
    unsubscribes.push(unsubPersonalizados);

    const unsubImportados = fetchServicosImportadosRealtime(
      user.uid,
      (importados) => {
        servicosImportadosTemp.length = 0;
        servicosImportadosTemp.push(...importados);
        mergeAllServicos();
      }
    );
    unsubscribes.push(unsubImportados);

    const unsubCriados = onSnapshot(
      collection(db, "users", user.uid, "servicosCriados"),
      (snapshot) => {
        servicosCriadosTemp.length = 0;
        servicosCriadosTemp.push(
          ...snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
        );
        mergeAllServicos();
      }
    );
    unsubscribes.push(unsubCriados);

    return () => unsubscribes.forEach((fn) => fn && fn());
  }, [user?.uid, ramoUsuario]);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
    });
    if (!result.canceled) setFoto(result.assets[0].uri);
  };

  const togglePreferencia = (id) => {
    const nova = new Set(preferencias);
    if (nova.has(id)) nova.delete(id);
    else nova.add(id);
    setPreferencias(nova);
  };

  const handleSave = async () => {
  if (!nome.trim()) {
    Toast.show({ type: "error", text1: "O nome é obrigatório" });
    return;
  }

  try {
    const preferenciasSelecionadas = servicos
      .filter((s) => preferencias.has(s.id))
      .map((s) => ({
        id: s.id,
        nome: s.nome,
        tipo: s.tipo,
      }));

    await createCollaborator({
      nome,
      fotoUri: foto ?? null,
      idEstabelecimento: user.uid,
      preferenciasSelecionadas,
    });

    Toast.show({
      type: "success",
      text1: "Colaborador cadastrado com sucesso!",
    });

    setNome("");
    setFoto(null);
    setPreferencias(new Set());
    navigation.goBack();
  } catch (error) {
    Toast.show({
      type: "error",
      text1: "Erro ao salvar",
      text2: error.message,
    });
    console.log(error.message);
  }
};

  const renderServico = ({ item }) => {
    const selected = preferencias.has(item.id);
    return (
      <TouchableOpacity
        style={[styles.servicoItem, selected && styles.servicoItemSelected]}
        onPress={() => togglePreferencia(item.id)}
        activeOpacity={0.8}
      >
        <View style={{ flex: 1 }}>
          <Text style={styles.servicoNome} numberOfLines={1}>
            {item.nome}
          </Text>
          {item.descricao ? (
            <Text style={styles.servicoDescricao} numberOfLines={2}>
              {item.descricao}
            </Text>
          ) : null}

          <View style={styles.labelContainer}>
            {item.tipo === "padrao" && (
              <View style={[styles.label, { backgroundColor: "#3498db" }]}>
                <Layers size={14} color="#fff" style={{ marginRight: 4 }} />
                <Text style={styles.labelText}>Padrão</Text>
              </View>
            )}
            {item.tipo === "importado" && (
              <View style={[styles.label, { backgroundColor: "#27ae60" }]}>
                <Download size={14} color="#fff" style={{ marginRight: 4 }} />
                <Text style={styles.labelText}>Importado</Text>
              </View>
            )}
            {item.tipo === "personalizado" && (
              <View style={[styles.label, { backgroundColor: "#e67e22" }]}>
                <Edit3 size={14} color="#fff" style={{ marginRight: 4 }} />
                <Text style={styles.labelText}>Personalizado</Text>
              </View>
            )}
            {item.tipo === "criado" && (
              <View style={[styles.label, { backgroundColor: "#8e44ad" }]}>
                <UserIcon size={14} color="#fff" style={{ marginRight: 4 }} />
                <Text style={styles.labelText}>Criado</Text>
              </View>
            )}
          </View>
        </View>

        <View style={{ marginLeft: 12 }}>
          {selected ? (
            <CheckSquare size={24} color="#329de4" />
          ) : (
            <Square size={24} color="#999" />
          )}
        </View>
      </TouchableOpacity>
    );
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

      <Text style={styles.subtitle}>Preferências de Serviços</Text>

      {loadingServicos ? (
        <ActivityIndicator size="large" color="#329de4" style={{ marginTop: 12 }} />
      ) : servicos.length === 0 ? (
        <Text style={{ color: "#777", marginBottom: 8 }}>
          Nenhum serviço disponível.
        </Text>
      ) : (
        <FlatList
          data={servicos}
          keyExtractor={(item, index) => `${item.id}-${item.tipo}-${index}`}
          renderItem={renderServico}
          contentContainerStyle={{ paddingBottom: 16 }}
        />
      )}

      <TouchableOpacity style={styles.button} onPress={handleSave}>
        <Text style={styles.buttonText}>Salvar</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fff" },
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
  image: { width: "100%", height: "100%", borderRadius: 8 },
  subtitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 10,
    color: "#329de4",
  },
  servicoItem: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    backgroundColor: "#f9f9f9",
  },
  servicoItemSelected: {
    borderColor: "#329de4",
    backgroundColor: "#e9f5ff",
  },
  servicoNome: { fontSize: 15, fontWeight: "600", color: "#333" },
  servicoDescricao: { fontSize: 13, color: "#555", marginTop: 2 },
  labelContainer: { flexDirection: "row", marginTop: 6 },
  label: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginRight: 6,
  },
  labelText: { color: "#fff", fontSize: 12, fontWeight: "600" },
  button: {
    backgroundColor: "#329de4",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});
