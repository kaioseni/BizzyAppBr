import React, { useEffect, useState, useContext } from "react";
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Dimensions, Modal, BackHandler } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { Plus, Calendar, User } from "lucide-react-native";
import dayjs from "dayjs";
import DateTimePicker from "@react-native-community/datetimepicker";
import { AuthContext } from "../contexts/AuthContext";
import { ThemeContext } from "../contexts/ThemeContext";
import { lightTheme, darkTheme } from "../utils/themes";
import { db } from "../firebase/firebaseConfig";
import {
  collection, query, where, orderBy, Timestamp,
  onSnapshot, getDoc, getDocs, doc
} from "firebase/firestore";

const { width, height } = Dimensions.get("window");
const APP_BLUE = "#329de4";

export default function HomeScreen() {
  const navigation = useNavigation();
  const { user, loading } = useContext(AuthContext);
  const { effectiveTheme } = useContext(ThemeContext);
  const currentTheme = effectiveTheme === "dark" ? darkTheme : lightTheme;

  const [agendamentos, setAgendamentos] = useState([]);
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [showPicker, setShowPicker] = useState(false);

  const [servicos, setServicos] = useState([]);
  const [favoritosServicos, setFavoritosServicos] = useState(new Set());
  const [exitModalVisible, setExitModalVisible] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      const backAction = () => { setExitModalVisible(true); return true; };
      const backHandler = BackHandler.addEventListener("hardwareBackPress", backAction);
      return () => backHandler.remove();
    }, [])
  );
 
  useEffect(() => {
    if (!user?.uid) return;

    const unsubscribes = [];
    const temp = { padrao: [], importados: [], personalizados: [], criados: [], favoritos: new Set() };

    const mergeServicos = () => {
      let all = [
        ...temp.personalizados.map(s => ({ ...s, tipo: "personalizado" })),
        ...temp.importados.map(s => ({ ...s, tipo: "importado" })),
        ...temp.criados.map(s => ({ ...s, tipo: "criado" })),
        ...temp.padrao.map(s => ({ ...s, tipo: "padrao" })),
      ];
      temp.favoritos.forEach(favId => {
        if (!all.some(s => s.id === favId)) all.push({ id: favId, nome: favId, descricao: "(Favorito)", tipo: "favorito" });
      });
      all.sort((a, b) => {
        const aFav = temp.favoritos.has(a.id);
        const bFav = temp.favoritos.has(b.id);
        return aFav === bFav ? -1 : bFav ? 1 : 0;
      });
      setServicos(all);
      setFavoritosServicos(temp.favoritos);
    };

    const init = async () => {
      try {
        const estSnap = await getDoc(doc(db, "estabelecimentos", user.uid));
        if (!estSnap.exists()) return;
        const { ramoAtividade } = estSnap.data();
        if (!ramoAtividade) return;

        const padraoSnap = await getDocs(collection(db, "ramosDeAtividade", ramoAtividade, "ServicosComuns"));
        temp.padrao = padraoSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        mergeServicos();

        unsubscribes.push(
          onSnapshot(collection(db, "users", user.uid, "servicosPersonalizados"), snap => {
            temp.personalizados = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            mergeServicos();
          })
        );

        unsubscribes.push(
          onSnapshot(collection(db, "users", user.uid, "servicosImportados"), snap => {
            temp.importados = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            mergeServicos();
          })
        );

        unsubscribes.push(
          onSnapshot(collection(db, "users", user.uid, "servicosCriados"), snap => {
            temp.criados = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            mergeServicos();
          })
        );

        unsubscribes.push(
          onSnapshot(collection(db, "users", user.uid, "favoritos"), snap => {
            temp.favoritos = new Set(snap.docs.map(d => d.id));
            mergeServicos();
          })
        );
      } catch (err) {
        console.error("Erro ao carregar serviços:", err);
      }
    };

    init();
    return () => unsubscribes.forEach(u => u && u());
  }, [user?.uid]);
 
  useEffect(() => {
    if (!user?.uid) return;
    const startOfDay = selectedDate.startOf("day").toDate();
    const endOfDay = selectedDate.endOf("day").toDate();

    const q = query(
      collection(db, "agendamentos"),
      where("userAux", "==", user.uid),
      where("dataHora", ">=", Timestamp.fromDate(startOfDay)),
      where("dataHora", "<=", Timestamp.fromDate(endOfDay)),
      orderBy("dataHora", "asc")
    );

    const unsubscribe = onSnapshot(q, snapshot => {
      const data = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(item => item.status !== "finalizado");
      setAgendamentos(data);
    });

    return () => unsubscribe();
  }, [user, selectedDate, servicos]);

  const getNomeServico = (id) => {
    const s = servicos.find(s => s.id === id);
    return s ? `${favoritosServicos.has(id) ? "⭐ " : ""}${s.nome}` : id;
  };

  const handleDateChange = (event, date) => {
    setShowPicker(false);
    if (date) setSelectedDate(dayjs(date));
  };

  const isLate = (dataHora) => {
    const agendamentoTime = dataHora instanceof Date ? dayjs(dataHora) : dayjs(dataHora.toDate());
    return agendamentoTime.isBefore(dayjs());
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.loadingContainer, { backgroundColor: currentTheme.background }]}>
        <Text style={[styles.loadingText, { color: currentTheme.text }]}>
          Carregando usuário...
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: currentTheme.background }]} edges={['top', 'bottom']}>
      <TouchableOpacity
        style={[styles.dateButton, { backgroundColor: APP_BLUE }]}
        onPress={() => setShowPicker(true)}
      >
        <Calendar size={width * 0.05} color="#fff" style={{ marginRight: width * 0.02 }} />
        <Text style={[styles.dateButtonText, { fontSize: Math.min(width * 0.042, 18) }]}>
          {selectedDate.format("DD/MM/YYYY")}
        </Text>
      </TouchableOpacity>

      {showPicker && (
        <DateTimePicker
          value={selectedDate.toDate()}
          mode="date"
          display="default"
          onChange={handleDateChange}
        />
      )}

      <FlatList
        data={agendamentos}
        keyExtractor={item => item.id}
        contentContainerStyle={{ paddingBottom: height * 0.2 }}
        renderItem={({ item }) => {
          const atrasado = isLate(item.dataHora);

          return (
            <TouchableOpacity
              onPress={() => navigation.navigate("ManageService", { agendamento: item })}
              style={[
                styles.card,
                { backgroundColor: currentTheme.card, borderColor: APP_BLUE },
                atrasado && { borderColor: "red", backgroundColor: "#fec6c6ff" }
              ]}
            >
              <View style={styles.cardHeader}>
                <Text style={[styles.name, { color: atrasado ? currentTheme.textDrow : currentTheme.text }]}>
                  {item.nomeCliente}
                </Text>
                <Text style={[styles.time, { color: APP_BLUE }]}>
                  {item.dataHora instanceof Date
                    ? dayjs(item.dataHora).format("HH:mm")
                    : dayjs(item.dataHora.toDate()).format("HH:mm")}
                </Text>
              </View>

              {item.servico && (
                <Text style={[styles.servico, { color: APP_BLUE }]}>
                  Serviço: {getNomeServico(item.servico)}
                </Text>
              )}

              {item.colaborador && (
                <View style={styles.colaboradorWrapper}>
                  <User size={width * 0.035} color={APP_BLUE} style={{ marginRight: width * 0.015 }} />
                  <Text style={[styles.colaborador, { color: APP_BLUE }]}>
                    {item.colaborador}
                  </Text>
                </View>
              )}

              <Text style={[styles.phone, { color: atrasado ? currentTheme.textDrow : currentTheme.text }]}>
                {item.telefone}
              </Text>
            </TouchableOpacity>
          );
        }}
        ItemSeparatorComponent={() => <View style={{ height: height * 0.01 }} />}
        ListEmptyComponent={
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center", height: height * 0.6 }}>
            <Text style={{ fontSize: Math.min(width * 0.045, 18), textAlign: "center", color: currentTheme.text }}>
              Nenhum agendamento para este dia
            </Text>
          </View>
        }
      />

      <TouchableOpacity
        style={[
          styles.fab,
          { backgroundColor: APP_BLUE, bottom: height * 0.05, right: width * 0.08, width: width * 0.14, height: width * 0.14, borderRadius: width * 0.07 }
        ]}
        onPress={() => navigation.navigate("AppointmentsScreen")}
      >
        <Plus size={width * 0.07} color="#fff" />
      </TouchableOpacity>

      <Modal
        transparent
        animationType="fade"
        visible={exitModalVisible}
        onRequestClose={() => setExitModalVisible(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: "rgba(0,0,0,0.5)" }]}>
          <View style={[styles.modalContainer, { backgroundColor: currentTheme.card }]}>
            <Text style={[styles.modalText, { color: currentTheme.text, fontSize: Math.min(width * 0.045, 18) }]}>
              Você está prestes a sair do app
            </Text>
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: APP_BLUE }]}
              onPress={() => BackHandler.exitApp()}
            >
              <Text style={[styles.modalButtonText, { fontSize: Math.min(width * 0.045, 18) }]}>Sair</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setExitModalVisible(false)}>
              <Text style={[styles.cancelText, { color: currentTheme.text, fontSize: Math.min(width * 0.042, 16) }]}>
                Agora Não
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: width * 0.05,
    paddingTop: height * 0.08
  },
  dateButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: "center",
    marginBottom: 12
  },
  dateButtonText: {
    color: "#fff",
    fontSize: width * 0.042,
    fontWeight: "600"
  },
  loadingText: {
    flex: 1,
    textAlign: "center",
    marginTop: 50,
    fontSize: width * 0.045
  },
  phone: { fontSize: width * 0.038 },
  servico: {
    fontSize: width * 0.04,
    marginBottom: 4,
    fontWeight: "500"
  },
  colaboradorWrapper: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4
  },
  colaborador: {
    fontSize: width * 0.038,
    fontWeight: "500"
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
    elevation: 6,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 6
  },
  card: {
    padding: width * 0.04,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6
  },
  time: {
    fontWeight: "bold",
    fontSize: width * 0.042
  },
  name: { fontWeight: "600", fontSize: width * 0.042 },
  separator: { height: 8 },
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
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: width * 0.8,
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
  },
  modalText: {
    fontSize: width * 0.045,
    textAlign: "center",
    marginBottom: 20
  },
  modalButton: {
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: "center"
  },
  modalButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: width * 0.045
  },
  cancelText: {
    fontSize: width * 0.042
  }
});
