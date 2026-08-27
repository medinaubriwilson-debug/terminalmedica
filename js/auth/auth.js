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


export async function iniciarSesion(email, password) {
    try {
        return await signInWithEmailAndPassword(
            auth,
            email,
            password
        );
    } catch (error) {

        console.error("Error de inicio de sesión:", error);

        switch (error.code) {

            case "auth/invalid-credential":
            case "auth/wrong-password":
            case "auth/user-not-found":
                throw new Error("Correo o contraseña incorrectos.");

            case "auth/too-many-requests":
                throw new Error(
                    "Demasiados intentos. Espera unos minutos e inténtalo nuevamente."
                );

            case "auth/user-disabled":
                throw new Error(
                    "Esta cuenta ha sido deshabilitada."
                );

            case "auth/invalid-email":
                throw new Error(
                    "El correo electrónico no es válido."
                );

            default:
                throw new Error(
                    "No se pudo iniciar sesión. Inténtalo nuevamente."
                );
        }
    }
}


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
