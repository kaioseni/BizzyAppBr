import React, { createContext, useState, useEffect } from "react";
import { auth, db } from "../firebase/firebaseConfig";
import { createUserWithEmailAndPassword, onAuthStateChanged, sendPasswordResetEmail } from "firebase/auth";
import { doc, setDoc, collection } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import * as FileSystem from "expo-file-system";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const storage = getStorage();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

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

  return (
    <AuthContext.Provider value={{ user, loading, register, resetPassword }}>
      {children}
    </AuthContext.Provider>
  );
};
