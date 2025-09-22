import React, { useContext } from "react";
import { ScrollView, Text, StyleSheet, Dimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ThemeContext } from "../contexts/ThemeContext";
import { lightTheme, darkTheme } from "../utils/themes";

const { width } = Dimensions.get("window");

export default function AboutScreen() {
  const { effectiveTheme } = useContext(ThemeContext);
  const currentTheme = effectiveTheme === "dark" ? darkTheme : lightTheme;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: currentTheme.background }}>
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
          O BizzyApp é um aplicativo completo para gestão de agendamentos e organização de pequenas empresas, 
          com funcionalidades voltadas para eficiência, controle e experiência do usuário.
        </Text>

        <Text style={[styles.sectionTitle, { color: currentTheme.text }]}>
          ✨ Funcionalidades
        </Text>
        <Text style={[styles.text, { color: currentTheme.textSecondary }]}>
          - Cadastro e login de usuários via Firebase Authentication {"\n"}
          - Login com e-mail/senha e suporte à autenticação biométrica {"\n"}
          - Onboarding inicial com carrossel explicativo {"\n"}
          - Cadastro e edição de perfil de estabelecimento {"\n"}
          - Upload e gerenciamento de logotipo do estabelecimento {"\n"}
          - Gerenciamento de endereço completo com busca via CEP {"\n"}
          - Cadastro e seleção de ramos de atividade do estabelecimento {"\n"}
          - Criação, edição e exclusão de agendamentos {"\n"}
          - Agendamento com data, hora, serviço e colaborador {"\n"}
          - Listagem de agendamentos em tempo real, ordenados por data/hora {"\n"}
          - Indicação visual de agendamentos atrasados {"\n"}
          - Tela de bloqueio com senha e opção de exibir/esconder senha {"\n"}
          - Redefinição de senha via e-mail {"\n"}
          - Tema claro/escuro dinâmico em todo o app {"\n"}
          - Integração completa com Firebase Firestore para persistência de dados
        </Text>

        <Text style={[styles.sectionTitle, { color: currentTheme.text }]}>
          🚀 Roadmap futuro
        </Text>
        <Text style={[styles.text, { color: currentTheme.textSecondary }]}>
          - Implementar relatórios avançados de agendamento {"\n"}
          - Melhorias na experiência de usuário e fluxos do app {"\n"}
          - Possibilidade de integração com pagamentos online {"\n"}
          - Recursos de marketing e fidelização de clientes {"\n"}
          - Publicação em ambiente de testes (Beta) e em produção
        </Text>

        <Text style={[styles.sectionTitle, { color: currentTheme.text }]}>
          👨‍💻 Desenvolvedor
        </Text>
        <Text style={[styles.text, { color: currentTheme.textSecondary }]}>
          Kaio Bolpeti Seni Serradela {"\n"}
          Desenvolvedor de Aplicativos Móveis
        </Text>

        <Text style={[styles.footer, { color: currentTheme.textSecondary }]}>
          Versão 1.0.0 • Aplicativo concluído
        </Text>
      </ScrollView>
    </SafeAreaView>
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
