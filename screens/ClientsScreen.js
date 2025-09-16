import { useEffect, useState, useContext } from "react";
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, Dimensions } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { AuthContext } from "../contexts/AuthContext";
import { ThemeContext } from "../contexts/ThemeContext";
import { db } from "../firebase/firebaseConfig";
import { collection, query, where, getDocs, Timestamp } from "firebase/firestore";

const { width } = Dimensions.get("window");
const APP_BLUE = "#329de4";

export default function ClientsScreen() {
  const { user } = useContext(AuthContext);
  const { theme } = useContext(ThemeContext);

  const currentTheme = theme === "dark"
    ? {
      background: "#121212",
      card: "#1e1e1e",
      text: "#fff",
      textSecondary: "#ccc",
      input: "#2a2a2a",
    }
    : {
      background: "#f2f5f7",
      card: "#fff",
      text: "#333",
      textSecondary: "#555",
      input: "#fff",
    };

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
    <View style={[styles.container, { backgroundColor: currentTheme.background }]}>
      <View style={styles.filtersContainer}>
        <TouchableOpacity
          style={[styles.filterButton, { backgroundColor: APP_BLUE }]}
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
          style={[styles.filterButton, { backgroundColor: APP_BLUE }]}
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
            <Text style={[styles.clearText, { color: "#e74c3c" }]}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      <TextInput
        style={[
          styles.input,
          { backgroundColor: currentTheme.input, color: currentTheme.text, borderColor: currentTheme.textSecondary },
        ]}
        placeholder="Buscar cliente pelo nome..."
        placeholderTextColor={currentTheme.textSecondary}
        value={search}
        onChangeText={setSearch}
      />

      <FlatList
        data={filteredClients}
        keyExtractor={(item) => item.nomeCliente + item.telefone}
        renderItem={({ item }) => (
          <View
            style={[
              styles.clientCard,
              {
                backgroundColor: theme === "dark" ? "#1e1e1e" : "#e6f0fa",
                borderLeftColor: APP_BLUE,
              },
            ]}
          >
            <View style={styles.clientHeader}>
              <Text style={[styles.clientName, { color: APP_BLUE }]}>{item.nomeCliente}</Text>
              <Text style={[styles.clientDate, { color: currentTheme.textSecondary }]}>
                {item.dataHora.toLocaleDateString("pt-BR")}
              </Text>
            </View>
            <Text style={[styles.clientPhone, { color: currentTheme.text }]}>{item.telefone}</Text>
          </View>
        )}
        ListEmptyComponent={
          <Text style={{ textAlign: "center", marginTop: 20, color: currentTheme.textSecondary }}>
            Nenhum cliente encontrado
          </Text>
        }
      />

      {showDatePicker && (
        <DateTimePicker value={new Date()} mode="date" display="default" onChange={handleDateChange} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: width * 0.04,
  },
  filtersContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
  },
  filterButton: {
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
    fontWeight: "bold",
    fontSize: 18,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    fontSize: width * 0.04,
  },
  clientCard: {
    borderLeftWidth: 5,
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
  },
  clientDate: {
    fontSize: width * 0.035,
  },
  clientPhone: {
    fontSize: width * 0.04,
  },
});
