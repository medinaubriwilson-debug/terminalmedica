import { pacientesRef } from "../config/firebase.js";

import {
    addDoc,
    onSnapshot,
    doc,
    deleteDoc,
    updateDoc,
    query,
    orderBy
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";


export function observarPacientes(callback) {

    const consulta = query(
        pacientesRef,
        orderBy("fechaIngreso", "desc")
    );

    return onSnapshot(consulta, callback);
}


export function agregarPaciente(datos) {

    return addDoc(pacientesRef, datos);
}


export function actualizarPaciente(id, datos) {

    return updateDoc(
        doc(pacientesRef, id),
        datos
    );
}


export function eliminarPaciente(id) {

    return deleteDoc(
        doc(pacientesRef, id)
    );
}