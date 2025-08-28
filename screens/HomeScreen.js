import { useEffect, useState, useContext } from "react";
import { 
  View, 
  Text, 
  FlatList, 
  StyleSheet, 
  TouchableOpacity, 
  Dimensions 
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Plus, Calendar, User } from "lucide-react-native";
import dayjs from "dayjs";
import DateTimePicker from "@react-native-community/datetimepicker";
import { AuthContext } from "../contexts/AuthContext";
import { db } from "../firebase/firebaseConfig";
import { collection, query, where, orderBy, Timestamp, onSnapshot } from "firebase/firestore";

const { width, height } = Dimensions.get("window");

export default function HomeScreen() {
  const navigation = useNavigation();
  const { user, loading } = useContext(AuthContext);

  const [agendamentos, setAgendamentos] = useState([]);
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [showPicker, setShowPicker] = useState(false);

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

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAgendamentos(data);
    });

    return () => unsubscribe();
  }, [user, selectedDate]);

  const handleDateChange = (event, date) => {
    setShowPicker(false);
    if (date) setSelectedDate(dayjs(date));
  };

  const isLate = (dataHora) => {
    const agendamentoTime = dataHora instanceof Date ? dayjs(dataHora) : dayjs(dataHora.toDate());
    return agendamentoTime.isBefore(dayjs());
  };

  if (loading) return <Text style={styles.loadingText}>Carregando usuário...</Text>;

  return (
    <View style={styles.container}>
      
      <TouchableOpacity 
        style={styles.dateButton} 
        onPress={() => setShowPicker(true)}
      >
        <Calendar size={20} color="#fff" style={{ marginRight: 8 }} />
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

      <FlatList
        data={agendamentos}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 20 }}
        renderItem={({ item }) => {
          const atrasado = isLate(item.dataHora);

          return (
            <View
              style={[
                styles.card,
                atrasado && { borderColor: "red", backgroundColor: "#ffe6e6" }
              ]}
            >
              <View style={styles.cardHeader}>
                <Text style={[styles.time, atrasado && { color: "red" }]}>
                  {item.dataHora instanceof Date 
                    ? dayjs(item.dataHora).format("HH:mm")
                    : dayjs(item.dataHora.toDate()).format("HH:mm")}
                </Text>
                <Text style={styles.name}>{item.nomeCliente}</Text>
              </View>

              {item.servico && (
                <Text style={styles.servico}>Serviço: {item.servico}</Text>
              )}

              {item.colaborador && (
                <View style={styles.colaboradorWrapper}>
                  <User size={14} color="#329de4" style={{ marginRight: 6 }} />
                  <Text style={styles.colaborador}>Profissional: {item.colaborador}</Text>
                </View>
              )}

              <Text style={styles.phone}>{item.telefone}</Text>
            </View>
          );
        }}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              Nenhum agendamento para este dia
            </Text>
          </View>
        }
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate("AppointmentsScreen")}
      >
        <Plus size={28} color="white" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: width * 0.05,
    paddingTop: height * 0.08,
    backgroundColor: "#fff"
  },
  dateButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#329de4",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: "center",
    marginBottom: 12,
  },
  dateButtonText: {
    color: "#fff",
    fontSize: width * 0.042,
    fontWeight: "600",
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
    color: "#329de4",
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
    color: "#329de4",
    fontWeight: "500"
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
    shadowColor: "#329de4",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  card: {
    backgroundColor: "#fff",
    padding: width * 0.04,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#329de4",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6
  },
  time: {
    fontWeight: "bold",
    color: "#329de4",
    fontSize: width * 0.042
  },
  name: {
    fontWeight: "600",
    fontSize: width * 0.042
  },
  separator: { height: 8 },
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
});
