import React, { useState, useContext, useEffect } from 'react';
import {
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase/firebaseConfig';
import Toast from 'react-native-toast-message';
import { AuthContext } from "../contexts/AuthContext";

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);

  const { promptEnableBiometrics, initBiometric, setUser } = useContext(AuthContext);

  useEffect(() => {
    const checkBio = async () => {
      const success = await initBiometric();
      if (success) {
        showToast('success', 'Login realizado!', 'Autenticado via biometria 👆');
        navigation.navigate('HomeScreen');
      }
    };
    checkBio();
  }, []);



  const handleLogin = async () => {
  if (!email || !senha) {
    showToast('error', 'Erro', 'Preencha todos os campos');
    return;
  }

  setLoading(true);
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, senha);
    const currentUser = userCredential.user;

    // Atualiza o user no contexto como objeto { uid, email }
    setUser({ uid: currentUser.uid, email: currentUser.email });

    showToast('success', 'Login realizado!', 'Bem-vindo de volta 👋');

    await promptEnableBiometrics();

    navigation.navigate('HomeScreen');
  } catch (error) {
    handleAuthError(error);
  } finally {
    setLoading(false);
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
