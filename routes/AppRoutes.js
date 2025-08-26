import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';
import OnboardingCarousel from '../onboarding/OnboardingCarousel';
import Register from '../screens/Register';
import ForgotPassword from '../screens/ForgotPassword';
import AppointmentsScreen from '../screens/AppointmentsScreen';

const Stack = createNativeStackNavigator();

export default function AppRoutes({ viewOnboarding }) {
  return (
      <Stack.Navigator
        initialRouteName={viewOnboarding ? 'LoginScreen' : 'OnboardingCarousel'}
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="OnboardingCarousel" component={OnboardingCarousel} />
        <Stack.Screen name="LoginScreen" component={LoginScreen} />
        <Stack.Screen name="HomeScreen" component={HomeScreen} />
        <Stack.Screen name="Register" component={Register} />
        <Stack.Screen name='ForgotPassword' component={ForgotPassword} />
        <Stack.Screen name='AppointmentsScreen' component={AppointmentsScreen} />
      </Stack.Navigator>
  );
}
