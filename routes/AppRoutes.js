import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useContext } from "react";
import { ThemeContext } from "../contexts/ThemeContext";
import { lightTheme, darkTheme } from "../utils/themes";
import LoginScreen from "../screens/LoginScreen";
import OnboardingCarousel from "../onboarding/OnboardingCarousel";
import Register from "../screens/Register";
import ForgotPassword from "../screens/ForgotPassword";
import AppointmentsScreen from "../screens/AppointmentsScreen";
import AboutScreen from "../screens/About";
import MainTabs from "./MainTabs";
import ProfileScreen from "../screens/ProfileScreen";
import CollaboratorsScreen from "../screens/CollaboratorsScreen";
import CreateCollaboratorScreen from "../screens/CreateCollaboratorScreen";
import EditCollaboratorScreen from "../screens/EditCollaboratorScreen";
import ClientsScreen from "../screens/ClientsScreen";
import ServiceScreen from "../screens/ServiceScreen";
import CreateServiceScreen from "../screens/CreateServiceScreen";
import EditServiceScreen from "../screens/EditServiceScreen";
import ManageServiceScreen from "../screens/ManageServiceScreen";
import FinishedScreen from "../screens/FinishedScreen";
import ThemeSettingsScreen from "../screens/ThemeSettingsScreen";

const Stack = createNativeStackNavigator();

export default function AppRoutes({ viewOnboarding }) {
  const { theme } = useContext(ThemeContext);
  const currentTheme = theme === "dark" ? darkTheme : lightTheme;

  return (
    <Stack.Navigator
      initialRouteName={viewOnboarding ? "LoginScreen" : "OnboardingCarousel"}
      screenOptions={{
        headerStyle: { backgroundColor: currentTheme.background },
        headerTintColor: currentTheme.text,
        contentStyle: { backgroundColor: currentTheme.background },
      }}
    >
      <Stack.Screen name="OnboardingCarousel" component={OnboardingCarousel} options={{ headerShown: false }} />
      <Stack.Screen name="LoginScreen" component={LoginScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Register" component={Register} options={{ title: "" }} />
      <Stack.Screen name="ForgotPassword" component={ForgotPassword} options={{ title: "", headerShown: true }} />
      <Stack.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false }} />
      <Stack.Screen name="AppointmentsScreen" component={AppointmentsScreen} options={{ title: "Novo Agendamento" }} />
      <Stack.Screen name="About" component={AboutScreen} options={{ title: "" }} />
      <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: "Perfil do Estabelecimento" }} />
      <Stack.Screen name="CollaboratorsScreen" component={CollaboratorsScreen} options={{ title: "Colaboradores" }} />
      <Stack.Screen name="CreateCollaboratorScreen" component={CreateCollaboratorScreen} options={{ title: "Novo Colaborador" }} />
      <Stack.Screen name="EditCollaboratorScreen" component={EditCollaboratorScreen} options={{ title: "Editar colaborador" }} />
      <Stack.Screen name="ClientsScreen" component={ClientsScreen} options={{ title: "Relatório de Clientes" }} />
      <Stack.Screen name="ServicesScreen" component={ServiceScreen} options={{ title: "Tipos de Serviços" }} />
      <Stack.Screen name="CreateServiceScreen" component={CreateServiceScreen} options={{ title: "Novo Tipo de Serviço" }} />
      <Stack.Screen name="EditServiceScreen" component={EditServiceScreen} options={{ title: "Editar Serviço" }} />
      <Stack.Screen name="ManageService" component={ManageServiceScreen} options={{ title: "Editar Agendamento" }} />
      <Stack.Screen name="FinishedScreen" component={FinishedScreen} options={{ title: "Agendamentos Finalizados" }} />
      <Stack.Screen name="ThemeSettingsScreen" component={ThemeSettingsScreen} options={{ title: "Tema do Aplicativo" }} />
    </Stack.Navigator>
  );
}
