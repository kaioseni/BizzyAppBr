import React, { useState, useContext } from 'react';
import {
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  View
} from 'react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase/firebaseConfig';
import Toast from 'react-native-toast-message';
import { AuthContext } from "../contexts/AuthContext";

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);

  const { resetPassword } = useContext(AuthContext);

  const handleLogin = async () => {
    if (!email || !senha) {
      Toast.show({
        type: 'error',
        text1: 'Erro',
        text2: 'Preencha todos os campos',
      });
      return;
    }

    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, senha);
      setLoading(false);
      Toast.show({
        type: 'success',
        text1: 'Login realizado!',
        text2: 'Bem-vindo de volta 👋',
      });
      navigation.navigate('HomeScreen');
    } catch (error) {
      setLoading(false);

      let message = '';
      if (error.code === 'auth/user-not-found') {
        message = 'Usuário não encontrado. Cadastre-se primeiro.';
      } else if (error.code === 'auth/invalid-credential') {
        message = 'Senha incorreta.';
      } else if (error.code === 'auth/invalid-email') {
        message = 'E-mail inválido.';
      } else {
        message = error.message;
      }

      Toast.show({
        type: 'error',
        text1: 'Erro',
        text2: message,
      });
    }
  };

  const handlePasswordReset = async () => {
    if (!email) {
      Toast.show({
        type: 'error',
        text1: 'Aviso!',
        text2: 'Informe o e-mail para recuperar a senha.',
      });
      return;
    }

    try {
      await resetPassword(email);
      Toast.show({
        type: 'success',
        text1: 'E-mail enviado!',
        text2: 'Verifique sua caixa de entrada para redefinir a senha.',
      });
    } catch (error) {
      let message = '';
      if (error.code === 'auth/user-not-found') {
        message = 'Usuário não encontrado.';
      } else if (error.code === 'auth/invalid-email') {
        message = 'E-mail inválido.';
      } else {
        message = error.message;
      }

      Toast.show({
        type: 'error',
        text1: 'Erro',
        text2: message,
      });
    }
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
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
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
