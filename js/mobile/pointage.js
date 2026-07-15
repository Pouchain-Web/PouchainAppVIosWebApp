import { api } from '../api.js';
import { auth } from '../auth.js';
import config from '../config.js';

const PRESET_ACTIVITIES = [
    "Montage AIA 1", "Montage AIA 2", "Maintenance HT", "Travaux Ligne",
    "Logistique", "Atelier", "Bureau", "Déplacement", "Réunion", "Formation",
    "Repos", "Congés Payés", "RTT", "Maladie"
];

const MEAL_OPTIONS = ["Aucun", "1 Repas", "2 Repas", "3 Repas", "Repas GD", "Ticket Resto", "Panier Chantier"];
const TRAJET_OPTIONS = ["Aucune", "Z1", "Z2", "Z3", "Z4", "Z5", "Z6", "Z6+"];
const HOUR_OPTIONS = Array.from({ length: 22 }, (_, i) => (i + 1) * 0.5);

window.renderMobilePointage = async function (targetWeek, targetYear) {
    document.getElementById("categories-view").classList.add("hidden");
    document.getElementById("document-list").classList.remove("hidden");
    document.getElementById("selected-category-title").innerText = "Mon Pointage Hebdo";

    const uploadBtn = document.getElementById('mobile-upload-btn');
    if (uploadBtn) uploadBtn.style.display = 'none';

    window.mobileCurrentPath = "pointage";

    const container = document.getElementById("list-content");
    const now = new Date();
    const week = targetWeek || window.getISOWeekNumber(now);
    const year = targetYear || now.getFullYear();

    container.innerHTML = `<div style="text-align: center; padding: 40px;"><div class="loader-spinner"></div></div>`;

    try {
        // Fetch dynamic activities if not cached yet
        if (!window.presetActivities || window.presetActivities.length === 0) {
            try {
                const list = await api.getPointageActivities();
                if (list && list.length > 0) {
                    window.presetActivities = list.map(a => a.name);
                } else {
                    window.presetActivities = [...PRESET_ACTIVITIES];
                }
            } catch (e) {
                console.warn("Could not fetch activities from API, using static presets", e);
                window.presetActivities = [...PRESET_ACTIVITIES];
            }
        }

        const pointages = await api.getPointages(week, year);
        window.currentWeekPointages = pointages; // Cache for editing
        window.currentPointageWeek = week;
        window.currentPointageYear = year;

        // Get defaults
        const defaults = JSON.parse(localStorage.getItem('pouchain_pointage_defaults') || '{"repas":"Panier Chantier","trajet":"Z1"}');

        const isPublished = pointages.some(pt => {
            if (pt.status !== 'published') return false;
            if (!pt.activities || !Array.isArray(pt.activities)) return false;
            return pt.activities.some(act => {
                const name = act.activity_name;
                if (!name) return false;
                const lowerName = name.toLowerCase();
                const isLeave = lowerName.startsWith('cp\\') ||
                                lowerName.startsWith('rtt\\') ||
                                lowerName.startsWith('formation\\') ||
                                lowerName.startsWith('cpe\\') ||
                                lowerName.startsWith('cpef\\') ||
                                lowerName.startsWith('cs\\') ||
                                lowerName.startsWith('repos\\');
                return !isLeave;
            });
        });
        let isLocked = false;
        let lockReason = "";
        let showRequestButton = false;

        if (isPublished) {
            const req = await api.getPointageModificationRequest(week, year).catch(() => null);
            const activeReq = (Array.isArray(req) && req.length > 0) ? req[0] : null;

            if (!activeReq || activeReq.status === 'completed') {
                // Si la semaine est publiée et qu'il n'y a pas de demande active (soit pas de demande du tout, soit demande complétée)
                isLocked = true;
                lockReason = "Vous avez déjà pointé cette semaine.";
                showRequestButton = true;
            } else if (activeReq.status === 'pending') {
                isLocked = true;
                lockReason = "Demande de modification en attente de validation par un administrateur.";
                showRequestButton = false;
            } else if (activeReq.status === 'rejected') {
                isLocked = true;
                lockReason = "Votre demande de modification a été refusée par l'administrateur.";
                showRequestButton = true;
            } else if (activeReq.status === 'approved') {
                isLocked = false;
            } else {
                isLocked = true;
                lockReason = "Vous avez déjà pointé cette semaine.";
                showRequestButton = true;
            }
        }

        const dk = document.documentElement.getAttribute("data-theme") === "dark";
        const headerBg = dk ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.02)";
        const headerBorder = dk ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)";
        const textColor = dk ? "white" : "#1c1c1e";
        const btnBg = dk ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)";
        const btnColor = dk ? "white" : "#1c1c1e";
        const lockedCardBg = dk ? "#1C1C1E" : "#FFFFFF";
        const lockedCardBorder = dk ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)";
        const lockedCardShadow = dk ? "rgba(0,0,0,0.3)" : "rgba(0,0,0,0.05)";

        container.innerHTML = `
            <div style="padding: 15px; padding-bottom: 120px;">
                <button onclick="window.goHome()" style="background: none; border: none; color: #174286; font-weight: 800; font-size: 15px; margin-bottom: 20px; display: flex; align-items: center; gap: 5px;">← Retour</button>
                
                <div style="background: ${headerBg}; padding: 15px; border-radius: 18px; margin-bottom: 25px; display: flex; align-items: center; justify-content: space-between; border: 1px solid ${headerBorder}; color: ${textColor};">
                    <div>
                        <div style="font-weight: 800; font-size: 16px;">Semaine ${week} - ${year}</div>
                        <div id="autosave-indicator" style="font-size: 11px; color: #8E8E93; font-weight: 600; margin-top: 2px;">☁️ Prêt</div>
                    </div>
                    <div style="display: flex; gap: 10px;">
                        <button onclick="window.navigateMobilePointage(${week - 1}, ${year})" style="background: ${btnBg}; border:none; color: ${btnColor}; width:40px; height:40px; border-radius:12px; font-size: 18px; cursor: pointer;">&lt;</button>
                        <button onclick="window.navigateMobilePointage(${week + 1}, ${year})" style="background: ${btnBg}; border:none; color: ${btnColor}; width:40px; height:40px; border-radius:12px; font-size: 18px; cursor: pointer;">&gt;</button>
                    </div>
                </div>
 
                ${isLocked ? `
                <div style="background: ${lockedCardBg}; border: 1px solid ${lockedCardBorder}; border-radius: 28px; width: 100%; padding: 40px 20px; box-shadow: 0 10px 30px ${lockedCardShadow}; display: flex; flex-direction: column; align-items: center; text-align: center; margin-top: 10px;">
                    <div style="font-size: 50px; margin-bottom: 15px;">🔒</div>
                    <div style="font-weight: 900; font-size: 20px; color: ${textColor}; margin-bottom: 10px;">Semaine Verrouillée</div>
                    <div style="font-size: 14px; color: #8E8E93; margin-bottom: 25px; line-height: 1.4; max-width: 280px;">${lockReason}</div>
                    
                    <div style="display: flex; flex-direction: column; gap: 12px; width: 100%; max-width: 280px; align-items: center;">
                        <button onclick="window.showMyPointageSummary()" style="width: 100%; background: ${btnBg}; border: 1px solid ${headerBorder}; color: ${textColor}; padding: 16px; border-radius: 18px; font-weight: 800; font-size: 14px; cursor: pointer;">
                            🔎 Voir mon pointage
                        </button>
                        ${showRequestButton ? `
                            <button onclick="window.requestPointageModification(${week}, ${year})" style="width: 100%; background: #174286; color: white; border: none; padding: 16px; border-radius: 18px; font-weight: 800; font-size: 14px; box-shadow: 0 4px 15px rgba(23, 66, 134, 0.3); cursor: pointer;">
                                Demander une modification
                            </button>
                        ` : ''}
                    </div>
                </div>
                ` : `
                <div id="pointage-days-list" style="display: flex; flex-direction: column; gap: 30px;">
                    ${['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'].map((dayName, i) => {
            const date = new Date();
            const dayOffset = (i + 1) - (now.getDay() || 7);
            date.setDate(now.getDate() + dayOffset + (week - window.getISOWeekNumber(now)) * 7);
            const isoDate = date.toISOString().split('T')[0];
            const isWeekend = i >= 5;
            
            let p = pointages.find(pt => pt.date === isoDate);
            if (!p) {
                p = {
                    date: isoDate,
                    activities: isWeekend ? [] : [{ activity_name: '', hours: 7, project_name: '' }],
                    night_hours: 0,
                    grand_deplacement: false,
                    repas: isWeekend ? "Aucun" : (defaults.repas || "Panier Chantier"),
                    trajet: isWeekend ? "Aucune" : (defaults.trajet || "Z1")
                };
            } else {
                if (!isWeekend) {
                    if (!p.repas || p.repas === "" || p.repas === "Aucun") {
                        p.repas = defaults.repas || "Panier Chantier";
                    }
                    if (!p.trajet || p.trajet === "" || p.trajet === "Aucune") {
                        p.trajet = defaults.trajet || "Z1";
                    }
                }
            }

            return window.generateDayFormHtml(dayName, date, p, i >= 5);
        }).join('')}
                </div>
                `}
            </div>
            
            ${isLocked ? '' : `
            <div style="position: fixed; bottom: 20px; left: 15px; right: 15px; z-index: 100; display: flex; flex-direction: column;">
                <button onclick="window.saveAllPointages(${week}, ${year}, 'published')" style="width: 100%; background: #174286; color: white; border: none; padding: 18px; border-radius: 18px; font-weight: 900; font-size: 15px; box-shadow: 0 8px 20px rgba(23, 66, 134, 0.4); cursor: pointer;">
                    🚀 Publier la semaine
                </button>
            </div>
            `}
        `;

        if (!isLocked) {
            // Bind auto-save listeners on all inputs/selects/checkboxes via delegation
            const formList = document.getElementById('pointage-days-list');
            if (formList) {
                formList.addEventListener('input', () => window.triggerPointageAutosave());
                formList.addEventListener('change', () => window.triggerPointageAutosave());
            }
        }
    } catch (e) {
        container.innerHTML = `<div style="padding: 40px; text-align: center; color: #FF3B30;">Erreur: ${e.message}</div>`;
    }
};

