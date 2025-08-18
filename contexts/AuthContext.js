import React, { createContext, useState, useEffect } from "react";
import { auth, db } from "../firebase/firebaseConfig";
import { createUserWithEmailAndPassword, onAuthStateChanged } from "firebase/auth";
import { doc, setDoc, collection } from "firebase/firestore";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const register = async (email, password, extraData) => {
  
  const { user } = await createUserWithEmailAndPassword(auth, email, password);

  await setDoc(doc(db, "users", user.uid), {
    email,
    createdAt: new Date()
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
    createdAt: new Date()
  });
};

  return (
    <AuthContext.Provider value={{ user, loading, register }}>
      {children}
    </AuthContext.Provider>
  );
};
