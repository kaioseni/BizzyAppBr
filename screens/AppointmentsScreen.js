import { useEffect, useState, useContext } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Platform } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { MaskedTextInput } from "react-native-mask-text";
import { createAgendamento } from "../services/appointments";
import Toast from "react-native-toast-message";
import { AuthContext } from "../contexts/AuthContext";

export default function AppointmentsScreen({ navigation }) {
    
    const { user } = useContext(AuthContext);
    const [userAux, setUserAux] = useState(user.uid);

    const [nomeCliente, setNomeCliente] = useState("");
    const [telefone, setTelefone] = useState("");
    const [dataHora, setDataHora] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);

    const validarCampos = () => {
    if (!nomeCliente.trim()) {
      Toast.show({ type: "error", text1: "Preencha o nome do cliente." });
      return false;
    }
    if (!telefone.trim() || telefone.replace(/\D/g, "").length < 11) {
      Toast.show({ type: "error", text1: "Telefone inválido." });
      return false;
    }
    if (!dataHora || dataHora < new Date()) {
      Toast.show({ type: "error", text1: "Data e hora inválidas." });
      return false;
    }
    return true;
  };

    const onDateChange = (event, selectedDate) => {
        setShowDatePicker(false);
        if (selectedDate) {
            const newDate = new Date(selectedDate);
            newDate.setHours(dataHora.getHours());
            newDate.setMinutes(dataHora.getMinutes());
            setDataHora(newDate);

            if (Platform.OS === "android") {
                setShowTimePicker(true);
            }
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
            await createAgendamento({ userAux, nomeCliente, telefone, dataHora });
            Toast.show({ type: "success", text1: "Agendamento cadastrado com sucesso!" });

            setNomeCliente("");
            setTelefone("");
            setDataHora(new Date());

            navigation.goBack()
        } catch (error) {
            Toast.show({ type: "error", text1: "Erro ao cadastrar agendamento", text2: error.message });
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Novo Agendamento</Text>

            <TextInput
                placeholder="Nome do cliente"
                value={nomeCliente}
                onChangeText={setNomeCliente}
                style={styles.input}
            />

            <MaskedTextInput
                mask="55 (99) 9 9999-9999"
                keyboardType="phone-pad"
                placeholder="Telefone do cliente"
                value={telefone}
                onChangeText={setTelefone}
                style={styles.input}
            />

            <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.input}>
                <Text>{dataHora.toLocaleString()}</Text>
            </TouchableOpacity>

            {showDatePicker && (
                <DateTimePicker
                    value={dataHora}
                    mode="date"
                    display="default"
                    onChange={onDateChange}
                />
            )}

            {showTimePicker && (
                <DateTimePicker
                    value={dataHora}
                    mode="time"
                    is24Hour={true}
                    display="default"
                    onChange={onTimeChange}
                />
            )}

            <TouchableOpacity style={styles.btn} onPress={handleAgendar}>
                <Text style={styles.btnText}>Salvar Agendamento</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: "#fff",
        justifyContent: "center",
    },
    title: {
        fontSize: 22,
        fontWeight: "bold",
        marginBottom: 20,
        color: "#329de4",
        textAlign: "center",
    },
    input: {
        borderWidth: 1,
        borderColor: "#ccc",
        padding: 12,
        borderRadius: 8,
        marginBottom: 15,
    },
    btn: {
        backgroundColor: "#329de4",
        padding: 15,
        borderRadius: 8,
        alignItems: "center",
        marginTop: 10,
    },
    btnText: {
        color: "white",
        fontWeight: "bold",
        fontSize: 16,
    },
});
