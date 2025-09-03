import { useEffect, useState, useContext } from "react";
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Dimensions, Alert, ActivityIndicator } from "react-native";
import { AuthContext } from "../contexts/AuthContext";
import { Plus, Star, StarOff, Trash2 } from "lucide-react-native";
import DropDownPicker from "react-native-dropdown-picker";
import Toast from "react-native-toast-message";
import { fetchServicosRamoRealtime, fetchServicosImportadosRealtime, fetchFavoritosRealtime, toggleFavorito, deleteServico, importarServicoUsuario, removerServicoImportado, fetchRamos, fetchRamoUsuario } from "../services/servicesService";

const { width, height } = Dimensions.get("window");

export default function ServicesScreen({ navigation }) {
  const { user } = useContext(AuthContext);

  const [servicos, setServicos] = useState([]);
  const [favoritosIds, setFavoritosIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [ramos, setRamos] = useState([]);
  const [ramoSelecionado, setRamoSelecionado] = useState(null);
  const [ramoUsuario, setRamoUsuario] = useState(null);
  const [openDropdown, setOpenDropdown] = useState(false);
  const [itemsDropdown, setItemsDropdown] = useState([]);

  useEffect(() => {
    if (!user?.uid) return;

    const init = async () => {
      const ramosDisponiveis = await fetchRamos();
      setRamos(ramosDisponiveis);
      setItemsDropdown(ramosDisponiveis.map((r) => ({ label: r, value: r })));

      const ramo = await fetchRamoUsuario(user.uid);
      const selected = ramo || ramosDisponiveis[0];
      setRamoUsuario(ramo);
      setRamoSelecionado(selected);
    };

    init();
  }, [user?.uid]);

  useEffect(() => {
    if (!user?.uid || !ramoSelecionado) return;
    setLoading(true);

    const unsubscribeRamo = fetchServicosRamoRealtime(ramoSelecionado, (lista) => {
      setServicos((prev) => {
        if (ramoSelecionado === ramoUsuario)
          return [...prev.filter((s) => s.isImportado), ...lista];
        return lista;
      });
      setLoading(false);
    });

    const unsubscribeImportados = fetchServicosImportadosRealtime(user.uid, (importados) => {
      const importadosMarcados = importados.map((i) => ({ ...i, isImportado: true }));
      setServicos((prev) => {
        if (ramoSelecionado === ramoUsuario)
          return [...importadosMarcados, ...prev.filter((s) => !s.isImportado)];
        return prev;
      });
    });

    const unsubscribeFavoritos = fetchFavoritosRealtime(user.uid, setFavoritosIds);

    return () => {
      unsubscribeRamo();
      unsubscribeImportados();
      unsubscribeFavoritos();
    };
  }, [user?.uid, ramoSelecionado, ramoUsuario]);

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

  const handleRemover = async (itemId) => {
    try {
      await removerServicoImportado(user.uid, itemId);
      Toast.show({
        type: "success",
        text1: "Serviço removido",
        text2: "O serviço importado foi removido.",
      });
    } catch (error) {
      console.error("Erro ao remover serviço importado:", error);
      Toast.show({ type: "error", text1: "Erro ao remover serviço" });
    }
  };

  const handleDelete = (item) => {
    Alert.alert(
      "Excluir serviço",
      `Deseja realmente excluir "${item.nome}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteServico(user.uid, ramoUsuario, item);
              Toast.show({
                type: "info",
                text1: "Serviço excluído",
                text2: `"${item.nome}" foi removido.`,
              });
            } catch (error) {
              console.error("Erro ao deletar serviço:", error);
              Toast.show({ type: "error", text1: "Erro ao excluir serviço" });
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate("EditServiceScreen", { servico: item })}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.name} numberOfLines={1}>
          {item.nome}
        </Text>
        {item.descricao && (
          <Text style={styles.descricao} numberOfLines={2}>
            {item.descricao}
          </Text>
        )}
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          onPress={() => toggleFavorito(user.uid, item, favoritosIds.has(item.id))}
          style={{ marginRight: 12 }}
        >
          {favoritosIds.has(item.id) ? (
            <Star size={22} color="#f1c40f" />
          ) : (
            <StarOff size={22} color="#888" />
          )}
        </TouchableOpacity>

        {item.isImportado ? (
          <TouchableOpacity onPress={() => handleRemover(item.id)}>
            <Text style={{ color: "red", fontWeight: "600" }}>Remover</Text>
          </TouchableOpacity>
        ) : ramoSelecionado === ramoUsuario ? (
          <TouchableOpacity onPress={() => handleDelete(item)}>
            <Trash2 size={22} color="red" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={() => handleImportar(item)}>
            <Text style={{ color: "#329de4", fontWeight: "600" }}>Importar</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.infoText}>Selecione um Ramo de Atividade para importar outros serviços</Text>
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

      {loading && <ActivityIndicator size="large" color="#329de4" style={{ marginTop: 50 }} />}

      {!loading && servicos.length === 0 && (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Nenhum serviço cadastrado ainda</Text>
        </View>
      )}

      <FlatList
        data={servicos}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 80 }}
      />

      {ramoSelecionado === ramoUsuario && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => navigation.navigate("CreateServiceScreen")}
        >
          <Plus size={28} color="#fff" />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: width * 0.05,
    paddingTop: height * 0.03,
    backgroundColor: "#fff",
  },
  dropdown: {
    borderColor: "#329de4",
    borderRadius: 10,
    backgroundColor: "#f9f9f9",
    paddingHorizontal: 10,
    height: 50,
    marginBottom: 15,
  },
  dropdownContainer: {
    borderColor: "#329de4",
    borderRadius: 10,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: width * 0.04,
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#329de4",
  },
  cardHeader: {
    flex: 1,
    flexShrink: 1,
    marginRight: 10
  },
  name: {
    fontSize: width * 0.045,
    fontWeight: "600",
    color: "#333",
    maxWidth: width * 0.65
  },
  descricao: {
    fontSize: width * 0.04,
    color: "#555",
    marginTop: 4,
    maxWidth: width * 0.7
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
    color: "#777",
    fontSize: width * 0.045,
    textAlign: "center"
  },
  fab: {
    position: "absolute",
    bottom: width * 0.08,
    right: width * 0.08,
    backgroundColor: "#329de4",
    width: width * 0.14,
    height: width * 0.14,
    borderRadius: width * 0.07,
    justifyContent: "center",
    alignItems: "center",
    elevation: 6,
  },
  infoText: {
    fontSize: width * 0.042,
    color: "#329de4",
    fontWeight: "600",
    marginBottom: 10,
    textAlign: "center",
  },
});
