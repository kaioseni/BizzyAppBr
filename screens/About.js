import { useContext } from "react";
import { ScrollView, Text, StyleSheet, Dimensions } from "react-native";
import { ThemeContext } from "../contexts/ThemeContext";
import { lightTheme, darkTheme } from "../utils/themes";

const { width } = Dimensions.get("window");

export default function AboutScreen() {
  const { effectiveTheme } = useContext(ThemeContext);
  const currentTheme = effectiveTheme === "dark" ? darkTheme : lightTheme;

  return (
    <ScrollView
      contentContainerStyle={[styles.container, { backgroundColor: currentTheme.background }]}
    >
      <Text style={[styles.title, { color: currentTheme.primary }]}>
        Sobre o BizzyApp
      </Text>

      <Text style={[styles.sectionTitle, { color: currentTheme.text }]}>
        📌 O que é?
      </Text>
      <Text style={[styles.text, { color: currentTheme.text }]}>
        O BizzyApp é um aplicativo voltado para gestão de agendamentos de pequenas empresas, 
        criado como parte de um trabalho de pós-graduação e em evolução para se tornar um 
        produto completo.
      </Text>

      <Text style={[styles.sectionTitle, { color: currentTheme.text }]}>
        ✨ Funcionalidades atuais
      </Text>
      <Text style={[styles.text, { color: currentTheme.textSecondary }]}>
        - Cadastro e login de usuários com Firebase Authentication {"\n"}
        - Suporte a login via biometria {"\n"}
        - Onboarding inicial com carrossel {"\n"}
        - Agendamento de clientes com data, hora, serviço e colaborador {"\n"}
        - Listagem de agendamentos em tempo real, ordenados por data/hora {"\n"}
        - Indicação visual de agendamentos atrasados {"\n"}
        - Integração com Firestore (coleção {"agendamentos"})
      </Text>

      <Text style={[styles.sectionTitle, { color: currentTheme.text }]}>
        🚀 Roadmap
      </Text>
      <Text style={[styles.text, { color: currentTheme.textSecondary }]}>
        - Implementar Bottom Tabs (Início + Mais opções) {"\n"}
        - Criar menu de funcionalidades extras na aba "Mais" {"\n"}
        - Melhorias no fluxo de login e biometria {"\n"}
        - Refinar telas de perfil, configurações e notificações {"\n"}
        - Publicar em ambiente de testes (Beta)
      </Text>

      <Text style={[styles.sectionTitle, { color: currentTheme.text }]}>
        👨‍💻 Desenvolvedor
      </Text>
      <Text style={[styles.text, { color: currentTheme.textSecondary }]}>
        Kaio Bolpeti Seni Serradela {"\n"}
        Desenvolvedor de Aplicativos Móveis
      </Text>

      <Text style={[styles.footer, { color: currentTheme.textSecondary }]}>
        Versão 0.1.0 • Em desenvolvimento
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: width * 0.05,
  },
  title: {
    fontSize: width * 0.06,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  sectionTitle: {
    fontSize: width * 0.045,
    fontWeight: "600",
    marginTop: 15,
    marginBottom: 6,
  },
  text: {
    fontSize: width * 0.04,
    lineHeight: 22,
  },
  footer: {
    marginTop: 30,
    textAlign: "center",
    fontSize: width * 0.038,
  },
});
