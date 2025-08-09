import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import OnboardingCarousel from './onboarding/OnboardingCarousel';
import LoginScreen from './screens/LoginScreen'
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

const Loading = () => {
  <View>
    <ActivityIndicator size="large" />
  </View>
}

export default function App() {

  const [loading, setLoading] = useState(true);
  const [viewOnboarding, setViewOnboarding] = useState(false);


  const checkOnboarding = async () => {

    try {
      const value = await AsyncStorage.getItem('@viewedOnboarding');

      if (value !== null) {
        setViewOnboarding(true)
      }
    } catch (err) {
      console.log('Error @checkOnboarding: ', err)
    } finally {
      setLoading(false)
    }

  }

  useEffect(() => {
    checkOnboarding();
  },[]);

  return (
    <View style={styles.container}>
      {loading ? <Loading /> : viewOnboarding ? <LoginScreen /> : <OnboardingCarousel />}
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