window.generateDayFormHtml = function (dayName, date, p, isWeekend) {
    const isoDate = p.date;
    const dateDisplay = date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
    const dk = document.documentElement.getAttribute("data-theme") === "dark";

    // Theme-dependent styles
    const cardBg = dk ? "rgba(255,255,255,0.03)" : "#FFFFFF";
    const cardBorder = dk ? (isWeekend ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.12)') : (isWeekend ? 'rgba(0,0,0,0.05)' : 'rgba(0,0,0,0.08)');
    const cardShadow = dk ? "0 4px 15px rgba(0,0,0,0.1)" : "0 4px 15px rgba(0,0,0,0.04)";
    const dayLabelColor = isWeekend ? '#8E8E93' : (dk ? '#fff' : '#1c1c1e');
    const headerBorder = dk ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)";
    const addBtnBg = dk ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)";
    const addBtnBorder = dk ? "1px dashed rgba(255,255,255,0.2)" : "1px dashed rgba(0,0,0,0.15)";
    const addBtnColor = dk ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.6)";

    const labelColor = '#8E8E93';
    const selectBg = dk ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.04)";
    const selectColor = dk ? "white" : "#1c1c1e";
    const selectBorder = dk ? "none" : "1px solid rgba(0,0,0,0.08)";
    const starColor = (JSON.parse(localStorage.getItem('pouchain_pointage_defaults') || '{}').repas === p.repas) ? '#FFCC00' : (dk ? 'rgba(255,255,255,0.2)' : '#AEAEB2');
    const starTrajetColor = (JSON.parse(localStorage.getItem('pouchain_pointage_defaults') || '{}').trajet === p.trajet) ? '#FFCC00' : (dk ? 'rgba(255,255,255,0.2)' : '#AEAEB2');

    const gdLabelColor = dk ? '#fff' : '#1c1c1e';
    const nightLabelColor = '#8E8E93';

    return `
        <div class="day-card" data-date="${isoDate}" style="background: ${cardBg}; border: 1px solid ${cardBorder}; border-radius: 24px; padding: 20px; box-shadow: ${cardShadow};">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 1px solid ${headerBorder}; padding-bottom: 12px;">
                <div>
                    <span style="font-weight: 900; font-size: 17px; color: ${dayLabelColor};">${dayName}</span>
                    <span style="font-size: 14px; color: #8E8E93; margin-left: 8px;">${dateDisplay}</span>
                </div>
                ${isWeekend ? '<span style="font-size: 11px; font-weight: 800; color: #8E8E93; text-transform: uppercase;">Week-end</span>' : ''}
            </div>

            <div class="day-activities" id="activities-${isoDate}">
                ${(p.activities || []).map((act, idx) => window.generateActivityRowHtml(isoDate, idx, act)).join('')}
            </div>
            
            <button onclick="window.addActivityToDay('${isoDate}')" style="background: ${addBtnBg}; border: ${addBtnBorder}; color: ${addBtnColor}; width: 100%; padding: 12px; border-radius: 14px; font-size: 13px; font-weight: 700; margin-bottom: 20px; cursor: pointer;">+ Ajouter activité</button>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                <div class="form-group">
                    <label style="font-size: 11px; font-weight: 800; color: ${labelColor}; text-transform: uppercase; display: block; margin-bottom: 6px;">Repas</label>
                    <div style="display: flex; gap: 4px;">
                        <select class="p-repas-select" data-date="${isoDate}" onchange="window.updateDefaultStarColor('repas', '${isoDate}')" style="flex: 1; background: ${selectBg}; border: ${selectBorder}; color: ${selectColor}; padding: 10px; border-radius: 10px; font-size: 13px; font-weight: 600;">
                            ${MEAL_OPTIONS.map(opt => `<option value="${opt}" style="background-color: ${dk ? '#1c1c1e' : '#ffffff'}; color: ${dk ? '#ffffff' : '#000000'};" ${p.repas === opt ? 'selected' : ''}>${opt}</option>`).join('')}
                        </select>
                        <button id="star-repas-${isoDate}" onclick="window.setDefaultPointage('repas', '${isoDate}')" style="background: none; border: none; font-size: 18px; padding: 0 5px; color: ${starColor}; transition: 0.2s; cursor: pointer;">★</button>
                    </div>
                </div>
                <div class="form-group">
                    <label style="font-size: 11px; font-weight: 800; color: ${labelColor}; text-transform: uppercase; display: block; margin-bottom: 6px;">Zone</label>
                    <div style="display: flex; gap: 4px;">
                        <select class="p-trajet-select" data-date="${isoDate}" onchange="window.updateDefaultStarColor('trajet', '${isoDate}')" style="flex: 1; background: ${selectBg}; border: ${selectBorder}; color: ${selectColor}; padding: 10px; border-radius: 10px; font-size: 13px; font-weight: 600;">
                            ${TRAJET_OPTIONS.map(opt => `<option value="${opt}" style="background-color: ${dk ? '#1c1c1e' : '#ffffff'}; color: ${dk ? '#ffffff' : '#000000'};" ${p.trajet === opt ? 'selected' : ''}>${opt}</option>`).join('')}
                        </select>
                        <button id="star-trajet-${isoDate}" onclick="window.setDefaultPointage('trajet', '${isoDate}')" style="background: none; border: none; font-size: 18px; padding: 0 5px; color: ${starTrajetColor}; transition: 0.2s; cursor: pointer;">★</button>
                    </div>
                </div>
            </div>
            <div style="display: flex; flex-direction: column; gap: 12px; margin-top: 15px; border-top: 1px solid ${headerBorder}; padding-top: 15px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <input type="checkbox" class="p-gd-check" data-date="${isoDate}" ${p.grand_deplacement ? 'checked' : ''} style="width: 18px; height: 18px; border-radius: 4px; cursor: pointer;" />
                        <label style="font-size: 13px; font-weight: 600; color: ${gdLabelColor}; cursor: pointer;">Grand Déplacement (GD)</label>
                    </div>
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <label style="font-size: 12px; font-weight: 600; color: ${nightLabelColor};">Nuit:</label>
                        <input type="number" class="p-night-input" data-date="${isoDate}" value="${p.night_hours || 0}" step="0.5" style="width: 50px; background: ${selectBg}; border: ${selectBorder}; color: ${selectColor}; padding: 8px; border-radius: 8px; text-align: center; font-size: 13px; font-weight: 800;" />
                    </div>
                </div>
                <div style="display: flex; align-items: center; gap: 8px;">
                    <input type="checkbox" class="p-vp-check" data-date="${isoDate}" ${p.vehicule_pouchain ? 'checked' : ''} style="width: 18px; height: 18px; border-radius: 4px; cursor: pointer;" />
                    <label style="font-size: 13px; font-weight: 600; color: ${gdLabelColor}; cursor: pointer;">Véhicule Pouchain</label>
                </div>
            </div>
        </div>
    `;
};

