import React, { createContext, useState, useEffect } from "react";
import { auth, db } from "../firebase/firebaseConfig";
import { createUserWithEmailAndPassword, onAuthStateChanged, sendPasswordResetEmail } from "firebase/auth";
import { doc, setDoc, collection } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from "react-native";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const storage = getStorage();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [biometricAvailable, setBiometricAvailable] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser.uid) {
        setUser(currentUser.uid);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Upload de imagem
  const uploadImageAsync = async (uri, path) => {
    const response = await fetch(uri);
    const blob = await response.blob();
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, blob);
    return await getDownloadURL(storageRef);
  };

  const register = async (email, password, extraData) => {
    const { user } = await createUserWithEmailAndPassword(auth, email, password);

    await setDoc(doc(db, "users", user.uid), { email, createdAt: new Date() });

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
  };

  const resetPassword = async (email) => sendPasswordResetEmail(auth, email);

  const promptEnableBiometrics = async () => {
    if (!biometricAvailable) return;
    const useBio = await AsyncStorage.getItem("useBiometrics");
    if (useBio === "true") return;
    Alert.alert("Autenticação biométrica", "Deseja usar sua biometria para futuros logins?", [
      { text: "Agora não", style: "cancel" },
      { text: "Sim", onPress: async () => await AsyncStorage.setItem("useBiometrics", "true") }
    ]);
  };

  const initBiometric = async () => {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    setBiometricAvailable(compatible && enrolled);
    const useBio = await AsyncStorage.getItem("useBiometrics");
    if (compatible && enrolled && useBio === "true") return await handleBiometricAuth();
    return false;
  };

  const handleBiometricAuth = async () => {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: "Login com biometria",
      cancelLabel: "Cancelar",
    });
    return result.success;
  };

  return (
    <AuthContext.Provider value={{ user, loading, register, resetPassword, promptEnableBiometrics, initBiometric, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};
