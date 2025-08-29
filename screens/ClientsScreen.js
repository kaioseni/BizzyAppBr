import { useEffect, useState, useContext } from "react";
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, Dimensions } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { AuthContext } from "../contexts/AuthContext";
import { db } from "../firebase/firebaseConfig";
import { collection, query, where, getDocs, Timestamp } from "firebase/firestore";

const { width } = Dimensions.get("window");

export default function ClientsScreen() {
  const { user } = useContext(AuthContext);
  const [agendamentos, setAgendamentos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [search, setSearch] = useState("");
  const [dateRange, setDateRange] = useState({ start: null, end: null });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateMode, setDateMode] = useState("start");

  useEffect(() => {
    if (!user?.uid) return;
    fetchAgendamentos();
  }, [user]);

  const fetchAgendamentos = async () => {
    try {
      const q = query(collection(db, "agendamentos"), where("userAux", "==", user.uid));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((doc) => doc.data());
      setAgendamentos(data);

      const uniqueClientsMap = {};
      data.forEach((a) => {
        if (!uniqueClientsMap[a.nomeCliente]) {
          uniqueClientsMap[a.nomeCliente] = {
            nomeCliente: a.nomeCliente,
            telefone: a.telefone,
            dataHora: a.dataHora,
          };
        } else {
          const existing = uniqueClientsMap[a.nomeCliente];
          if (a.dataHora.toDate() > existing.dataHora.toDate()) {
            uniqueClientsMap[a.nomeCliente] = {
              nomeCliente: a.nomeCliente,
              telefone: a.telefone,
              dataHora: a.dataHora,
            };
          }
        }
      });

      const clientesArray = Object.values(uniqueClientsMap).sort((a, b) =>
        a.nomeCliente.localeCompare(b.nomeCliente)
      );
      setClientes(clientesArray);
    } catch (error) {
      console.error("Erro ao buscar agendamentos:", error);
    }
  };

  const filteredClients = clientes.filter((c) => {
    const nomeMatch = c.nomeCliente.toLowerCase().includes(search.trim().toLowerCase());
    let dateMatch = true;
    if (dateRange.start && dateRange.end) {
      const dataAtendimento =
        c.dataHora instanceof Timestamp ? c.dataHora.toDate() : new Date(c.dataHora);
      dateMatch = dataAtendimento >= dateRange.start && dataAtendimento <= dateRange.end;
    }
    return nomeMatch && dateMatch;
  });

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (!selectedDate) return;

    if (dateMode === "start") {
      setDateRange({ ...dateRange, start: selectedDate });
      setDateMode("end");
      setShowDatePicker(true);
    } else {
      setDateRange({ ...dateRange, end: selectedDate });
      setDateMode("start");
    }
  };

  const clearFilters = () => {
    setSearch("");
    setDateRange({ start: null, end: null });
  };

  return (
    <View style={styles.container}>

      <View style={styles.filterRow}>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => {
            setDateMode("start");
            setShowDatePicker(true);
          }}
        >
          <Text style={styles.filterText}>Filtrar por período</Text>
        </TouchableOpacity>

        {dateRange.start && dateRange.end && (
          <View style={styles.rangeContainer}>
            <Text style={styles.rangeText}>
              {dateRange.start.toLocaleDateString()} → {dateRange.end.toLocaleDateString()}
            </Text>
            <TouchableOpacity onPress={clearFilters}>
              <Text style={styles.clearText}>✕</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
      <TextInput
        style={styles.input}
        placeholder="Buscar cliente pelo nome..."
        value={search}
        onChangeText={setSearch}
      />

      <FlatList
        data={filteredClients}
        keyExtractor={(item) => item.nomeCliente + item.telefone}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.nome}>{item.nomeCliente}</Text>
            <Text style={styles.telefone}>{item.telefone}</Text>
          </View>
        )}
        ListEmptyComponent={
          <Text style={{ textAlign: "center", marginTop: 20 }}>Nenhum cliente encontrado</Text>
        }
      />

      {showDatePicker && (
        <DateTimePicker
          value={new Date()}
          mode="date"
          display="default"
          onChange={handleDateChange}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: width * 0.04,
    backgroundColor: "#f2f5f7"
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    fontSize: width * 0.04,
    backgroundColor: "#fff",
  },
  filterRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: 'center',
    marginBottom: 12
  },
  filterButton: {
    backgroundColor: "#329de4",
    padding: 10,
    borderRadius: 8
  },
  filterText: {
    color: "#fff",
    fontWeight: "600"
  },
  rangeContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 10,
    backgroundColor: "#dbefff",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  rangeText: {
    color: "#329de4",
    fontWeight: "600",
    marginRight: 6
  },
  clearText: {
    color: "#e74c3c",
    fontWeight: "bold",
    fontSize: 16
  },
  card: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  nome: {
    fontSize: width * 0.045,
    fontWeight: "600",
    marginBottom: 4
  },
  telefone: {
    fontSize: width * 0.04,
    color: "#555"
  },
});