window.generateActivityRowHtml = function (isoDate, idx, act) {
    const dk = document.documentElement.getAttribute("data-theme") === "dark";
    const selectBg = dk ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.04)";
    const selectBorder = dk ? "1px solid rgba(255,255,255,0.05)" : "1px solid rgba(0,0,0,0.08)";
    const hoursSelectBg = dk ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.06)";
    const textColor = dk ? "#fff" : "#1c1c1e";
    const actNameColor = act.activity_name ? textColor : (dk ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.4)');

    return `
        <div class="activity-row" style="margin-bottom: 12px; position: relative;">
            <div style="display: flex; gap: 8px;">
                <div onclick="window.openActivityPicker('${isoDate}', ${idx})" style="flex: 1; background: ${selectBg}; padding: 14px; border-radius: 14px; color: ${actNameColor}; font-size: 14px; font-weight: 700; display: flex; justify-content: space-between; align-items: center; border: ${selectBorder}; cursor: pointer;">
                    <span id="act-name-${isoDate}-${idx}">${act.activity_name || 'Choisir activité...'}</span>
                    <span style="font-size: 12px; opacity: 0.5;">▼</span>
                    <input type="hidden" class="p-act-name" data-date="${isoDate}" data-idx="${idx}" value="${window.escapeHTML(act.activity_name || '')}" />
                </div>
                <select class="p-act-hours" data-date="${isoDate}" data-idx="${idx}" style="width: 75px; background: ${hoursSelectBg}; border: ${selectBorder}; color: ${textColor}; padding: 12px; border-radius: 14px; text-align: center; font-size: 14px; font-weight: 900;">
                    ${HOUR_OPTIONS.map(h => `<option value="${h}" style="background-color: ${dk ? '#1c1c1e' : '#ffffff'}; color: ${dk ? '#ffffff' : '#000000'};" ${parseFloat(act.hours) === h ? 'selected' : ''}>${h}h</option>`).join('')}
                </select>
            </div>
            <button onclick="this.parentElement.remove(); window.triggerPointageAutosave();" style="position: absolute; top: -10px; right: -10px; background: rgba(255,59,48,0.3); color: #fff; border: none; width: 26px; height: 26px; border-radius: 50%; font-size: 12px; display: flex; align-items: center; justify-content: center; z-index: 2; backdrop-filter: blur(5px); cursor: pointer;">✕</button>
        </div>
    `;
};

window.addActivityToDay = function (isoDate) {
    const container = document.getElementById(`activities-${isoDate}`);
    const idx = container.querySelectorAll('.activity-row').length;
    const div = document.createElement('div');
    div.innerHTML = window.generateActivityRowHtml(isoDate, idx, { activity_name: '', hours: 0, project_name: '' });
    container.appendChild(div.firstElementChild);
    window.triggerPointageAutosave();
};

