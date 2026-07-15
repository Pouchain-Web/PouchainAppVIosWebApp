import { api } from '../api.js';
import { auth } from '../auth.js';
import config from '../config.js';

window.renderMobileRTT = async function () {
    document.getElementById('categories-view').classList.add('hidden');
    document.getElementById('search-results-view').classList.add('hidden');
    const searchContainer = document.querySelector('.mobile-search-container');
    if (searchContainer) searchContainer.classList.add('hidden');
    document.getElementById('document-list').classList.remove('hidden');

    document.getElementById('selected-category-title').innerText = "Gestion des RTT ⚡";
    document.getElementById('mobile-upload-btn').style.display = 'none';

    window.mobileCurrentPath = "rtt";
    const container = document.getElementById('list-content');
    container.innerHTML = `<div style="text-align:center; padding: 40px;"><div class="loader-spinner"></div></div>`;

    if (!document.getElementById('rtt-mobile-styles')) {
        const style = document.createElement('style');
        style.id = 'rtt-mobile-styles';
        style.innerHTML = `
            .rtt-dashboard { display: flex; flex-direction: column; gap: 20px; padding: 16px; padding-bottom: 100px; }
            .rtt-card { background: var(--card-background, #fff); border: 1px solid var(--border-color, rgba(0,0,0,0.05)); border-radius: 24px; padding: 20px; box-shadow: 0 4px 15px rgba(0,0,0,0.03); }
            .rtt-solde-title { font-size: 14px; color: #8E8E93; text-transform: uppercase; font-weight: 600; margin-bottom: 4px; }
            .rtt-solde-val { font-size: 36px; font-weight: 800; color: #FF3B30; }
            .rtt-btn { display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%; height: 50px; border-radius: 14px; border: none; font-size: 15px; font-weight: 700; cursor: pointer; transition: 0.2s; }
            .rtt-btn-primary { background: #174286; color: white; }
            .rtt-btn-secondary { background: rgba(142, 142, 147, 0.12); color: var(--text-primary, #1c1c1e); }
            
            .rtt-segmented { display: flex; background: rgba(142, 142, 147, 0.12); padding: 4px; border-radius: 12px; margin-bottom: 20px; }
            .rtt-segment-btn { flex: 1; text-align: center; padding: 10px; border-radius: 9px; font-size: 13px; font-weight: 700; border: none; background: transparent; color: #8E8E93; cursor: pointer; transition: 0.2s; }
            .rtt-segment-btn.active { background: var(--card-background, #fff); color: var(--text-primary, #1c1c1e); box-shadow: 0 2px 8px rgba(0,0,0,0.08); }

            /* Calendrier Styles */
            .calendar-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
            .calendar-title { font-size: 16px; font-weight: 700; color: var(--text-primary, #1c1c1e); }
            .calendar-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 6px; text-align: center; }
            .calendar-day-label { font-size: 12px; font-weight: 700; color: #8E8E93; padding: 4px 0; }
            .calendar-cell { height: 38px; display: flex; align-items: center; justify-content: center; border-radius: 10px; font-size: 14px; font-weight: 600; color: var(--text-primary, #1c1c1e); cursor: pointer; position: relative; transition: 0.2s; }
            .calendar-cell-empty { cursor: default; }
            .calendar-cell-weekend { color: #174286; background: rgba(23, 66, 134, 0.05); }
            .calendar-cell-holiday { color: #FF3B30; background: rgba(255, 59, 48, 0.05); }
            .rtt-card .calendar-cell-selected { background: #174286 !important; color: white !important; font-weight: 700; box-shadow: 0 4px 10px rgba(23, 66, 134, 0.3); }
            .rtt-card .calendar-cell-range { background: rgba(23, 66, 134, 0.15); color: var(--text-primary, #1c1c1e); }
            .calendar-cell-disabled { opacity: 0.3; cursor: not-allowed; }
            
            /* Signature Pad */
            .sig-canvas { border: 2px dashed rgba(142, 142, 147, 0.3); border-radius: 14px; background: #ffffff; width: 100%; height: 150px; display: block; touch-action: none; }
        `;
        document.head.appendChild(style);
    }

    try {
        const dk = document.documentElement.getAttribute('data-theme') === 'dark';
        const textColor = dk ? '#FFFFFF' : '#1c1c1e';

        const status = await api.getRTTSolde();

        if (!status.rtt_initialise) {
            container.innerHTML = `
                <div class="rtt-dashboard">
                    <div class="rtt-card" style="text-align: center; padding: 30px;">
                        <div style="font-size: 54px; margin-bottom: 16px;">⚡</div>
                        <h2 style="margin: 0 0 12px 0; color: ${textColor}; font-size: 22px;">Première connexion</h2>
                        <p style="color: #8E8E93; font-size: 14px; line-height: 1.5; margin-bottom: 24px;">
                            Bienvenue dans votre outil de RTT. Veuillez renseigner votre nombre de RTT restants actuels pour démarrer.
                        </p>
                        <div style="margin-bottom: 24px; text-align: left;">
                            <label style="display: block; font-size: 13px; font-weight: 600; color: #8E8E93; margin-bottom: 8px;">Solde actuel (en jours)</label>
                            <input type="number" id="init-rtt-input" class="form-input" style="width:100%; height:50px; text-align:center; font-size: 20px; font-weight:700; border-radius:12px;" placeholder="Ex: 10 ou 5" step="0.5" min="0">
                        </div>
                        <button class="rtt-btn rtt-btn-primary" id="init-rtt-btn">Enregistrer mon solde</button>
                    </div>
                </div>
            `;

            document.getElementById('init-rtt-btn').onclick = async () => {
                const val = parseFloat(document.getElementById('init-rtt-input').value);
                if (isNaN(val) || val < 0) {
                    alert("Veuillez entrer un nombre de jours valide supérieur ou égal à 0.");
                    return;
                }
                const btn = document.getElementById('init-rtt-btn');
                btn.disabled = true;
                btn.innerText = "Initialisation...";
                try {
                    await api.initRTTSolde(val);
                    window.showToast("Solde initialisé !");
                    window.renderMobileRTT();
                } catch (e) {
                    alert("Erreur: " + e.message);
                    btn.disabled = false;
                    btn.innerText = "Enregistrer mon solde";
                }
            };
            return;
        }

        container.innerHTML = `
            <div class="rtt-dashboard">
                <div class="rtt-card" style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <div class="rtt-solde-title">Mon solde de RTT</div>
                        <div class="rtt-solde-val" id="user-rtt-solde">${status.rtt_solde} <span style="font-size:18px; font-weight:600; color:#8E8E93;">jours</span></div>
                    </div>
                    <div style="font-size: 44px;">⚡</div>
                </div>

                <div style="display: flex; gap: 12px;">
                    <button class="rtt-btn rtt-btn-primary" id="btn-rtt-new" style="flex:1;">
                        📝 Demander RTT
                    </button>
                    <button class="rtt-btn rtt-btn-secondary" id="btn-rtt-history" style="flex:1;">
                        📜 Mes demandes
                    </button>
                </div>

                <div id="rtt-view-area"></div>
            </div>
        `;

        document.getElementById('btn-rtt-new').onclick = () => showRTTRequestForm(status.rtt_solde);
        document.getElementById('btn-rtt-history').onclick = showRTTHistoryList;

        showRTTRequestForm(status.rtt_solde);

    } catch (e) {
        container.innerHTML = `<div style="color:red; text-align:center; padding:20px;">Erreur de chargement: ${e.message}</div>`;
    }
};

