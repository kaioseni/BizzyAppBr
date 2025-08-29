import { useEffect, useState, useContext } from "react";
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Image, Dimensions, Alert } from "react-native";
import { Plus, User, Trash2 } from "lucide-react-native";
import { AuthContext } from "../contexts/AuthContext";
import { listenCollaborators, deleteCollaborator } from "../services/collaborators";
import Toast from "react-native-toast-message";

const { width, height } = Dimensions.get("window");

export default function CollaboratorsScreen({ navigation }) {
  const { user } = useContext(AuthContext);
  const [colaboradores, setColaboradores] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) return;

    const unsubscribe = listenCollaborators(
      user.uid,
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setColaboradores(data);
        setLoading(false);
      },
      (error) => {
        console.error("Erro ao buscar colaboradores em tempo real:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const handleDelete = (id) => {
    Alert.alert(
      "Excluir colaborador",
      "Tem certeza que deseja excluir este colaborador?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteCollaborator(id);
              Toast.show({
                type: "success",
                text1: "Colaborador removido com sucesso",
              });
            } catch (error) {
              console.error("Erro ao excluir colaborador:", error);
              Toast.show({
                type: "error",
                text1: "Erro ao excluir colaborador",
              });
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() =>
        navigation.navigate("EditCollaboratorScreen", {
          collaboratorId: item.id,
        })
      }
    >
      <View style={styles.cardHeader}>
        {item.foto ? (
          <Image source={{ uri: item.foto }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <User size={24} color="#329de4" />
          </View>
        )}
        <Text
          style={styles.name}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {item.nome}
        </Text>
      </View>

      <TouchableOpacity onPress={() => handleDelete(item.id)}>
        <Trash2 size={22} color="red" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {loading && (
        <Text style={styles.loadingText}>Carregando colaboradores...</Text>
      )}

      {!loading && colaboradores.length === 0 && (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Nenhum colaborador cadastrado ainda</Text>
        </View>
      )}

      <FlatList
        data={colaboradores}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 80 }}
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate("CreateCollaboratorScreen")}
      >
        <Plus size={28} color="#fff" />
      </TouchableOpacity>
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
  loadingText: {
    textAlign: "center",
    marginTop: 50,
    fontSize: width * 0.045,
    color: "#777",
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
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 1,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#e0f0ff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  name: {
    fontSize: width * 0.045,
    fontWeight: "600",
    color: "#333",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    height: height * 0.6,
  },
  emptyText: {
    color: "#777",
    fontSize: width * 0.045,
    textAlign: "center",
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
  name: {
    fontSize: width * 0.045,
    fontWeight: "600",
    color: "#333",
    flexShrink: 1,
    maxWidth: width * 0.6,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
});
