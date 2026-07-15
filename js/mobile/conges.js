import { api } from '../api.js';
import { auth } from '../auth.js';
import config from '../config.js';

window.renderMobileConges = async function () {
    document.getElementById('categories-view').classList.add('hidden');
    document.getElementById('search-results-view').classList.add('hidden');
    const searchContainer = document.querySelector('.mobile-search-container');
    if (searchContainer) searchContainer.classList.add('hidden');
    document.getElementById('document-list').classList.remove('hidden');

    document.getElementById('selected-category-title').innerText = "Gestion des Congés 🌴";
    document.getElementById('mobile-upload-btn').style.display = 'none';

    window.mobileCurrentPath = "conges";
    const container = document.getElementById('list-content');
    container.innerHTML = `<div style="text-align:center; padding: 40px;"><div class="loader-spinner"></div></div>`;

    // Injecter les styles spécifiques pour le calendrier et le formulaire de congés
    if (!document.getElementById('conges-mobile-styles')) {
        const style = document.createElement('style');
        style.id = 'conges-mobile-styles';
        style.innerHTML = `
            .conge-dashboard { display: flex; flex-direction: column; gap: 20px; padding: 16px; padding-bottom: 100px; }
            .conge-card { background: var(--card-background, #fff); border: 1px solid var(--border-color, rgba(0,0,0,0.05)); border-radius: 24px; padding: 20px; box-shadow: 0 4px 15px rgba(0,0,0,0.03); }
            .conge-solde-title { font-size: 14px; color: #8E8E93; text-transform: uppercase; font-weight: 600; margin-bottom: 4px; }
            .conge-solde-val { font-size: 36px; font-weight: 800; color: var(--primary-color, #007AFF); }
            .conge-btn { display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%; height: 50px; border-radius: 14px; border: none; font-size: 15px; font-weight: 700; cursor: pointer; transition: 0.2s; }
            .conge-btn-primary { background: #174286; color: white; }
            .conge-btn-secondary { background: rgba(142, 142, 147, 0.12); color: var(--text-primary, #1c1c1e); }
            
            /* Calendrier Styles */
            .calendar-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
            .calendar-title { font-size: 16px; font-weight: 700; color: var(--text-primary, #1c1c1e); }
            .calendar-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 6px; text-align: center; }
            .calendar-day-label { font-size: 12px; font-weight: 700; color: #8E8E93; padding: 4px 0; }
            .calendar-cell { height: 38px; display: flex; align-items: center; justify-content: center; border-radius: 10px; font-size: 14px; font-weight: 600; color: var(--text-primary, #1c1c1e); cursor: pointer; position: relative; transition: 0.2s; }
            .calendar-cell-empty { cursor: default; }
            .calendar-cell-weekend { color: #174286; background: rgba(23, 66, 134, 0.05); }
            .calendar-cell-holiday { color: #FF3B30; background: rgba(255, 59, 48, 0.05); }
            .calendar-cell-selected { background: #174286 !important; color: white !important; font-weight: 700; box-shadow: 0 4px 10px rgba(23, 66, 134, 0.3); }
            .calendar-cell-range { background: rgba(23, 66, 134, 0.15); color: var(--text-primary, #1c1c1e); }
            .calendar-cell-disabled { opacity: 0.3; cursor: not-allowed; }
            
            /* Signature Pad */
            .sig-canvas { border: 2px dashed rgba(142, 142, 147, 0.3); border-radius: 14px; background: #ffffff; width: 100%; height: 150px; display: block; touch-action: none; }
            
            /* Mode Selector */
            .conge-segmented { display: flex; background: rgba(142, 142, 147, 0.12); padding: 4px; border-radius: 12px; margin-bottom: 20px; }
            .conge-segment-btn { flex: 1; text-align: center; padding: 10px; border-radius: 9px; font-size: 13px; font-weight: 700; border: none; background: transparent; color: #8E8E93; cursor: pointer; transition: 0.2s; }
            .conge-segment-btn.active { background: var(--card-background, #fff); color: var(--text-primary, #1c1c1e); box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
        `;
        document.head.appendChild(style);
    }

    try {
        const dk = document.documentElement.getAttribute('data-theme') === 'dark';
        const cardBg = dk ? '#1C1C1E' : '#fff';
        const textColor = dk ? '#FFFFFF' : '#1c1c1e';
        const subtleBorder = dk ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)';

        const status = await api.getCongeSolde();

        // 1. Écran de première connexion (Saisie du solde initial)
        if (!status.conge_initialise) {
            container.innerHTML = `
                <div class="conge-dashboard">
                    <div class="conge-card" style="text-align: center; padding: 30px;">
                        <div style="font-size: 54px; margin-bottom: 16px;">🌴</div>
                        <h2 style="margin: 0 0 12px 0; color: ${textColor}; font-size: 22px;">Première connexion</h2>
                        <p style="color: #8E8E93; font-size: 14px; line-height: 1.5; margin-bottom: 24px;">
                            Bienvenue dans votre outil de congés. Veuillez renseigner votre nombre de jours de congés restants actuels pour démarrer.
                        </p>
                        <div style="margin-bottom: 24px; text-align: left;">
                            <label style="display: block; font-size: 13px; font-weight: 600; color: #8E8E93; margin-bottom: 8px;">Solde actuel (en jours)</label>
                            <input type="number" id="init-conge-input" class="form-input" style="width:100%; height:50px; text-align:center; font-size: 20px; font-weight:700; border-radius:12px;" placeholder="Ex: 25 ou 12.5" step="0.5" min="0">
                        </div>
                        <button class="conge-btn conge-btn-primary" id="init-conge-btn">Enregistrer mon solde</button>
                    </div>
                </div>
            `;

            document.getElementById('init-conge-btn').onclick = async () => {
                const val = parseFloat(document.getElementById('init-conge-input').value);
                if (isNaN(val) || val < 0) {
                    alert("Veuillez entrer un nombre de jours valide supérieur ou égal à 0.");
                    return;
                }
                const btn = document.getElementById('init-conge-btn');
                btn.disabled = true;
                btn.innerText = "Initialisation...";
                try {
                    await api.initCongeSolde(val);
                    window.showToast("Solde initialisé !");
                    window.renderMobileConges();
                } catch (e) {
                    alert("Erreur: " + e.message);
                    btn.disabled = false;
                    btn.innerText = "Enregistrer mon solde";
                }
            };
            return;
        }

        // 2. Tableau de bord principal des congés
        container.innerHTML = `
            <div class="conge-dashboard">
                <div class="conge-card" style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <div class="conge-solde-title">Mon solde de congés</div>
                        <div class="conge-solde-val" id="user-conge-solde">${status.conge_solde} <span style="font-size:18px; font-weight:600; color:#8E8E93;">jours</span></div>
                    </div>
                    <div style="font-size: 44px;">🏖️</div>
                </div>

                <div style="display: flex; gap: 12px;">
                    <button class="conge-btn conge-btn-primary" id="btn-conge-new" style="flex:1;">
                        📝 Demander des congés
                    </button>
                    <button class="conge-btn conge-btn-secondary" id="btn-conge-history" style="flex:1;">
                        📜 Mes demandes
                    </button>
                </div>

                <div id="conges-view-area"></div>
            </div>
        `;

        // Action Handlers
        document.getElementById('btn-conge-new').onclick = () => showCongeRequestForm(status.conge_solde);
        document.getElementById('btn-conge-history').onclick = showCongeHistoryList;

        // Vue par défaut : Formulaire si solde > 0, sinon l'historique
        if (status.conge_solde > 0) {
            showCongeRequestForm(status.conge_solde);
        } else {
            showCongeHistoryList();
        }

    } catch (e) {
        container.innerHTML = `<div style="color:red; text-align:center; padding:20px;">Erreur de chargement: ${e.message}</div>`;
    }
};

