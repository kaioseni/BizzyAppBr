import { db } from "../firebase/firebaseConfig";
import { collection, doc, getDoc, getDocs, setDoc, deleteDoc, onSnapshot } from "firebase/firestore";

export const fetchServicosRamoRealtime = (ramo, callback) => {
  const ref = collection(db, "ramosDeAtividade", ramo, "ServicosComuns");
  return onSnapshot(ref, (snapshot) => {
    const lista = snapshot.docs.map((doc) => ({
      id: doc.id,
      ramoAtividade: ramo,
      ...doc.data(),
    }));
    callback(lista);
  });
};

export const fetchServicosImportadosRealtime = (userId, callback) => {
  const ref = collection(db, "users", userId, "servicosImportados");
  return onSnapshot(ref, (snapshot) => {
    const lista = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    callback(lista);
  });
};

export const fetchServicosPersonalizadosRealtime = (uid, callback) => {
  const ref = collection(db, "estabelecimentos", uid, "servicosPersonalizados");
  return onSnapshot(ref, (snapshot) => {
    const lista = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    callback(lista);
  });
};

export const fetchFavoritosRealtime = (userId, callback) => {
  const ref = collection(db, "users", userId, "favoritos");
  return onSnapshot(ref, (snapshot) => {
    const favIds = new Set(snapshot.docs.map((doc) => doc.id));
    callback(favIds);
  });
};

export async function toggleFavorito(userId, servico, isFavorito) {
  try {
    const favRef = doc(db, "users", userId, "favoritos", servico.id);

    if (isFavorito) {
      await deleteDoc(favRef);
    } else {
      await setDoc(favRef, {
        nome: servico.nome,
        descricao: servico.descricao || "",
        tipo: servico.tipo,
        updatedAt: new Date(),
      });
    }
  } catch (error) {
    console.error("Erro ao atualizar favorito:", error);
    throw error;
  }
}

export const deleteServico = async (userId, ramoUsuario, item) => {
  if (item.tipo === "padrao") {
     
    await ocultarServicoPadraoParaUsuario(userId, item.id);
  } else if (item.tipo === "importado") {
    await removerServicoImportado(userId, item.id);
  } else if (item.tipo === "personalizado") {
    await removerServicoPersonalizado(userId, item.id);
  }

  
  const favRef = doc(db, "users", userId, "favoritos", item.id);
  await deleteDoc(favRef);
};

export const importarServicoUsuario = async (userId, item) => {
  const ref = doc(db, "users", userId, "servicosImportados", item.id);
  await setDoc(ref, {
    nome: item.nome,
    descricao: item.descricao || "",
    ramoOriginal: item.ramoAtividade,
    createdAt: new Date(),
  });
};

export const removerServicoImportado = async (userId, itemId) => {
  const ref = doc(db, "users", userId, "servicosImportados", itemId);
  await deleteDoc(ref);
};

export const removerServicoPersonalizado = async (userId, itemId) => {
  const ref = doc(db, "estabelecimentos", userId, "servicosPersonalizados", itemId);
  await deleteDoc(ref);
};

export const removerServicoUsuario = async (userId, itemId, tipo) => {
  const colecao = tipo === "importado" ? "servicosImportados" : "servicosPersonalizados";
  const ref = doc(db, "users", userId, colecao, itemId);
  await deleteDoc(ref);
};

export const fetchRamos = async () => {
  const ramosSnap = await getDocs(collection(db, "ramosDeAtividade"));
  return ramosSnap.docs.map((doc) => doc.id);
};

export const fetchRamoUsuario = async (userId) => {
  const estabRef = doc(db, "estabelecimentos", userId);
  const estabSnap = await getDoc(estabRef);
  if (!estabSnap.exists()) return null;
  return estabSnap.data().ramoAtividade || null;
};

export const updateServico = async (userId, servico) => {
  if (!userId || !servico?.id) {
    throw new Error("Parâmetros inválidos para updateServico");
  }

  const ref = doc(
    db,
    "estabelecimentos",
    userId,
    "servicosPersonalizados",
    servico.id
  );

  await setDoc(
    ref,
    {
      idOriginal: servico.id,
      nome: servico.nome,
      descricao: servico.descricao,
      tipo: "personalizado",
      atualizadoEm: new Date(),
    },
    { merge: true }
  );
};

export const ocultarServicoPadraoParaUsuario = async (userId, servicoId) => {
  const ref = doc(db, "users", userId, "servicosOcultos", servicoId);
  await setDoc(ref, { ocultoEm: new Date() });
};

