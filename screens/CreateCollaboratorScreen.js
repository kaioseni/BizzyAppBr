import { useState, useContext, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, Image, StyleSheet, FlatList, ActivityIndicator, Dimensions, SafeAreaView } from "react-native";
import * as ImagePicker from "expo-image-picker";
import Toast from "react-native-toast-message";
import { AuthContext } from "../contexts/AuthContext";
import { ThemeContext } from "../contexts/ThemeContext";
import { createCollaborator } from "../services/collaborators";
import { fetchServicosRamoRealtime, fetchServicosImportadosRealtime, fetchServicosPersonalizadosRealtime, fetchRamoUsuario } from "../services/servicesService";
import { db } from "../firebase/firebaseConfig";
import { collection, getDocs, onSnapshot } from "firebase/firestore";
import { Download, Edit3, Layers, User as UserIcon, CheckSquare, Square } from "lucide-react-native";

const CLOUDINARY_CLOUD_NAME = "dol0wheky";
const CLOUDINARY_UPLOAD_PRESET = "colaboradores";

const { width, height } = Dimensions.get("window");
const APP_BLUE = "#329de4";

const uploadImageToCloudinary = async (fotoUri) => {
  const formData = new FormData();
  formData.append("file", { uri: fotoUri, type: "image/jpeg", name: "foto.jpg" });
  formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

  try {
    const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
      method: "POST",
      body: formData,
    });
    const data = await res.json();
    return data.secure_url;
  } catch (err) {
    console.log("Erro upload Cloudinary:", err);
    throw err;
  }
};

