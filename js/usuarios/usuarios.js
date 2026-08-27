import { auth, db } from "../config/firebase.js";

import {
    doc,
    getDoc,
    setDoc,
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";


export async function cargarPerfilUsuario(user) {
    if (!user) return null;

    try {
        const ref = doc(db, "usuarios", user.uid);
        const snap = await getDoc(ref);

        if (!snap.exists()) {
            console.warn("No existe perfil para el usuario:", user.uid);
            return null;
        }

        const perfil = snap.data();

        // Actualizar nombre
        const currentName = document.getElementById("current-name");
        if (currentName) {
            currentName.textContent = perfil.name || "Usuario";
        }

        // Actualizar correo
        const currentEmail = document.getElementById("current-email");
        if (currentEmail) {
            currentEmail.textContent = perfil.email || user.email || "";
        }

        // Actualizar rol
        const currentRole = document.querySelector("#current-user .role");
        if (currentRole) {
            currentRole.textContent = perfil.role || "Sin rol";
        }

        // Actualizar nombre del perfil
        const profileName = document.getElementById("profile-name");
        if (profileName) {
            profileName.value = perfil.name || "";
        }

        // Actualizar correo del perfil
        const profileEmail = document.getElementById("profile-email");
        if (profileEmail) {
            profileEmail.value = perfil.email || user.email || "";
        }

        // Actualizar teléfono
        const profilePhone = document.getElementById("profile-phone");
        if (profilePhone) {
            profilePhone.value = perfil.phone || "";
        }

        // Actualizar rol
        const profileRole = document.getElementById("profile-role");
        if (profileRole) {
            profileRole.value = perfil.role || "";
        }

        // Actualizar empresa
        const profileCompany = document.getElementById("profile-company");
        if (profileCompany) {
            profileCompany.value = perfil.company || "";
        }

        return perfil;

    } catch (error) {
        console.error("Error cargando perfil:", error);
        return null;
    }
} {
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
