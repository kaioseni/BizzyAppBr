import React, { useEffect, useState, useContext } from "react";
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, Dimensions } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { SafeAreaView } from "react-native-safe-area-context";
import { AuthContext } from "../contexts/AuthContext";
import { ThemeContext } from "../contexts/ThemeContext";
import { db } from "../firebase/firebaseConfig";
import { collection, query, where, getDocs, Timestamp } from "firebase/firestore";

const { width, height } = Dimensions.get("window");
const APP_BLUE = "#329de4";

export default function ClientsScreen() {
  const { user } = useContext(AuthContext);
  const { effectiveTheme } = useContext(ThemeContext);

  const currentTheme = effectiveTheme === "dark"
    ? { background: "#121212", card: "#1e1e1e", text: "#fff", textSecondary: "#ccc", input: "#2a2a2a" }
    : { background: "#f2f5f7", card: "#fff", text: "#333", textSecondary: "#555", input: "#fff" };

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
        if (!uniqueClientsMap[a.nomeCliente] || dataHora > uniqueClientsMap[a.nomeCliente].dataHora) {
          uniqueClientsMap[a.nomeCliente] = { nomeCliente: a.nomeCliente, telefone: a.telefone, dataHora };
        }
      });

      const clientesArray = Object.values(uniqueClientsMap).sort((a, b) => a.nomeCliente.localeCompare(b.nomeCliente));
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
    <SafeAreaView style={[styles.container, { backgroundColor: currentTheme.background }]} edges={['top', 'bottom']}>
    
      <View style={styles.filtersContainer}>
        <TouchableOpacity
          style={[styles.filterButton, { backgroundColor: APP_BLUE }]}
          onPress={() => { setDateMode("start"); setShowDatePicker(true); }}
        >
          <Text style={[styles.filterText, { fontSize: Math.min(width * 0.04, 16) }]}>
            {dateRange.start ? dateRange.start.toLocaleDateString("pt-BR") : "Data Início"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterButton, { backgroundColor: APP_BLUE }]}
          onPress={() => { setDateMode("end"); setShowDatePicker(true); }}
        >
          <Text style={[styles.filterText, { fontSize: Math.min(width * 0.04, 16) }]}>
            {dateRange.end ? dateRange.end.toLocaleDateString("pt-BR") : "Data Fim"}
          </Text>
        </TouchableOpacity>

        {(dateRange.start || dateRange.end) && (
          <TouchableOpacity style={{ marginLeft: 8 }} onPress={clearFilters}>
            <Text style={[styles.clearText, { color: "#e74c3c", fontSize: Math.min(width * 0.05, 18) }]}>
              ✕
            </Text>
          </TouchableOpacity>
        )}

      </View>
 
      <TextInput
        style={[
          styles.input,
          { backgroundColor: currentTheme.input, color: currentTheme.text, borderColor: currentTheme.textSecondary, fontSize: Math.min(width * 0.04, 16), paddingVertical: height * 0.015 }
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
          <View style={[styles.clientCard, { backgroundColor: currentTheme.card, borderLeftColor: APP_BLUE, padding: width * 0.04 }]}>
            <View style={styles.clientHeader}>
              <Text style={[styles.clientName, { color: APP_BLUE, fontSize: Math.min(width * 0.045, 18) }]}>{item.nomeCliente}</Text>
              <Text style={[styles.clientDate, { color: currentTheme.textSecondary, fontSize: Math.min(width * 0.035, 16) }]}>{item.dataHora.toLocaleDateString("pt-BR")}</Text>
            </View>
            <Text style={[styles.clientPhone, { color: currentTheme.text, fontSize: Math.min(width * 0.04, 16) }]}>{item.telefone}</Text>
          </View>
        )}
        ListEmptyComponent={
          <Text style={{ textAlign: "center", marginTop: height * 0.03, color: currentTheme.textSecondary, fontSize: Math.min(width * 0.04, 16) }}>
            Nenhum cliente encontrado
          </Text>
        }
        contentContainerStyle={{ paddingBottom: height * 0.04 }}  
      />
 
      {showDatePicker && <DateTimePicker value={new Date()} mode="date" display="default" onChange={handleDateChange} />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: width * 0.04,
  },
  filtersContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: height * 0.015,
    gap: 8,
  },
  filterButton: {
    paddingVertical: height * 0.015,
    paddingHorizontal: width * 0.04,
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
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: height * 0.015,
    paddingHorizontal: width * 0.04,
  },
  clientCard: {
    borderLeftWidth: 5,
    borderRadius: 12,
    marginBottom: height * 0.015,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  clientHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: height * 0.008,
  },
  clientName: {
    fontWeight: "700",
  },
  clientDate: {},
  clientPhone: {},
});
