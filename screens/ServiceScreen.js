import { useEffect, useState, useContext } from "react";
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from "react-native";
import { db } from "../firebase/firebaseConfig";
import { collection, doc, onSnapshot, getDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { AuthContext } from "../contexts/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { Trash2 } from "lucide-react-native";
import { Alert } from "react-native";

export default function ServicesScreen({ navigation }) {
    const { user } = useContext(AuthContext);
    const [servicos, setServicos] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user?.uid) {
            setLoading(false);
            return;
        }


        const fetchServicosRealtime = async () => {
            try {
                const estabRef = doc(db, "estabelecimentos", user.uid);
                const estabSnap = await getDoc(estabRef);

                if (!estabSnap.exists()) {
                    setLoading(false);
                    return;
                }

                const ramoAtividade = estabSnap.data().ramoAtividade;
                if (!ramoAtividade) {
                    setLoading(false);
                    return;
                }

                const servicosRef = collection(db, "ramosDeAtividade", ramoAtividade, "ServicosComuns");

                const unsubscribe = onSnapshot(servicosRef, (snapshot) => {
                    const lista = snapshot.docs.map(doc => ({
                        id: doc.id,
                        ramoAtividade,
                        ...doc.data(),
                    }));
                    setServicos(lista);
                    setLoading(false);
                });

                return () => unsubscribe();
            } catch (error) {
                setLoading(false);
            }
        };

        fetchServicosRealtime();
    }, [user?.uid]);

    const deleteService = (item) => {
        Alert.alert(
            "Excluir Serviço",
            `Deseja realmente excluir o serviço "${item.nome}"?`,
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Excluir",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            const estabRef = doc(db, "estabelecimentos", user.uid);
                            const estabSnap = await getDoc(estabRef);
                            if (!estabSnap.exists()) return;

                            const ramoAtividade = estabSnap.data().ramoAtividade;
                            if (!ramoAtividade) return;

                            const servicoRef = doc(db, "ramosDeAtividade", ramoAtividade, "ServicosComuns", item.id);
                            await deleteDoc(servicoRef);
                        } catch (error) {
                            //console.log("Erro ao deletar serviço:", error);
                        }
                    }
                }
            ]
        );
    };


    const toggleFavorito = async (item) => {
        try {
            const estabRef = doc(db, "estabelecimentos", user.uid);
            const estabSnap = await getDoc(estabRef);
            if (!estabSnap.exists()) return;

            const ramoAtividade = estabSnap.data().ramoAtividade;
            if (!ramoAtividade) return;

            const servicoRef = doc(db, "ramosDeAtividade", ramoAtividade, "ServicosComuns", item.id);
            await updateDoc(servicoRef, { favorito: !item.favorito });
        } catch (error) {
            //console.log("Erro ao alternar favorito:", error);
        }
    };

    const renderItem = ({ item }) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate("EditServiceScreen", { servico: item })}
        >
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <View>
                    <Text style={styles.nome}>{item.nome}</Text>
                    <Text style={styles.descricao}>{item.descricao}</Text>
                </View>

                <View style={{ flexDirection: "row", alignItems: "center" }}>

                    <TouchableOpacity onPress={() => toggleFavorito(item)} style={{ marginRight: 12 }}>
                        <Ionicons
                            name={item.favorito ? "star" : "star-outline"}
                            size={24}
                            color={item.favorito ? "#f1c40f" : "#888"}
                        />
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => deleteService(item)}>
                        <Trash2 size={22} color="red" />
                    </TouchableOpacity>
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            {loading ? (
                <Text>Carregando serviços...</Text>
            ) : servicos.length === 0 ? (
                <Text>Nenhum serviço encontrado</Text>
            ) : (
                <FlatList
                    data={servicos}
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={{ paddingBottom: 80 }}
                />
            )}

            <TouchableOpacity
                style={styles.fab}
                onPress={() => navigation.navigate("CerateServiceScreen")}
            >
                <Ionicons name="add" size={28} color="#fff" />
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: "#fff"
    },
    card: {
        backgroundColor: "#f2f2f2",
        borderRadius: 10,
        padding: 16,
        marginBottom: 12,
    },
    nome: {
        fontSize: 18,
        fontWeight: "bold"
    },
    descricao: {
        fontSize: 14,
        color: "#555",
        marginVertical: 6
    },
    favorito: {
        fontSize: 12,
        color: "#888"
    },
    fab: {
        position: "absolute",
        bottom: 20,
        right: 20,
        backgroundColor: "#329de4",
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: "center",
        alignItems: "center",
        elevation: 5,
    },
});
