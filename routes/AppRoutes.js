import { createNativeStackNavigator } from "@react-navigation/native-stack";
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

const Stack = createNativeStackNavigator();

export default function AppRoutes({ viewOnboarding }) {
  return (
    <Stack.Navigator
      initialRouteName={viewOnboarding ? "LoginScreen" : "OnboardingCarousel"}
    >
      <Stack.Screen name="OnboardingCarousel" component={OnboardingCarousel} options={{ headerShown: false }} />
      <Stack.Screen name="LoginScreen" component={LoginScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Register" component={Register} options={{ title: "" }} />
      <Stack.Screen name="ForgotPassword" component={ForgotPassword} options={{ title: "", headerShown: true }} />
      <Stack.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false }} />
      <Stack.Screen name="AppointmentsScreen" component={AppointmentsScreen} options={{ title: "", headerShown: true }} />
      <Stack.Screen name="About" component={AboutScreen} options={{ title: "" }} />
      <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: "Perfil do Estabelecimento" }} />
      <Stack.Screen name="CollaboratorsScreen" component={CollaboratorsScreen} options={{ title: "Colaboradores" }} />
      <Stack.Screen name="CreateCollaboratorScreen" component={CreateCollaboratorScreen} options={{ title: "Novo Colaborador" }} />
      <Stack.Screen name="EditCollaboratorScreen" component={EditCollaboratorScreen} options={{ title: "Editar colaborador" }} />
      <Stack.Screen name="ClientsScreen" component={ClientsScreen} options={{ title: "Relatório de Clientes" }} />

    </Stack.Navigator>
  );
}
