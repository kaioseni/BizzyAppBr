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
        const dataHora = a.dataHora instanceof Timestamp ? a.dataHora.toDate() : new Date(a.dataHora);
        if (!uniqueClientsMap[a.nomeCliente]) {
          uniqueClientsMap[a.nomeCliente] = { nomeCliente: a.nomeCliente, telefone: a.telefone, dataHora };
        } else if (dataHora > uniqueClientsMap[a.nomeCliente].dataHora) {
          uniqueClientsMap[a.nomeCliente] = { nomeCliente: a.nomeCliente, telefone: a.telefone, dataHora };
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
      const dataAtendimento = c.dataHora instanceof Date ? c.dataHora : new Date(c.dataHora);
      dateMatch = dataAtendimento >= dateRange.start && dataAtendimento <= dateRange.end;
    }
    return nomeMatch && dateMatch;
  });

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (!selectedDate) return;

    const date = new Date(selectedDate);
    if (dateMode === "start") {
      date.setHours(0, 0, 0, 0);
      setDateRange({ ...dateRange, start: date });
    } else {
      date.setHours(23, 59, 59, 999);
      setDateRange({ ...dateRange, end: date });
    }
  };

  const clearFilters = () => {
    setSearch("");
    setDateRange({ start: null, end: null });
  };

  return (
    <View style={styles.container}>

      <View style={styles.filtersContainer}>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => {
            setDateMode("start");
            setShowDatePicker(true);
          }}
        >
          <Text style={styles.filterText}>
            {dateRange.start ? dateRange.start.toLocaleDateString("pt-BR") : "Data Início"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => {
            setDateMode("end");
            setShowDatePicker(true);
          }}
        >
          <Text style={styles.filterText}>
            {dateRange.end ? dateRange.end.toLocaleDateString("pt-BR") : "Data Fim"}
          </Text>
        </TouchableOpacity>

        {(dateRange.start || dateRange.end) && (
          <TouchableOpacity style={{ marginLeft: 8 }} onPress={clearFilters}>
            <Text style={styles.clearText}>✕</Text>
          </TouchableOpacity>
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
          <View style={styles.clientCard}>
            <View style={styles.clientHeader}>
              <Text style={styles.clientName}>{item.nomeCliente}</Text>
              <Text style={styles.clientDate}>
                {item.dataHora.toLocaleDateString("pt-BR")}
              </Text>
            </View>
            <Text style={styles.clientPhone}>{item.telefone}</Text>
          </View>
        )}
        ListEmptyComponent={
          <Text style={{ textAlign: "center", marginTop: 20, color: "#777" }}>
            Nenhum cliente encontrado
          </Text>
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
    backgroundColor: "#f2f5f7",
  },
  filtersContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
  },
  filterButton: {
    backgroundColor: "#329de4",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  filterText: {
    color: "#fff",
    fontWeight: "600",
  },
  clearText: {
    color: "#e74c3c",
    fontWeight: "bold",
    fontSize: 18,
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
    marginBottom: 4,
  },
  telefone: {
    fontSize: width * 0.04,
    color: "#555",
  },
  clientCard: {
    backgroundColor: "#e6f0fa",
    borderLeftWidth: 5,
    borderLeftColor: "#329de4",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  clientHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  clientName: {
    fontSize: width * 0.045,
    fontWeight: "700",
    color: "#329de4",
  },
  clientDate: {
    fontSize: width * 0.035,
    color: "#555",
  },
  clientPhone: {
    fontSize: width * 0.04,
    color: "#333",
  },

});
