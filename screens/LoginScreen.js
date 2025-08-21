import React, { useState, useContext, useEffect } from 'react';
import {
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert
} from 'react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase/firebaseConfig';
import Toast from 'react-native-toast-message';
import { AuthContext } from "../contexts/AuthContext";
import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);

  const { resetPassword } = useContext(AuthContext);

  useEffect(() => {
    initBiometric();
  }, []);

  // Inicializa biometria e tenta login automático se ativada
  const initBiometric = async () => {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    setBiometricAvailable(compatible && enrolled);

    const useBio = await AsyncStorage.getItem("useBiometrics");
    if (compatible && enrolled && useBio === "true") {
      handleBiometricAuth();
    }
  };

  const handleLogin = async () => {
    if (!email || !senha) {
      return showToast('error', 'Erro', 'Preencha todos os campos');
    }

    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, senha);
      setLoading(false);
      showToast('success', 'Login realizado!', 'Bem-vindo de volta 👋');

      await promptEnableBiometrics();

      navigation.navigate('HomeScreen');
    } catch (error) {
      setLoading(false);
      handleAuthError(error);
    }
  };

  const promptEnableBiometrics = async () => {
    if (!biometricAvailable) return;

    const useBio = await AsyncStorage.getItem("useBiometrics");
    if (useBio === "true") return; 

    Alert.alert(
      "Autenticação biométrica",
      "Deseja usar sua biometria para futuros logins?",
      [
        { text: "Agora não", style: "cancel" },
        { 
          text: "Sim", 
          onPress: async () => await AsyncStorage.setItem("useBiometrics", "true")
        }
      ]
    );
  };

  const handleBiometricAuth = async () => {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: "Login com biometria",
      cancelLabel: "Cancelar",
    });

    if (result.success) {
      showToast('success', 'Login realizado!', 'Autenticado via biometria 👆');
      navigation.navigate('HomeScreen');
    }
  };

  const handlePasswordReset = () => navigation.navigate('ForgotPassword');

  const showToast = (type, title, message) => {
    Toast.show({ type, text1: title, text2: message });
  };

  const handleAuthError = (error) => {
    let message = '';
    switch (error.code) {
      case 'auth/user-not-found':
        message = 'Usuário não encontrado. Cadastre-se primeiro.';
        break;
      case 'auth/invalid-credential':
        message = 'Senha incorreta.';
        break;
      case 'auth/invalid-email':
        message = 'E-mail inválido.';
        break;
      default:
        message = error.message;
    }
    showToast('error', 'Erro', message);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Bem-vindo de volta 👋</Text>

        <TextInput
          placeholder="E-mail"
          placeholderTextColor="#999"
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <TextInput
          placeholder="Senha"
          placeholderTextColor="#999"
          style={styles.input}
          value={senha}
          onChangeText={setSenha}
          secureTextEntry
        />

        <TouchableOpacity style={styles.button} onPress={handleLogin} activeOpacity={0.8}>
          <Text style={styles.buttonText}>{loading ? 'Entrando...' : 'Entrar'}</Text>
        </TouchableOpacity>

        
        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
          <Text style={styles.registerText}>
            Ainda não tem conta? <Text style={styles.registerLink}>Cadastre-se</Text>
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handlePasswordReset}>
          <Text style={styles.forgotPasswordText}>Esqueci minha senha</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#329de4',
    marginBottom: 30,
    textAlign: 'center',
  },
  input: {
    height: 50,
    borderColor: '#329de4',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 15,
    fontSize: 16,
    marginBottom: 10,
    color: '#333',
  },
  forgotPasswordText: {
    fontSize: 14,
    color: '#329de4',
    textAlign: 'center',
    marginBottom: 20,
    paddingVertical: 12
  },
  button: {
    backgroundColor: '#329de4',
    paddingVertical: 15,
    borderRadius: 10,
    marginTop: 10,
    marginBottom: 25,
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
  },
  registerText: {
    fontSize: 14,
    color: '#555',
    textAlign: 'center',
  },
  registerLink: {
    color: '#329de4',
    fontWeight: '600',
  },
});
