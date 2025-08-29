import { db } from "../firebase/firebaseConfig";
import { collection, addDoc, query, where, getDocs, orderBy, Timestamp } from "firebase/firestore";

export async function createAgendamento({ userAux, nomeCliente, telefone, dataHora, servico, colaborador }) {
  const agendamentosRef = collection(db, "agendamentos");
  const dataHoraTimestamp = dataHora instanceof Date ? Timestamp.fromDate(dataHora) : dataHora;

  const q = query(agendamentosRef, where("dataHora", "==", dataHoraTimestamp));
  const querySnapshot = await getDocs(q);

  if (!querySnapshot.empty) {
    throw new Error("Já existe um agendamento nesse horário!");
  }

  await addDoc(agendamentosRef, {
    nomeCliente,
    telefone,
    servico,
    colaborador: colaborador || null,
    dataHora: dataHoraTimestamp,
    createdAt: Timestamp.fromDate(new Date()),
    userAux,
  });
}

/**
 * Cria um novo agendamento no Firestore
 * 
 * @param {Object} params
 * @param {string} params.user 
 * @param {string} params.nomeCliente 
 * @param {string} params.telefone
 * @param {Date|string} params.dataHora
 * @param {string} params.colaboradorSelecionado
 * 
 * @returns {Promise<string>} 
 */

export const getAppointmentsByDate = async (uid, startOfDay, endOfDay) => {
  try {
    const agendamentosRef = collection(db, "agendamentos");

    const q = query(
      agendamentosRef,
      where("userAux", "==", uid),
      where("dataHora", ">=", Timestamp.fromDate(startOfDay)),
      where("dataHora", "<=", Timestamp.fromDate(endOfDay)),
      orderBy("dataHora", "asc")
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Erro ao buscar agendamentos:", error);
    throw error;
  }
};