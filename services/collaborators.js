import { db, storage } from "../firebase/firebaseConfig";
import { doc, setDoc, getDocs, collection, query, where, deleteDoc, onSnapshot, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export async function createCollaborator({ nome, fotoUri, idEstabelecimento, preferenciasSelecionadas }) {
  if (!nome || !nome.trim()) throw new Error("Nome do colaborador é obrigatório");
  if (!idEstabelecimento) throw new Error("ID do estabelecimento não definido");

  let fotoUrl = null;

  if (fotoUri) {
    const response = await fetch(fotoUri);
    const blob = await response.blob();
    const storageRef = ref(storage, `colaboradores/${nome.replace(/\s+/g, "")}.jpg`);
    await uploadBytes(storageRef, blob);
    fotoUrl = await getDownloadURL(storageRef);
  }

  const docId = nome.replace(/\s+/g, "");

  await setDoc(doc(db, "colaboradores", docId), {
    nome: nome.trim(),
    foto: fotoUrl || null,
    idEstabelecimento: idEstabelecimento,
    preferenciasServicos: preferenciasSelecionadas,
    createdAt: new Date(),
  });
}

export async function getCollaboratorsByEstablishment(idEstabelecimento) {
  const q = query(
    collection(db, "colaboradores"),
    where("idEstabelecimento", "==", idEstabelecimento)
  );
  const snapshot = await getDocs(q);

  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function deleteCollaborator(docId) {
  await deleteDoc(doc(db, "colaboradores", docId));
}

export async function updateCollaborator(id, data) {
  const ref = doc(db, "colaboradores", id);
  await updateDoc(ref, data);
}

export function listenCollaborators(estabelecimentoId, callback, onError) {
  const q = query(
    collection(db, "colaboradores"),
    where("idEstabelecimento", "==", estabelecimentoId)
  );

  return onSnapshot(q, callback, onError);
}
