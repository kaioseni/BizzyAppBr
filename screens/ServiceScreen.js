import { useEffect, useState, useContext } from "react";
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Dimensions, Alert, ActivityIndicator } from "react-native";
import { AuthContext } from "../contexts/AuthContext";
import { Plus, Star, StarOff, Trash2, Edit3, Layers } from "lucide-react-native";
import DropDownPicker from "react-native-dropdown-picker";
import Toast from "react-native-toast-message";
import {
  fetchServicosRamoRealtime, fetchServicosImportadosRealtime, fetchServicosPersonalizadosRealtime, fetchFavoritosRealtime, toggleFavorito, importarServicoUsuario, removerServicoImportado,
  removerServicoPersonalizado, fetchRamos, fetchRamoUsuario
} from "../services/servicesService";
import { db } from "../firebase/firebaseConfig";
import { collection, getDocs, doc, setDoc } from "firebase/firestore";

const { width, height } = Dimensions.get("window");

export default function ServicesScreen({ navigation }) {
  const { user } = useContext(AuthContext);
  const [servicos, setServicos] = useState([]);
  const [favoritosIds, setFavoritosIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [itemsDropdown, setItemsDropdown] = useState([]);
  const [ramoSelecionado, setRamoSelecionado] = useState(null);
  const [ramoUsuario, setRamoUsuario] = useState(null);
  const [openDropdown, setOpenDropdown] = useState(false);

  useEffect(() => {
    if (!user?.uid) return;

    const init = async () => {
      const ramosDisponiveis = (await fetchRamos()).filter(r => r != null);

      const dropdownItems = [
        { label: "Meus Serviços", value: "meusServicos" },
        ...ramosDisponiveis.map(r => ({ label: r, value: r })),
      ];
      setItemsDropdown(dropdownItems);

      const ramo = await fetchRamoUsuario(user.uid);
      const selected = ramo && ramosDisponiveis.includes(ramo) ? ramo : "meusServicos";

      setRamoUsuario(ramo);
      setRamoSelecionado(selected);

      console.log("Ramo do usuário:", ramo, "| Dropdown inicial:", selected);
    };

    init();
  }, [user?.uid]);

  useEffect(() => {
    if (!user?.uid || !ramoSelecionado) return;
    setLoading(true);

    const unsubscribes = [];

    const loadMeusServicos = async () => {
      const unsubPadrao = fetchServicosRamoRealtime(ramoUsuario, async (padrao) => {
        const ocultosSnap = await getDocs(collection(db, "users", user.uid, "servicosOcultos"));
        const ocultosIds = new Set(ocultosSnap.docs.map(doc => doc.id));

        const padraoVisiveis = padrao
          .filter(s => !ocultosIds.has(s.id))
          .map(s => ({ ...s, tipo: "padrao" }));

        setServicos(prev => {
          const personalizados = prev.filter(s => s.tipo === "personalizado");
          return [...personalizados, ...padraoVisiveis];
        });
        setLoading(false);
      });

      const unsubPersonalizados = fetchServicosPersonalizadosRealtime(user.uid, (personalizados) => {
        setServicos(prev => {
          const padrao = prev.filter(s => s.tipo === "padrao");
          return [...personalizados.map(p => ({ ...p, tipo: "personalizado" })), ...padrao];
        });
        setLoading(false);
      });

      unsubscribes.push(unsubPadrao, unsubPersonalizados);
    };

    const loadRamoExterno = async () => {
      const unsubRamo = fetchServicosRamoRealtime(ramoSelecionado, async (lista) => {
        const ocultosSnap = await getDocs(collection(db, "users", user.uid, "servicosOcultos"));
        const ocultosIds = new Set(ocultosSnap.docs.map(doc => doc.id));

        const servicosVisiveis = lista
          .filter(s => !ocultosIds.has(s.id))
          .map(s => ({ ...s, tipo: "padrao" }));

        setServicos(servicosVisiveis);
        setLoading(false);
      });

      const unsubImportados = fetchServicosImportadosRealtime(user.uid, (importados) => {
        const importadosMarcados = importados.map(i => ({ ...i, tipo: "importado" }));
        setServicos(prev => [...importadosMarcados, ...prev.filter(s => s.tipo !== "importado")]);
      });

      const unsubPersonalizados = fetchServicosPersonalizadosRealtime(user.uid, (personalizados) => {
        setServicos(prev => {
          const mapaPersonalizados = new Map(personalizados.map(p => [p.idOriginal, p]));
          return prev.map(s => mapaPersonalizados.has(s.id) ? { ...s, ...mapaPersonalizados.get(s.id), tipo: "personalizado" } : s);
        });
      });

      unsubscribes.push(unsubRamo, unsubImportados, unsubPersonalizados);
    };

    if (ramoSelecionado === "meusServicos") loadMeusServicos();
    else loadRamoExterno();

    const unsubFavoritos = fetchFavoritosRealtime(user.uid, setFavoritosIds);
    unsubscribes.push(unsubFavoritos);

    return () => unsubscribes.forEach(fn => fn && fn());
  }, [user?.uid, ramoSelecionado, ramoUsuario]);

  const handleDelete = (item) => {
    Alert.alert(
      "Remover serviço",
      `Deseja realmente remover "${item.nome}" ${item.tipo === "padrao" ? "apenas para você" : ""}?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Remover",
          style: "destructive",
          onPress: async () => {
            try {
              if (item.tipo === "importado") await removerServicoImportado(user.uid, item.id);
              else if (item.tipo === "personalizado") await removerServicoPersonalizado(user.uid, item.id);
              else if (item.tipo === "padrao") await setDoc(doc(db, "users", user.uid, "servicosOcultos", item.id), { ocultoEm: new Date() });

              Toast.show({
                type: "success",
                text1: "Serviço removido",
                text2: `"${item.nome}" não aparecerá mais para você.`,
              });
            } catch (error) {
              console.error("Erro ao remover serviço:", error);
              Toast.show({ type: "error", text1: "Erro ao remover serviço" });
            }
          },
        },
      ]
    );
  };

  const handleImportar = async (item) => {
    try {
      await importarServicoUsuario(user.uid, item);
      Toast.show({
        type: "success",
        text1: "Serviço importado com sucesso!",
        text2: `"${item.nome}" foi adicionado aos seus serviços.`,
      });
      setRamoSelecionado(ramoUsuario);
    } catch (error) {
      console.error("Erro ao importar serviço:", error);
      Toast.show({ type: "error", text1: "Erro ao importar serviço" });
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate("EditServiceScreen", { servico: item })}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.name} numberOfLines={1}>{item.nome}</Text>
        {item.descricao && <Text style={styles.descricao} numberOfLines={2}>{item.descricao}</Text>}
        <View style={styles.labelContainer}>
          {item.tipo === "padrao" && <View style={[styles.label, { backgroundColor: "#3498db" }]}><Layers size={14} color="#fff" style={{ marginRight: 4 }} /><Text style={styles.labelText}>Padrão</Text></View>}
          {item.tipo === "importado" && <View style={[styles.label, { backgroundColor: "#27ae60" }]}><Layers size={14} color="#fff" style={{ marginRight: 4 }} /><Text style={styles.labelText}>Importado</Text></View>}
          {item.tipo === "personalizado" && <View style={[styles.label, { backgroundColor: "#e67e22" }]}><Edit3 size={14} color="#fff" style={{ marginRight: 4 }} /><Text style={styles.labelText}>Personalizado</Text></View>}
        </View>
      </View>

      <View style={styles.actions}>
        {ramoSelecionado === "meusServicos" ? (
          <>
            <TouchableOpacity onPress={() => toggleFavorito(user.uid, item, favoritosIds.has(item.id))} style={{ marginRight: 12 }}>
              {favoritosIds.has(item.id) ? <Star size={22} color="#f1c40f" /> : <StarOff size={22} color="#888" />}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleDelete(item)}>
              {item.tipo === "importado" ? <Text style={{ color: "red", fontWeight: "600" }}>Remover</Text> : <Trash2 size={22} color="red" />}
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity onPress={() => handleImportar(item)}>
            <Text style={{ color: "#27ae60", fontWeight: "600" }}>Importar</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.infoText}>Selecione um Ramo de Atividade para importar outros serviços</Text>

      {itemsDropdown.length > 0 && ramoSelecionado && (
        <DropDownPicker
          open={openDropdown}
          value={ramoSelecionado}
          items={itemsDropdown}
          setOpen={setOpenDropdown}
          setValue={setRamoSelecionado}
          setItems={setItemsDropdown}
          placeholder="Selecione o ramo de atividade"
          style={[styles.dropdown, { zIndex: 1000, elevation: 1000 }]}
          dropDownContainerStyle={{ ...styles.dropdownContainer, zIndex: 1000, elevation: 1000 }}
          listMode="SCROLLVIEW"
        />
      )}

      {loading && <ActivityIndicator size="large" color="#329de4" style={{ marginTop: 50 }} />}

      {!loading && servicos.length === 0 && (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Nenhum serviço cadastrado ainda</Text>
        </View>
      )}

      <FlatList
        data={servicos}
        keyExtractor={(item, index) => `${item.id}-${item.tipo}-${index}`}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 80 }}
      />

      {ramoSelecionado === "meusServicos" && (
        <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate("CreateServiceScreen")}>
          <Plus size={28} color="#fff" />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: width * 0.05, paddingTop: height * 0.03, backgroundColor: "#fff" },
  dropdown: { borderColor: "#329de4", borderRadius: 10, backgroundColor: "#f9f9f9", paddingHorizontal: 10, height: 50, marginBottom: 15 },
  dropdownContainer: { borderColor: "#329de4", borderRadius: 10 },
  card: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: width * 0.04, backgroundColor: "#f9f9f9", borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: "#329de4" },
  cardHeader: { flex: 1, flexShrink: 1, marginRight: 10 },
  name: { fontSize: width * 0.045, fontWeight: "600", color: "#333", maxWidth: width * 0.65 },
  descricao: { fontSize: width * 0.04, color: "#555", marginTop: 4, maxWidth: width * 0.7 },
  labelContainer: { flexDirection: "row", marginTop: 6 },
  label: { flexDirection: "row", alignItems: "center", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginRight: 6 },
  labelText: { color: "#fff", fontSize: 12, fontWeight: "600" },
  actions: { flexDirection: "row", alignItems: "center" },
  emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center", height: height * 0.6 },
  emptyText: { color: "#777", fontSize: width * 0.045, textAlign: "center" },
  fab: { position: "absolute", bottom: width * 0.08, right: width * 0.08, backgroundColor: "#329de4", width: width * 0.14, height: width * 0.14, borderRadius: width * 0.07, justifyContent: "center", alignItems: "center", elevation: 6 },
  infoText: { fontSize: width * 0.042, color: "#329de4", fontWeight: "600", marginBottom: 10, textAlign: "center" },
});
