import React, { useState, useContext } from 'react';
import { Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { AuthContext } from "../contexts/AuthContext";

export default function ForgotPassword({ navigation }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const { resetPassword } = useContext(AuthContext);

  const handlePasswordReset = async () => {
    if (!email) {
      Toast.show({
        type: 'error',
        text1: 'Aviso!',
        text2: 'Informe o e-mail para recuperar a senha.',
      });
      return;
    }

    setLoading(true);
    try {
      await resetPassword(email);
      setLoading(false);
      Toast.show({
        type: 'success',
        text1: 'E-mail enviado!',
        text2: 'Verifique sua caixa de entrada para redefinir a senha.',
      });
    } catch (error) {
      setLoading(false);
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
        <Text style={styles.title}>Recuperar Senha 🔑</Text>

        <TextInput
          placeholder="Digite seu e-mail"
          placeholderTextColor="#999"
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <TouchableOpacity style={styles.button} onPress={handlePasswordReset} activeOpacity={0.8}>
          <Text style={styles.buttonText}>{loading ? 'Enviando...' : 'Redefinir Senha'}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('LoginScreen')}>
          <Text style={styles.backText}>Voltar para Login</Text>
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
    marginBottom: 15,
    color: '#333',
  },
  button: {
    backgroundColor: '#329de4',
    paddingVertical: 15,
    borderRadius: 10,
    marginTop: 10,
    marginBottom: 20,
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
  },
  backText: {
    fontSize: 14,
    color: '#329de4',
    textAlign: 'center',
    marginTop: 10,
  },
});
