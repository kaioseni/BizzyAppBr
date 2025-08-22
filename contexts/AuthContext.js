import React, { createContext, useState, useEffect } from "react";
import { auth, db } from "../firebase/firebaseConfig";
import { createUserWithEmailAndPassword, onAuthStateChanged, sendPasswordResetEmail } from "firebase/auth";
import { doc, setDoc, collection } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import * as FileSystem from "expo-file-system";
import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from "react-native";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const storage = getStorage();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [biometricAvailable, setBiometricAvailable] = useState();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const uploadImageAsync = async (uri, path) => {
    try {

      const response = await fetch(uri);
      const blob = await response.blob();

      const storageRef = ref(storage, path);

      await uploadBytes(storageRef, blob);

      const downloadURL = await getDownloadURL(storageRef);
      return downloadURL;
    } catch (error) {
      console.log("Erro ao fazer upload da imagem:", error);
      throw new Error("Falha ao fazer upload da imagem.");
    }
  };

  const register = async (email, password, extraData) => {
    try {
      const { user } = await createUserWithEmailAndPassword(auth, email, password);

      await setDoc(doc(db, "users", user.uid), {
        email,
        createdAt: new Date(),
      });

      let logoUrl = null;
      if (extraData.logo) {
        const fileName = `${Date.now()}_${extraData.nomeEstabelecimento}.jpg`;
        logoUrl = await uploadImageAsync(extraData.logo, `logos/${fileName}`);
      }

      await setDoc(doc(collection(db, "estabelecimentos"), user.uid), {
        userId: user.uid,
        nomeEstabelecimento: extraData.nomeEstabelecimento,
        telefone: extraData.telefone,
        cep: extraData.cep,
        logradouro: extraData.logradouro,
        bairro: extraData.bairro,
        cidade: extraData.cidade,
        estado: extraData.estado,
        numero: extraData.numero,
        complemento: extraData.complemento,
        logo: logoUrl,
        ramoAtividade: extraData.ramoAtividade,
        createdAt: new Date(),
      });

      return user;
    } catch (error) {
      console.log("Erro no register:", error);
      throw error;
    }
  };

  const resetPassword = async (email) => {
    return sendPasswordResetEmail(auth, email);
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

  const initBiometric = async () => {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    setBiometricAvailable(compatible && enrolled);

    const useBio = await AsyncStorage.getItem("useBiometrics");
    if (compatible && enrolled && useBio === "true") {
      return await handleBiometricAuth();
    }
    return false;
  };

  const handleBiometricAuth = async () => {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: "Login com biometria",
      cancelLabel: "Cancelar",
    });

    if (result.success) {
      return true;
    }
    return false;
  };

  return (
    <AuthContext.Provider value={{ user, loading, register, resetPassword, promptEnableBiometrics, initBiometric }}>
      {children}
    </AuthContext.Provider>
  );
};
