import { useEffect, useState, useContext } from "react";
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Dimensions } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Plus } from "lucide-react-native";
import dayjs from "dayjs";
import { AuthContext } from "../contexts/AuthContext";
import { db } from "../firebase/firebaseConfig";
import { collection, query, where, orderBy, Timestamp, onSnapshot } from "firebase/firestore";

const { width, height } = Dimensions.get("window");

export default function HomeScreen() {
  const navigation = useNavigation();
  const { user, loading } = useContext(AuthContext);
  const [agendamentos, setAgendamentos] = useState([]);
  const [selectedDate, setSelectedDate] = useState(dayjs());

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

  if (loading) return <Text style={styles.loadingText}>Carregando usuário...</Text>;

  return (
    <View style={styles.container}>
      <Text style={styles.subtitle}>
        Agendamentos de {selectedDate.format("DD/MM/YYYY")}
      </Text>

      <FlatList
        data={agendamentos}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 20 }}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.time}>{dayjs(item.dataHora.toDate()).format("HH:mm")}</Text>
              <Text style={styles.name}>{item.nomeCliente}</Text>
            </View>
            <Text style={styles.phone}>{item.telefone}</Text>
          </View>
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', marginTop: 50 }}>
            <Text style={{ color: '#777', fontSize: width * 0.045 }}>
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
    paddingTop: height * 0.1,
    backgroundColor: "#fff"
  },
  subtitle: {
    fontSize: width * 0.045,
    fontWeight: "600",
    marginBottom: 10
  },
  loadingText: {
    flex: 1, textAlign: "center",
    marginTop: 50,
    fontSize: width * 0.045
  },
  phone: {
    fontSize: width * 0.038,
    color: "#666"
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
    shadowOpacity: 0.3, shadowRadius: 6,
  },
  card: {
    backgroundColor: '#fff',
    padding: width * 0.04,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#329de4',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4
  },
  time: {
    fontWeight: 'bold',
    color: '#329de4',
    fontSize: width * 0.042
  },
  name: {
    fontWeight: '600',
    fontSize: width * 0.042
  },
  separator: { height: 8 },
});