function showRTTRequestForm(currentSolde) {
    const area = document.getElementById('rtt-view-area');
    if (!area) return;

    const getLocalYYYYMMDD = (d) => {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const groupConsecutiveDates = (dates) => {
        if (!dates || dates.length === 0) return [];
        const sorted = [...dates].sort();
        const groups = [];
        let currentGroup = [sorted[0]];
        for (let i = 1; i < sorted.length; i++) {
            const prev = new Date(sorted[i - 1] + 'T12:00:00');
            const curr = new Date(sorted[i] + 'T12:00:00');
            const diffTime = Math.abs(curr - prev);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            let isConsecutive = false;
            if (diffDays === 1) {
                isConsecutive = true;
            } else {
                let tempDate = new Date(prev);
                tempDate.setDate(tempDate.getDate() + 1);
                let onlyWeekendsOrHolidays = true;
                while (tempDate < curr) {
                    const day = tempDate.getDay();
                    const isWeekend = day === 0 || day === 6;
                    const dateStr = tempDate.toISOString().split('T')[0];
                    const isHoliday = window.isJoursFerieFrance(dateStr);
                    if (!isWeekend && !isHoliday) {
                        onlyWeekendsOrHolidays = false;
                        break;
                    }
                    tempDate.setDate(tempDate.getDate() + 1);
                }
                if (onlyWeekendsOrHolidays) {
                    isConsecutive = true;
                }
            }
            if (isConsecutive) {
                currentGroup.push(sorted[i]);
            } else {
                groups.push(currentGroup);
                currentGroup = [sorted[i]];
            }
        }
        groups.push(currentGroup);
        return groups;
    };

    document.getElementById('btn-rtt-new').classList.add('rtt-btn-primary');
    document.getElementById('btn-rtt-new').classList.remove('rtt-btn-secondary');
    document.getElementById('btn-rtt-history').classList.remove('rtt-btn-primary');
    document.getElementById('btn-rtt-history').classList.add('rtt-btn-secondary');

    const dk = document.documentElement.getAttribute('data-theme') === 'dark';
    const textColor = dk ? '#FFFFFF' : '#1c1c1e';

    area.innerHTML = `
        <div class="rtt-card">
            <h3 style="margin-top:0; color: ${textColor}; font-size:17px; margin-bottom: 15px;">Nouvelle Demande</h3>

            <div class="rtt-segmented">
                <button class="rtt-segment-btn active" id="rtt-mode-days-btn">Sélection de jours</button>
                <button class="rtt-segment-btn" id="rtt-mode-range-btn">Sélection de période</button>
            </div>

            <!-- Calendrier Container -->
            <div style="margin-bottom: 20px;">
                <div class="calendar-header">
                    <button id="rtt-cal-prev-btn" style="background:none; border:none; color:#174286; font-size:20px; font-weight:bold; padding:5px 10px; cursor:pointer;">&lt;</button>
                    <div class="calendar-title" id="rtt-cal-month-title">Mois</div>
                    <button id="rtt-cal-next-btn" style="background:none; border:none; color:#174286; font-size:20px; font-weight:bold; padding:5px 10px; cursor:pointer;">&gt;</button>
                </div>
                <div class="calendar-grid" id="rtt-calendar-grid-element"></div>
            </div>

            <div style="background: rgba(142, 142, 147, 0.08); border-radius: 12px; padding: 15px; margin-bottom: 20px; display:flex; justify-content:space-between; align-items:center;">
                <span style="font-size:14px; font-weight:600; color: #8E8E93;">Jours comptés (ouvrés) :</span>
                <span style="font-size:18px; font-weight:800; color: ${textColor};" id="rtt-counted-days-badge">0 jours</span>
            </div>

            <div id="rtt-balance-alert" style="display:none; color:#FF3B30; font-size:13px; font-weight:600; margin-bottom: 15px; text-align:center;">
                ⚠️ Solde insuffisant (max ${currentSolde} jours).
            </div>

            <!-- Zone de signature -->
            <div style="margin-bottom: 24px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 8px;">
                    <label style="font-size:13px; font-weight:600; color: #8E8E93;">Signature électronique</label>
                    <button id="rtt-clear-sig-btn" style="background:none; border:none; color:#FF3B30; font-size:12px; font-weight:700;">Effacer</button>
                </div>
                <canvas id="rtt-signature-pad" class="sig-canvas"></canvas>
            </div>

            <button class="rtt-btn rtt-btn-primary" id="submit-rtt-request-btn" disabled>Envoyer la demande</button>
        </div>
    `;

    let selectionMode = 'days';
    let currentDate = new Date();
    let currentMonth = currentDate.getMonth();
    let currentYear = currentDate.getFullYear();

    const selectedDates = new Set();
    let rangeStart = null;
    let rangeEnd = null;

    const canvas = document.getElementById('rtt-signature-pad');
    const ctx = canvas.getContext('2d');
    let drawing = false;
    let isSigned = false;

    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#000000';

    const getPos = (e) => {
        const rect = canvas.getBoundingClientRect();
        const clientX = (e.touches && e.touches.length > 0) ? e.touches[0].clientX : e.clientX;
        const clientY = (e.touches && e.touches.length > 0) ? e.touches[0].clientY : e.clientY;
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        return {
            x: (clientX - rect.left) * scaleX,
            y: (clientY - rect.top) * scaleY
        };
    };

    const drawStart = (x, y) => {
        drawing = true;
        isSigned = true;
        ctx.beginPath();
        ctx.moveTo(x, y);
    };

    const drawMove = (x, y) => {
        if (!drawing) return;
        ctx.lineTo(x, y);
        ctx.stroke();
        validateFormInputs();
    };

    const drawEnd = () => {
        drawing = false;
    };

    canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const pos = getPos(e);
        drawStart(pos.x, pos.y);
    });
    canvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
        const pos = getPos(e);
        drawMove(pos.x, pos.y);
    });
    canvas.addEventListener('touchend', drawEnd);

    canvas.addEventListener('mousedown', (e) => {
        const pos = getPos(e);
        drawStart(pos.x, pos.y);
    });
    canvas.addEventListener('mousemove', (e) => {
        const pos = getPos(e);
        drawMove(pos.x, pos.y);
    });
    canvas.addEventListener('mouseup', drawEnd);

    document.getElementById('rtt-clear-sig-btn').onclick = () => {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        isSigned = false;
        validateFormInputs();
    };

    document.getElementById('rtt-mode-days-btn').onclick = () => {
        selectionMode = 'days';
        document.getElementById('rtt-mode-days-btn').classList.add('active');
        document.getElementById('rtt-mode-range-btn').classList.remove('active');
        renderCalendar();
        updateDaysCounter();
    };

    document.getElementById('rtt-mode-range-btn').onclick = () => {
        selectionMode = 'range';
        document.getElementById('rtt-mode-range-btn').classList.add('active');
        document.getElementById('rtt-mode-days-btn').classList.remove('active');
        renderCalendar();
        updateDaysCounter();
    };

    function renderCalendar() {
        const monthNames = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
        document.getElementById('rtt-cal-month-title').innerText = `${monthNames[currentMonth]} ${currentYear}`;

        const grid = document.getElementById('rtt-calendar-grid-element');
        grid.innerHTML = '';

        const daysShort = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
        daysShort.forEach(label => {
            const div = document.createElement('div');
            div.className = 'calendar-day-label';
            div.innerText = label;
            grid.appendChild(div);
        });

        const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
        const totalDays = new Date(currentYear, currentMonth + 1, 0).getDate();
        const startOffset = firstDayIndex === 0 ? 6 : firstDayIndex - 1;

        for (let i = 0; i < startOffset; i++) {
            const div = document.createElement('div');
            div.className = 'calendar-cell calendar-cell-empty';
            grid.appendChild(div);
        }

        const todayStr = getLocalYYYYMMDD(new Date());

        for (let day = 1; day <= totalDays; day++) {
            const dateObj = new Date(currentYear, currentMonth, day);
            const dateStr = getLocalYYYYMMDD(dateObj);
            const cell = document.createElement('div');
            cell.className = 'calendar-cell';
            cell.innerText = day;

            if (dateStr < todayStr) {
                cell.classList.add('calendar-cell-disabled');
            }

            const dayOfWeek = dateObj.getDay();
            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
            const isHoliday = window.isJoursFerieFrance(dateStr);

            if (isWeekend) cell.classList.add('calendar-cell-weekend');
            if (isHoliday) cell.classList.add('calendar-cell-holiday');

            if (selectionMode === 'days') {
                if (selectedDates.has(dateStr)) {
                    cell.classList.add('calendar-cell-selected');
                }
            } else if (selectionMode === 'range') {
                if (rangeStart && dateStr === getLocalYYYYMMDD(rangeStart)) {
                    cell.classList.add('calendar-cell-selected');
                } else if (rangeEnd && dateStr === getLocalYYYYMMDD(rangeEnd)) {
                    cell.classList.add('calendar-cell-selected');
                } else if (rangeStart && rangeEnd && dateObj > rangeStart && dateObj < rangeEnd) {
                    cell.classList.add('calendar-cell-range');
                }
            }

            if (dateStr >= todayStr) {
                cell.onclick = () => {
                    handleDayClick(dateObj);
                };
            }

            grid.appendChild(cell);
        }
    }

    function handleDayClick(dateObj) {
        const dateStr = getLocalYYYYMMDD(dateObj);

        if (selectionMode === 'days') {
            if (selectedDates.has(dateStr)) {
                selectedDates.delete(dateStr);
            } else {
                const tempSet = new Set(selectedDates);
                tempSet.add(dateStr);
                const groups = groupConsecutiveDates(Array.from(tempSet));
                if (groups.length > 3) {
                    alert("⚠️ Vous ne pouvez pas sélectionner plus de 3 périodes distinctes par demande.");
                    return;
                }
                selectedDates.add(dateStr);
            }
        } else if (selectionMode === 'range') {
            if (!rangeStart || (rangeStart && rangeEnd)) {
                rangeStart = dateObj;
                rangeEnd = null;
            } else if (dateObj < rangeStart) {
                rangeStart = dateObj;
            } else {
                rangeEnd = dateObj;
            }
        }

        renderCalendar();
        updateDaysCounter();
    }

    document.getElementById('rtt-cal-prev-btn').onclick = () => {
        currentMonth--;
        if (currentMonth < 0) {
            currentMonth = 11;
            currentYear--;
        }
        renderCalendar();
        updateDaysCounter();
    };

    document.getElementById('rtt-cal-next-btn').onclick = () => {
        currentMonth++;
        if (currentMonth > 11) {
            currentMonth = 0;
            currentYear++;
        }
        renderCalendar();
        updateDaysCounter();
    };

    function countBusinessDays(datesArray) {
        let count = 0;
        datesArray.forEach(dStr => {
            const d = new Date(dStr + 'T12:00:00');
            const dayOfWeek = d.getDay();
            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
            const isHoliday = window.isJoursFerieFrance(dStr);
            if (!isWeekend && !isHoliday) {
                count++;
            }
        });
        return count;
    }

    function getSelectedDatesList() {
        const list = [];
        if (selectionMode === 'days') {
            selectedDates.forEach(d => list.push(d));
        } else if (selectionMode === 'range' && rangeStart && rangeEnd) {
            let curr = new Date(rangeStart);
            while (curr <= rangeEnd) {
                list.push(getLocalYYYYMMDD(curr));
                curr.setDate(curr.getDate() + 1);
            }
        }
        return list.sort();
    }

    function updateDaysCounter() {
        const list = getSelectedDatesList();
        const count = countBusinessDays(list);

        document.getElementById('rtt-counted-days-badge').innerText = `${count} jours`;

        const alertDiv = document.getElementById('rtt-balance-alert');
        if (count > currentSolde) {
            alertDiv.style.display = 'block';
        } else {
            alertDiv.style.display = 'none';
        }

        validateFormInputs();
    }

    function validateFormInputs() {
        const list = getSelectedDatesList();
        const count = countBusinessDays(list);
        const submitBtn = document.getElementById('submit-rtt-request-btn');

        const isSoldeOk = count <= currentSolde;
        const isValid = count > 0 && isSoldeOk && isSigned;
        submitBtn.disabled = !isValid;
    }

    renderCalendar();

    document.getElementById('submit-rtt-request-btn').onclick = async () => {
        const list = getSelectedDatesList();
        const count = countBusinessDays(list);
        const submitBtn = document.getElementById('submit-rtt-request-btn');

        if (list.length === 0 || count <= 0) return;

        submitBtn.disabled = true;
        submitBtn.innerText = "Envoi...";

        const startDate = list[0];
        const endDate = list[list.length - 1];
        const signatureBase64 = canvas.toDataURL('image/png');

        try {
            await api.submitRTTRequest(startDate, endDate, list, count, signatureBase64);
            window.showToast("Demande de RTT envoyée !");
            window.renderMobileRTT();
        } catch (e) {
            alert("Erreur de soumission: " + e.message);
            submitBtn.disabled = false;
            submitBtn.innerText = "Envoyer la demande";
        }
    };
}

