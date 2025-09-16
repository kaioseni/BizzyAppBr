import { useEffect, useState, useContext } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Platform, Alert } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { MaskedTextInput } from "react-native-mask-text";
import { Picker } from "@react-native-picker/picker";
import Toast from "react-native-toast-message";
import { useRoute, useNavigation } from "@react-navigation/native";
import { AuthContext } from "../contexts/AuthContext";
import { ThemeContext } from "../contexts/ThemeContext";
import { db } from "../firebase/firebaseConfig";
import { doc, updateDoc, deleteDoc, collection, getDocs, getDoc, onSnapshot } from "firebase/firestore";
import dayjs from "dayjs";

export default function AtendimentoScreen() {
  const { user } = useContext(AuthContext);
  const { theme } = useContext(ThemeContext);
  const navigation = useNavigation();
  const route = useRoute();
  const { agendamento } = route.params;

  const [nomeCliente, setNomeCliente] = useState(agendamento.nomeCliente || "");
  const [telefone, setTelefone] = useState(agendamento.telefone || "");
  const [dataHora, setDataHora] = useState(agendamento.dataHora?.toDate ? agendamento.dataHora.toDate() : new Date());

  const [servicos, setServicos] = useState([]);
  const [servicoSelecionado, setServicoSelecionado] = useState(agendamento.servico || "");

  const [colaboradores, setColaboradores] = useState([]);
  const [colaboradorSelecionado, setColaboradorSelecionado] = useState(agendamento.colaborador || "");

  const [favoritosIds, setFavoritosIds] = useState(new Set());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const textoPicker = theme === "dark" ? "#fff" : "#000";

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
        if (!all.some(s => s.id === favId)) {
          all.push({ id: favId, nome: favId, descricao: "(Favorito)", tipo: "favorito" });
        }
      });
      all.sort((a, b) => (temp.favoritos.has(a.id) === temp.favoritos.has(b.id) ? -1 : 1));
      setServicos(all);
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
            setFavoritosIds(temp.favoritos);
            mergeServicos();
          })
        );
      } catch (err) {
        console.error("Erro ao carregar serviços:", err);
        Toast.show({ type: "error", text1: "Erro ao carregar serviços" });
      }
    };

    init();
    return () => unsubscribes.forEach(u => u && u());
  }, [user?.uid]);

  useEffect(() => {
    if (!user?.uid) return;

    const fetchColaboradores = async () => {
      try {
        const colSnap = await getDocs(collection(db, "colaboradores"));
        const lista = colSnap.docs
          .filter(doc => doc.data().idEstabelecimento === user.uid)
          .map(doc => ({ id: doc.id, nome: doc.data().nome }));

        setColaboradores(lista);
      } catch (err) {
        console.error("Erro ao carregar colaboradores:", err);
        Toast.show({ type: "error", text1: "Erro ao carregar colaboradores" });
      }
    };

    fetchColaboradores();
  }, [user?.uid]);

  const salvarAlteracoes = async () => {
    try {
      await updateDoc(doc(db, "agendamentos", agendamento.id), {
        nomeCliente,
        telefone,
        dataHora,
        servico: servicoSelecionado,
        colaborador: colaboradorSelecionado,
      });
      Toast.show({ type: "success", text1: "Atendimento atualizado!" });
      navigation.goBack();
    } catch (err) {
      console.error(err);
      Toast.show({ type: "error", text1: "Erro ao salvar alterações." });
    }
  };

  const finalizarAtendimento = async () => {
    try {
      await updateDoc(doc(db, "agendamentos", agendamento.id), { status: "finalizado" });
      Toast.show({ type: "success", text1: "Atendimento concluído!" });
      navigation.goBack();
    } catch (err) {
      console.error(err);
      Toast.show({ type: "error", text1: "Erro ao finalizar atendimento." });
    }
  };

  const excluirAgendamento = () => {
    Alert.alert("Excluir agendamento", "Tem certeza que deseja excluir?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Excluir",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteDoc(doc(db, "agendamentos", agendamento.id));
            Toast.show({ type: "success", text1: "Agendamento excluído!" });
            navigation.goBack();
          } catch (err) {
            console.error(err);
            Toast.show({ type: "error", text1: "Erro ao excluir agendamento." });
          }
        },
      },
    ]);
  };

  const handleDateChange = (event, date) => {
    setShowDatePicker(false);
    if (!date) return;
    const newDate = new Date(date);
    newDate.setHours(dataHora.getHours());
    newDate.setMinutes(dataHora.getMinutes());
    setDataHora(newDate);
    if (Platform.OS === "android") setShowTimePicker(true);
  };

  const handleTimeChange = (event, time) => {
    setShowTimePicker(false);
    if (!time) return;
    const newDate = new Date(dataHora);
    newDate.setHours(time.getHours());
    newDate.setMinutes(time.getMinutes());
    setDataHora(newDate);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme === "dark" ? "#121212" : "#fff" }]}>
      <Text style={[styles.label, { color: theme === "dark" ? "#fff" : "#555" }]}>Nome do Cliente</Text>
      <TextInput
        placeholder="Nome do cliente"
        placeholderTextColor={theme === "dark" ? "#aaa" : "#999"}
        value={nomeCliente}
        onChangeText={setNomeCliente}
        style={[styles.input, { color: theme === "dark" ? "#fff" : "#000", borderColor: theme === "dark" ? "#555" : "#ccc" }]}
      />

      <Text style={[styles.label, { color: theme === "dark" ? "#fff" : "#555" }]}>Telefone</Text>
      <MaskedTextInput
        mask="55 (99) 9 9999-9999"
        keyboardType="phone-pad"
        placeholder="Telefone do cliente"
        placeholderTextColor={theme === "dark" ? "#aaa" : "#999"}
        value={telefone}
        onChangeText={setTelefone}
        style={[styles.input, { color: theme === "dark" ? "#fff" : "#000", borderColor: theme === "dark" ? "#555" : "#ccc" }]}
      />

      <Text style={[styles.label, { color: theme === "dark" ? "#fff" : "#555" }]}>Serviço</Text>
      <View style={[styles.pickerWrapper, { borderColor: theme === "dark" ? "#555" : "#ccc" }]}>
        <Picker
          selectedValue={servicoSelecionado}
          onValueChange={setServicoSelecionado}
          style={{ color: theme === "dark" ? "#fff" : "#000" }}
          dropdownIconColor={theme === "dark" ? "#fff" : "#000"}
        >
          <Picker.Item label="Selecione um serviço" value="" enabled={false} />
          {servicos.map(s => (
            <Picker.Item
              key={`${s.id}-${s.tipo}`}
              label={`${s.nome || s.id}${favoritosIds.has(s.id) ? " ⭐" : ""}`}
              value={s.id}
            />
          ))}
        </Picker>
      </View>

      <Text style={[styles.label, { color: theme === "dark" ? "#fff" : "#555" }]}>Colaborador</Text>
      <View style={[styles.pickerWrapper, { borderColor: theme === "dark" ? "#555" : "#ccc" }]}>
        <Picker
          selectedValue={colaboradorSelecionado}
          onValueChange={setColaboradorSelecionado}
          style={{ color: theme === "dark" ? "#fff" : "#000" }}
          dropdownIconColor={theme === "dark" ? "#fff" : "#000"}
        >
          <Picker.Item label="Selecione um colaborador (opcional)" value="" />
          {colaboradores.map(c => (
            <Picker.Item key={c.id} label={c.nome} value={c.nome} />
          ))}
        </Picker>
      </View>

      <Text style={[styles.label, { color: theme === "dark" ? "#fff" : "#555" }]}>Data e Hora</Text>
      <TouchableOpacity
        onPress={() => setShowDatePicker(true)}
        style={[styles.input, { borderColor: theme === "dark" ? "#555" : "#ccc" }]}
      >
        <Text style={{ color: theme === "dark" ? "#fff" : "#000" }}>{dayjs(dataHora).format("DD/MM/YYYY HH:mm")}</Text>
      </TouchableOpacity>

      {showDatePicker && <DateTimePicker value={dataHora} mode="date" display="default" onChange={handleDateChange} />}
      {showTimePicker && <DateTimePicker value={dataHora} mode="time" is24Hour display="default" onChange={handleTimeChange} />}

      {agendamento.status !== "finalizado" && (
        <>
          <TouchableOpacity style={styles.btn} onPress={salvarAlteracoes}>
            <Text style={styles.btnText}>Salvar Alterações</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.btn, { backgroundColor: "green" }]} onPress={finalizarAtendimento}>
            <Text style={styles.btnText}>Finalizar Atendimento</Text>
          </TouchableOpacity>
        </>
      )}

      <TouchableOpacity style={[styles.btn, { backgroundColor: "red" }]} onPress={excluirAgendamento}>
        <Text style={styles.btnText}>Excluir Agendamento</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4
  },
  input: {
    borderWidth: 1,
    padding: 12,
    borderRadius: 8,
    marginBottom: 15
  },
  pickerWrapper: {
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 15
  },
  btn: {
    backgroundColor: "#329de4",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10
  },
  btnText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16
  },
});
