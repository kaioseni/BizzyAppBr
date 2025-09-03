import { db } from "../firebase/firebaseConfig";
import { collection, doc, getDoc, getDocs, setDoc, deleteDoc, onSnapshot } from "firebase/firestore";

export const fetchServicosRamoRealtime = (ramo, callback) => {
  const ref = collection(db, "ramosDeAtividade", ramo, "ServicosComuns");
  return onSnapshot(ref, (snapshot) => {
    const lista = snapshot.docs.map((doc) => ({ id: doc.id, ramoAtividade: ramo, ...doc.data() }));
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
        isImportado: servico.isImportado || false,
        updatedAt: new Date(),
      });
    }
  } catch (error) {
    console.error("Erro ao atualizar favorito:", error);
    throw error;
  }
}

export const deleteServico = async (userId, ramoUsuario, item) => {
  const servicoRef = doc(db, "ramosDeAtividade", ramoUsuario, "ServicosComuns", item.id);
  await deleteDoc(servicoRef);
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
