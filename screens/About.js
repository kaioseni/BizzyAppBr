import { View, Text, StyleSheet, ScrollView, Dimensions } from "react-native";

const { width } = Dimensions.get("window");

export default function AboutScreen() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Sobre o BizzyApp</Text>

      <Text style={styles.sectionTitle}>📌 O que é?</Text>
      <Text style={styles.text}>
        O BizzyApp é um aplicativo voltado para gestão de agendamentos de pequenas empresas, 
        criado como parte de um trabalho de pós-graduação e em evolução para se tornar um 
        produto completo.
      </Text>

      <Text style={styles.sectionTitle}>✨ Funcionalidades atuais</Text>
      <Text style={styles.text}>
        - Cadastro e login de usuários com Firebase Authentication {"\n"}
        - Suporte a login via biometria {"\n"}
        - Onboarding inicial com carrossel {"\n"}
        - Agendamento de clientes com data, hora, serviço e colaborador {"\n"}
        - Listagem de agendamentos em tempo real, ordenados por data/hora {"\n"}
        - Indicação visual de agendamentos atrasados {"\n"}
        - Integração com Firestore (coleção {"agendamentos"})
      </Text>

      <Text style={styles.sectionTitle}>🚀 Roadmap</Text>
      <Text style={styles.text}>
        - Implementar Bottom Tabs (Início + Mais opções) {"\n"}
        - Criar menu de funcionalidades extras na aba "Mais" {"\n"}
        - Melhorias no fluxo de login e biometria {"\n"}
        - Refinar telas de perfil, configurações e notificações {"\n"}
        - Publicar em ambiente de testes (Beta)
      </Text>

      <Text style={styles.sectionTitle}>👨‍💻 Desenvolvedor</Text>
      <Text style={styles.text}>
        Kaio Bolpeti Seni Serradela {"\n"}
        Desenvolvedor de Aplicativos Móveis
      </Text>

      <Text style={styles.footer}>
        Versão 0.1.0 • Em desenvolvimento
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: width * 0.05,
    backgroundColor: "#fff",
    flexGrow: 1,
  },
  title: {
    fontSize: width * 0.06,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#329de4",
    textAlign: "center",
  },
  sectionTitle: {
    fontSize: width * 0.045,
    fontWeight: "600",
    marginTop: 15,
    marginBottom: 6,
    color: "#333",
  },
  text: {
    fontSize: width * 0.04,
    color: "#555",
    lineHeight: 22,
  },
  footer: {
    marginTop: 30,
    textAlign: "center",
    fontSize: width * 0.038,
    color: "#999",
  },
});
