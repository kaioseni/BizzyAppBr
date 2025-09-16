import { useEffect, useState, useContext } from "react";
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Dimensions, Alert, ActivityIndicator } from "react-native";
import { AuthContext } from "../contexts/AuthContext";
import { ThemeContext } from "../contexts/ThemeContext";
import { Plus, Star, StarOff, Trash2, Edit3, Layers, User, Download } from "lucide-react-native";
import DropDownPicker from "react-native-dropdown-picker";
import Toast from "react-native-toast-message";
import {
  fetchServicosRamoRealtime, fetchServicosImportadosRealtime, fetchServicosPersonalizadosRealtime, fetchFavoritosRealtime, toggleFavorito, importarServicoUsuario, removerServicoImportado, removerServicoPersonalizado,
  fetchRamos, fetchRamoUsuario
} from "../services/servicesService";
import { db } from "../firebase/firebaseConfig";
import { collection, getDocs, doc, setDoc, onSnapshot, deleteDoc } from "firebase/firestore";

const { width, height } = Dimensions.get("window");

export default function ServicesScreen({ navigation }) {
  const { user } = useContext(AuthContext);
  const { theme } = useContext(ThemeContext);
  const themeColors = theme === "dark" ? {
    background: "#121212",
    text: "#eee",
    card: "#1f1f1f",
    primary: "#329de4",
    subtext: "#ccc",
    onPrimary: "#fff"
  } : {
    background: "#fff",
    text: "#333",
    card: "#f9f9f9",
    primary: "#329de4",
    subtext: "#555",
    onPrimary: "#fff"
  };

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
      setRamoUsuario(ramo);
      setRamoSelecionado("meusServicos");
    };

    init();
  }, [user?.uid]);

  useEffect(() => {
    if (!user?.uid || !ramoSelecionado) return;
    setLoading(true);

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
      setLoading(false);
    };

    if (ramoSelecionado === "meusServicos") {
      const unsubPadrao = fetchServicosRamoRealtime(ramoUsuario, async (padrao) => {
        const ocultosSnap = await getDocs(collection(db, "users", user.uid, "servicosOcultos"));
        const ocultosIds = new Set(ocultosSnap.docs.map(doc => doc.id));

        servicosPadraoTemp.length = 0;
        servicosPadraoTemp.push(...padrao.filter(s => !ocultosIds.has(s.id)));

        mergeAllServicos();
      });
      unsubscribes.push(unsubPadrao);

      const unsubPersonalizados = fetchServicosPersonalizadosRealtime(user.uid, (personalizados) => {
        servicosPersonalizadosTemp.length = 0;
        servicosPersonalizadosTemp.push(...personalizados);
        mergeAllServicos();
      });
      unsubscribes.push(unsubPersonalizados);

      const unsubImportados = fetchServicosImportadosRealtime(user.uid, (importados) => {
        servicosImportadosTemp.length = 0;
        servicosImportadosTemp.push(...importados);
        mergeAllServicos();
      });
      unsubscribes.push(unsubImportados);

      const servicosCriadosRef = collection(db, "users", user.uid, "servicosCriados");
      const unsubCriados = onSnapshot(servicosCriadosRef, (snapshot) => {
        servicosCriadosTemp.length = 0;
        servicosCriadosTemp.push(...snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        mergeAllServicos();
      });
      unsubscribes.push(unsubCriados);

    } else {
      const unsubRamoExterno = fetchServicosRamoRealtime(ramoSelecionado, (listaExterna) => {
        const padraoExterno = listaExterna.map(s => ({ ...s, tipo: "padrao" }));
        setServicos(padraoExterno);
        setLoading(false);
      });
      unsubscribes.push(unsubRamoExterno);
    }

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
              else if (item.tipo === "criado") await deleteDoc(doc(db, "users", user.uid, "servicosCriados", item.id));

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
      setRamoSelecionado("meusServicos");
    } catch (error) {
      console.error("Erro ao importar serviço:", error);
      Toast.show({ type: "error", text1: "Erro ao importar serviço" });
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: themeColors.card, borderColor: themeColors.primary }]}
      onPress={() => navigation.navigate("EditServiceScreen", { servico: item })}
    >
      <View style={styles.cardHeader}>
        <Text style={[styles.name, { color: themeColors.text }]} numberOfLines={1}>{item.nome}</Text>
        {item.descricao && <Text style={[styles.descricao, { color: themeColors.subtext }]} numberOfLines={2}>{item.descricao}</Text>}
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
              <User size={14} color="#fff" style={{ marginRight: 4 }} />
              <Text style={styles.labelText}>Criado</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.actions}>
        {ramoSelecionado === "meusServicos" ? (
          <>
            <TouchableOpacity onPress={() => toggleFavorito(user.uid, item, favoritosIds.has(item.id))} style={{ marginRight: 12 }}>
              {favoritosIds.has(item.id) ? <Star size={23} color="#f1c40f" /> : <StarOff size={22} color="#888" />}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleDelete(item)}>
              <Trash2 size={23} color="red" />
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity onPress={() => handleImportar(item)}>
            <View style={{ alignItems: "center" }}>
              <Text style={{ color: "#27ae60", fontWeight: "600" }}>Importar</Text>
              <Download size={23} color={"#27ae60"} />
            </View>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <Text style={[styles.infoText, { color: themeColors.primary }]}>Selecione um Ramo de Atividade para importar outros serviços</Text>

      {itemsDropdown.length > 0 && ramoSelecionado && (
        <DropDownPicker
          open={openDropdown}
          value={ramoSelecionado}
          items={itemsDropdown}
          setOpen={setOpenDropdown}
          setValue={setRamoSelecionado}
          setItems={setItemsDropdown}
          placeholder="Selecione o ramo de atividade"
          style={[
            styles.dropdown,
            {
              backgroundColor: themeColors.card,
              borderColor: themeColors.primary
            }
          ]}
          dropDownContainerStyle={[
            styles.dropdownContainer,
            {
              backgroundColor: themeColors.card,
              borderColor: themeColors.primary
            }
          ]}
          textStyle={{ color: themeColors.text }}
          labelStyle={{ color: themeColors.text }}
          placeholderStyle={{ color: themeColors.subtext }}
          listMode="SCROLLVIEW"
        />
      )}


      {loading && <ActivityIndicator size="large" color={themeColors.primary} style={{ marginTop: 50 }} />}

      {!loading && servicos.length === 0 && (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: themeColors.subtext }]}>Nenhum serviço cadastrado ainda</Text>
        </View>
      )}

      <FlatList
        data={servicos}
        keyExtractor={(item, index) => `${item.id}-${item.tipo}-${index}`}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 80 }}
      />

      {ramoSelecionado === "meusServicos" && (
        <TouchableOpacity style={[styles.fab, { backgroundColor: themeColors.primary }]} onPress={() => navigation.navigate("CreateServiceScreen")}>
          <Plus size={28} color={themeColors.onPrimary} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: width * 0.05,
    paddingTop: height * 0.03
  },
  dropdown: {
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 50,
    marginBottom: 15
  },
  dropdownContainer: { borderRadius: 10 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: width * 0.04,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1
  },
  cardHeader: {
    flex: 1,
    flexShrink: 1,
    marginRight: 10
  },
  name: {
    fontSize: width * 0.045,
    fontWeight: "600",
    maxWidth: width * 0.65
  },
  descricao: {
    fontSize: width * 0.04,
    marginTop: 4,
    maxWidth: width * 0.7
  },
  labelContainer: {
    flexDirection: "row",
    marginTop: 6
  },
  label: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginRight: 6
  },
  labelText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600"
  },
  actions: {
    flexDirection: "row",
    alignItems: "center"
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    height: height * 0.6
  },
  emptyText: {
    fontSize: width * 0.045,
    textAlign: "center"
  },
  fab: {
    position: "absolute",
    bottom: width * 0.08,
    right: width * 0.08,
    width: width * 0.14,
    height: width * 0.14,
    borderRadius: width * 0.07,
    justifyContent: "center",
    alignItems: "center",
    elevation: 6
  },
  infoText: {
    fontSize: width * 0.042,
    fontWeight: "600",
    marginBottom: 10,
    textAlign: "center"
  },
});
