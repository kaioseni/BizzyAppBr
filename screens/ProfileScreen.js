import { useState, useEffect, useContext } from "react";
import { View, Text, StyleSheet, ActivityIndicator, Image, Dimensions, ScrollView } from "react-native";
import { AuthContext } from "../contexts/AuthContext";
import { db } from "../firebase/firebaseConfig";
import { collection, query, where, getDocs } from "firebase/firestore";

const { width } = Dimensions.get("window");

export default function ProfileScreen() {
  const { user } = useContext(AuthContext);
  const [estabelecimento, setEstabelecimento] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) return;

    const fetchEstabelecimento = async () => {
      try {
        const q = query(
          collection(db, "estabelecimentos"),
          where("userId", "==", user.uid)
        );
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
          setEstabelecimento(snapshot.docs[0].data());
        }
      } catch (error) {
        console.error("Erro ao buscar estabelecimento:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEstabelecimento();
  }, [user]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#329de4" />
        <Text style={{ marginTop: 10 }}>Carregando informações...</Text>
      </View>
    );
  }

  if (!estabelecimento) {
    return (
      <View style={styles.center}>
        <Text style={{ color: "#999" }}>Nenhum estabelecimento encontrado.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
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

      <Text style={styles.title}>{estabelecimento.nomeEstabelecimento}</Text>
      <Text style={styles.subtitle}>
        {estabelecimento.ramoAtividade}
      </Text>

      <View style={styles.infoCard}>
        <Text style={styles.label}>Telefone:</Text>
        <Text style={styles.value}>{estabelecimento.telefone}</Text>

        <Text style={styles.label}>Endereço:</Text>
        <Text style={styles.value}>
          {estabelecimento.logradouro}, {estabelecimento.numero}{" "}
          {estabelecimento.complemento ? `- ${estabelecimento.complemento}` : ""}
        </Text>
        <Text style={styles.value}>
          {estabelecimento.bairro}, {estabelecimento.cidade} - {estabelecimento.estado}
        </Text>
        <Text style={styles.value}>CEP: {estabelecimento.cep}</Text>

        <Text style={styles.label}>Criado em:</Text>
        <Text style={styles.value}>
          {estabelecimento.createdAt?.toDate
            ? estabelecimento.createdAt.toDate().toLocaleString("pt-BR")
            : ""}
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: width * 0.06,
    alignItems: "center",
    backgroundColor: "#fff",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  logo: {
    width: width * 0.4,
    height: width * 0.4,
    borderRadius: width * 0.2,
    marginBottom: 20,
    borderColor: '#c8c8c8ff',
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
    color: "#329de4",
  },
  title: {
    fontSize: width * 0.06,
    fontWeight: "bold",
    color: "#329de4",
    textAlign: "center",
  },
  subtitle: {
    fontSize: width * 0.04,
    color: "#777",
    marginBottom: 20,
    textAlign: "center",
  },
  infoCard: {
    width: "100%",
    backgroundColor: "#f9f9f9",
    padding: 20,
    borderRadius: 12,
    marginTop: 10,
    elevation: 2,
  },
  label: {
    fontWeight: "600",
    color: "#333",
    marginTop: 10,
  },
  value: {
    fontSize: width * 0.04,
    color: "#555",
  },
});
