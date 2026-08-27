// ========================================================
// CALENDARIO
// ========================================================

export function parseFormattedDate(text) {
    if (!text) return null;
    const isoMatch = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (isoMatch) return new Date(`${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`);
    const parts = text.split(" de ");
    if (parts.length < 2) return null;
    const day = parseInt(parts[0], 10);
    const rest = parts[1].split(",");
    const monthName = rest[0].trim();
    const year = parseInt((rest[1] || "").trim(), 10) || new Date().getFullYear();
    const monthNames = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
    const monthIndex = monthNames.indexOf(monthName);
    return !Number.isNaN(day) && monthIndex >= 0 ? new Date(year, monthIndex, day) : null;
}

export function attachDatePicker(targetInput) {
    if (!targetInput) return;
    targetInput.style.cursor = "pointer";
    targetInput.addEventListener("click", (e) => {
        e.stopPropagation();
        const temp = document.createElement("input");
        temp.type = "date";
        temp.style.position = "fixed";
        temp.style.left = "-9999px";
        document.body.appendChild(temp);
        const parsed = parseFormattedDate(targetInput.value || "");
        if (parsed) temp.value = `${parsed.getFullYear()}-${String(parsed.getMonth()+1).padStart(2,"0")}-${String(parsed.getDate()).padStart(2,"0")}`;
        temp.addEventListener("change", () => {
            const d = temp.valueAsDate;
            if (d) {
                const months = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
                targetInput.value = `${d.getDate()} de ${months[d.getMonth()]}, ${d.getFullYear()}`;
                targetInput.style.borderColor = "var(--color-primary)";
            }
            temp.remove();
        }, { once: true });
        temp.click();
    });
}

export function focusCalendarTo(dateObj, gridMeses, monthIndicator) {
    if (!gridMeses || !dateObj) return;
    const monthIndex = dateObj.getMonth();
    const dayNum = dateObj.getDate();
    const monthCards = Array.from(gridMeses.querySelectorAll(".month-card"));
    monthCards.forEach((card, idx) => card.classList.toggle("active-month", idx === monthIndex));
    const targetCard = monthCards[monthIndex];
    if (!targetCard) return;
    targetCard.scrollIntoView({ behavior: "smooth", block: "center" });
    const days = Array.from(targetCard.querySelectorAll(".days-grid .day-cell"));
    days.forEach(d => d.classList.remove("selected-day"));
    const match = days.find(d => !d.classList.contains("empty") && Number(d.textContent) === dayNum);
    if (match) {
        match.classList.add("selected-day");
        const monthName = targetCard.querySelector(".month-card-header")?.textContent || "";
        if (monthIndicator) monthIndicator.textContent = `Selección: ${dayNum} de ${monthName}`;
    }
}

export function renderizarAlmanaque({ gridMeses, mesesAnuales, diasSemana, anioActual, monthIndicator, inputFechaPaciente, getDateSelectionTarget, setDateSelectionTarget, modalEditar, showInfoPanel, activarVista }) {
    if (!gridMeses) return;
    gridMeses.innerHTML = "";
    mesesAnuales.forEach((nombreMes, indiceMes) => {
        const monthCard = document.createElement("div");
        monthCard.classList.add("month-card");
        if (indiceMes === new Date().getMonth()) {
            monthCard.classList.add("active-month");
            if (monthIndicator) monthIndicator.textContent = `Período Activo: ${nombreMes} ${anioActual}`;
        }
        monthCard.innerHTML = `<div class="month-card-header">${nombreMes} ${anioActual}</div><div class="weekdays-grid"></div><div class="days-grid"></div>`;
        const weekdaysContainer = monthCard.querySelector(".weekdays-grid");
        diasSemana.forEach((d, index) => {
            const span = document.createElement("span");
            span.textContent = d;
            if (index === 0 || index === 6) span.classList.add("weekday-weekend");
            weekdaysContainer.appendChild(span);
        });
        const daysContainer = monthCard.querySelector(".days-grid");
        const firstDay = new Date(anioActual, indiceMes, 1).getDay();
        const totalDays = new Date(anioActual, indiceMes + 1, 0).getDate();
        for (let i = 0; i < firstDay; i++) {
            const empty = document.createElement("span");
            empty.classList.add("day-cell", "empty");
            daysContainer.appendChild(empty);
        }
        for (let dia = 1; dia <= totalDays; dia++) {
            const dayCell = document.createElement("span");
            dayCell.classList.add("day-cell");
            dayCell.textContent = dia;
            const fechaFormateada = `${dia} de ${nombreMes}, ${anioActual}`;
            const dow = new Date(anioActual, indiceMes, dia).getDay();
            const isWeekend = dow === 0 || dow === 6;
            if (isWeekend) { dayCell.classList.add("weekend"); dayCell.title = "No seleccionable para admisión"; dayCell.style.cursor = "not-allowed"; }
            const hoy = new Date();
            if (dia === hoy.getDate() && indiceMes === hoy.getMonth() && anioActual === hoy.getFullYear()) dayCell.classList.add("today");
            if (!isWeekend) {
                dayCell.addEventListener("click", (e) => {
                    e.stopPropagation();
                    document.querySelectorAll(".day-cell").forEach(d => d.classList.remove("selected-day"));
                    dayCell.classList.add("selected-day");
                    const today = new Date();
                    const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
                    const selected = new Date(anioActual, indiceMes, dia);
                    let finalDate = fechaFormateada;
                    if (selected < todayOnly) {
                        const next = new Date(anioActual + 1, indiceMes, dia);
                        if ([0,6].includes(next.getDay())) { showInfoPanel(`La fecha seleccionada se ajusta al año ${anioActual + 1} porque el día original ya pasó. Sin embargo, ${dia} de ${nombreMes} ${anioActual + 1} cae en fin de semana, por lo que no se puede programar para ese día.`); return; }
                        finalDate = `${dia} de ${nombreMes}, ${anioActual + 1}`;
                    }
                    const currentTarget = getDateSelectionTarget();
                    const target = currentTarget || inputFechaPaciente;
                    if (monthIndicator) monthIndicator.textContent = `Selección: ${finalDate}`;
                    if (target) { target.value = finalDate; try { target.style.borderColor = "var(--color-primary)"; } catch (_) {} }
                    if (currentTarget && currentTarget.id === "edit-fecha") {
                        activarVista("admision");
                        setTimeout(() => { if (modalEditar) { modalEditar.style.display = "flex"; try { document.getElementById("edit-fecha")?.focus(); } catch (_) {} } }, 220);
                    } else activarVista("admision");
                    setDateSelectionTarget(null);
                });
            }
            const selectedFecha = inputFechaPaciente?.value?.trim() || document.getElementById("edit-fecha")?.value?.trim();
            if (selectedFecha === fechaFormateada) dayCell.classList.add("selected-day");
            daysContainer.appendChild(dayCell);
        }
        monthCard.addEventListener("click", () => {
            document.querySelectorAll(".month-card").forEach(m => m.classList.remove("active-month"));
            monthCard.classList.add("active-month");
            if (monthIndicator) monthIndicator.textContent = `Período Activo: ${nombreMes} ${anioActual}`;
        });
        gridMeses.appendChild(monthCard);
    });
}
