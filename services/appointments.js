import { db } from "../firebase/firebaseConfig";
import { collection, addDoc, query, where, getDocs } from "firebase/firestore";

export async function criarAgendamento({ nomeCliente, telefone, dataHora }) {
  const agendamentosRef = collection(db, "agendamentos");

  const q = query(agendamentosRef, where("dataHora", "==", dataHora.toISOString()));
  const querySnapshot = await getDocs(q);

  if (!querySnapshot.empty) {
    throw new Error("Já existe um agendamento nesse horário!");
  }

  await addDoc(agendamentosRef, {
    nomeCliente,
    telefone,
    dataHora: dataHora.toISOString(),
    createdAt: new Date().toISOString(),
  });
}
