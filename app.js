import { db, auth } from "./js/config/firebase.js";
import { observarSesion, iniciarSesion, cerrarSesion, crearCuenta } from "./js/auth/auth.js";
import { observarPacientes, agregarPaciente, actualizarPaciente, eliminarPaciente } from "./js/pacientes/pacientes.js";
import { renderizarAlmanaque, focusCalendarTo, attachDatePicker, parseFormattedDate } from "./js/calendario/calendario.js";
import {
    collection,
    doc,
    getDoc,
    setDoc,
    getDocs
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";
    import {
    cargarPerfilUsuario,
    obtenerUsuariosRegistrados
} from "./js/usuarios/usuarios.js";

document.addEventListener("DOMContentLoaded", () => {
    const anioActual = new Date().getFullYear();
    const mesesAnuales = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    const diasSemana = ["D", "L", "M", "M", "J", "V", "S"];
    
    // Mapeo absoluto del DOM (IDs Exactos Unificados)
    const gridMeses = document.getElementById("grid-meses");
    const monthIndicator = document.getElementById("month-indicator");
    
    const formAdmision = document.getElementById("form-admision");
    const tablaPacientes = document.getElementById("tabla-pacientes-body");
    const inputBuscar = document.getElementById("buscar-paciente");

    const inputNombrePaciente = document.getElementById("paciente-nombre");
    const inputRecordPaciente = document.getElementById("paciente-record");
    const inputCedulaPaciente = document.getElementById("paciente-cedula");
    const inputTelefonoPaciente = document.getElementById("paciente-telefono");
    const inputFechaPaciente = document.getElementById("paciente-fecha");
    const inputComentarioPaciente = document.getElementById("paciente-comentario");

    const modalEditar = document.getElementById("modal-editar");
    const formEditar = document.getElementById("form-editar-paciente");
    const btnCerrarModal = document.getElementById("cerrar-modal");
    const btnCancelarModal = document.getElementById("btn-cancelar-modal");

    const themeToggle = document.getElementById("theme-toggle");
    const themeText = document.getElementById("theme-text");

    const bookedDates = new Set();
    let dateSelectionTarget = null; // will hold the input element (paciente-fecha or edit-fecha) when user wants to pick a date

    // Login / Signup elements
    const loginScreen = document.getElementById("login-screen");
    const formLogin = document.getElementById("form-login");
    const loginEmail = document.getElementById("login-email");
    const loginPassword = document.getElementById("login-password");
    const loginError = document.getElementById("login-error");

    const formSignup = document.getElementById("form-signup");
    const signupName = document.getElementById("signup-name");
    const signupEmail = document.getElementById("signup-email");
    const signupPassword = document.getElementById("signup-password");
    const signupConfirm = document.getElementById("signup-confirm");
    const signupPhone = document.getElementById("signup-phone");
    const signupRole = document.getElementById("signup-role");
    const signupCompany = document.getElementById("signup-company");
    const signupError = document.getElementById("signup-error");
    const signupSuccess = document.getElementById("signup-success");
    const showSignup = document.getElementById("show-signup");
    const showLogin = document.getElementById("show-login");

    // User profile elements
    const profileName = document.getElementById("profile-name");
    const profileEmail = document.getElementById("profile-email");
    const profilePhone = document.getElementById("profile-phone");
    const profileRole = document.getElementById("profile-role");
    const profileCompany = document.getElementById("profile-company");
    const profileMessage = document.getElementById("profile-message");
    const formUserProfile = document.getElementById("form-user-profile");

    // Registered users modal elements (accounts panel)
    const showRegisteredUsers = document.getElementById('show-registered-users');
    const modalRegisteredUsers = document.getElementById('modal-registered-users');
    const closeRegisteredUsers = document.getElementById('close-registered-users');
    const registeredUsersBody = document.getElementById('registered-users-body');
    const otherAccounts = document.getElementById('other-accounts');
    const currentNameEl = document.getElementById('current-name');
    const currentEmailEl = document.getElementById('current-email');
    const currentAvatar = document.getElementById('current-avatar');
    const btnAddAccount = document.getElementById('btn-add-account');
    const infoPanel = document.getElementById('info-panel');
    const btnInfoPanelClose = document.getElementById('btn-info-panel-close');
    function activarVista(target) {
        const navButtons = document.querySelectorAll(".nav-btn[data-target]");
        navButtons.forEach(b => b.classList.toggle("active", b.getAttribute("data-target") === target));
        document.querySelectorAll(".content-view").forEach(v => v.classList.remove("active"));
        const targetView = document.getElementById(`view-${target}`);
        if (targetView) targetView.classList.add("active");
        const titleHeader = document.getElementById("current-view-title");
        if (titleHeader) titleHeader.textContent = target === "panel" ? "Panel de inicio" : target === "admision" ? "Admisión de pacientes" : "Usuarios";
    }

    function showInfoPanel(message) {
        if (!infoPanel) return;
        const messageNode = infoPanel.querySelector('.info-panel-message');
        if (messageNode) messageNode.textContent = message;
        infoPanel.style.display = 'flex';
    }

    function hideInfoPanel() {
        if (!infoPanel) return;
        infoPanel.style.display = 'none';
    }

    if (btnInfoPanelClose) {
        btnInfoPanelClose.addEventListener('click', hideInfoPanel);
    }

    // 3. ENRUTADOR INTERNO Y NAVEGACIÓN DE PESTAÑAS (SPA)
    // ========================================================
    const confirmationPanel = document.getElementById('confirmation-panel');
    const btnKeepEditingDate = document.getElementById('btn-keep-date-editing');
    const btnCancelDateSelection = document.getElementById('btn-cancel-date-selection');
    let pendingAction = null;

    function abrirPanelConfirmacion(action) {
        pendingAction = action;
        if (confirmationPanel) confirmationPanel.style.display = 'flex';
    }

    function cerrarPanelConfirmacion() {
        if (confirmationPanel) confirmationPanel.style.display = 'none';
        pendingAction = null;
    }

    if (btnKeepEditingDate) {
        btnKeepEditingDate.addEventListener('click', () => {
            cerrarPanelConfirmacion();
        });
    }

    if (btnCancelDateSelection) {
        btnCancelDateSelection.addEventListener('click', () => {
            dateSelectionTarget = null;
            cerrarPanelConfirmacion();
            if (pendingAction) {
                pendingAction();
            }
        });
    }

    const navButtons = document.querySelectorAll(".nav-btn[data-target]");
    navButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            const target = btn.getAttribute("data-target");
            if (!dateSelectionTarget) {
                activarVista(target);
                return;
            }
            abrirPanelConfirmacion(() => activarVista(target));
        });
    });

    const btnExport = document.getElementById("btn-export");
    const modalExport = document.getElementById('modal-export-preview');
    const exportTableBody = document.getElementById('export-table-body');
    const btnConfirmExport = document.getElementById('btn-confirm-export');
    const btnCancelExport = document.getElementById('btn-cancel-export');

    function populateExportPreview() {
        if (!exportTableBody || !tablaPacientes) return;
        exportTableBody.innerHTML = '';
        const filas = Array.from(tablaPacientes.querySelectorAll('tr'));
        filas.forEach(fila => {
            if (fila.style.display === 'none') return; // skip filtered rows
            const tds = fila.querySelectorAll('td');
            if (!tds || tds.length < 5) return;
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td style="padding:8px; border-bottom:1px solid var(--border-subtle);">${tds[0].textContent.trim()}</td>
                <td style="padding:8px; border-bottom:1px solid var(--border-subtle);">${tds[1].textContent.trim()}</td>
                <td style="padding:8px; border-bottom:1px solid var(--border-subtle);">${tds[2].textContent.trim()}</td>
                <td style="padding:8px; border-bottom:1px solid var(--border-subtle);">${tds[3].textContent.trim()}</td>
                <td style="padding:8px; border-bottom:1px solid var(--border-subtle);">${tds[4].textContent.trim()}</td>
                <td style="padding:8px; border-bottom:1px solid var(--border-subtle);">${tds[5].textContent.trim()}</td>
            `;
            exportTableBody.appendChild(tr);
        });
    }

    function performExport() {
        // Placeholder: reemplazar con la lógica real de exportación a .xlsx cuando esté disponible
        alert(`Terminal Médica Enterprise: Conectando con servidor de datos... Extrayendo registros del año ${anioActual} en formato estructurado .xlsx de forma segura.`);
    }

    function showExportPreview() {
        populateExportPreview();
        if (modalExport) modalExport.style.display = 'flex';
    }

    if (btnExport) {
        btnExport.addEventListener("click", () => {
            if (!dateSelectionTarget) {
                showExportPreview();
                return;
            }
            abrirPanelConfirmacion(() => showExportPreview());
        });
    }

    if (btnCancelExport) {
        btnCancelExport.addEventListener('click', () => { if (modalExport) modalExport.style.display = 'none'; });
    }

    if (btnConfirmExport) {
        btnConfirmExport.addEventListener('click', () => {
            if (modalExport) modalExport.style.display = 'none';
            performExport();
        });
    }


    async function guardarPerfilUsuario(uid) {
    if (!uid) return;

    if (profileMessage) {
        profileMessage.textContent = '';
    }

    try {
        await setDoc(
            doc(db, "usuarios", uid),
            {
                name: profileName?.value.trim() || "",
                email: profileEmail?.value.trim() || "",
                phone: profilePhone?.value.trim() || "",
                role: profileRole?.value.trim() || "",
                company: profileCompany?.value.trim() || ""
            },
            { merge: true }
        );

        const usuarioActual = auth.currentUser;

        if (usuarioActual) {
            await cargarPerfilUsuario(usuarioActual);
        }

        if (profileMessage) {
            profileMessage.textContent = "Perfil guardado correctamente.";
        }

    } catch (error) {
        console.error(
            "Error guardando perfil de usuario:",
            error
        );

        if (profileMessage) {
            profileMessage.textContent =
                "No se pudo guardar el perfil. Intenta de nuevo.";
        }
    }
}
    // ========================================================
    // 4. MÁSCARAS DE ENTRADA INTELIGENTES DE DATOS (DATA VALIDATION)
    // ========================================================
    function aplicarMascaras(inputNom, inputRec, inputCed, inputTel) {
        if(!inputNom || !inputRec || !inputCed || !inputTel) return;

        inputNom.addEventListener("input", () => {
            let palabras = inputNom.value.split(" ");
            inputNom.value = palabras.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(" ");
        });
        inputRec.addEventListener("input", () => {
            inputRec.value = inputRec.value.replace(/\D/g, "");
        });
        inputCed.addEventListener("input", () => {
            let valor = inputCed.value.replace(/\D/g, "");
            let res = "";
            if (valor.length > 0) res += valor.substring(0, 3);
            if (valor.length > 3) res += "-" + valor.substring(3, 10);
            if (valor.length > 10) res += "-" + valor.substring(10, 11);
            inputCed.value = res;
        });
        inputTel.addEventListener("input", () => {
            let valor = inputTel.value.replace(/\D/g, "");
            let res = "";
            if (valor.length > 0) res += "(" + valor.substring(0, 3);
            if (valor.length > 3) res += ") " + valor.substring(3, 6);
            if (valor.length > 6) res += "-" + valor.substring(6, 10);
            inputTel.value = res;
        });
    }

    // Inicialización simétrica de máscaras (Formulario Base + Formulario de Edición Modal)
    aplicarMascaras(inputNombrePaciente, inputRecordPaciente, inputCedulaPaciente, inputTelefonoPaciente);
    aplicarMascaras(
        document.getElementById("edit-nombre"), 
        document.getElementById("edit-record"), 
        document.getElementById("edit-cedula"), 
        document.getElementById("edit-telefono")
    );

    // ========================================================
    // 5. ESCUCHA REALTIME Y CRUD AVANZADO FIRESTORE NATIVO
    // ========================================================
    // ========================================================
    // CALENDARIO
    // ========================================================
    function renderizarAlmanaqueLocal() {
        renderizarAlmanaque({ gridMeses, mesesAnuales, diasSemana, anioActual, monthIndicator, inputFechaPaciente, getDateSelectionTarget: () => dateSelectionTarget, setDateSelectionTarget: value => { dateSelectionTarget = value; }, modalEditar, showInfoPanel, activarVista });
    }
    renderizarAlmanaqueLocal();
    attachDatePicker(inputFechaPaciente);
    attachDatePicker(document.getElementById("edit-fecha"));
    if (inputFechaPaciente) {
        inputFechaPaciente.addEventListener("click", (e) => {
            e.preventDefault(); activarVista("panel");
            const parsed = parseFormattedDate(inputFechaPaciente.value);
            if (parsed) focusCalendarTo(parsed, gridMeses, monthIndicator);
            else gridMeses?.querySelector(".active-month")?.scrollIntoView({ behavior: "smooth", block: "center" });
        });
    }
    const editFechaInput = document.getElementById("edit-fecha");
    if (editFechaInput) {
        editFechaInput.addEventListener("click", (e) => {
            e.preventDefault(); dateSelectionTarget = editFechaInput;
            if (modalEditar) modalEditar.style.display = "none"; activarVista("panel");
            const parsed = parseFormattedDate(editFechaInput.value);
            if (parsed) focusCalendarTo(parsed, gridMeses, monthIndicator);
        });
    }

    // ========================================================
    // 5. PACIENTES / CRUD
    // ========================================================
    function dibujarPacientes(snapshot) {
        if (!tablaPacientes) return;
        tablaPacientes.innerHTML = "";
        bookedDates.clear();
        snapshot.forEach((documento) => {
            const paciente = documento.data();
            const id = documento.id;
            if (paciente.fechaConsulta) bookedDates.add(paciente.fechaConsulta);
            const fila = document.createElement("tr");
            fila.style.borderBottom = "1px solid var(--border-subtle)";
            const comentarioLimpio = paciente.comentario ? paciente.comentario.toLowerCase() : "";
            fila.setAttribute("data-buscar", `${paciente.record || ""} ${(paciente.nombre || "").toLowerCase()} ${paciente.cedula || ""} ${paciente.telefono || ""} ${comentarioLimpio}`);
            fila.innerHTML = `<td style="padding:12px;font-weight:600;">${paciente.record || ""}</td><td style="padding:12px;color:var(--text-main);font-weight:500;">${paciente.nombre || ""}</td><td style="padding:12px;">${paciente.cedula || ""}</td><td style="padding:12px;">${paciente.telefono || ""}</td><td style="padding:12px;font-weight:600;color:var(--color-primary);">${paciente.fechaConsulta || "No asignada"}</td><td style="padding:12px;color:var(--text-muted);max-width:200px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" title="${paciente.comentario || ""}">${paciente.comentario || "<em>Sin comentarios</em>"}</td><td style="padding:12px;text-align:center;white-space:nowrap;"><button class="btn-edit" title="Editar Expediente"><i class="fa-solid fa-user-pen"></i></button><button class="btn-delete" title="Eliminar Expediente"><i class="fa-solid fa-trash-can"></i></button></td>`;
            fila.querySelector(".btn-edit")?.addEventListener("click", () => abrirEditor(id, paciente));
            fila.querySelector(".btn-delete")?.addEventListener("click", () => confirmarEliminarPaciente(id, paciente.nombre));
            tablaPacientes.appendChild(fila);
        });
        renderizarAlmanaqueLocal();
    }

    if (formAdmision) {
        formAdmision.addEventListener("submit", async (e) => {
            e.preventDefault();
            if (!inputFechaPaciente.value) { alert("Flujo incompleto: Por favor, diríjase al 'Panel de inicio' y seleccione el día de consulta en el Almanaque Corporativo."); return; }
            try {
                await agregarPaciente({ nombre: inputNombrePaciente.value.trim(), record: inputRecordPaciente.value.trim(), cedula: inputCedulaPaciente.value.trim(), telefono: inputTelefonoPaciente.value.trim(), fechaConsulta: inputFechaPaciente.value, comentario: inputComentarioPaciente.value.trim(), fechaIngreso: new Date() });
                formAdmision.reset();
                inputFechaPaciente.value = "";
                alert("Éxito: Paciente admitido y agendado correctamente en la base de datos.");
            } catch (error) { console.error("Error crítico en inserción:", error); }
        });
    }

    async function confirmarEliminarPaciente(id, nombre) {
        if (!confirm(`¿Está seguro de que desea eliminar permanentemente de los registros al paciente: ${nombre}? Esta acción es irreversible.`)) return;
        try { await eliminarPaciente(id); } catch (error) { console.error("Error en eliminación:", error); }
    }

    function abrirEditor(id, paciente) {
        const idIndex = document.getElementById("edit-index");
        if (idIndex) idIndex.value = id;
        document.getElementById("edit-nombre").value = paciente.nombre || "";
        document.getElementById("edit-record").value = paciente.record || "";
        document.getElementById("edit-cedula").value = paciente.cedula || "";
        document.getElementById("edit-telefono").value = paciente.telefono || "";
        document.getElementById("edit-fecha").value = paciente.fechaConsulta || "No asignada";
        document.getElementById("edit-comentario").value = paciente.comentario || "";
        if (modalEditar) modalEditar.style.display = "flex";
    }

    if (formEditar) {
        formEditar.addEventListener("submit", async (e) => {
            e.preventDefault();
            const id = document.getElementById("edit-index")?.value;
            if (!id) return;
            try {
                await actualizarPaciente(id, { nombre: document.getElementById("edit-nombre").value.trim(), record: document.getElementById("edit-record").value.trim(), cedula: document.getElementById("edit-cedula").value.trim(), telefono: document.getElementById("edit-telefono").value.trim(), fechaConsulta: document.getElementById("edit-fecha").value.trim(), comentario: document.getElementById("edit-comentario").value.trim() });
                if (modalEditar) modalEditar.style.display = "none";
                alert("Expediente actualizado con éxito.");
            } catch (error) { console.error("Error al actualizar Firestore:", error); }
        });
    }
    if (btnCerrarModal) btnCerrarModal.addEventListener("click", () => { if (modalEditar) modalEditar.style.display = "none"; });
    if (btnCancelarModal) btnCancelarModal.addEventListener("click", () => { if (modalEditar) modalEditar.style.display = "none"; });

    if (inputBuscar) {
        inputBuscar.addEventListener("input", () => {
            const busqueda = inputBuscar.value.toLowerCase().trim();
            if (!tablaPacientes) return;
            tablaPacientes.querySelectorAll("tr").forEach(fila => {
                const datosFila = fila.getAttribute("data-buscar") || "";
                fila.style.display = datosFila.includes(busqueda) ? "" : "none";
            });
        });
    }

    // ========================================================
    // 6. GESTIÓN DE CONFIGURACIONES DE ENTORNO (THEME & LOGOUT)
    // ========================================================
    if (themeToggle) {
        themeToggle.addEventListener("click", () => {
            const isDark = document.documentElement.getAttribute("data-theme") === "dark";
            if (isDark) {
                document.documentElement.removeAttribute("data-theme");
                themeToggle.innerHTML = '<i class="fa-solid fa-moon"></i> <span>Modo Oscuro</span>';
            } else {
                document.documentElement.setAttribute("data-theme", "dark");
                themeToggle.innerHTML = '<i class="fa-solid fa-sun"></i> <span>Modo Claro</span>';
            }
        });
    }

    const btnLogout = document.getElementById("btn-logout");
    if (btnLogout) {
        btnLogout.addEventListener("click", async () => {
            const ejecutarLogout = async () => {
                if (confirm("¿Desea cerrar sesión de forma segura de Terminal Médica?")) {
                    try {
                        await cerrarSesion();
                    } catch (err) {
                        console.error("Error al cerrar sesión:", err);
                    }
                    const appContainer = document.querySelector('.app-container');
                    if (appContainer) appContainer.style.display = 'none';
                    if (loginScreen) loginScreen.style.display = 'flex';
                }
            };

            if (!dateSelectionTarget) {
                await ejecutarLogout();
                return;
            }
            abrirPanelConfirmacion(async () => {
                await ejecutarLogout();
            });
        });
    }

  // Observador de estado de autenticación
let detenerObservacionPacientes = null;

observarSesion(async (user) => {
    const appContainer = document.querySelector('.app-container');

    if (user) {
        if (loginScreen) loginScreen.style.display = 'none';
        if (appContainer) appContainer.style.display = 'flex';

        await cargarPerfilUsuario(user.uid);

        activarVista('panel');

        // Iniciar Firestore solamente cuando el usuario esté autenticado
        detenerObservacionPacientes = observarPacientes(dibujarPacientes);

    } else {
        if (loginScreen) loginScreen.style.display = 'flex';
        if (appContainer) appContainer.style.display = 'none';

        activarVista('panel');

        // Detener la escucha cuando se cierra la sesión
        if (detenerObservacionPacientes) {
            detenerObservacionPacientes();
            detenerObservacionPacientes = null;
        }
    }
});

    // Mostrar panel de cuentas (usuarios registrados)
async function fetchRegisteredUsers() {
    try {
        const usuarios = await obtenerUsuariosRegistrados();

        console.log("Usuarios encontrados:", usuarios);

        if (!registeredUsersBody) {
            console.warn("No existe #registered-users-body");
        } else {
            registeredUsersBody.innerHTML = "";

            if (usuarios.length === 0) {
                registeredUsersBody.innerHTML = `
                    <tr>
                        <td colspan="5" style="text-align:center; padding:20px;">
                            No hay usuarios registrados.
                        </td>
                    </tr>
                `;
            } else {
                usuarios.forEach(usuario => {
                    const fila = document.createElement("tr");

                    fila.innerHTML = `
                        <td>${usuario.name || "Sin nombre"}</td>
                        <td>${usuario.email || "Sin correo"}</td>
                        <td>${usuario.phone || "Sin teléfono"}</td>
                        <td>${usuario.role || "Sin rol"}</td>
                        <td>${usuario.company || "Sin empresa"}</td>
                    `;

                    registeredUsersBody.appendChild(fila);
                });
            }
        }

        // También actualizamos la lista de cuentas
        if (otherAccounts) {
            otherAccounts.innerHTML = "";

            usuarios.forEach(usuario => {
                const item = document.createElement("div");

                const iniciales = (
                    usuario.name ||
                    usuario.email ||
                    "U"
                )
                    .split(" ")
                    .map(p => p[0] || "")
                    .join("")
                    .slice(0, 2)
                    .toUpperCase();

                item.style.display = "flex";
                item.style.alignItems = "center";
                item.style.gap = "10px";
                item.style.padding = "8px";
                item.style.borderRadius = "8px";
                item.style.cursor = "pointer";

                item.innerHTML = `
                    <div style="
                        width:36px;
                        height:36px;
                        border-radius:50%;
                        background:#eef2ff;
                        display:flex;
                        align-items:center;
                        justify-content:center;
                        font-weight:700;
                    ">
                        ${iniciales}
                    </div>

                    <div style="flex:1;">
                        <div style="font-weight:600;">
                            ${usuario.name || "Usuario"}
                        </div>

                        <div style="
                            font-size:0.85rem;
                            color:var(--text-muted);
                        ">
                            ${usuario.email || ""}
                        </div>

                        <div style="
                            font-size:0.78rem;
                            color:var(--text-muted);
                        ">
                            ${usuario.role || "Sin rol"}
                        </div>
                    </div>
                `;

                otherAccounts.appendChild(item);
            });
        }

    } catch (error) {
        console.error("Error cargando usuarios registrados:", error);

        if (registeredUsersBody) {
            registeredUsersBody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align:center; padding:20px;">
                        Error al cargar los usuarios registrados.
                    </td>
                </tr>
            `;
        }
    }
}
    if (showRegisteredUsers) {
        showRegisteredUsers.addEventListener('click', async (e) => {
            e.preventDefault();
            if (modalRegisteredUsers) modalRegisteredUsers.style.display = 'flex';
            await fetchRegisteredUsers();
        });
    }
    if (closeRegisteredUsers) {
        closeRegisteredUsers.addEventListener('click', () => {
            if (modalRegisteredUsers) modalRegisteredUsers.style.display = 'none';
        });
    }

    if (btnAddAccount) {
        btnAddAccount.addEventListener('click', (e) => {
            e.preventDefault();
            if (modalRegisteredUsers) modalRegisteredUsers.style.display = 'none';
            if (formSignup) {
                formSignup.style.display = 'flex';
                formLogin.style.display = 'none';
            }
        });
    }

    // Login form handler
    if (formLogin) {
        formLogin.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (loginError) loginError.textContent = '';
            const email = loginEmail ? loginEmail.value.trim() : '';
            const password = loginPassword ? loginPassword.value : '';
            try {
                await iniciarSesion(email, password);
            } catch (err) {
                console.error('Error al iniciar sesión:', err);
                if (loginError) loginError.textContent = 'Credenciales inválidas o error de autenticación.';
            }
        });
    }

    // Toggle to show signup form
    if (showSignup) {
        showSignup.addEventListener('click', (e) => {
            e.preventDefault();
            if (formLogin) formLogin.style.display = 'none';
            if (formSignup) formSignup.style.display = 'flex';
            if (loginError) loginError.textContent = '';
            if (signupError) signupError.textContent = '';
            if (signupSuccess) signupSuccess.textContent = '';
        });
    }
    if (showLogin) {
        showLogin.addEventListener('click', (e) => {
            e.preventDefault();
            if (formSignup) formSignup.style.display = 'none';
            if (formLogin) formLogin.style.display = 'flex';
        });
    }

    // Signup form handler
    if (formSignup) {
        formSignup.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (signupError) signupError.textContent = '';
            if (signupSuccess) signupSuccess.textContent = '';
            const email = signupEmail ? signupEmail.value.trim() : '';
            const password = signupPassword ? signupPassword.value : '';
            const confirm = signupConfirm ? signupConfirm.value : '';
            const name = signupName ? signupName.value.trim() : '';
            const phone = signupPhone ? signupPhone.value.trim() : '';
            const role = signupRole ? signupRole.value.trim() : '';
            const company = signupCompany ? signupCompany.value.trim() : '';

            if (!email || !password || !name || !phone || !role || !company) {
                if (signupError) signupError.textContent = 'Por favor complete todos los campos del registro.';
                return;
            }
            if (password.length < 6) {
                if (signupError) signupError.textContent = 'La contraseña debe tener al menos 6 caracteres.';
                return;
            }
            if (password !== confirm) {
                if (signupError) signupError.textContent = 'Las contraseñas no coinciden.';
                return;
            }

            try {
                await crearCuenta(email, password, { name, phone, role, company });
                if (signupSuccess) signupSuccess.textContent = 'Cuenta creada correctamente. Ya puedes iniciar sesión.';
                if (formSignup) formSignup.style.display = 'none';
                if (formLogin) formLogin.style.display = 'flex';
                if (showLogin) showLogin.click();
            } catch (err) {
                console.error('Error al crear cuenta:', err);
                if (signupError) signupError.textContent = 'Error al crear la cuenta: ' + (err.message || 'compruebe los datos');
            }
        });
    }

    if (formUserProfile) {
        formUserProfile.addEventListener('submit', async (e) => {
            e.preventDefault();
            const currentUser = auth.currentUser;
            if (!currentUser) return;
            await guardarPerfilUsuario(currentUser.uid);
        });
    }
});