window.openActivityPicker = function (isoDate, idx) {
    const dk = document.documentElement.getAttribute("data-theme") === "dark";
    const bg = dk ? "rgba(28,28,30,0.95)" : "rgba(255,255,255,0.95)";
    const backdrop = "blur(15px)";
    const textColor = dk ? "#fff" : "#1c1c1e";
    const inputBg = dk ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)";
    const inputBorder = dk ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.15)";
    const inputColor = dk ? "white" : "black";
    const closeBtnBg = dk ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)";

    const overlay = document.createElement('div');
    overlay.style = `position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: ${bg}; backdrop-filter: ${backdrop}; -webkit-backdrop-filter: ${backdrop}; z-index: 10000; display: flex; flex-direction: column; padding: 20px;`;

    overlay.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <h2 style="margin: 0; color: ${textColor}; font-size: 18px; font-weight: 800;">Choisir une activité</h2>
            <button onclick="this.closest('.picker-overlay').remove()" style="background: ${closeBtnBg}; border: none; color: ${textColor}; width: 36px; height: 36px; border-radius: 50%; font-size: 18px; display: flex; align-items: center; justify-content: center; cursor: pointer;">✕</button>
        </div>
        <input type="text" id="activity-search" placeholder="🔍 Rechercher..." style="width: 100%; background: ${inputBg}; border: 1px solid ${inputBorder}; color: ${inputColor}; padding: 15px; border-radius: 16px; font-size: 16px; margin-bottom: 20px; box-sizing: border-box; outline: none;">
        <div id="picker-list" style="flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 8px; padding-bottom: 20px;">
        </div>
    `;
    overlay.className = 'picker-overlay';
    document.body.appendChild(overlay);

    const pickerList = document.getElementById('picker-list');
    const searchInput = document.getElementById('activity-search');

    const renderList = (filter = '') => {
        pickerList.innerHTML = '';
        const favorites = JSON.parse(localStorage.getItem('pouchain_activity_favorites') || '[]');

        // Combine presets + favorites, unique
        const all = [...new Set([...favorites, ...(window.presetActivities || PRESET_ACTIVITIES)])];
        const filtered = all.filter(a => a.toLowerCase().includes(filter.toLowerCase()));

        // Sort: Favorites first
        filtered.sort((a, b) => {
            const isFavA = favorites.includes(a);
            const isFavB = favorites.includes(b);
            if (isFavA && !isFavB) return -1;
            if (!isFavA && isFavB) return 1;
            return a.localeCompare(b);
        });

        const itemBg = dk ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.02)";
        const itemBorder = dk ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.06)";
        const starColorOff = dk ? "rgba(255,255,255,0.2)" : "#AEAEB2";

        filtered.forEach(act => {
            const isFav = favorites.includes(act);
            const isReposRecup = act === "Repos\\Recup";
            const itemBgColor = isReposRecup ? (dk ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.01)") : itemBg;
            const itemOpacity = isReposRecup ? "0.4" : "1";

            const div = document.createElement('div');
            div.style = `background: ${itemBgColor}; opacity: ${itemOpacity}; padding: 16px; border-radius: 14px; display: flex; justify-content: space-between; align-items: center; border: 1px solid ${itemBorder}; cursor: ${isReposRecup ? 'not-allowed' : 'pointer'};`;
            div.innerHTML = `
                <div style="flex: 1; color: ${textColor}; font-weight: 700; font-size: 15px;">${act}</div>
                <button class="fav-btn" data-act="${window.escapeHTML(act)}" style="background: none; border: none; font-size: 22px; padding: 0 10px; color: ${isFav ? '#FFCC00' : starColorOff}; transition: 0.2s; cursor: pointer;">★</button>
            `;
            div.onclick = (e) => {
                if (isReposRecup) {
                    alert("Cette activité doit être remplie via une demande de récup via l'app Heures Sup.");
                    return;
                }
                const favBtn = e.target.closest('.fav-btn');
                if (favBtn) {
                    e.stopPropagation();
                    const isNowFav = window.toggleActivityFavorite(act);
                    favBtn.style.color = isNowFav ? '#FFCC00' : starColorOff;
                    // Re-render list to update sorting if needed after a delay
                    setTimeout(() => renderList(searchInput.value), 300);
                    return;
                }
                document.getElementById(`act-name-${isoDate}-${idx}`).innerText = act;
                document.querySelector(`.p-act-name[data-date="${isoDate}"][data-idx="${idx}"]`).value = act;
                overlay.remove();
                window.triggerPointageAutosave();
            };
            pickerList.appendChild(div);
        });

        if (filtered.length === 0 && filter) {
            const div = document.createElement('div');
            div.style = "text-align: center; padding: 20px; color: rgba(255,255,255,0.4); font-size: 14px;";
            div.innerText = "Aucun résultat. Appuyez sur Entrée pour ajouter.";
            pickerList.appendChild(div);
        }
    };

    searchInput.oninput = (e) => renderList(e.target.value);
    searchInput.onkeydown = (e) => {
        if (e.key === 'Enter' && searchInput.value.trim()) {
            const act = searchInput.value.trim();
            document.getElementById(`act-name-${isoDate}-${idx}`).innerText = act;
            document.querySelector(`.p-act-name[data-date="${isoDate}"][data-idx="${idx}"]`).value = act;
            overlay.remove();
        }
    };

    renderList();
    searchInput.focus();
};

window.toggleActivityFavorite = function (act) {
    let favorites = JSON.parse(localStorage.getItem('pouchain_activity_favorites') || '[]');
    let isNowFav = false;
    if (favorites.includes(act)) {
        favorites = favorites.filter(a => a !== act);
    } else {
        favorites.push(act);
        isNowFav = true;
    }
    localStorage.setItem('pouchain_activity_favorites', JSON.stringify(favorites));
    return isNowFav;
};

window.updateDefaultStarColor = function (type, isoDate) {
    const select = document.querySelector(`.p-${type}-select[data-date="${isoDate}"]`);
    const star = document.getElementById(`star-${type}-${isoDate}`);
    const defaults = JSON.parse(localStorage.getItem('pouchain_pointage_defaults') || '{}');
    const dk = document.documentElement.getAttribute("data-theme") === "dark";
    if (defaults[type] === select.value) {
        star.style.color = '#FFCC00';
    } else {
        star.style.color = dk ? 'rgba(255,255,255,0.2)' : '#AEAEB2';
    }
};

window.setDefaultPointage = function (type, isoDate) {
    const select = document.querySelector(`.p-${type}-select[data-date="${isoDate}"]`);
    const val = select.value;
    const defaults = JSON.parse(localStorage.getItem('pouchain_pointage_defaults') || '{}');
    defaults[type] = val;
    localStorage.setItem('pouchain_pointage_defaults', JSON.stringify(defaults));

    // Auto-fill all other days in the current view EXCEPT weekends
    document.querySelectorAll(`.p-${type}-select`).forEach(s => {
        const dateStr = s.getAttribute('data-date');
        const d = new Date(dateStr);
        const day = d.getDay(); // 0 is Sunday, 6 is Saturday
        if (day !== 0 && day !== 6) {
            s.value = val;
        }
        // Trigger star color update for each day
        window.updateDefaultStarColor(type, dateStr);
    });

    window.showToast(`Défaut "${type}" appliqué aux jours de la semaine : ${val}`);
    window.triggerPointageAutosave();
};

window.openMobileSignatureModal = function (titleText = "Signature requise", durationHours = 0) {
    return new Promise((resolve) => {
        const dk = document.documentElement.getAttribute("data-theme") === "dark";
        const bg = dk ? "#1C1C1E" : "#FFFFFF";
        const textColor = dk ? "#FFFFFF" : "#1C1C1E";
        const border = dk ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)";
        const inputBg = dk ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)";

        // Helper to calculate default end time
        const calculateDefaultEndTime = (startTimeStr, durHours) => {
            const [h, m] = startTimeStr.split(':').map(Number);
            let totalMinutes = h * 60 + m;
            let targetMinutes = Math.round(durHours * 60);
            let minutesAdded = 0;
            while (minutesAdded < targetMinutes) {
                totalMinutes++;
                const minOfDay = totalMinutes % 1440;
                // Exclude lunch break 11:30 to 12:30 (690 to 750 minutes)
                if (minOfDay < 690 || minOfDay >= 750) {
                    minutesAdded++;
                }
            }
            let endH = Math.floor(totalMinutes / 60) % 24;
            let endM = totalMinutes % 60;
            return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
        };

        // Force body overflow hidden to prevent scrolling in background
        document.body.style.overflow = 'hidden';

        const overlay = document.createElement("div");
        overlay.className = "modal-overlay";
        overlay.style.zIndex = "20000";

        overlay.innerHTML = `
            <div class="modal-box" style="background: ${bg}; padding: 0; overflow: hidden; display: flex; flex-direction: column; width: 90%; max-width: 400px; border-radius: 28px; animation: modalPop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);">
                <div style="padding: 20px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid ${border};">
                    <div style="width: 32px;"></div>
                    <h2 style="margin: 0; color: ${textColor}; font-size: 17px; font-weight: 800; text-align: center;">${titleText}</h2>
                    <button id="close-sig-modal" style="background: ${inputBg}; border: none; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 14px; color: ${textColor}; cursor: pointer;">✕</button>
                </div>
                <div style="padding: 24px; display: flex; flex-direction: column; gap: 15px;">
                    <p style="color: #8E8E93; font-size: 13px; font-weight: 500; margin: 0 0 5px 0; line-height: 1.4; text-align: center;">
                        Votre solde d'heures supplémentaires est négatif. Veuillez indiquer vos horaires et signer ci-dessous pour valider votre demande (Repos/Recup).
                    </p>
                    <div style="display: flex; gap: 12px; margin-bottom: 5px;">
                        <div style="flex: 1; display: flex; flex-direction: column; gap: 6px;">
                            <label style="color: ${textColor}; font-size: 13px; font-weight: 700; text-align: left;">Début :</label>
                            <input type="time" id="recup-start-time" value="08:00" style="background: ${inputBg}; border: 1px solid ${border}; color: ${textColor}; padding: 10px 12px; border-radius: 12px; font-size: 15px; font-weight: 600; width: 100%; outline: none; box-sizing: border-box;">
                        </div>
                        <div style="flex: 1; display: flex; flex-direction: column; gap: 6px;">
                            <label style="color: ${textColor}; font-size: 13px; font-weight: 700; text-align: left;">Fin :</label>
                            <input type="time" id="recup-end-time" value="${calculateDefaultEndTime('08:00', durationHours)}" style="background: ${inputBg}; border: 1px solid ${border}; color: ${textColor}; padding: 10px 12px; border-radius: 12px; font-size: 15px; font-weight: 600; width: 100%; outline: none; box-sizing: border-box;">
                        </div>
                    </div>
                    <div style="border: 1px solid ${border}; border-radius: 16px; overflow: hidden; background: #FFFFFF; height: 180px; position: relative;">
                        <canvas id="recup-sig-pad" style="width: 100%; height: 100%; display: block; touch-action: none; cursor: crosshair;"></canvas>
                    </div>
                    <div style="display: flex; gap: 10px; margin-top: 10px;">
                        <button id="clear-recup-sig" style="flex: 1; height: 50px; border-radius: 14px; border: 1px solid ${border}; background: transparent; color: #FF3B30; font-weight: 800; font-size: 14px; cursor: pointer;">Effacer</button>
                        <button id="submit-recup-sig" style="flex: 1; height: 50px; border-radius: 14px; border: none; background: #174286; color: white; font-weight: 800; font-size: 14px; cursor: pointer; box-shadow: 0 4px 12px rgba(23, 66, 134, 0.3);">Valider</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);

        const canvas = document.getElementById('recup-sig-pad');
        const ctx = canvas.getContext('2d');
        let drawing = false;
        let isSigned = false;

        const startInput = document.getElementById('recup-start-time');
        const endInput = document.getElementById('recup-end-time');
        startInput.onchange = () => {
            endInput.value = calculateDefaultEndTime(startInput.value, durationHours);
        };

        // Adjust canvas resolution
        const resizeCanvas = () => {
            const rect = canvas.getBoundingClientRect();
            canvas.width = rect.width;
            canvas.height = rect.height;
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.lineWidth = 3;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.strokeStyle = '#000000';
        };
        resizeCanvas();

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
        };

        const drawEnd = () => {
            drawing = false;
        };

        // Touch Listeners
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

        // Mouse Listeners
        canvas.addEventListener('mousedown', (e) => {
            const pos = getPos(e);
            drawStart(pos.x, pos.y);
        });
        canvas.addEventListener('mousemove', (e) => {
            if (!drawing) return;
            const pos = getPos(e);
            drawMove(pos.x, pos.y);
        });
        canvas.addEventListener('mouseup', drawEnd);
        canvas.addEventListener('mouseleave', drawEnd);

        // Clear button
        document.getElementById('clear-recup-sig').onclick = () => {
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            isSigned = false;
        };

        // Close/Cancel helper
        const cleanup = () => {
            document.body.style.overflow = '';
            overlay.remove();
        };

        document.getElementById('close-sig-modal').onclick = () => {
            cleanup();
            resolve(null);
        };

        document.getElementById('submit-recup-sig').onclick = () => {
            if (!isSigned) {
                alert("Veuillez signer avant de valider.");
                return;
            }
            const dataUrl = canvas.toDataURL('image/png');
            const startTime = startInput.value || "08:00";
            const endTime = endInput.value || "12:00";

            cleanup();
            resolve({ signature: dataUrl, start_time: startTime, end_time: endTime });
        };
    });
};

