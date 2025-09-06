import { useState, useContext } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { db } from "../firebase/firebaseConfig";
import { doc, setDoc, getDoc, collection } from "firebase/firestore";
import { AuthContext } from "../contexts/AuthContext";
import Toast from "react-native-toast-message";

export default function CerateServiceScreen({ navigation }) {

    const { user } = useContext(AuthContext);
    const [nome, setNome] = useState("");
    const [descricao, setDescricao] = useState("");

    const handleSave = async () => {
        if (!nome || !descricao) {
            Toast.show({ type: "error", text1: "Preencha todos os campos" });
            return;
        }

        try {
            if (!user?.uid) {
                Toast.show({ type: "error", text1: "Usuário não encontrado" });
                return;
            }

            const servicosCriadosRef = collection(db, "users", user.uid, "servicosCriados");

            const idServico = nome.replace(/\s+/g, "").toLowerCase();

            const servicoRef = doc(servicosCriadosRef, idServico);

            await setDoc(servicoRef, {
                nome,
                descricao,
                favorito: false,
                createdAt: new Date()
            });

            Toast.show({ type: "success", text1: "Serviço criado com sucesso!" });
            navigation.goBack();
        } catch (error) {
            console.log("Erro ao criar serviço:", error);
            Toast.show({ type: "error", text1: "Erro ao criar serviço" });
        }
    };


    return (
        <View style={styles.container}>

            <Text style={styles.title}>Novo Serviço</Text>

            <TextInput
                style={styles.input}
                placeholder="Nome do Serviço"
                value={nome}
                onChangeText={setNome}
            />

            <TextInput
                style={styles.input}
                value={descricao}
                onChangeText={setDescricao}
                placeholder="Descrição do Serviço"
                multiline={true}
            />

            <TouchableOpacity style={styles.btn} onPress={handleSave}>
                <Text style={styles.btnText}>Salvar</Text>
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
    title: {
        fontSize: 20,
        fontWeight: "bold",
        marginBottom: 20,
        textAlign: "center",
        color: "#329de4",
    },
    input: {
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 8,
        padding: 10,
        marginBottom: 16,
    },
    btn: {
        backgroundColor: "#329de4",
        padding: 15,
        borderRadius: 8,
        alignItems: "center",
    },
    btnText: { color: "#fff", fontWeight: "bold" },
});