// Afficher le formulaire de demande de congés
function showCongeRequestForm(currentSolde) {
    const area = document.getElementById('conges-view-area');
    if (!area) return;

    // Helper de formatage de date locale pour éviter les décalages de fuseau horaire
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

    // Toggle bouton actif
    document.getElementById('btn-conge-new').classList.add('conge-btn-primary');
    document.getElementById('btn-conge-new').classList.remove('conge-btn-secondary');
    document.getElementById('btn-conge-history').classList.remove('conge-btn-primary');
    document.getElementById('btn-conge-history').classList.add('conge-btn-secondary');

    const dk = document.documentElement.getAttribute('data-theme') === 'dark';
    const textColor = dk ? '#FFFFFF' : '#1c1c1e';

    area.innerHTML = `
        <div class="conge-card">
            <h3 style="margin-top:0; color: ${textColor}; font-size:17px; margin-bottom: 15px;">Nouvelle Demande</h3>

            <div style="margin-bottom: 15px;">
                <label style="display:block; font-size:13px; font-weight:600; color: #8E8E93; margin-bottom: 6px;">Motif de la demande</label>
                <select class="form-input" id="fo-conge-motif" style="width: 100%; height: 46px; border-radius: 12px; font-size: 14px; font-weight: 700; background: var(--card-background, #fff); color: ${textColor}; border: 1px solid var(--border-color, rgba(0,0,0,0.15)); padding: 0 10px; margin-bottom: 15px; outline: none;">
                    <option value="CP" selected>CP</option>
                    <option value="CPE">CPE</option>
                    <option value="CPEF">CPEF</option>
                    <option value="Formation">Formation</option>
                    <option value="CS">CS</option>
                </select>
            </div>

            <div class="conge-segmented">
                <button class="conge-segment-btn active" id="mode-days-btn">Sélection de jours</button>
                <button class="conge-segment-btn" id="mode-range-btn">Sélection de période</button>
            </div>

            <!-- Calendrier Container -->
            <div style="margin-bottom: 20px;">
                <div class="calendar-header">
                    <button id="cal-prev-btn" style="background:none; border:none; color: #174286; font-size:20px; font-weight:bold; padding:5px 10px; cursor:pointer;">&lt;</button>
                    <div class="calendar-title" id="cal-month-title">Mois</div>
                    <button id="cal-next-btn" style="background:none; border:none; color: #174286; font-size:20px; font-weight:bold; padding:5px 10px; cursor:pointer;">&gt;</button>
                </div>
                <div class="calendar-grid" id="calendar-grid-element"></div>
            </div>

            <div style="background: rgba(142, 142, 147, 0.08); border-radius: 12px; padding: 15px; margin-bottom: 20px; display:flex; justify-content:space-between; align-items:center;">
                <span style="font-size:14px; font-weight:600; color: #8E8E93;">Jours comptés (ouvrés) :</span>
                <span style="font-size:18px; font-weight:800; color: ${textColor};" id="counted-days-badge">0 jours</span>
            </div>

            <div id="conge-balance-alert" style="display:none; color:#FF3B30; font-size:13px; font-weight:600; margin-bottom: 15px; text-align:center;">
                ⚠️ Solde insuffisant (max ${currentSolde} jours).
            </div>

            <!-- Zone de signature -->
            <div style="margin-bottom: 24px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 8px;">
                    <label style="font-size:13px; font-weight:600; color: #8E8E93;">Signature électronique</label>
                    <button id="clear-sig-btn" style="background:none; border:none; color:#FF3B30; font-size:12px; font-weight:700;">Effacer</button>
                </div>
                <canvas id="conge-signature-pad" class="sig-canvas"></canvas>
            </div>

            <button class="conge-btn conge-btn-primary" id="submit-conge-request-btn" disabled>Envoyer la demande</button>
        </div>
    `;

    // Calendar state variables
    let selectionMode = 'days'; // 'days' or 'range'
    let currentDate = new Date();
    let currentMonth = currentDate.getMonth();
    let currentYear = currentDate.getFullYear();

    const selectedDates = new Set(); // Stores dates in 'YYYY-MM-DD' format (for multi days mode)
    let rangeStart = null; // Date object (for range mode)
    let rangeEnd = null; // Date object

    // Canvas drawing logic
    const canvas = document.getElementById('conge-signature-pad');
    const ctx = canvas.getContext('2d');
    let drawing = false;
    let isSigned = false;

    // Adjust canvas resolution
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    // Remplir le fond en blanc solide pour éviter la transparence à l'exportation PNG
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#000000'; // Toujours dessiner en noir pour le contraste

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

    // Touch Event Listeners
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

    // Mouse Event Listeners
    canvas.addEventListener('mousedown', (e) => {
        const pos = getPos(e);
        drawStart(pos.x, pos.y);
    });
    canvas.addEventListener('mousemove', (e) => {
        const pos = getPos(e);
        drawMove(pos.x, pos.y);
    });
    canvas.addEventListener('mouseup', drawEnd);

    document.getElementById('clear-sig-btn').onclick = () => {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        isSigned = false;
        validateFormInputs();
    };

    // Mode switching
    document.getElementById('mode-days-btn').onclick = () => {
        selectionMode = 'days';
        document.getElementById('mode-days-btn').classList.add('active');
        document.getElementById('mode-range-btn').classList.remove('active');
        renderCalendar();
        updateDaysCounter();
    };

    document.getElementById('mode-range-btn').onclick = () => {
        selectionMode = 'range';
        document.getElementById('mode-range-btn').classList.add('active');
        document.getElementById('mode-days-btn').classList.remove('active');
        renderCalendar();
        updateDaysCounter();
    };

    // Calendar rendering
    function renderCalendar() {
        const monthNames = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
        document.getElementById('cal-month-title').innerText = `${monthNames[currentMonth]} ${currentYear}`;

        const grid = document.getElementById('calendar-grid-element');
        grid.innerHTML = '';

        // Render Day Labels
        const daysShort = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
        daysShort.forEach(label => {
            const div = document.createElement('div');
            div.className = 'calendar-day-label';
            div.innerText = label;
            grid.appendChild(div);
        });

        const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay(); // 0 is Sunday
        const totalDays = new Date(currentYear, currentMonth + 1, 0).getDate();

        // Adjust index so Mon is 0 and Sun is 6
        const startOffset = firstDayIndex === 0 ? 6 : firstDayIndex - 1;

        // Render Empty cells
        for (let i = 0; i < startOffset; i++) {
            const div = document.createElement('div');
            div.className = 'calendar-cell calendar-cell-empty';
            grid.appendChild(div);
        }

        // Render Day cells
        const todayStr = getLocalYYYYMMDD(new Date());

        for (let day = 1; day <= totalDays; day++) {
            const dateObj = new Date(currentYear, currentMonth, day);
            const dateStr = getLocalYYYYMMDD(dateObj);
            const cell = document.createElement('div');
            cell.className = 'calendar-cell';
            cell.innerText = day;

            // Highlight past days
            if (dateStr < todayStr) {
                cell.classList.add('calendar-cell-disabled');
            }

            // Weekends & Holidays styling
            const dayOfWeek = dateObj.getDay();
            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
            const isHoliday = window.isJoursFerieFrance(dateStr);

            if (isWeekend) cell.classList.add('calendar-cell-weekend');
            if (isHoliday) cell.classList.add('calendar-cell-holiday');

            // Selected styling
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

            // Click action
            if (dateStr >= todayStr) {
                cell.onclick = () => {
                    handleDayClick(dateObj);
                };
            }

            grid.appendChild(cell);
        }
    }

    // Day clicking handler
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

    // Navigation calendar months
    document.getElementById('cal-prev-btn').onclick = () => {
        currentMonth--;
        if (currentMonth < 0) {
            currentMonth = 11;
            currentYear--;
        }
        renderCalendar();
        updateDaysCounter();
    };

    document.getElementById('cal-next-btn').onclick = () => {
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
            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // Sunday/Saturday
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
        const motif = document.getElementById('fo-conge-motif') ? document.getElementById('fo-conge-motif').value : 'CP';

        document.getElementById('counted-days-badge').innerText = `${count} jours`;

        const alertDiv = document.getElementById('conge-balance-alert');
        if (motif === 'CP' && count > currentSolde) {
            alertDiv.style.display = 'block';
        } else {
            alertDiv.style.display = 'none';
        }

        validateFormInputs();
    }

    // Calculate business days
    function validateFormInputs() {
        const list = getSelectedDatesList();
        const count = countBusinessDays(list);
        const submitBtn = document.getElementById('submit-conge-request-btn');
        const motif = document.getElementById('fo-conge-motif') ? document.getElementById('fo-conge-motif').value : 'CP';

        const isSoldeOk = motif !== 'CP' || count <= currentSolde;
        const isValid = count > 0 && isSoldeOk && isSigned;
        submitBtn.disabled = !isValid;
    }

    // Bind motif selection change
    const motifSelect = document.getElementById('fo-conge-motif');
    if (motifSelect) {
        motifSelect.onchange = () => {
            updateDaysCounter();
        };
    }

    // Initial render
    renderCalendar();

    // Submit Request
    document.getElementById('submit-conge-request-btn').onclick = async () => {
        const list = getSelectedDatesList();
        const count = countBusinessDays(list);
        const submitBtn = document.getElementById('submit-conge-request-btn');
        const motif = document.getElementById('fo-conge-motif') ? document.getElementById('fo-conge-motif').value : 'CP';

        if (list.length === 0 || count <= 0) return;

        submitBtn.disabled = true;
        submitBtn.innerText = "Envoi...";

        const startDate = list[0];
        const endDate = list[list.length - 1];
        const signatureBase64 = canvas.toDataURL('image/png');

        try {
            await api.submitCongeRequest(startDate, endDate, list, count, signatureBase64, motif);
            window.showToast("Demande de congés envoyée !");
            window.renderMobileConges();
        } catch (e) {
            alert("Erreur de soumission: " + e.message);
            submitBtn.disabled = false;
            submitBtn.innerText = "Envoyer la demande";
        }
    };
}

