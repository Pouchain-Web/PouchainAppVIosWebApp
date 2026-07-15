import { api } from '../api.js';
import { auth } from '../auth.js';
import config from '../config.js';

function getISOWeekNumber(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

// Map a week number (1-52) in a given year to its respective month (1-12)
function getMonthFromWeek(week, year) {
    const jan4 = new Date(year, 0, 4);
    const day = jan4.getDay() || 7;
    const mondayVal = jan4.getTime() - (day - 1) * 24 * 60 * 60 * 1000;
    const targetMonday = new Date(mondayVal + (week - 1) * 7 * 24 * 60 * 60 * 1000);
    const midWeek = new Date(targetMonday.getTime() + 3 * 24 * 60 * 60 * 1000);
    return midWeek.getMonth() + 1; // 1-12
}

// Get the Monday date for a given ISO week number and year
function getMondayOfWeek(week, year) {
    const jan4 = new Date(year, 0, 4);
    const day = jan4.getDay() || 7;
    const mondayVal = jan4.getTime() - (day - 1) * 24 * 60 * 60 * 1000;
    return new Date(mondayVal + (week - 1) * 7 * 24 * 60 * 60 * 1000);
}

// Get the Sunday date for a given ISO week number and year
function getSundayOfWeek(week, year) {
    const monday = getMondayOfWeek(week, year);
    return new Date(monday.getTime() + 6 * 24 * 60 * 60 * 1000);
}

const MONTH_SHORT = ["jan.", "fév.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];

let parsedMobilePlanningData = null;
let currentMobileChecks = [];
let selectedMobileWeek = getISOWeekNumber(new Date());
let selectedMobileYear = new Date().getFullYear();
let selectedMobileMarket = null; // Holds active market code (e.g. '01', '02')

window.renderMobilePlanningPrevisionnel = async function () {
    // Hide home views
    document.getElementById('categories-view').classList.add('hidden');
    document.getElementById('search-results-view').classList.add('hidden');
    const searchContainer = document.querySelector('.mobile-search-container');
    if (searchContainer) searchContainer.classList.add('hidden');

    const docList = document.getElementById('document-list');
    docList.classList.remove('hidden');
    docList.style.background = 'var(--ios-bg)';
    docList.style.minHeight = '100vh';

    document.getElementById('selected-category-title').innerText = "Maint. Prév.";
    document.getElementById('mobile-upload-btn').style.display = 'none';

    window.mobileCurrentPath = "planning";
    localStorage.setItem('pouchain_last_app', 'planning_previsionnel');
    const navHeader = document.querySelector('.nav-header');
    if (navHeader) navHeader.style.display = 'none';

    // Inject styles for particle burst & satisfying animations
    if (!document.getElementById('pp-satisfying-styles')) {
        const style = document.createElement('style');
        style.id = 'pp-satisfying-styles';
        style.innerHTML = `
            .pp-container {
                display: flex;
                flex-direction: column;
                padding: 16px;
                padding-top: 210px;
                padding-bottom: 90px;
                color: var(--text-primary);
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            }
            .pp-container.with-market-switch {
                padding-top: 194px !important;
            }
            .pp-container.no-market-switch {
                padding-top: 168px !important;
            }
            .pp-container.no-market {
                padding-top: 106px !important;
            }
            .pp-fixed-header {
                position: fixed;
                top: 50px;
                left: 0;
                right: 0;
                z-index: 999;
                background: var(--ios-header-bg);
                backdrop-filter: blur(20px);
                -webkit-backdrop-filter: blur(20px);
                border-bottom: 1px solid var(--ios-border);
                padding: 12px 16px;
                display: flex;
                flex-direction: column;
                gap: 8px;
            }
            .pp-header-row {
                display: flex;
                justify-content: space-between;
                align-items: center;
                gap: 8px;
            }
            .pp-title {
                font-size: 20px;
                font-weight: 800;
                margin: 0;
            }
            .pp-progress-container {
                background: rgba(142,142,147,0.15);
                border-radius: 10px;
                height: 8px;
                overflow: hidden;
                width: 100%;
                margin-top: 4px;
            }
            .pp-progress-bar {
                height: 100%;
                background: linear-gradient(90deg, #34C759, #30B0C7);
                width: 0%;
                transition: width 0.4s cubic-bezier(0.1, 0.8, 0.1, 1);
            }
            .pp-card {
                background: rgba(255, 255, 255, 0.03);
                backdrop-filter: blur(20px);
                -webkit-backdrop-filter: blur(20px);
                border: 1px solid rgba(255, 255, 255, 0.08);
                border-radius: 20px;
                padding: 16px;
                margin-bottom: 16px;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
                display: flex;
                flex-direction: column;
                gap: 12px;
                position: relative;
                overflow: hidden;
            }
            .pp-task-row {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 12px 14px;
                background: rgba(255, 255, 255, 0.04);
                border: 1px solid rgba(255, 255, 255, 0.08);
                border-radius: 14px;
                margin-top: 6px;
                transition: all 0.2s ease;
                cursor: pointer;
            }
            .pp-task-row:active {
                transform: scale(0.98);
                background: rgba(255, 255, 255, 0.08);
            }
            .pp-task-row.checked {
                background: rgba(23, 66, 134, 0.18);
                border-color: rgba(23, 66, 134, 0.4);
            }
            .pp-task-row.overdue {
                background: rgba(255, 59, 48, 0.08);
                border-color: rgba(255, 59, 48, 0.2);
            }
            .pp-checkbox {
                width: 26px;
                height: 26px;
                border-radius: 50%;
                border: 2px solid rgba(255, 255, 255, 0.2);
                background: rgba(255,255,255,0.02);
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                box-shadow: inset 0 1px 3px rgba(0,0,0,0.2);
            }
            .pp-checkbox.checked {
                background: linear-gradient(135deg, #4CD964, #28cd41);
                border-color: #4CD964;
                box-shadow: 0 0 12px rgba(76, 217, 100, 0.4);
                transform: scale(1.1);
            }
            .pp-checkbox.checked svg {
                opacity: 1;
                transform: scale(1);
            }
            .pp-checkbox svg {
                color: white;
                opacity: 0;
                transform: scale(0.5);
                transition: opacity 0.2s, transform 0.2s;
            }
            .particle {
                position: fixed;
                pointer-events: none;
                width: 6px;
                height: 6px;
                border-radius: 50%;
                z-index: 100000;
                animation: explode 0.6s ease-out forwards;
            }
            @keyframes explode {
                0% { transform: translate(0, 0) scale(1); opacity: 1; }
                100% { transform: translate(var(--tx), var(--ty)) scale(0.2); opacity: 0; }
            }
            
            /* Badge styles */
            .pp-badge-red {
                background: #FF3B30;
                color: white;
                font-size: 10px;
                font-weight: 800;
                border-radius: 10px;
                padding: 1px 6px;
                min-width: 12px;
                text-align: center;
            }
            .pp-section-title {
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 10px 4px 6px 4px;
                font-size: 13px;
                font-weight: 800;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
        `;
        document.head.appendChild(style);
    }

    // Format week date range for display
    const formatWeekRange = (week, year) => {
        const monday = getMondayOfWeek(week, year);
        const sunday = getSundayOfWeek(week, year);
        const fmtDay = (d) => `${d.getDate()} ${MONTH_SHORT[d.getMonth()]}`;
        return `${fmtDay(monday)} → ${fmtDay(sunday)}`;
    };

    // Header layout
    document.getElementById('list-content').innerHTML = `
        <div class="pp-fixed-header">
            <div class="pp-header-row">
                <div class="back-button" id="pp-back-btn" style="padding:0; margin:0;">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:4px;">
                        <path d="M15 18L9 12L15 6"></path>
                    </svg>
                    Retour
                </div>
                <h1 class="pp-title">Maint. Prév.</h1>
            </div>
            
            <div id="pp-week-picker-wrapper" style="display:flex; align-items:center; justify-content:space-between; background:var(--ios-card-bg); padding:8px 14px; border-radius:14px; margin-top:8px; box-shadow:var(--ios-shadow);">
                <button class="ios-nav-btn" onclick="window.changeMobileWeek(-1)" style="position:relative; background:rgba(255,255,255,0.05); border:none; width:32px; height:32px; border-radius:50%; display:flex; align-items:center; justify-content:center; color:var(--primary-color); font-size:18px; cursor:pointer;">
                    ‹
                </button>
                <div style="text-align:center;">
                    <div id="pp-week-label" style="font-weight:800; font-size:15px; color:var(--text-primary);">S${selectedMobileWeek} – ${selectedMobileYear}</div>
                    <div id="pp-week-dates" style="font-size:11px; color:#8E8E93; margin-top:2px;">${formatWeekRange(selectedMobileWeek, selectedMobileYear)}</div>
                </div>
                <button class="ios-nav-btn" onclick="window.changeMobileWeek(1)" style="background:rgba(255,255,255,0.05); border:none; width:32px; height:32px; border-radius:50%; display:flex; align-items:center; justify-content:center; color:var(--primary-color); font-size:18px; cursor:pointer;">›</button>
            </div>
            
            <div id="pp-market-header-btn" style="text-align:center; margin-top:6px; display:none;">
                <button onclick="window.clearMobilePPMarket()" style="background:rgba(0,122,255,0.1); border:none; color:#007AFF; font-size:11px; font-weight:800; padding:4px 10px; border-radius:10px; cursor:pointer;">
                    Marché ⇆ Changer
                </button>
            </div>

            <div id="pp-progress-wrapper" class="pp-progress-container">
                <div id="pp-progress" class="pp-progress-bar"></div>
            </div>
        </div>

        <div class="pp-container" id="pp-mobile-content">
            <div style="display:flex; justify-content:center; padding: 40px;"><div class="loader" style="border: 4px solid var(--border); border-top-color: var(--primary-color); border-radius: 50%; width: 30px; height: 30px; animation: spin 1s linear infinite;"></div></div>
        </div>
    `;

    document.getElementById('pp-back-btn').onclick = () => {
        window.goHome();
    };

    await loadMobilePPData();
};

window.changeMobileWeek = function (dir) {
    selectedMobileWeek += dir;
    if (selectedMobileWeek < 1) {
        selectedMobileWeek = 52;
        selectedMobileYear -= 1;
    } else if (selectedMobileWeek > 52) {
        selectedMobileWeek = 1;
        selectedMobileYear += 1;
    }
    renderMobilePPWorkspace();
};

// Keep old function name for compatibility
window.changeMobilePPMonth = window.changeMobileWeek;

window.selectMobilePPMarket = function (code) {
    selectedMobileMarket = code;
    renderMobilePPWorkspace();
};

window.clearMobilePPMarket = function () {
    selectedMobileMarket = null;
    renderMobilePPWorkspace();
};

async function loadMobilePPData() {
    try {
        currentMobileChecks = await api.getPlanningPrevisionnelChecks();

        if (!parsedMobilePlanningData) {
            let res = await fetch(`${config.api.workerUrl}/get/planning_previsionnel_data.json`);
            if (res.ok) {
                parsedMobilePlanningData = await res.json();
            } else {
                res = await fetch(`${config.api.workerUrl}/get/planning_previsionnel.xlsm`);
                if (!res.ok) {
                    document.getElementById('pp-mobile-content').innerHTML = `
                        <div style="text-align:center; padding: 60px 20px; color:#8E8E93;">
                            <span style="font-size:50px; display:block; margin-bottom:15px;">📊</span>
                            <h3>Données non disponibles</h3>
                            <p style="font-size:13px;">L'administrateur n'a pas encore importé le fichier prévisionnel.</p>
                        </div>
                    `;
                    return;
                }
                const buffer = await res.arrayBuffer();
                const workbook = XLSX.read(new Uint8Array(buffer), { type: 'array' });
                parsedMobilePlanningData = parseWorkbook(workbook);
            }
        }

        renderMobilePPWorkspace();
    } catch (e) {
        console.error(e);
        document.getElementById('pp-mobile-content').innerHTML = `<div style="color:red; padding:20px; text-align:center;">Erreur: ${e.message}</div>`;
    }
}

function parseWorkbook(workbook) {
    const data = [];
    const sheetNames = ['AIACP', 'Feuil1'];

    sheetNames.forEach(sheetName => {
        const sheet = workbook.Sheets[sheetName];
        if (!sheet) return;

        const json = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        if (json.length < 5) return;

        for (let r = 4; r < json.length; r++) {
            const row = json[r];
            if (!row || !row[0]) continue;

            const eqId = String(row[0]).trim();
            if (!eqId.startsWith("MI") && !eqId.startsWith("mi")) continue;

            const eqObj = {
                sheet: sheetName,
                id: eqId,
                market_no: String(row[1] || '').trim(),
                market_name: String(row[2] || '').trim(),
                machine: String(row[4] || '').trim(),
                brand: String(row[5] || '').trim(),
                model: String(row[6] || '').trim(),
                serial: String(row[7] || '').trim(),
                location: String(row[9] || '').trim(),
                tasks: {}
            };

            for (let w = 1; w <= 52; w++) {
                const colIdx = 11 + (w - 1) * 3;
                const pVal = row[colIdx];
                const cVal = row[colIdx + 1];
                const mVal = row[colIdx + 2];

                if (pVal || cVal || mVal) {
                    eqObj.tasks[w] = {};
                    if (pVal) eqObj.tasks[w].preventif = String(pVal).trim();
                    if (cVal) eqObj.tasks[w].controle = String(cVal).trim();
                    if (mVal) eqObj.tasks[w].metrologie = String(mVal).trim();
                }
            }
            data.push(eqObj);
        }
    });

    return data;
}

function renderMobilePPWorkspace() {
    const content = document.getElementById('pp-mobile-content');
    if (!parsedMobilePlanningData) return;

    const currentWeek = getISOWeekNumber(new Date());
    const currentYear = new Date().getFullYear();

    // Format week date range for display
    const formatWeekRange = (week, year) => {
        const monday = getMondayOfWeek(week, year);
        const sunday = getSundayOfWeek(week, year);
        const fmtDay = (d) => `${d.getDate()} ${MONTH_SHORT[d.getMonth()]}`;
        return `${fmtDay(monday)} → ${fmtDay(sunday)}`;
    };

    // Update week label
    const labelEl = document.getElementById('pp-week-label');
    if (labelEl) {
        const isThisWeek = (selectedMobileWeek === currentWeek && selectedMobileYear === currentYear);
        labelEl.innerText = isThisWeek ? `S${selectedMobileWeek} – Cette semaine` : `S${selectedMobileWeek} – ${selectedMobileYear}`;
    }
    const datesEl = document.getElementById('pp-week-dates');
    if (datesEl) {
        datesEl.innerText = formatWeekRange(selectedMobileWeek, selectedMobileYear);
    }

    let assignedList = [];
    if (window.currentUserProfile && window.currentUserProfile.assigned_markets) {
        assignedList = window.currentUserProfile.assigned_markets.split(',').map(m => m.trim().padStart(2, '0')).filter(Boolean);
    }

    // Handle Market selection if multiple assigned markets
    if (assignedList.length > 1 && !selectedMobileMarket) {
        const marketNames = {};
        parsedMobilePlanningData.forEach(eq => {
            let prefix = "Sans MI";
            const cleanId = eq.id.toUpperCase();
            if (cleanId.startsWith("MI")) {
                const num = cleanId.substring(2, 4);
                if (!isNaN(parseInt(num))) prefix = num;
            }
            if (prefix !== "Sans MI" && eq.market_name) {
                marketNames[prefix] = eq.market_name;
            }
        });

        content.innerHTML = `
            <div style="display:flex; flex-direction:column; gap:20px; width:100%; padding: 10px 4px; align-items:center;">
                <!-- Icon and Intro -->
                <div style="text-align:center; margin-bottom:10px; margin-top:10px;">
                    <div style="width: 64px; height: 64px; background: linear-gradient(135deg, rgba(0, 122, 255, 0.15), rgba(0, 199, 190, 0.15)); border: 1px solid rgba(0, 122, 255, 0.25); border-radius: 20px; display: inline-flex; align-items: center; justify-content: center; box-shadow: 0 8px 24px rgba(0,0,0,0.15); margin-bottom: 14px;">
                        <span style="font-size: 30px;">📊</span>
                    </div>
                    <h3 style="margin: 0; font-size:18px; font-weight:800; color:var(--text-primary); letter-spacing:-0.5px;">Mes Secteurs</h3>
                    <p style="margin: 6px 0 0 0; font-size:12.5px; color:#8E8E93; line-height:1.4; max-width:280px; margin-left:auto; margin-right:auto;">
                        Sélectionnez un marché pour afficher ses équipements et tâches de maintenance.
                    </p>
                </div>

                <!-- Market Cards -->
                <div style="display:flex; flex-direction:column; gap:12px; width:100%;">
                    ${assignedList.map(code => {
                        const name = marketNames[code] || `Marché ${code}`;
                        return `
                            <div onclick="window.selectMobilePPMarket('${code}')" style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 18px; padding: 16px; cursor: pointer; transition: all 0.2s cubic-bezier(0.1, 0.8, 0.1, 1); display:flex; align-items:center; gap:14px; box-shadow: 0 4px 15px rgba(0,0,0,0.1);" onmouseover="this.style.background='rgba(255,255,255,0.06)'" onmouseout="this.style.background='rgba(255,255,255,0.03)'">
                                <!-- Icon Badge -->
                                <div style="width: 42px; height: 42px; background: linear-gradient(135deg, #007AFF, #00C7BE); border-radius: 12px; display:flex; align-items:center; justify-content:center; color:white; font-weight:800; font-size:15px; box-shadow: 0 4px 10px rgba(0,122,255,0.25); flex-shrink:0;">
                                    ${code}
                                </div>
                                <!-- Title details -->
                                <div style="display:flex; flex-direction:column; flex:1; min-width:0;">
                                    <h4 style="margin:0; font-size:14.5px; font-weight:800; color:var(--text-primary); text-overflow:ellipsis; overflow:hidden; white-space:nowrap;">${window.escapeHTML(name)}</h4>
                                    <span style="font-size:11px; color:#8E8E93; margin-top:2px;">Consulter le suivi préventif</span>
                                </div>
                                <!-- Chevron -->
                                <div style="color: rgba(255,255,255,0.2); font-size: 18px; font-weight: 300;">
                                    ›
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;

        content.className = 'pp-container no-market';

        const weekPicker = document.getElementById('pp-week-picker-wrapper');
        if (weekPicker) weekPicker.style.display = 'none';
        const progressWrap = document.getElementById('pp-progress-wrapper');
        if (progressWrap) progressWrap.style.display = 'none';
        const changeBtn = document.getElementById('pp-market-header-btn');
        if (changeBtn) changeBtn.style.display = 'none';
        return;
    }

    const weekPicker = document.getElementById('pp-week-picker-wrapper');
    if (weekPicker) weekPicker.style.display = 'flex';
    const progressWrap = document.getElementById('pp-progress-wrapper');
    if (progressWrap) progressWrap.style.display = 'block';

    // Auto select market if only one assigned
    if (assignedList.length === 1 && !selectedMobileMarket) {
        selectedMobileMarket = assignedList[0];
    }

    if (assignedList.length === 0) {
        content.innerHTML = `
            <div style="text-align:center; padding:60px 20px; color:#8E8E93;">
                <span style="font-size:50px; display:block; margin-bottom:15px;">⚠️</span>
                <h3>Aucun marché affecté</h3>
                <p style="font-size:13px;">Veuillez demander à un administrateur de vous affecter des marchés.</p>
            </div>
        `;
        return;
    }

    // Display "Changer de marché" button if user has multiple markets
    const changeBtn = document.getElementById('pp-market-header-btn');
    if (changeBtn) {
        if (assignedList.length > 1) {
            changeBtn.style.display = 'block';
            changeBtn.querySelector('button').innerText = `Marché ${selectedMobileMarket} ⇆ Changer`;
            content.className = 'pp-container with-market-switch';
        } else {
            changeBtn.style.display = 'none';
            content.className = 'pp-container no-market-switch';
        }
    }

    // Filter equipment based on selected market
    let filteredEq = parsedMobilePlanningData.filter(eq => {
        let prefix = "Sans MI";
        const cleanId = eq.id.toUpperCase();
        if (cleanId.startsWith("MI")) {
            const num = cleanId.substring(2, 4);
            if (!isNaN(parseInt(num))) prefix = num;
        }
        return prefix === selectedMobileMarket;
    });

    // 1. Collect OVERDUE tasks (past weeks, unchecked)
    const overdueTasks = [];
    filteredEq.forEach(eq => {
        Object.keys(eq.tasks).forEach(wStr => {
            const w = parseInt(wStr);
            const isPast = selectedMobileYear > currentYear || 
                          (selectedMobileYear === currentYear && w < selectedMobileWeek);
            if (isPast) {
                ['preventif', 'controle', 'metrologie'].forEach(type => {
                    if (eq.tasks[w][type]) {
                        const isChecked = currentMobileChecks.some(c => 
                            c.equipment_id === eq.id && 
                            c.task_type === type && 
                            (c.week_number === (selectedMobileYear * 100 + w) || (selectedMobileYear === 2026 && c.week_number === w))
                        );
                        if (!isChecked) {
                            overdueTasks.push({ eq, week: w, type, value: eq.tasks[w][type], isChecked: false, isOverdue: true });
                        }
                    }
                });
            }
        });
    });
    // Sort overdue by week descending (most recent overdue first)
    overdueTasks.sort((a, b) => b.week - a.week);

    // 2. Collect current selected week's tasks
    const weekTasks = [];
    filteredEq.forEach(eq => {
        if (eq.tasks[selectedMobileWeek]) {
            ['preventif', 'controle', 'metrologie'].forEach(type => {
                if (eq.tasks[selectedMobileWeek][type]) {
                    const isChecked = currentMobileChecks.some(c => 
                        c.equipment_id === eq.id && 
                        c.task_type === type && 
                        (c.week_number === (selectedMobileYear * 100 + selectedMobileWeek) || (selectedMobileYear === 2026 && c.week_number === selectedMobileWeek))
                    );
                    weekTasks.push({ eq, week: selectedMobileWeek, type, value: eq.tasks[selectedMobileWeek][type], isChecked, isOverdue: false });
                }
            });
        }
    });

    // Calculate progress percentage for this week (excluding overdue)
    const totalWeekTasks = weekTasks.length;
    const completedWeekTasks = weekTasks.filter(t => t.isChecked).length;
    const percent = totalWeekTasks > 0 ? Math.round((completedWeekTasks / totalWeekTasks) * 100) : 100;
    const progressEl = document.getElementById('pp-progress');
    if (progressEl) progressEl.style.width = `${percent}%`;

    const allTasks = [...overdueTasks, ...weekTasks];

    if (allTasks.length === 0) {
        content.innerHTML = `
            <div style="text-align:center; padding:60px 20px; color:#8E8E93;">
                <span style="font-size:50px; display:block; margin-bottom:15px;">🌴</span>
                <h3>Aucune tâche planifiée</h3>
                <p style="font-size:13px;">Rien à faire cette semaine sur ce marché !</p>
            </div>
        `;
        return;
    }

    // Build sections
    let sectionsHTML = '';

    // --- OVERDUE SECTION ---
    if (overdueTasks.length > 0) {
        // Group overdue tasks by equipment
        const overdueGroups = {};
        overdueTasks.forEach(t => {
            if (!overdueGroups[t.eq.id]) overdueGroups[t.eq.id] = { eq: t.eq, tasks: [] };
            overdueGroups[t.eq.id].tasks.push(t);
        });

        sectionsHTML += `
            <div class="pp-section-title" style="color:#FF453A;">
                <span>⚠️</span> En retard (${overdueTasks.length})
            </div>
        `;

        Object.values(overdueGroups).forEach(group => {
            const eq = group.eq;
            sectionsHTML += `
                <div class="pp-card" style="border-color: rgba(255, 69, 58, 0.2);">
                    <div style="border-bottom:1px solid rgba(255, 69, 58, 0.15); padding-bottom:8px;">
                        <span style="font-size:12px; font-weight:700; color:#FF453A;">${window.escapeHTML(eq.id)}</span>
                        <h4 style="margin:4px 0 0 0; font-size:16px; font-weight:800; color:var(--text-primary);">${window.escapeHTML(eq.machine || 'Machine')}</h4>
                        <div style="font-size:11px; color:#8E8E93; margin-top:2px;">
                            ${eq.brand ? `${window.escapeHTML(eq.brand)} ` : ''}
                            ${eq.model ? `| ${window.escapeHTML(eq.model)} ` : ''}
                            ${eq.location ? `| Loc: ${window.escapeHTML(eq.location)}` : ''}
                        </div>
                    </div>
                    <div style="display:flex; flex-direction:column; gap:8px;">
                        ${group.tasks.map(t => {
                            const typeLabel = t.type === 'preventif' ? 'Préventif' : (t.type === 'controle' ? 'Contrôle' : 'Métrologie');
                            return `
                                <div class="pp-task-row overdue" onclick="window.clickMobilePPCheck(event, '${eq.id}', ${t.week}, '${t.type}')">
                                    <div style="display:flex; flex-direction:column; gap:2px; flex:1; padding-right:12px;">
                                        <div style="display:flex; align-items:center; gap:6px;">
                                            <span style="font-size:11px; font-weight:700; color:#FF453A; text-transform:uppercase;">${typeLabel}</span>
                                            <span style="font-size:9px; font-weight:800; background:rgba(255,69,58,0.15); color:#FF453A; padding:2px 6px; border-radius:6px;">S${t.week}</span>
                                        </div>
                                        <span style="font-size:13px; font-weight:600; color:var(--text-primary); margin-top:2px;">${window.escapeHTML(t.value)}</span>
                                    </div>
                                    <div class="pp-checkbox">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">
                                            <polyline points="20 6 9 17 4 12"></polyline>
                                        </svg>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            `;
        });
    }

    // --- CURRENT WEEK SECTION ---
    if (weekTasks.length > 0) {
        // Group week tasks by equipment
        const weekGroups = {};
        weekTasks.forEach(t => {
            if (!weekGroups[t.eq.id]) weekGroups[t.eq.id] = { eq: t.eq, tasks: [] };
            weekGroups[t.eq.id].tasks.push(t);
        });

        // Sort tasks inside each group (unchecked first)
        Object.values(weekGroups).forEach(group => {
            group.tasks.sort((a, b) => (a.isChecked === b.isChecked) ? 0 : a.isChecked ? 1 : -1);
        });

        // Sort equipment cards (incomplete cards first)
        const sortedWeekGroups = Object.values(weekGroups).sort((a, b) => {
            const aAllDone = a.tasks.every(t => t.isChecked);
            const bAllDone = b.tasks.every(t => t.isChecked);
            if (aAllDone === bAllDone) return 0;
            return aAllDone ? 1 : -1;
        });

        sectionsHTML += `
            <div class="pp-section-title" style="color:#007AFF;">
                <span>📋</span> Cette semaine – S${selectedMobileWeek} (${weekTasks.length})
            </div>
        `;

        sortedWeekGroups.forEach(group => {
            const eq = group.eq;
            sectionsHTML += `
                <div class="pp-card">
                    <div style="border-bottom:1px solid rgba(142,142,147,0.1); padding-bottom:8px;">
                        <span style="font-size:12px; font-weight:700; color:#007AFF;">${window.escapeHTML(eq.id)}</span>
                        <h4 style="margin:4px 0 0 0; font-size:16px; font-weight:800; color:var(--text-primary);">${window.escapeHTML(eq.machine || 'Machine')}</h4>
                        <div style="font-size:11px; color:#8E8E93; margin-top:2px;">
                            ${eq.brand ? `${window.escapeHTML(eq.brand)} ` : ''}
                            ${eq.model ? `| ${window.escapeHTML(eq.model)} ` : ''}
                            ${eq.location ? `| Loc: ${window.escapeHTML(eq.location)}` : ''}
                        </div>
                    </div>

                    <div style="display:flex; flex-direction:column; gap:8px;">
                        ${group.tasks.map(t => {
                            const typeLabel = t.type === 'preventif' ? 'Préventif' : (t.type === 'controle' ? 'Contrôle' : 'Métrologie');
                            return `
                                <div class="pp-task-row ${t.isChecked ? 'checked' : ''}" onclick="window.clickMobilePPCheck(event, '${eq.id}', ${t.week}, '${t.type}')">
                                    <div style="display:flex; flex-direction:column; gap:2px; flex:1; padding-right:12px;">
                                        <div>
                                            <span style="font-size:11px; font-weight:700; color:#30B0C7; text-transform:uppercase;">${typeLabel}</span>
                                        </div>
                                        <span style="font-size:13px; font-weight:600; color:var(--text-primary); margin-top:2px;">${window.escapeHTML(t.value)}</span>
                                    </div>
                                    <div class="pp-checkbox ${t.isChecked ? 'checked' : ''}">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">
                                            <polyline points="20 6 9 17 4 12"></polyline>
                                        </svg>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            `;
        });
    }

    content.innerHTML = `
        <div style="display:flex; flex-direction:column; gap:4px; width:100%;">
            ${sectionsHTML}
        </div>
    `;
}

window.clickMobilePPCheck = async function (event, eqId, week, type) {
    const row = event.currentTarget.closest('.pp-task-row');
    const box = row.querySelector('.pp-checkbox');
    const isChecked = box.classList.contains('checked');
    const targetState = !isChecked;

    if (navigator.vibrate) navigator.vibrate(60);

    if (targetState) {
        row.classList.add('checked');
        row.classList.remove('overdue');
        box.classList.add('checked');
        triggerConfetti(event.clientX, event.clientY);
    } else {
        row.classList.remove('checked');
        box.classList.remove('checked');
    }

    try {
        const encodedWeek = selectedMobileYear * 100 + week;
        await api.savePlanningPrevisionnelCheck(eqId, encodedWeek, type, targetState);
        currentMobileChecks = await api.getPlanningPrevisionnelChecks();
        renderMobilePPWorkspace();
    } catch (e) {
        alert("Erreur de synchronisation : " + e.message);
        renderMobilePPWorkspace();
    }
};

function triggerConfetti(x, y) {
    const colors = ['#FF2D55', '#FF9500', '#FFCC00', '#4CD964', '#5AC8FA', '#5856D6', '#007AFF'];
    const count = 16;

    for (let i = 0; i < count; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        
        const color = colors[Math.floor(Math.random() * colors.length)];
        const size = Math.random() * 4 + 4;
        const angle = Math.random() * Math.PI * 2;
        const velocity = Math.random() * 60 + 40;
        const tx = Math.cos(angle) * velocity;
        const ty = Math.sin(angle) * velocity;

        particle.style.background = color;
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        particle.style.left = `${x - size/2}px`;
        particle.style.top = `${y - size/2}px`;
        
        particle.style.setProperty('--tx', `${tx}px`);
        particle.style.setProperty('--ty', `${ty}px`);

        document.body.appendChild(particle);

        setTimeout(() => particle.remove(), 600);
    }
}
