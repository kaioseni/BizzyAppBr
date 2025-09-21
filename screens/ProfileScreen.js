import { useState, useCallback, useContext } from "react";
import { SafeAreaView, ScrollView, View, Text, StyleSheet, ActivityIndicator, Image, Dimensions, TouchableOpacity } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { AuthContext } from "../contexts/AuthContext";
import { ThemeContext } from "../contexts/ThemeContext";
import { db } from "../firebase/firebaseConfig";
import { collection, query, where, getDocs, getDoc } from "firebase/firestore";
import { Pencil } from "lucide-react-native";

const { width } = Dimensions.get("window");
const APP_BLUE = "#329de4";

export default function ProfileScreen({ navigation }) {
  const { user } = useContext(AuthContext);
  const { effectiveTheme } = useContext(ThemeContext);

  const currentTheme =
    effectiveTheme === "dark"
      ? { background: "#121212", card: "#1e1e1e", text: "#fff", textSecondary: "#ccc" }
      : { background: "#fff", card: "#f9f9f9", text: "#333", textSecondary: "#555" };

  const [estabelecimento, setEstabelecimento] = useState(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      if (!user?.uid) return;

      const fetchEstabelecimento = async () => {
        setLoading(true);
        try {
          const q = query(collection(db, "estabelecimentos"), where("userId", "==", user.uid));
          const snapshot = await getDocs(q);

          if (!snapshot.empty) {
            const docSnap = snapshot.docs[0];
            let data = { id: docSnap.id, ...docSnap.data() };

             
            if (data.ramoAtividade?.id || data.ramoAtividade?.path) {
              const ramoRef = data.ramoAtividade;
              const ramoSnap = await getDoc(ramoRef);
              if (ramoSnap.exists()) {
                data.ramoAtividade = ramoSnap.data().nome;  
              } else {
                data.ramoAtividade = "Não informado";
              }
            }

            setEstabelecimento(data);
          }
        } catch (error) {
          console.error("Erro ao buscar estabelecimento:", error);
        } finally {
          setLoading(false);
        }
      };

      fetchEstabelecimento();
    }, [user?.uid])
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.center, { backgroundColor: currentTheme.background }]}>
        <ActivityIndicator size="large" color={APP_BLUE} />
        <Text style={{ marginTop: 10, color: currentTheme.text }}>Carregando informações...</Text>
      </SafeAreaView>
    );
  }

  if (!estabelecimento) {
    return (
      <SafeAreaView style={[styles.center, { backgroundColor: currentTheme.background }]}>
        <Text style={{ color: currentTheme.textSecondary }}>Nenhum estabelecimento encontrado.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: currentTheme.background }}>
      <ScrollView contentContainerStyle={[styles.container, { backgroundColor: currentTheme.background }]}>
        <View style={{ position: "relative", alignItems: "center" }}>
          {estabelecimento.logo ? (
            <Image
              source={{ uri: estabelecimento.logo }}
              style={styles.logo}
              resizeMode="contain"
            />
          ) : (
            <View style={styles.logoPlaceholder}>
              <Text style={styles.logoPlaceholderText}>
                {estabelecimento.nomeEstabelecimento?.[0]?.toUpperCase() || "?"}
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={styles.editIcon}
            onPress={() =>
              navigation.navigate("EditProfileScreen", { estabelecimento, id: estabelecimento.id })
            }
          >
            <Pencil size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        <Text style={[styles.title, { color: APP_BLUE }]}>{estabelecimento.nomeEstabelecimento}</Text>
        <Text style={[styles.subtitle, { color: currentTheme.text }]}>{estabelecimento.ramoAtividade}</Text>

        <View style={[styles.infoCard, { backgroundColor: currentTheme.card, borderColor: APP_BLUE, borderWidth: 2 }]}>
          <Text style={[styles.label, { color: currentTheme.text }]}>Telefone:</Text>
          <Text style={[styles.value, { color: currentTheme.text }]}>{estabelecimento.telefone}</Text>

          <Text style={[styles.label, { color: currentTheme.text }]}>Endereço:</Text>
          <Text style={[styles.value, { color: currentTheme.text }]}>
            {estabelecimento.logradouro}, {estabelecimento.numero} {estabelecimento.complemento ? `- ${estabelecimento.complemento}` : ""}
          </Text>
          <Text style={[styles.value, { color: currentTheme.text }]}>
            {estabelecimento.bairro}, {estabelecimento.cidade} - {estabelecimento.estado}
          </Text>
          <Text style={[styles.value, { color: currentTheme.text }]}>CEP: {estabelecimento.cep}</Text>

          <Text style={[styles.label, { color: currentTheme.text }]}>Criado em:</Text>
          <Text style={[styles.value, { color: currentTheme.text }]}>
            {estabelecimento.createdAt?.toDate ? estabelecimento.createdAt.toDate().toLocaleString("pt-BR") : ""}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: width * 0.06,
    alignItems: "center",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  logo: {
    width: width * 0.4,
    height: width * 0.4,
    borderRadius: width * 0.2,
    marginBottom: 20,
    borderColor: "#c8c8c8ff",
    borderWidth: 1,
  },
  logoPlaceholder: {
    width: width * 0.4,
    height: width * 0.4,
    borderRadius: width * 0.2,
    backgroundColor: "#e0f0ff",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  logoPlaceholderText: {
    fontSize: width * 0.12,
    fontWeight: "bold",
    color: APP_BLUE,
  },
  title: {
    fontSize: width * 0.06,
    fontWeight: "bold",
    textAlign: "center",
  },
  subtitle: {
    fontSize: width * 0.04,
    marginBottom: 20,
    textAlign: "center",
  },
  infoCard: {
    width: "100%",
    padding: 20,
    borderRadius: 12,
    marginTop: 10,
    elevation: 2,
  },
  label: {
    fontWeight: "600",
    marginTop: 10,
  },
  value: {
    fontSize: width * 0.04,
  },
  editIcon: {
    position: "absolute",
    top: -10,
    right: 10,
    backgroundColor: APP_BLUE,
    padding: 8,
    borderRadius: 20,
    elevation: 4,
  },
});