async function showRTTHistoryList() {
    const area = document.getElementById('rtt-view-area');
    if (!area) return;

    document.getElementById('btn-rtt-history').classList.add('rtt-btn-primary');
    document.getElementById('btn-rtt-history').classList.remove('rtt-btn-secondary');
    document.getElementById('btn-rtt-new').classList.remove('rtt-btn-primary');
    document.getElementById('btn-rtt-new').classList.add('rtt-btn-secondary');

    area.innerHTML = `<div style="text-align:center; padding: 20px;"><div class="loader-spinner"></div></div>`;

    try {
        const requests = await api.getRTTRequests();
        const dk = document.documentElement.getAttribute('data-theme') === 'dark';
        const cardBg = dk ? '#1c1c1e' : '#f2f2f7';
        const textColor = dk ? '#FFFFFF' : '#1c1c1e';

        if (requests.length === 0) {
            area.innerHTML = `
                <div style="text-align:center; color:#8E8E93; padding: 30px; font-style:italic;">
                    Aucune demande passée trouvée.
                </div>
            `;
            return;
        }

        let html = '<div style="display:flex; flex-direction:column; gap:12px;">';
        requests.forEach(r => {
            let badgeColor = '#8E8E93';
            let statusLabel = 'En attente ⏳';

            if (r.status === 'approved') {
                badgeColor = '#34C759';
                statusLabel = 'Validée ✅';
            } else if (r.status === 'refused') {
                badgeColor = '#FF3B30';
                statusLabel = 'Refusée ❌';
            } else if (r.status === 'adjustment') {
                badgeColor = '#FF9500';
                statusLabel = 'Ajustement 🔧';
            }

            const startStr = new Date(r.start_date).toLocaleDateString('fr-FR');
            const endStr = new Date(r.end_date).toLocaleDateString('fr-FR');

            html += `
                <div style="background: ${cardBg}; padding:16px; border-radius:16px; display:flex; flex-direction:column; gap:8px;">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <span style="font-weight:700; color:${textColor}; font-size:15px;">Du ${startStr} au ${endStr}</span>
                        <span style="background:${badgeColor}; color:white; padding:4px 10px; border-radius:12px; font-size:11px; font-weight:700; text-transform:uppercase;">${statusLabel}</span>
                    </div>
                    <div style="display:flex; justify-content:space-between; font-size:13px; color:#8E8E93;">
                        <span>Durée décomptée :</span>
                        <strong style="color:${textColor};">${r.days_requested} jours</strong>
                    </div>

                    ${r.pdf_path ? `
                        <button onclick="window.openFile('${r.pdf_path}')" style="margin-top: 8px; width:100%; height:36px; background:rgba(23,66,134,0.1); border:none; border-radius:8px; color:#174286; font-size:12px; font-weight:700; cursor:pointer;">
                            📄 Télécharger la fiche de RTT
                        </button>
                    ` : ''}
                </div>
            `;
        });
        html += '</div>';
        area.innerHTML = html;

    } catch (e) {
        area.innerHTML = `<div style="color:#FF3B30; font-size:13px; text-align:center; padding:20px;">Erreur de récupération: ${e.message}</div>`;
    }
}

