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
      >
        <Stack.Screen name="OnboardingCarousel" component={OnboardingCarousel} options={{ headerShown: false }}/>
        <Stack.Screen name="LoginScreen" component={LoginScreen}  options={{ headerShown: false }}/>
        <Stack.Screen name="HomeScreen" component={HomeScreen} options={{ headerShown: false }}/>
        <Stack.Screen name="Register" component={Register} options={{ title: '' }} />
        <Stack.Screen name='ForgotPassword' component={ForgotPassword} options={{ title: '', headerShown: true }}/>
        <Stack.Screen name='AppointmentsScreen' component={AppointmentsScreen} options={{title: '', headerShown: true }}/>
      </Stack.Navigator>
  );
}
