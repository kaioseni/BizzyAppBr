import { useEffect, useState, useContext } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Platform, ScrollView, KeyboardAvoidingView, Dimensions } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { MaskedTextInput } from "react-native-mask-text";
import { Picker } from "@react-native-picker/picker";
import Toast from "react-native-toast-message";
import { AuthContext } from "../contexts/AuthContext";
import { ThemeContext } from "../contexts/ThemeContext";
import { db } from "../firebase/firebaseConfig";
import { doc, getDoc, collection, getDocs, onSnapshot } from "firebase/firestore";
import { createAgendamento } from "../services/appointments";
import { lightTheme, darkTheme } from "../utils/themes";

const APP_BLUE = "#329de4";
const { width, height } = Dimensions.get("window");

export default function AppointmentsScreen({ navigation }) {
  const { user } = useContext(AuthContext);
  const { effectiveTheme } = useContext(ThemeContext);
  const currentTheme = effectiveTheme === "dark" ? darkTheme : lightTheme;

  const [nomeCliente, setNomeCliente] = useState("");
  const [telefone, setTelefone] = useState("");
  const [dataHora, setDataHora] = useState(new Date());

  const [servicos, setServicos] = useState([]);
  const [servicoSelecionado, setServicoSelecionado] = useState("");

  const [colaboradores, setColaboradores] = useState([]);
  const [colaboradorSelecionado, setColaboradorSelecionado] = useState("");

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const [favoritosIds, setFavoritosIds] = useState(new Set());
 
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
        return aFav === bFav ? 0 : aFav ? -1 : 1;
      });
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
          .map(doc => ({
            id: doc.id,
            nome: doc.data().nome,
            preferenciasServicos: doc.data().preferenciasServicos || [],
          }));
        if (servicoSelecionado) {
          lista.sort((a, b) => {
            const aPref = a.preferenciasServicos.some(s => s.id === servicoSelecionado);
            const bPref = b.preferenciasServicos.some(s => s.id === servicoSelecionado);
            return aPref === bPref ? 0 : aPref ? -1 : 1;
          });
        }
        setColaboradores(lista);
      } catch (err) {
        console.error("Erro ao carregar colaboradores:", err);
        Toast.show({ type: "error", text1: "Erro ao carregar colaboradores" });
      }
    };
    fetchColaboradores();
  }, [user?.uid, servicoSelecionado]);

  const validarCampos = () => {
    if (!nomeCliente.trim()) { Toast.show({ type: "error", text1: "Preencha o nome do cliente." }); return false; }
    if (!telefone.trim() || telefone.replace(/\D/g, "").length < 11) { Toast.show({ type: "error", text1: "Telefone inválido." }); return false; }
    if (!dataHora || dataHora < new Date()) { Toast.show({ type: "error", text1: "Data e hora inválidas." }); return false; }
    if (!servicoSelecionado) { Toast.show({ type: "error", text1: "Selecione um serviço." }); return false; }
    return true;
  };

  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const newDate = new Date(selectedDate);
      newDate.setHours(dataHora.getHours());
      newDate.setMinutes(dataHora.getMinutes());
      setDataHora(newDate);
      if (Platform.OS === "android") setShowTimePicker(true);
    }
  };

  const onTimeChange = (event, selectedTime) => {
    setShowTimePicker(false);
    if (selectedTime) {
      const newDate = new Date(dataHora);
      newDate.setHours(selectedTime.getHours());
      newDate.setMinutes(selectedTime.getMinutes());
      setDataHora(newDate);
    }
  };

  const handleAgendar = async () => {
    if (!validarCampos()) return;
    try {
      await createAgendamento({
        userAux: user.uid,
        nomeCliente,
        telefone,
        dataHora,
        servico: servicoSelecionado,
        colaborador: colaboradorSelecionado,
      });
      Toast.show({ type: "success", text1: "Agendamento cadastrado com sucesso!" });
      setNomeCliente("");
      setTelefone("");
      setDataHora(new Date());
      setServicoSelecionado("");
      setColaboradorSelecionado("");
      navigation.goBack();
    } catch (err) {
      Toast.show({ type: "error", text1: "Erro ao cadastrar agendamento", text2: err.message });
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: "center", paddingHorizontal: width * 0.05, paddingBottom: height * 0.18, }}>
        <TextInput
          placeholder="Nome do cliente"
          placeholderTextColor={currentTheme.textSecondary}
          value={nomeCliente}
          onChangeText={setNomeCliente}
          style={[styles.input, { backgroundColor: currentTheme.card, color: currentTheme.text, borderColor: APP_BLUE, fontSize: Math.min(width * 0.045, 18) }]}
        />

        <MaskedTextInput
          mask="55 (99) 9 9999-9999"
          keyboardType="phone-pad"
          placeholder="Telefone do cliente"
          placeholderTextColor={currentTheme.textSecondary}
          value={telefone}
          onChangeText={setTelefone}
          style={[styles.input, { backgroundColor: currentTheme.card, color: currentTheme.text, borderColor: APP_BLUE, fontSize: Math.min(width * 0.045, 18) }]}
        />

        <View style={[styles.pickerWrapper, { backgroundColor: currentTheme.card, borderColor: APP_BLUE }]}>
          <Picker
            selectedValue={servicoSelecionado}
            onValueChange={setServicoSelecionado}
            dropdownIconColor={currentTheme.text}
            style={{ color: servicoSelecionado ? currentTheme.text : currentTheme.textSecondary, fontSize: Math.min(width * 0.045, 18) }}
          >
            <Picker.Item label="Selecione um serviço" value="" enabled={false} color={currentTheme.textSecondary} />
            {servicos.map(s => (
              <Picker.Item key={`${s.id}-${s.tipo}`} label={`${s.nome || s.id}${favoritosIds.has(s.id) ? " ⭐" : ""}`} value={s.id} color={currentTheme.textDrow} />
            ))}
          </Picker>
        </View>

        <View style={[styles.pickerWrapper, { backgroundColor: currentTheme.card, borderColor: APP_BLUE }]}>
          <Picker
            selectedValue={colaboradorSelecionado}
            onValueChange={setColaboradorSelecionado}
            dropdownIconColor={currentTheme.text}
            style={{ color: colaboradorSelecionado ? currentTheme.text : currentTheme.textSecondary, fontSize: Math.min(width * 0.045, 18) }}
          >
            <Picker.Item label="Selecione um colaborador (opcional)" value="" color={currentTheme.textSecondary} />
            {colaboradores.map(c => (
              <Picker.Item key={c.id} label={c.nome} value={c.nome} color={currentTheme.textDrow} />
            ))}
          </Picker>
        </View>

        <TouchableOpacity onPress={() => setShowDatePicker(true)} style={[styles.input, { backgroundColor: currentTheme.card, borderColor: APP_BLUE }]}>
          <Text style={{ color: currentTheme.text, fontSize: Math.min(width * 0.045, 18) }}>{dataHora.toLocaleString()}</Text>
        </TouchableOpacity>
        {showDatePicker && <DateTimePicker value={dataHora} mode="date" display="default" onChange={onDateChange} />}
        {showTimePicker && <DateTimePicker value={dataHora} mode="time" is24Hour display="default" onChange={onTimeChange} />}
      </ScrollView>

      <TouchableOpacity
        style={[styles.btn, { backgroundColor: APP_BLUE, position: "absolute", bottom: height * 0.07, left: width * 0.05, right: width * 0.05, paddingVertical: height * 0.02 }]}
        onPress={handleAgendar}
      >
        <Text style={[styles.btnText, { fontSize: Math.min(width * 0.048, 18) }]}>Salvar Agendamento</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  input: { 
    borderWidth: 1, 
    borderRadius: 10, 
    paddingHorizontal: 15, 
    paddingVertical: 12, 
    marginBottom: 15 
  },
  pickerWrapper: { 
    borderWidth: 1, 
    borderRadius: 10, 
    marginBottom: 15 
  },
  btn: { alignItems: "center", borderRadius: 10 },
  btnText: { color: "#fff", fontWeight: "bold" },
});