window.saveAllPointages = async function (week, year, status = 'published', isAutosave = false) {
    const dayCards = document.querySelectorAll('.day-card');
    const allData = [];

    for (const card of dayCards) {
        const isoDate = card.getAttribute('data-date');
        const activities = [];

        const rowEls = card.querySelectorAll('.activity-row');
        rowEls.forEach(row => {
            const name = row.querySelector('.p-act-name').value;
            const hours = parseFloat(row.querySelector('.p-act-hours').value) || 0;
            const project = ""; // Removed as requested
            if (name && hours > 0) {
                activities.push({ activity_name: name, hours, project_name: project });
            }
        });

        const totalHours = activities.reduce((acc, a) => acc + a.hours, 0);
        const d = new Date(isoDate);
        const isWeekend = d.getDay() === 0 || d.getDay() === 6;

        // Strict rule only for publishing
        if (status === 'published' && !isWeekend && totalHours < 7) {
            const dayName = d.toLocaleDateString('fr-FR', { weekday: 'long' });
            return alert(`⚠️ Règle stricte : Le ${dayName} (${isoDate}) est incomplet (${totalHours}h). Vous devez pointer au moins 7h par jour en semaine pour publier.`);
        }

        allData.push({
            date: isoDate,
            week_number: week,
            year,
            activities,
            night_hours: parseFloat(card.querySelector('.p-night-input').value) || 0,
            grand_deplacement: card.querySelector('.p-gd-check').checked,
            vehicule_pouchain: card.querySelector('.p-vp-check').checked,
            repas: card.querySelector('.p-repas-select').value,
            trajet: card.querySelector('.p-trajet-select').value,
            status: status
        });
    }

    if (status === 'published' && !isAutosave) {
        let summaryHtml = `
            <div style="text-align: left; color: #fff; font-family: sans-serif; font-size: 14px;">
                <p style="margin-bottom: 15px; font-weight: 600; color: #8E8E93; line-height: 1.4;">
                    Veuillez vérifier vos pointages pour la semaine ${week} avant de publier. Une fois publiée, la semaine sera verrouillée.
                </p>
                <div style="display: flex; flex-direction: column; gap: 10px; max-height: 280px; overflow-y: auto; padding-right: 5px; margin-bottom: 20px;">
        `;
        allData.forEach(d => {
            const dt = new Date(d.date);
            const dayLabel = dt.toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: 'short' });
            const totH = d.activities.reduce((sum, act) => sum + act.hours, 0);
            const actList = d.activities.map(act => `${act.activity_name} (${act.hours}h)`).join(', ') || 'Aucune activité';
            const options = [];
            if (d.repas && d.repas !== 'Aucun') options.push(`Repas: ${d.repas}`);
            if (d.trajet && d.trajet !== 'Aucun') options.push(`Trajet: ${d.trajet}`);
            if (d.grand_deplacement) options.push(`GD`);
            if (d.night_hours > 0) options.push(`Nuit: ${d.night_hours}h`);

            summaryHtml += `
                <div style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08); padding: 12px; border-radius: 14px;">
                    <div style="display: flex; justify-content: space-between; font-weight: 800; font-size: 15px; margin-bottom: 4px;">
                        <span style="text-transform: capitalize; color: #174286;">${dayLabel}</span>
                        <span>${totH} h</span>
                    </div>
                    <div style="color: #E5E5EA; font-size: 13px; margin-bottom: 4px;">${actList}</div>
                    ${options.length > 0 ? `<div style="color: #8E8E93; font-size: 11px; font-style: italic;">${options.join(' | ')}</div>` : ''}
                </div>
            `;
        });
        summaryHtml += `
                </div>
            </div>
        `;

        const confirmed = await window.showPointageConfirmModal("Récapitulatif de publication", summaryHtml);
        if (!confirmed) return;
    }

    try {
        const publishBtn = document.querySelector('button[onclick*="published"]');

        if (status === 'published' && !isAutosave) {
            if (publishBtn) {
                publishBtn.disabled = true;
                publishBtn.innerHTML = 'Envoi...';
            }
        }

        await Promise.all(allData.map(data => api.submitPointage(data)));

        if (status === 'published') {
            try {
                // Clôturer directement la demande de modification approuvée pour cette semaine
                await api.completePointageModificationRequest(week, year);
            } catch (err) {
                console.warn("Could not auto-complete modification request:", err);
            }

            // Calculate overtime hours taken into account
            let calculatedOvertime = 0;
            allData.forEach(d => {
                const totalHours = d.activities.reduce((acc, act) => acc + parseFloat(act.hours || 0), 0);
                const dt = new Date(d.date);
                const dayOfWeek = dt.getUTCDay();
                
                let overtimeDelta = 0;
                if (dayOfWeek >= 1 && dayOfWeek <= 5) {
                    overtimeDelta = totalHours - 7;
                } else {
                    overtimeDelta = totalHours;
                }
                
                const recupHours = d.activities
                    .filter(act => act.activity_name && act.activity_name.startsWith('Repos\\Recup'))
                    .reduce((acc, act) => acc + parseFloat(act.hours || 0), 0);
                    
                let finalOvertimeLogAmount = 0;
                if (overtimeDelta > 0) {
                    finalOvertimeLogAmount = overtimeDelta;
                } else if (recupHours > 0) {
                    finalOvertimeLogAmount = -recupHours;
                }
                
                if (finalOvertimeLogAmount > 0) {
                    calculatedOvertime += finalOvertimeLogAmount;
                }
            });

            await window.showPointageSuccessModal(week, year, calculatedOvertime);
            window.renderMobilePointage(week, year);
        } else {
            if (!isAutosave) {
                window.showToast("💾 Brouillon enregistré localement.");
                window.renderMobilePointage(week, year);
            }
        }
    } catch (e) {
        if (!isAutosave) {
            alert("Erreur lors de l'enregistrement: " + e.message);
        } else {
            throw e;
        }
    } finally {
        if (status === 'published' && !isAutosave) {
            window.renderMobilePointage(week, year);
        }
    }
};

