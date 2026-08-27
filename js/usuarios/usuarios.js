import { db } from "../config/firebase.js";

import {
    doc,
    getDoc,
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";


/*
 * Obtiene el perfil del usuario actualmente autenticado.
 */
export async function cargarPerfilUsuario(user) {

    if (!user) {
        return null;
    }

    try {

        const perfilRef = doc(
            db,
            "usuarios",
            user.uid
        );

        const perfilSnap = await getDoc(perfilRef);

        if (!perfilSnap.exists()) {

            console.warn(
                "No existe perfil para:",
                user.uid
            );

            return null;
        }

        const perfil = perfilSnap.data();

        return perfil;

    } catch (error) {

        console.error(
            "Error cargando perfil de usuario:",
            error
        );

        return null;
    }
}


/*
 * Obtiene todos los usuarios registrados
 * en Firestore.
 *
 * Esta función NO requiere que exista
 * una sesión autenticada porque las Rules
 * permiten lectura de /usuarios.
 */
export async function obtenerUsuariosRegistrados() {

    try {

        const usuariosRef =
            collection(db, "usuarios");

        const snapshot =
            await getDocs(usuariosRef);

        const usuarios = [];

        snapshot.forEach(documento => {

            usuarios.push({
                id: documento.id,
                ...documento.data()
            });

        });

        console.log(
            "Usuarios registrados:",
            usuarios
        );

        return usuarios;

    } catch (error) {

        console.error(
            "Error obteniendo usuarios registrados:",
            error
        );

        throw error;
    }
}
