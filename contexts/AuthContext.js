import React, { createContext, useState, useEffect } from "react";
import { auth, db } from "../firebase/firebaseConfig";
import { createUserWithEmailAndPassword, onAuthStateChanged, sendPasswordResetEmail, deleteUser, signInWithEmailAndPassword, signOut as firebaseSignOut } from "firebase/auth";
import { doc, setDoc, collection } from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as LocalAuthentication from "expo-local-authentication";
import { Alert } from "react-native";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
 
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(
        currentUser ? { uid: currentUser.uid, email: currentUser.email } : null
      );
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);
 
  useEffect(() => {
    const loadUserFromStorage = async () => {
      try {
        const savedUid = await AsyncStorage.getItem("uid");
        if (savedUid && !user) {
          setUser({ uid: savedUid });
        }
      } catch (e) {
        console.log("Erro ao recuperar usuário do storage:", e);
      }
    };

    loadUserFromStorage();
  }, [user]);

  const register = async (email, password, extraData, uploadImageFn) => {
    let user;
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      user = userCredential.user;

      let logoUrl = null;
      if (extraData.logo && uploadImageFn) {
        try {
          logoUrl = await uploadImageFn(extraData.logo);
        } catch (err) {
          await deleteUser(user);
          throw new Error("Falha ao enviar logotipo: " + err.message);
        }
      }

      await setDoc(doc(db, "users", user.uid), {
        email,
        createdAt: new Date(),
      });

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
      if (user) {
        try {
          await deleteUser(user);
        } catch (e) {
          console.warn("Erro ao deletar usuário parcialmente criado:", e);
        }
      }
      throw error;
    }
  };

  const resetPassword = async (email) => sendPasswordResetEmail(auth, email);

  const logout = async () => {
    try {
      await firebaseSignOut(auth);
      setUser(null);
      await AsyncStorage.removeItem("uid");
      await AsyncStorage.removeItem("useBiometrics");
    } catch (error) {
      console.log("Erro ao sair:", error);
    }
  };

  const promptEnableBiometrics = async (uid) => {
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
          onPress: async () => {
            await AsyncStorage.setItem("useBiometrics", "true");
            await AsyncStorage.setItem("uid", uid);
          },
        },
      ]
    );
  };

 const initBiometric = async () => {
  try {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    setBiometricAvailable(compatible && enrolled);

    const useBio = await AsyncStorage.getItem("useBiometrics");
    const savedUid = await AsyncStorage.getItem("uid");
 
    if (compatible && enrolled && useBio === "true") {
      const success = await handleBiometricAuth();
      if (success && savedUid) {
        setUser({ uid: savedUid });
        return true;
      }
    }
 
    if ((!compatible || !enrolled) && savedUid) {
      setUser({ uid: savedUid });
      return true;
    }

    return false;
  } catch (error) {
    console.log("Erro em initBiometric:", error);
    return false;
  }
};


  const handleBiometricAuth = async () => {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: "Login com biometria",
      cancelLabel: "Cancelar",
    });
    return result.success;
  };

  const login = async (email, senha) => {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      senha
    );
    const currentUser = userCredential.user;
    setUser({ uid: currentUser.uid, email: currentUser.email });
    await AsyncStorage.setItem("uid", currentUser.uid);
    return currentUser;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        register,
        resetPassword,
        promptEnableBiometrics,
        initBiometric,
        setUser,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