// Afficher l'historique des congés
async function showCongeHistoryList() {
    const area = document.getElementById('conges-view-area');
    if (!area) return;

    // Toggle bouton actif
    document.getElementById('btn-conge-history').classList.add('conge-btn-primary');
    document.getElementById('btn-conge-history').classList.remove('conge-btn-secondary');
    document.getElementById('btn-conge-new').classList.remove('conge-btn-primary');
    document.getElementById('btn-conge-new').classList.add('conge-btn-secondary');

    area.innerHTML = `<div style="text-align:center; padding: 20px;"><div class="loader-spinner"></div></div>`;

    try {
        const requests = await api.getCongeRequests();
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
                    <div style="display:flex; justify-content:space-between; font-size:13px; color:#8E8E93;">
                        <span>Motif :</span>
                        <strong style="color: #174286;">${r.motif || 'CP'}</strong>
                    </div>

                    ${r.pdf_path ? `
                        <button onclick="window.openFile('${r.pdf_path}')" style="margin-top: 8px; width:100%; height:36px; background:rgba(23,66,134,0.1); border:none; border-radius:8px; color: #174286; font-size:12px; font-weight:700; cursor:pointer;">
                            📄 Télécharger la fiche de congé
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


// --- MODULE: GESTION DES RTT (Mobile) ---