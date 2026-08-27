import { auth, db } from "../config/firebase.js";

import {
    doc,
    getDoc,
    setDoc,
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";


export async function cargarPerfilUsuario({
    uid,
    signupName,
    signupPhone,
    signupRole,
    signupCompany,
    profileName,
    profileEmail,
    profilePhone,
    profileRole,
    profileCompany,
    profileMessage
}) {
    if (!uid) return;

    try {
        const perfilRef = doc(db, "usuarios", uid);
        const perfilSnap = await getDoc(perfilRef);

        let perfil = perfilSnap.exists()
            ? perfilSnap.data()
            : null;

        if (!perfil) {
            perfil = {
                name: signupName?.value?.trim() || "",
                email: auth.currentUser?.email || "",
                phone: signupPhone?.value?.trim() || "",
                role: signupRole?.value?.trim() || "",
                company: signupCompany?.value?.trim() || ""
            };

            await setDoc(perfilRef, perfil, { merge: true });
        }

        if (profileName) {
            profileName.value = perfil.name || "";
        }

        if (profileEmail) {
            profileEmail.value =
                auth.currentUser?.email ||
                perfil.email ||
                "";
        }

        if (profilePhone) {
            profilePhone.value = perfil.phone || "";
        }

        if (profileRole) {
            profileRole.value = perfil.role || "";
        }

        if (profileCompany) {
            profileCompany.value = perfil.company || "";
        }

        const nameText =
            document.querySelector(".user-profile .name");

        const roleText =
            document.querySelector(".user-profile .role");

        const avatar =
            document.querySelector(".user-profile .avatar");

        if (nameText) {
            nameText.textContent =
                perfil.name ||
                auth.currentUser?.email ||
                "Usuario";
        }

        if (roleText) {
            roleText.textContent =
                perfil.role ||
                "Administrador";
        }

        if (avatar) {
            const initials = (
                perfil.name ||
                auth.currentUser?.email ||
                "US"
            )
                .split(" ")
                .map(word => word[0] || "")
                .join("")
                .slice(0, 2)
                .toUpperCase();

            avatar.textContent = initials;
        }

        if (profileMessage) {
            profileMessage.textContent =
                "Perfil cargado. Puedes editarlo y guardar los cambios.";
        }

    } catch (error) {
        console.error(
            "Error cargando perfil de usuario:",
            error
        );
    }
    
}export async function obtenerUsuariosRegistrados() {
    const usuariosCol = collection(db, "usuarios");
    const qSnap = await getDocs(usuariosCol);

    const users = [];

    qSnap.forEach(docItem => {
        const usuario = docItem.data();

        users.push({
            ...usuario,
            _id: docItem.id
        });
    });

    return users;
}