let autosaveTimeout = null;
window.triggerPointageAutosave = function () {
    const week = window.currentPointageWeek;
    const year = window.currentPointageYear;

    if (week && year) {
        const indicator = document.getElementById('autosave-indicator');
        if (indicator) indicator.innerText = '☁️ Enregistrement...';

        if (autosaveTimeout) clearTimeout(autosaveTimeout);
        autosaveTimeout = setTimeout(async () => {
            try {
                await window.saveAllPointages(week, year, 'draft', true);
                if (indicator) indicator.innerText = '☁️ Enregistré';
            } catch (err) {
                console.error("Autosave error:", err);
                if (indicator) indicator.innerText = '⚠️ Erreur de sauvegarde';
            }
        }, 1200); // 1.2s debounce
    }
};

window.showPointageConfirmModal = function (title, html) {
    return new Promise((resolve) => {
        const overlay = document.createElement('div');
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100vw';
        overlay.style.height = '100vh';
        overlay.style.background = 'rgba(0,0,0,0.8)';
        overlay.style.backdropFilter = 'blur(15px)';
        overlay.style.zIndex = '200000';
        overlay.style.display = 'flex';
        overlay.style.alignItems = 'center';
        overlay.style.justifyContent = 'center';
        overlay.style.padding = '20px';
        overlay.style.boxSizing = 'border-box';

        overlay.innerHTML = `
            <div class="modal-box" style="background: #1C1C1E; border: 1px solid rgba(255,255,255,0.1); border-radius: 28px; width: 100%; max-width: 420px; padding: 24px; box-shadow: 0 20px 50px rgba(0,0,0,0.5); display: flex; flex-direction: column;">
                <div style="font-size: 20px; font-weight: 900; color: white; margin-bottom: 15px; text-align: center;">${title}</div>
                <div style="flex: 1; margin-bottom: 24px; overflow-y: auto;">${html}</div>
                <div style="display: flex; gap: 12px;">
                    <button id="p-confirm-cancel" style="flex: 1; background: rgba(255,255,255,0.08); color: white; border: none; padding: 15px; border-radius: 16px; font-weight: 700; font-size: 15px; cursor: pointer;">
                        Annuler
                    </button>
                    <button id="p-confirm-ok" style="flex: 1; background: #174286; color: white; border: none; padding: 15px; border-radius: 16px; font-weight: 900; font-size: 15px; cursor: pointer; box-shadow: 0 4px 15px rgba(23, 66, 134, 0.3);">
                        Confirmer et Publier
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        overlay.querySelector('#p-confirm-cancel').onclick = () => {
            overlay.remove();
            resolve(false);
        };
        overlay.querySelector('#p-confirm-ok').onclick = () => {
            overlay.remove();
            resolve(true);
        };
    });
};

window.showPointageSuccessModal = function (week, year, overtimeHours) {
    return new Promise((resolve) => {
        const overlay = document.createElement('div');
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100vw';
        overlay.style.height = '100vh';
        overlay.style.background = 'rgba(0,0,0,0.85)';
        overlay.style.backdropFilter = 'blur(15px)';
        overlay.style.zIndex = '200000';
        overlay.style.display = 'flex';
        overlay.style.alignItems = 'center';
        overlay.style.justifyContent = 'center';
        overlay.style.padding = '20px';
        overlay.style.boxSizing = 'border-box';
        overlay.style.animation = 'modalFadeIn 0.3s ease-out';

        const style = document.createElement('style');
        style.innerHTML = `
            @keyframes modalFadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            @keyframes modalBoxSlide {
                from { transform: translateY(20px) scale(0.95); opacity: 0; }
                to { transform: translateY(0) scale(1); opacity: 1; }
            }
            @keyframes popCheck {
                0% { transform: scale(0); }
                70% { transform: scale(1.2); }
                100% { transform: scale(1); }
            }
        `;
        document.head.appendChild(style);

        overlay.innerHTML = `
            <div class="modal-box" style="background: #1C1C1E; border: 1px solid rgba(255,255,255,0.1); border-radius: 28px; width: 100%; max-width: 420px; padding: 32px 24px; box-shadow: 0 20px 50px rgba(0,0,0,0.5); display: flex; flex-direction: column; align-items: center; text-align: center; animation: modalBoxSlide 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);">
                <div style="width: 72px; height: 72px; background: rgba(46, 204, 113, 0.15); border: 2px solid #2ecc71; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-bottom: 20px; font-size: 32px; animation: popCheck 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);">
                    ✅
                </div>
                <div style="font-size: 22px; font-weight: 900; color: white; margin-bottom: 10px;">Semaine publiée avec succès !</div>
                <div style="font-size: 14px; color: #8E8E93; margin-bottom: 24px; line-height: 1.5; max-width: 320px;">
                    Votre pointage pour la semaine ${week} (${year}) a été validé et enregistré.
                </div>
                
                ${overtimeHours > 0 ? `
                <div style="background: rgba(88, 86, 214, 0.12); border: 1px solid rgba(88, 86, 214, 0.25); border-radius: 20px; padding: 16px 20px; width: 100%; margin-bottom: 24px; box-sizing: border-box; display: flex; flex-direction: column; align-items: center; justify-content: center;">
                    <div style="font-size: 11px; font-weight: 700; color: #A5A5D8; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px;">Heures supplémentaires calculées</div>
                    <div style="font-size: 26px; font-weight: 900; color: #5856D6; display: flex; align-items: center; gap: 8px;">
                        <span>+${overtimeHours} h</span>
                    </div>
                </div>
                ` : ''}
                
                <button id="p-success-ok" style="width: 100%; background: #174286; color: white; border: none; padding: 16px; border-radius: 18px; font-weight: 900; font-size: 16px; cursor: pointer; box-shadow: 0 4px 15px rgba(23, 66, 134, 0.35); transition: all 0.2s;">
                    Continuer
                </button>
            </div>
        `;

        document.body.appendChild(overlay);

        overlay.querySelector('#p-success-ok').onclick = () => {
            style.remove();
            overlay.remove();
            resolve();
        };
    });
};

window.showPointagePromptModal = function (title, placeholder) {
    return new Promise((resolve) => {
        const overlay = document.createElement('div');
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100vw';
        overlay.style.height = '100vh';
        overlay.style.background = 'rgba(0,0,0,0.8)';
        overlay.style.backdropFilter = 'blur(15px)';
        overlay.style.zIndex = '200000';
        overlay.style.display = 'flex';
        overlay.style.alignItems = 'center';
        overlay.style.justifyContent = 'center';
        overlay.style.padding = '20px';
        overlay.style.boxSizing = 'border-box';

        overlay.innerHTML = `
            <div class="modal-box" style="background: #1C1C1E; border: 1px solid rgba(255,255,255,0.1); border-radius: 28px; width: 100%; max-width: 380px; padding: 24px; box-shadow: 0 20px 50px rgba(0,0,0,0.5); display: flex; flex-direction: column;">
                <div style="font-size: 20px; font-weight: 900; color: white; margin-bottom: 15px; text-align: center;">${title}</div>
                <textarea id="p-prompt-input" placeholder="${placeholder}" style="width: 100%; height: 100px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 14px; color: white; padding: 12px; font-size: 14px; box-sizing: border-box; margin-bottom: 20px; outline: none; font-family: sans-serif; resize: none;"></textarea>
                <div style="display: flex; gap: 12px;">
                    <button id="p-prompt-cancel" style="flex: 1; background: rgba(255,255,255,0.08); color: white; border: none; padding: 15px; border-radius: 16px; font-weight: 700; font-size: 15px; cursor: pointer;">
                        Annuler
                    </button>
                    <button id="p-prompt-ok" style="flex: 1; background: #174286; color: white; border: none; padding: 15px; border-radius: 16px; font-weight: 900; font-size: 15px; cursor: pointer; box-shadow: 0 4px 15px rgba(23, 66, 134, 0.3);">
                        Envoyer
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);
        const input = overlay.querySelector('#p-prompt-input');
        input.focus();

        overlay.querySelector('#p-prompt-cancel').onclick = () => {
            overlay.remove();
            resolve(null);
        };
        overlay.querySelector('#p-prompt-ok').onclick = () => {
            const val = input.value.trim();
            overlay.remove();
            resolve(val);
        };
    });
};