export default function CreateCollaboratorScreen({ navigation }) {
  const { user } = useContext(AuthContext);
  const { effectiveTheme } = useContext(ThemeContext);  

  const colors = effectiveTheme === "dark"
    ? { background: "#121212", card: "#1E1E1E", text: "#f5f5f5", subtext: "#bbb", border: "#444", placeholder: "#aaa" }
    : { background: "#fff", card: "#f9f9f9", text: "#333", subtext: "#555", border: "#ddd", placeholder: "#777" };

  const [nome, setNome] = useState("");
  const [foto, setFoto] = useState(null);
  const [loadingUpload, setLoadingUpload] = useState(false);
  const [ramoUsuario, setRamoUsuario] = useState(null);
  const [servicos, setServicos] = useState([]);
  const [loadingServicos, setLoadingServicos] = useState(true);
  const [preferencias, setPreferencias] = useState(new Set());

  useEffect(() => {
    if (!user?.uid) return;
    (async () => setRamoUsuario(await fetchRamoUsuario(user.uid)))();
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
        ...servicosPersonalizadosTemp.map(s => ({ ...s, tipo: "personalizado" })),
        ...servicosImportadosTemp.map(s => ({ ...s, tipo: "importado" })),
        ...servicosCriadosTemp.map(s => ({ ...s, tipo: "criado" })),
        ...servicosPadraoTemp.map(s => ({ ...s, tipo: "padrao" })),
      ]);
      setLoadingServicos(false);
    };

    const unsubPadrao = fetchServicosRamoRealtime(ramoUsuario, async (padrao) => {
      const ocultosSnap = await getDocs(collection(db, "users", user.uid, "servicosOcultos"));
      const ocultosIds = new Set(ocultosSnap.docs.map(d => d.id));
      servicosPadraoTemp.length = 0;
      servicosPadraoTemp.push(...padrao.filter(s => !ocultosIds.has(s.id)));
      mergeAllServicos();
    });
    unsubscribes.push(unsubPadrao);

    unsubscribes.push(fetchServicosPersonalizadosRealtime(user.uid, pers => { servicosPersonalizadosTemp.length = 0; servicosPersonalizadosTemp.push(...pers); mergeAllServicos(); }));
    unsubscribes.push(fetchServicosImportadosRealtime(user.uid, imp => { servicosImportadosTemp.length = 0; servicosImportadosTemp.push(...imp); mergeAllServicos(); }));
    unsubscribes.push(onSnapshot(collection(db, "users", user.uid, "servicosCriados"), snap => { servicosCriadosTemp.length = 0; servicosCriadosTemp.push(...snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))); mergeAllServicos(); }));

    return () => unsubscribes.forEach(fn => fn && fn());
  }, [user?.uid, ramoUsuario]);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") { alert("Permissão necessária para acessar a galeria."); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, quality: 0.7 });
    if (!result.canceled) setFoto(result.assets[0].uri);
  };

  const togglePreferencia = (id) => {
    const nova = new Set(preferencias);
    if (nova.has(id)) nova.delete(id); else nova.add(id);
    setPreferencias(nova);
  };

  const handleSave = async () => {
    if (!nome.trim()) { Toast.show({ type: "error", text1: "O nome é obrigatório" }); return; }
    setLoadingUpload(true);

    try {
      let fotoUrl = null;
      if (foto) fotoUrl = await uploadImageToCloudinary(foto);

      const preferenciasSelecionadas = servicos.filter(s => preferencias.has(s.id)).map(s => ({ id: s.id, nome: s.nome, tipo: s.tipo }));

      await createCollaborator({ nome, fotoUrl, idEstabelecimento: user.uid, preferenciasSelecionadas });

      Toast.show({ type: "success", text1: "Colaborador cadastrado com sucesso!" });
      setNome(""); setFoto(null); setPreferencias(new Set()); navigation.goBack();
    } catch (error) {
      Toast.show({ type: "error", text1: "Erro ao salvar", text2: error.message });
      console.log(error);
    } finally { setLoadingUpload(false); }
  };

  const renderServico = ({ item }) => {
    const selected = preferencias.has(item.id);
    return (
      <TouchableOpacity
        style={[styles.servicoItem, { backgroundColor: colors.card, borderColor: colors.border, padding: width * 0.03, borderRadius: width * 0.025 }, selected && { borderColor: APP_BLUE, backgroundColor: "#e9f5ff" }]}
        onPress={() => togglePreferencia(item.id)}
        activeOpacity={0.8}
      >
        <View style={{ flex: 1 }}>
          <Text style={[styles.servicoNome, { color: colors.subtext, fontSize: Math.min(width * 0.04, 16) }]} numberOfLines={1}>{item.nome}</Text>
          {item.descricao && <Text style={[styles.servicoDescricao, { color: colors.subtext, fontSize: Math.min(width * 0.035, 14) }]} numberOfLines={2}>{item.descricao}</Text>}
          <View style={styles.labelContainer}>
            {item.tipo === "padrao" && <View style={[styles.label, { backgroundColor: "#3498db", paddingHorizontal: width * 0.015 }]}><Layers size={14} color="#fff" style={{ marginRight: 4 }} /><Text style={styles.labelText}>Padrão</Text></View>}
            {item.tipo === "importado" && <View style={[styles.label, { backgroundColor: "#27ae60", paddingHorizontal: width * 0.015 }]}><Download size={14} color="#fff" style={{ marginRight: 4 }} /><Text style={styles.labelText}>Importado</Text></View>}
            {item.tipo === "personalizado" && <View style={[styles.label, { backgroundColor: "#e67e22", paddingHorizontal: width * 0.015 }]}><Edit3 size={14} color="#fff" style={{ marginRight: 4 }} /><Text style={styles.labelText}>Personalizado</Text></View>}
            {item.tipo === "criado" && <View style={[styles.label, { backgroundColor: "#8e44ad", paddingHorizontal: width * 0.015 }]}><UserIcon size={14} color="#fff" style={{ marginRight: 4 }} /><Text style={styles.labelText}>Criado</Text></View>}
          </View>
        </View>
        <View style={{ marginLeft: width * 0.03 }}>{selected ? <CheckSquare size={24} color={APP_BLUE} /> : <Square size={24} color={colors.subtext} />}</View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={servicos}
        keyExtractor={(item, index) => `${item.id}-${item.tipo}-${index}`}
        renderItem={renderServico}
        ListHeaderComponent={
          <>
            <Text style={[styles.title, { color: APP_BLUE, fontSize: Math.min(width * 0.06, 22) }]}>Novo Colaborador</Text>

            <TouchableOpacity
              onPress={pickImage}
              style={[styles.imageWrapper, { backgroundColor: effectiveTheme === "dark" ? "#222" : "#e0f0ff", width: width * 0.3, height: width * 0.3, borderRadius: width * 0.15 }]}
            >
              {foto ? <Image source={{ uri: foto }} style={styles.image} /> : <Text style={[styles.imagePlaceholder, { color: APP_BLUE, fontSize: Math.min(width * 0.04, 16) }]}>Selecionar foto</Text>}
            </TouchableOpacity>

            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.text, fontSize: Math.min(width * 0.045, 16), padding: width * 0.03, borderRadius: width * 0.02 }]}
              placeholder="Nome do colaborador"
              placeholderTextColor={colors.placeholder}
              value={nome}
              onChangeText={setNome}
            />

            <Text style={[styles.subtitle, { color: APP_BLUE, fontSize: Math.min(width * 0.045, 16) }]}>Preferências de Serviços</Text>

            {loadingServicos && <ActivityIndicator size="large" color={APP_BLUE} style={{ marginTop: 12 }} />}
          </>
        }
        ListFooterComponent={<View style={{ height: height * 0.18 }} />}  
        contentContainerStyle={{ paddingHorizontal: width * 0.05 }}
      />

      <TouchableOpacity
        style={{
          position: "absolute",
          bottom: height * 0.08,
          left: width * 0.05,
          right: width * 0.05,
          backgroundColor: APP_BLUE,
          paddingVertical: height * 0.02,
          borderRadius: width * 0.02,
          alignItems: "center",
        }}
        onPress={handleSave}
        disabled={loadingUpload}
      >
        {loadingUpload ? <ActivityIndicator color="#fff" /> : <Text style={[styles.buttonText, { fontSize: Math.min(width * 0.045, 16) }]}>Salvar</Text>}
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  title: { 
    fontWeight: "bold", 
    marginBottom: 20, 
    textAlign: "center" 
  },
  input: { borderWidth: 1, marginBottom: 15 },
  imageWrapper: { 
    alignSelf: "center", 
    marginBottom: 20, 
    justifyContent: "center", 
    alignItems: "center", 
    overflow: "hidden" 
  },
  image: { 
    width: "100%", 
    height: "100%", 
    borderRadius: 8 
  },
  imagePlaceholder: { fontWeight: "600" },
  subtitle: { 
    fontWeight: "600", 
    marginBottom: 10 
  },
  servicoItem: { 
    flexDirection: "row", 
    alignItems: "center", 
    borderWidth: 1, 
    marginBottom: 10 
  },
  servicoNome: { fontWeight: "600" },
  servicoDescricao: { marginTop: 2 },
  labelContainer: { 
    flexDirection: "row", 
    marginTop: 6 
  },
  label: { 
    flexDirection: "row", 
    alignItems: "center", 
    paddingVertical: 3, 
    borderRadius: 6, 
    marginRight: 6 
  },
  labelText: { 
    color: "#fff", 
    fontWeight: "600", 
    fontSize: 12 
  },
  buttonText: { 
    color: "#fff", 
    fontWeight: "bold" 
  },
});
