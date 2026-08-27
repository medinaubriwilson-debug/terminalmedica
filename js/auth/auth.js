import { auth, db } from "../config/firebase.js";

import {
    onAuthStateChanged,
    signInWithEmailAndPassword,
    signOut,
    createUserWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";

import {
    doc,
    setDoc
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";


export const observarSesion = (callback) =>
    onAuthStateChanged(auth, callback);


export const iniciarSesion = (email, password) =>
    signInWithEmailAndPassword(auth, email, password);


export const cerrarSesion = () =>
    signOut(auth);


export async function crearCuenta(email, password, perfil = {}) {

    const credential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
    );

    await setDoc(
        doc(db, "usuarios", credential.user.uid),
        {
            name: perfil.name || "",
            email,
            phone: perfil.phone || "",
            role: perfil.role || "",
            company: perfil.company || ""
        }
    );

    return credential;
}
