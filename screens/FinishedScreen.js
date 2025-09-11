import { useEffect, useState, useContext } from "react";
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Dimensions, Share, TextInput, Alert, Modal } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { User, Copy, Edit2, Save } from "lucide-react-native";
import dayjs from "dayjs";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as Clipboard from "expo-clipboard";
import { AuthContext } from "../contexts/AuthContext";
import { db } from "../firebase/firebaseConfig";
import { collection, query, where, orderBy, Timestamp, onSnapshot, doc, getDoc, setDoc } from "firebase/firestore";

const { width, height } = Dimensions.get("window");

export default function FinishedScreen() {
  const navigation = useNavigation();
  const { user, loading } = useContext(AuthContext);

  const [finalizados, setFinalizados] = useState([]);
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [showPicker, setShowPicker] = useState(false);

  const [template, setTemplate] = useState("");
  const [customTemplate, setCustomTemplate] = useState("");
  const [modalVisible, setModalVisible] = useState(false);

  const defaultTemplate = "Atendimento finalizado:";

  useEffect(() => {
    if (!user?.uid) return;

    const startOfDay = selectedDate.startOf("day").toDate();
    const endOfDay = selectedDate.endOf("day").toDate();

    const q = query(
      collection(db, "agendamentos"),
      where("userAux", "==", user.uid),
      where("status", "==", "finalizado"),
      where("dataHora", ">=", Timestamp.fromDate(startOfDay)),
      where("dataHora", "<=", Timestamp.fromDate(endOfDay)),
      orderBy("dataHora", "asc")
    );

    const unsubscribe = onSnapshot(q, snapshot => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setFinalizados(data);
    });

    return () => unsubscribe();
  }, [user, selectedDate]);

  useEffect(() => {
    if (!user?.uid) return;
    const templateRef = doc(db, "templates", user.uid);
    getDoc(templateRef).then(snapshot => {
      if (snapshot.exists()) {
        setTemplate(snapshot.data().texto);
        setCustomTemplate(snapshot.data().texto);
      } else {
        setTemplate(defaultTemplate);
        setCustomTemplate(defaultTemplate);
      }
    });
  }, [user]);

  const handleDateChange = (event, date) => {
    setShowPicker(false);
    if (date) setSelectedDate(dayjs(date));
  };

  const gerarTextoAtendimento = (item) => {
    const textoUsuario = template || defaultTemplate;
    return `${textoUsuario}
Cliente: ${item.nomeCliente || ""}
Telefone: ${item.telefone || ""}
Serviço: ${item.servico || "Não informado"}
Colaborador: ${item.colaborador || "Não informado"}
Data/Hora: ${item.dataHora instanceof Date
        ? dayjs(item.dataHora).format("DD/MM/YYYY HH:mm")
        : dayjs(item.dataHora.toDate()).format("DD/MM/YYYY HH:mm")}`;
  };

  const copiarTexto = async (item) => {
    const texto = gerarTextoAtendimento(item);
    await Clipboard.setStringAsync(texto);
    Alert.alert("Copiado!", "O texto do atendimento foi copiado para a área de transferência.");
  };

  const compartilharTexto = async (item) => {
    const texto = gerarTextoAtendimento(item);
    try {
      await Share.share({ message: texto });
    } catch (error) {
      console.log("Erro ao compartilhar:", error);
    }
  };

  const salvarTemplate = async () => {
    if (!user?.uid) return;
    const templateRef = doc(db, "templates", user.uid);
    await setDoc(templateRef, { texto: customTemplate });
    setTemplate(customTemplate);
    Alert.alert("Template salvo!", "O template personalizado foi salvo com sucesso.");
    setModalVisible(false);
  };

  if (loading) return <Text style={styles.loadingText}>Carregando usuário...</Text>;

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.dateButton}
        onPress={() => setShowPicker(true)}
      >
        <Text style={styles.dateButtonText}>
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

      <TouchableOpacity
        style={styles.editTemplateButton}
        onPress={() => setModalVisible(true)}
      >
        <Edit2 size={16} color="#fff" style={{ marginRight: 6 }} />
        <Text style={styles.editTemplateText}>Editar Template</Text>
      </TouchableOpacity>

      <FlatList
        data={finalizados}
        keyExtractor={item => item.id}
        contentContainerStyle={{ paddingBottom: 20 }}
        renderItem={({ item }) => (
          <View style={[styles.card, { borderColor: "green", backgroundColor: "#e6ffe6" }]}>
            <TouchableOpacity
              onPress={() => navigation.navigate("ManageService", { agendamento: item })}
              style={styles.cardContent}
            >
              <View style={styles.cardHeader}>
                <Text style={[styles.time, { color: "green" }]}>
                  {item.dataHora instanceof Date
                    ? dayjs(item.dataHora).format("HH:mm")
                    : dayjs(item.dataHora.toDate()).format("HH:mm")}
                </Text>
                <Text style={styles.name}>{item.nomeCliente}</Text>
              </View>

              {item.servico && <Text style={styles.servico}>Serviço: {item.servico}</Text>}

              {item.colaborador && (
                <View style={styles.colaboradorWrapper}>
                  <User size={14} color="green" style={{ marginRight: 6 }} />
                  <Text style={styles.colaborador}>{item.colaborador}</Text>
                </View>
              )}

              <Text style={styles.phone}>{item.telefone}</Text>
            </TouchableOpacity>

            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.shareButton} onPress={() => copiarTexto(item)}>
                <Copy size={16} color="#fff" style={{ marginRight: 6 }} />
                <Text style={styles.buttonText}>Copiar</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.shareButton} onPress={() => compartilharTexto(item)}>
                <Text style={styles.buttonText}>Compartilhar</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Nenhum atendimento finalizado neste dia</Text>
          </View>
        }
      />

      <Modal
        visible={modalVisible}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Editar Template</Text>
          <Text style={styles.modalInfo}>Você pode alterar apenas a introdução do atendimento. Os campos do cliente permanecem fixos.</Text>
          <TextInput
            style={styles.modalInput}
            multiline
            value={customTemplate}
            onChangeText={setCustomTemplate}
          />
          <TouchableOpacity style={styles.saveButton} onPress={salvarTemplate}>
            <Save size={16} color="#fff" style={{ marginRight: 6 }} />
            <Text style={styles.buttonText}>Salvar Template</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: width * 0.05,
    paddingTop: height * 0.04,
    backgroundColor: "#fff"
  },
  dateButton: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "green",
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
  editTemplateButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2d9cdb",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignSelf: "center",
    marginBottom: 12
  },
  editTemplateText: {
    color: "#fff",
    fontSize: width * 0.038,
    fontWeight: "500"
  },
  loadingText: {
    flex: 1,
    textAlign: "center",
    marginTop: 50,
    fontSize: width * 0.045
  },
  phone: {
    fontSize: width * 0.038,
    color: "#666"
  },
  servico: {
    fontSize: width * 0.04,
    color: "green",
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
    color: "green",
    fontWeight: "500"
  },
  card: {
    padding: width * 0.04,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    marginBottom: 8
  },
  cardContent: {
    marginBottom: 8,
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
  name: {
    fontWeight: "600",
    fontSize: width * 0.042
  },
  separator: {
    height: 8
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
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  shareButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "green",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    marginTop: 6
  },
  buttonText: {
    color: "#fff",
    fontSize: width * 0.036,
    fontWeight: "500"
  },
  modalContainer: {
    flex: 1,
    padding: 16,
    backgroundColor: "#fff"
  },
  modalTitle: {
    fontSize: width * 0.045,
    fontWeight: "600",
    marginBottom: 8
  },
  modalInfo: {
    fontSize: width * 0.038,
    marginBottom: 8,
    color: "#555"
  },
  modalInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    fontSize: width * 0.038,
    textAlignVertical: "top",
    minHeight: 120
  },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "green",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignSelf: "center",
    marginTop: 12
  },
});