window.requestPointageModification = async function (week, year) {
    const comment = await window.showPointagePromptModal("Demander une modification", "Indiquez le motif de votre demande...");
    if (comment === null) return;
    if (comment === "") {
        alert("Veuillez saisir un motif pour votre demande.");
        return;
    }

    try {
        await api.submitPointageModificationRequest(week, year, comment);
        alert("📩 Demande de modification soumise avec succès à l'administrateur.");
        window.renderMobilePointage(week, year);
    } catch (e) {
        alert("Erreur lors de la soumission: " + e.message);
    }
};

window.showMyPointageSummary = function () {
    const pointages = window.currentWeekPointages || [];

    // Trier ou mapper les jours du Lundi au Dimanche
    const daysOfWeek = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

    // Déterminer l'année et la semaine en cours d'affichage
    // On peut les retrouver depuis les pointages s'ils existent
    let titleInfo = "";
    if (pointages.length > 0) {
        titleInfo = `Semaine ${pointages[0].week_number} - ${pointages[0].year}`;
    }

    let summaryHtml = `
        <div style="text-align: left; color: #fff; font-family: sans-serif; font-size: 14px;">
            <div style="display: flex; flex-direction: column; gap: 12px; max-height: 400px; overflow-y: auto; padding-right: 5px;">
    `;

    // Trier les pointages par date pour les afficher dans l'ordre chronologique
    const sortedPointages = [...pointages].sort((a, b) => a.date.localeCompare(b.date));

    if (sortedPointages.length === 0) {
        summaryHtml += `<div style="text-align: center; color: #8E8E93; padding: 20px;">Aucun pointage enregistré pour cette semaine.</div>`;
    } else {
        sortedPointages.forEach(pt => {
            const dt = new Date(pt.date);
            const dayLabel = dt.toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: 'short' });
            const totH = (pt.activities || []).reduce((sum, act) => sum + parseFloat(act.hours || 0), 0);
            const actList = (pt.activities || []).map(act => `${act.activity_name} (${act.hours}h)`).join(', ') || 'Aucune activité';

            const options = [];
            if (pt.repas && pt.repas !== 'Aucun') options.push(`Repas: ${pt.repas}`);
            if (pt.trajet && pt.trajet !== 'Aucun') options.push(`Trajet: ${pt.trajet}`);
            if (pt.grand_deplacement) options.push(`GD`);
            if (pt.vehicule_pouchain) options.push(`Véhicule Pouchain`);
            if (pt.night_hours > 0) options.push(`Nuit: ${pt.night_hours}h`);

            summaryHtml += `
                <div style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08); padding: 14px; border-radius: 18px;">
                    <div style="display: flex; justify-content: space-between; font-weight: 800; font-size: 15px; margin-bottom: 6px;">
                        <span style="text-transform: capitalize; color: #174286;">${dayLabel}</span>
                        <span style="color: #fff;">${totH} h</span>
                    </div>
                    <div style="color: #E5E5EA; font-size: 13px; margin-bottom: 6px; font-weight: 500;">${actList}</div>
                    ${options.length > 0 ? `<div style="color: #8E8E93; font-size: 11px; font-style: italic; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 6px; margin-top: 6px;">${options.join(' | ')}</div>` : ''}
                </div>
            `;
        });
    }

    summaryHtml += `
            </div>
        </div>
    `;

    // Créer une modal en lecture seule simple
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100vw';
    overlay.style.height = '100vh';
    overlay.style.background = 'rgba(0,0,0,0.85)';
    overlay.style.backdropFilter = 'blur(15px)';
    overlay.style.zIndex = '200000';
    overlay.style.display = 'flex';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    overlay.style.padding = '20px';
    overlay.style.boxSizing = 'border-box';

    overlay.innerHTML = `
        <div class="modal-box" style="background: #1C1C1E; border: 1px solid rgba(255,255,255,0.1); border-radius: 28px; width: 100%; max-width: 440px; padding: 24px; box-shadow: 0 20px 50px rgba(0,0,0,0.5); display: flex; flex-direction: column;">
            <div style="font-size: 20px; font-weight: 900; color: white; margin-bottom: 15px; text-align: center;">Mon Pointage ${titleInfo}</div>
            <div style="flex: 1; margin-bottom: 24px; overflow-y: auto;">${summaryHtml}</div>
            <button id="p-summary-close" style="width: 100%; background: #174286; color: white; border: none; padding: 16px; border-radius: 18px; font-weight: 900; font-size: 15px; cursor: pointer; box-shadow: 0 4px 15px rgba(23, 66, 134, 0.3);">
                Fermer
            </button>
        </div>
    `;

    document.body.appendChild(overlay);

    overlay.querySelector('#p-summary-close').onclick = () => {
        overlay.remove();
    };
};

