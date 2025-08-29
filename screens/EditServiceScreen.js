import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { db } from "../firebase/firebaseConfig";
import { doc, updateDoc } from "firebase/firestore";
import Toast from "react-native-toast-message";

export default function EditServiceScreen({ route, navigation }) {
    const { servico } = route.params;
    const [nome, setNome] = useState(servico.nome);
    const [descricao, setDescricao] = useState(servico.descricao);

    const handleUpdate = async () => {
        if (!nome || !descricao) {
            Toast.show({ type: "error", text1: "Preencha todos os campos" });
            return;
        }

        try {
            const servicoRef = doc(
                db,
                "ramosDeAtividade",
                servico.ramoAtividade,
                "ServicosComuns",
                servico.id
            );

            await updateDoc(servicoRef, { nome, descricao });

            Toast.show({ type: "success", text1: "Serviço atualizado com sucesso!" });
            navigation.goBack();
        } catch (error) {
            console.log("Erro ao atualizar serviço:", error);
            Toast.show({ type: "error", text1: "Erro ao atualizar serviço" });
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.label}>Nome do Serviço</Text>
            <TextInput style={styles.input} value={nome} onChangeText={setNome} />

            <Text style={styles.label}>Descrição</Text>
            <TextInput style={styles.input} value={descricao} onChangeText={setDescricao} />

            <TouchableOpacity style={styles.btn} onPress={handleUpdate}>
                <Text style={styles.btnText}>Salvar Alterações</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: "#fff"
    },
    label: {
        fontSize: 16,
        marginBottom: 8
    },
    input: {
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 8,
        padding: 10,
        marginBottom: 16
    },
    btn: {
        backgroundColor: "#329de4",
        padding: 15,
        borderRadius: 8,
        alignItems: "center"
    },
    btnText: {
        color: "#fff",
        fontWeight: "bold"
    },
});
