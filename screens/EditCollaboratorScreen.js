import { useEffect, useState, useContext } from "react";
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Dimensions, ActivityIndicator, Image, FlatList } from "react-native";
import * as ImagePicker from "expo-image-picker";
import Toast from "react-native-toast-message";
import { doc, getDoc, updateDoc, collection, getDocs, onSnapshot } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";
import { fetchServicosRamoRealtime, fetchServicosImportadosRealtime, fetchServicosPersonalizadosRealtime, fetchRamoUsuario } from "../services/servicesService";
import { CheckSquare, Square, Layers, Download, Edit3, User as UserIcon } from "lucide-react-native";
import { ThemeContext } from "../contexts/ThemeContext";

const CLOUDINARY_CLOUD_NAME = "dol0wheky";
const CLOUDINARY_UPLOAD_PRESET = "colaboradores";

const { width } = Dimensions.get("window");

export default function EditCollaboratorScreen({ route, navigation }) {
  const { collaboratorId } = route.params;
  const { effectiveTheme } = useContext(ThemeContext);  

  const colors = effectiveTheme === "dark"
    ? { background: "#121212", text: "#f5f5f5", card: "#1e1e1e", border: "#444" }
    : { background: "#fff", text: "#333", card: "#f9f9f9", border: "#ddd" };

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [nome, setNome] = useState("");
  const [foto, setFoto] = useState(null);
  const [idEstabelecimento, setIdEstabelecimento] = useState(null);
  const [ramoUsuario, setRamoUsuario] = useState(null);
  const [servicos, setServicos] = useState([]);
  const [preferencias, setPreferencias] = useState(new Set());

  useEffect(() => {
    const fetchCollaborator = async () => {
      try {
        const snap = await getDoc(doc(db, "colaboradores", collaboratorId));
        if (!snap.exists()) throw new Error("Colaborador não encontrado");
        const data = snap.data();

        setNome(data.nome || "");
        setFoto(data.foto || null);
        setPreferencias(new Set((data.preferenciasServicos || []).map(s => s.id)));

        if (!data.idEstabelecimento) throw new Error("ID do estabelecimento não encontrado");
        setIdEstabelecimento(data.idEstabelecimento);

        const ramo = await fetchRamoUsuario(data.idEstabelecimento);
        setRamoUsuario(ramo);
      } catch (error) {
        console.error(error);
        Toast.show({ type: "error", text1: "Erro ao carregar colaborador" });
        setLoading(false);
      }
    };

    fetchCollaborator();
  }, [collaboratorId]);

  useEffect(() => {
    if (!ramoUsuario || !idEstabelecimento) return;

    setServicos([]);
    const unsubscribes = [];

    const servicosPadraoTemp = [];
    const servicosImportadosTemp = [];
    const servicosPersonalizadosTemp = [];
    const servicosCriadosTemp = [];

    const mergeAllServicos = () => {
      const merged = [
        ...servicosPersonalizadosTemp.map(s => ({ ...s, tipo: "personalizado" })),
        ...servicosImportadosTemp.map(s => ({ ...s, tipo: "importado" })),
        ...servicosCriadosTemp.map(s => ({ ...s, tipo: "criado" })),
        ...servicosPadraoTemp.map(s => ({ ...s, tipo: "padrao" })),
      ];

      const unique = [];
      const seen = new Set();
      merged.forEach(s => {
        const key = `${s.id}-${s.tipo}`;
        if (!seen.has(key)) {
          seen.add(key);
          unique.push(s);
        }
      });

      setServicos(unique);
      setLoading(false);
    };

    const unsubPadrao = fetchServicosRamoRealtime(ramoUsuario, async padrao => {
      const ocultosSnap = await getDocs(collection(db, "users", idEstabelecimento, "servicosOcultos"));
      const ocultosIds = new Set(ocultosSnap.docs.map(d => d.id));
      servicosPadraoTemp.length = 0;
      servicosPadraoTemp.push(...padrao.filter(s => !ocultosIds.has(s.id)));
      mergeAllServicos();
    });
    unsubscribes.push(unsubPadrao);

    const unsubPersonalizados = fetchServicosPersonalizadosRealtime(idEstabelecimento, personalizados => {
      servicosPersonalizadosTemp.length = 0;
      servicosPersonalizadosTemp.push(...personalizados);
      mergeAllServicos();
    });
    unsubscribes.push(unsubPersonalizados);

    const unsubImportados = fetchServicosImportadosRealtime(idEstabelecimento, importados => {
      servicosImportadosTemp.length = 0;
      servicosImportadosTemp.push(...importados);
      mergeAllServicos();
    });
    unsubscribes.push(unsubImportados);

    const unsubCriados = onSnapshot(collection(db, "users", idEstabelecimento, "servicosCriados"), snapshot => {
      servicosCriadosTemp.length = 0;
      servicosCriadosTemp.push(...snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      mergeAllServicos();
    });
    unsubscribes.push(unsubCriados);

    return () => unsubscribes.forEach(fn => fn && fn());
  }, [ramoUsuario, idEstabelecimento]);

  const togglePreferencia = id => {
    const nova = new Set(preferencias);
    if (nova.has(id)) nova.delete(id);
    else nova.add(id);
    setPreferencias(nova);
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
    });
    if (!result.canceled) setFoto(result.assets[0].uri);
  };

  const uploadImageToCloudinary = async (fotoUri) => {
    const formData = new FormData();
    formData.append("file", { uri: fotoUri, type: "image/jpeg", name: "foto.jpg" });
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

    const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
      method: "POST",
      body: formData,
    });
    const data = await res.json();
    return data.secure_url;
  };

  const handleSave = async () => {
    if (!nome.trim()) {
      Toast.show({ type: "error", text1: "O nome não pode ser vazio" });
      return;
    }

    setSaving(true);

    try {
      let fotoUrl = foto;
      if (foto && typeof foto === "string" && foto.startsWith("file:")) {
        fotoUrl = await uploadImageToCloudinary(foto);
      }

      const preferenciasSelecionadas = servicos
        .filter(s => preferencias.has(s.id))
        .map(s => ({ id: s.id, nome: s.nome, tipo: s.tipo }));

      await updateDoc(doc(db, "colaboradores", collaboratorId), {
        nome,
        foto: fotoUrl || null,
        preferenciasServicos: preferenciasSelecionadas,
      });

      Toast.show({ type: "success", text1: "Colaborador atualizado" });
      navigation.goBack();
    } catch (error) {
      console.error(error);
      Toast.show({ type: "error", text1: "Erro ao atualizar colaborador", text2: error.message });
    } finally {
      setSaving(false);
    }
  };

  const renderServico = ({ item }) => {
    const selected = preferencias.has(item.id);
    return (
      <TouchableOpacity
        style={[
          styles.servicoItem,
          { backgroundColor: colors.card, borderColor: colors.border },
          selected && { borderColor: "#329de4", backgroundColor: effectiveTheme === "dark" ? "#1a2a3a" : "#e9f5ff" }
        ]}
        onPress={() => togglePreferencia(item.id)}
      >
        <View style={{ flex: 1 }}>
          <Text style={[styles.servicoNome, { color: colors.text }]}>{item.nome}</Text>
          {item.descricao && <Text style={[styles.servicoDescricao, { color: colors.text }]}>{item.descricao}</Text>}

          <View style={styles.labelContainer}>
            {item.tipo === "padrao" && <View style={[styles.label, { backgroundColor: "#3498db" }]}><Layers size={14} color="#fff" /><Text style={styles.labelText}>Padrão</Text></View>}
            {item.tipo === "importado" && <View style={[styles.label, { backgroundColor: "#27ae60" }]}><Download size={14} color="#fff" /><Text style={styles.labelText}>Importado</Text></View>}
            {item.tipo === "personalizado" && <View style={[styles.label, { backgroundColor: "#e67e22" }]}><Edit3 size={14} color="#fff" /><Text style={styles.labelText}>Personalizado</Text></View>}
            {item.tipo === "criado" && <View style={[styles.label, { backgroundColor: "#8e44ad" }]}><UserIcon size={14} color="#fff" /><Text style={styles.labelText}>Criado</Text></View>}
          </View>
        </View>
        <View style={{ marginLeft: 12 }}>
          {selected ? <CheckSquare size={24} color="#329de4" /> : <Square size={24} color={colors.border} />}
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#329de4" />
        <Text style={{ color: colors.text }}>Carregando colaborador...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <TouchableOpacity onPress={pickImage} style={[styles.imageWrapper, { backgroundColor: effectiveTheme === "dark" ? "#222" : "#e0f0ff" }]}>
        {foto ? <Image source={{ uri: foto }} style={styles.image} /> : <Text style={[styles.imagePlaceholder, { color: "#329de4" }]}>Selecionar foto</Text>}
      </TouchableOpacity>

      <Text style={[styles.label, { color: colors.text }]}>Nome do colaborador</Text>
      <TextInput
        value={nome}
        onChangeText={setNome}
        style={[styles.input, { borderColor: colors.border, color: colors.text }]}
        placeholder="Digite o nome"
        placeholderTextColor="#999"
      />

      <Text style={[styles.label, { marginTop: 12, color: colors.text }]}>Preferências de Serviços</Text>
      {servicos.length === 0 ? (
        <Text style={{ color: "#777", marginVertical: 10 }}>Nenhum serviço disponível.</Text>
      ) : (
        <FlatList
          data={servicos}
          keyExtractor={item => `${item.id}-${item.tipo}`}
          renderItem={renderServico}
          contentContainerStyle={{ paddingBottom: 16 }}
        />
      )}

      <TouchableOpacity style={[styles.button, saving && { opacity: 0.7 }]} onPress={handleSave} disabled={saving}>
        <Text style={styles.buttonText}>{saving ? "Salvando..." : "Salvar alterações"}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: width * 0.05 },
   label: {
    fontSize: width * 0.04,
    marginBottom: 8,
    fontWeight: "500"
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    fontSize: width * 0.045
  },
  button: {
    backgroundColor: "#329de4",
    padding: 15,
    borderRadius: 8,
    alignItems: "center"
  },
  buttonText: {
    color: "#fff",
    fontSize: width * 0.045,
    fontWeight: "600"
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center"
  },
  imageWrapper: {
    alignSelf: "center",
    marginBottom: 20,
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden"
  },
  image: { width: "100%", height: "100%" },
  imagePlaceholder: { fontSize: 14 },
  servicoItem: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 10
  },
  servicoNome: { fontSize: 15, fontWeight: "600" },
  servicoDescricao: { fontSize: 13, marginTop: 2 },
  labelContainer: { flexDirection: "row", marginTop: 6 },
  label: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginRight: 6
  },
  labelText: { color: "#fff", fontSize: 12, fontWeight: "600" },
});