window.getISOWeekNumber = function (d) {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    var yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    var weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    return weekNo;
};

window.navigateMobilePointage = async function (targetWeek, targetYear) {
    if (autosaveTimeout) {
        clearTimeout(autosaveTimeout);
        autosaveTimeout = null;
    }
    const daysList = document.getElementById('pointage-days-list');
    if (daysList && window.currentPointageWeek && window.currentPointageYear) {
        const indicator = document.getElementById('autosave-indicator');
        if (indicator) indicator.innerText = '☁️ Sauvegarde en cours...';
        try {
            await window.saveAllPointages(window.currentPointageWeek, window.currentPointageYear, 'draft', true);
        } catch (e) {
            console.error("Failed to save pointages before week navigation:", e);
        }
    }
    window.renderMobilePointage(targetWeek, targetYear);
};

// Wrap window.goHome to save any pending pointage modifications before returning to dashboard
if (typeof window.goHome === 'function' && !window.goHome.isPointageWrapped) {
    const originalGoHome = window.goHome;
    window.goHome = async function () {
        if (window.mobileCurrentPath === 'pointage' && autosaveTimeout) {
            clearTimeout(autosaveTimeout);
            autosaveTimeout = null;
            const daysList = document.getElementById('pointage-days-list');
            if (daysList && window.currentPointageWeek && window.currentPointageYear) {
                try {
                    await window.saveAllPointages(window.currentPointageWeek, window.currentPointageYear, 'draft', true);
                } catch (e) {
                    console.error("Failed to save pointages on goHome:", e);
                }
            }
        }
        originalGoHome();
    };
    window.goHome.isPointageWrapped = true;
}

