import { useEffect, useState, useContext } from "react";
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Dimensions, Share, TextInput, Alert, Modal } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { User, Copy, Edit2, Save, Phone } from "lucide-react-native";
import dayjs from "dayjs";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as Clipboard from "expo-clipboard";
import { AuthContext } from "../contexts/AuthContext";
import { ThemeContext } from "../contexts/ThemeContext";
import { db } from "../firebase/firebaseConfig";
import { collection, query, where, orderBy, Timestamp, onSnapshot, doc, getDoc, setDoc } from "firebase/firestore";

const { width, height } = Dimensions.get("window");

export default function FinishedScreen() {
  const navigation = useNavigation();
  const { user, loading } = useContext(AuthContext);
  const { effectiveTheme } = useContext(ThemeContext);

  const colors = effectiveTheme === "dark"
    ? { background: "#121212", text: "#fff", card: "#1f1f1f", primary: "#329de4", secondary: "#329de4", placeholder: "#888" }
    : { background: "#fff", text: "#333", card: "#f9f9f9", primary: "#329de4", secondary: "#329de4", placeholder: "#777" };

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
    await Clipboard.setStringAsync(gerarTextoAtendimento(item));
    Alert.alert("Copiado!", "O texto do atendimento foi copiado para a área de transferência.");
  };

  const compartilharTexto = async (item) => {
    try {
      await Share.share({ message: gerarTextoAtendimento(item) });
    } catch (error) {
      console.log("Erro ao compartilhar:", error);
    }
  };

  const salvarTemplate = async () => {
    if (!user?.uid) return;
    await setDoc(doc(db, "templates", user.uid), { texto: customTemplate });
    setTemplate(customTemplate);
    Alert.alert("Template salvo!", "O template personalizado foi salvo com sucesso.");
    setModalVisible(false);
  };

  if (loading) return <Text style={[styles.loadingText, { color: colors.text, fontSize: Math.min(width * 0.045, 20) }]}>Carregando usuário...</Text>;

  return (
    <SafeAreaView style={[styles.safeContainer, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <TouchableOpacity
        style={[styles.dateButton, { backgroundColor: colors.secondary, paddingVertical: height * 0.015, paddingHorizontal: width * 0.04 }]}
        onPress={() => setShowPicker(true)}
      >
        <Text style={[styles.dateButtonText, { fontSize: Math.min(width * 0.045, 18) }]}>{selectedDate.format("DD/MM/YYYY")}</Text>
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
        style={[styles.editTemplateButton, { backgroundColor: colors.primary, paddingVertical: height * 0.012, paddingHorizontal: width * 0.04 }]}
        onPress={() => setModalVisible(true)}
      >
        <Edit2 size={Math.min(width * 0.04, 18)} color="#fff" style={{ marginRight: 6 }} />
        <Text style={[styles.editTemplateText, { fontSize: Math.min(width * 0.038, 16) }]}>Editar Mensagem Padrão</Text>
      </TouchableOpacity>

      <FlatList
        data={finalizados}
        keyExtractor={item => item.id}
        contentContainerStyle={{ paddingBottom: height * 0.05 }}
        renderItem={({ item }) => (
          <View style={[styles.card, { borderColor: colors.secondary, backgroundColor: colors.card, padding: width * 0.04 }]}>
            <TouchableOpacity onPress={() => navigation.navigate("ManageService", { agendamento: item })} style={styles.cardContent}>
              <View style={styles.cardHeader}>
                <Text style={[styles.name, { color: colors.text, fontSize: Math.min(width * 0.045, 18) }]}>{item.nomeCliente}</Text>
                <Text style={[styles.time, { color: colors.secondary, fontSize: Math.min(width * 0.042, 16) }]}>{item.dataHora instanceof Date ? dayjs(item.dataHora).format("HH:mm") : dayjs(item.dataHora.toDate()).format("HH:mm")}</Text>
              </View>

              {item.servico && <Text style={[styles.servico, { color: colors.secondary, fontSize: Math.min(width * 0.042, 16) }]}>Serviço: {item.servico}</Text>}

              {item.colaborador && (
                <View style={styles.colaboradorWrapper}>
                  <User size={Math.min(width * 0.036, 14)} color={colors.secondary} style={{ marginRight: 6 }} />
                  <Text style={[styles.colaborador, { color: colors.secondary, fontSize: Math.min(width * 0.04, 15) }]}>{item.colaborador}</Text>
                </View>
              )}
              <View style={styles.colaboradorWrapper}>
              <Phone size={Math.min(width * 0.036, 14)} color={colors.secondary} style={{ marginRight: 6 }} />
              <Text style={[styles.phone, { color: colors.text, fontSize: Math.min(width * 0.04, 15) }]}>{item.telefone}</Text>
              </View>
            </TouchableOpacity>

            <View style={styles.buttonRow}>
              <TouchableOpacity style={[styles.shareButton, { backgroundColor: colors.secondary, paddingVertical: height * 0.012, paddingHorizontal: width * 0.03 }]} onPress={() => copiarTexto(item)}>
                <Copy size={Math.min(width * 0.036, 16)} color="#fff" style={{ marginRight: 6 }} />
                <Text style={[styles.buttonText, { fontSize: Math.min(width * 0.036, 14) }]}>Copiar</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.shareButton, { backgroundColor: colors.secondary, paddingVertical: height * 0.012, paddingHorizontal: width * 0.03 }]} onPress={() => compartilharTexto(item)}>
                <Text style={[styles.buttonText, { fontSize: Math.min(width * 0.036, 14) }]}>Compartilhar</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        ItemSeparatorComponent={() => <View style={{ height: height * 0.01 }} />}
        ListEmptyComponent={
          <View style={[styles.emptyContainer, { height: height * 0.6 }]}>
            <Text style={[styles.emptyText, { color: colors.placeholder, fontSize: Math.min(width * 0.045, 18) }]}>Nenhum atendimento finalizado neste dia</Text>
          </View>
        }
      />

      <Modal visible={modalVisible} animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={[styles.modalContainer, { backgroundColor: colors.background, padding: width * 0.04 }]}>
          <Text style={[styles.modalTitle, { color: colors.text, fontSize: Math.min(width * 0.045, 20) }]}>Editar Template</Text>
          <Text style={[styles.modalInfo, { color: colors.text, fontSize: Math.min(width * 0.038, 16), marginBottom: height * 0.015 }]}>Você pode alterar apenas a introdução do atendimento. Os campos do cliente permanecem fixos.</Text>
          <TextInput
            style={[styles.modalInput, { backgroundColor: colors.card, color: colors.text, fontSize: Math.min(width * 0.038, 16), minHeight: height * 0.15, padding: width * 0.03 }]}
            multiline
            value={customTemplate}
            onChangeText={setCustomTemplate}
          />
          <TouchableOpacity style={[styles.saveButton, { backgroundColor: colors.secondary, paddingVertical: height * 0.015, paddingHorizontal: width * 0.04 }]} onPress={salvarTemplate}>
            <Save size={Math.min(width * 0.04, 16)} color="#fff" style={{ marginRight: 6 }} />
            <Text style={[styles.buttonText, { fontSize: Math.min(width * 0.038, 16) }]}>Salvar Template</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: { flex: 1 },
  dateButton: { 
    alignItems: "center", 
    justifyContent: "center", 
    borderRadius: 8, 
    alignSelf: "center", 
    marginBottom: 12 
  },
  dateButtonText: { 
    color: "#fff", 
    fontWeight: "600" 
  },
  editTemplateButton: { 
    flexDirection: "row", 
    alignItems: "center", 
    borderRadius: 8, 
    alignSelf: "center", 
    marginBottom: 12 
  },
  editTemplateText: { 
    color: "#fff", 
    fontWeight: "500" 
  },
  loadingText: { 
    flex: 1, 
    textAlign: "center", 
    marginTop: 50 
  },
  phone: {},
  servico: { 
    marginBottom: 4, 
    fontWeight: "500" 
  },
  colaboradorWrapper: { 
    flexDirection: "row", 
    alignItems: "center", 
    marginBottom: 4 
  },
  colaborador: { fontWeight: "500" },
  card: { 
  width: width * 0.9,   
  alignSelf: "center",  
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
  cardContent: { marginBottom: 8 },
  cardHeader: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    marginBottom: 6 
  },
  time: { fontWeight: "bold" },
  name: { fontWeight: "600" },
  buttonRow: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    marginTop: 6 
  },
  shareButton: { 
    flexDirection: "row", 
    alignItems: "center", 
    borderRadius: 6 
  },
  buttonText: { 
    color: "#fff", 
    fontWeight: "500" 
  },
  modalContainer: { flex: 1 },
  modalTitle: { 
    fontWeight: "600", 
    marginBottom: 8 
  },
  modalInfo: { marginBottom: 8 },
  modalInput: { 
    borderWidth: 1, 
    borderRadius: 8, 
    textAlignVertical: "top" 
  },
  saveButton: { 
    flexDirection: "row", 
    alignItems: "center", 
    borderRadius: 8, 
    alignSelf: "center", 
    marginTop: 12 
  },
  emptyContainer: { 
    justifyContent: "center", 
    alignItems: "center" 
  },
  emptyText: { textAlign: "center" },
});
