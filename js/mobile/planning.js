import { api } from '../api.js';
import { auth } from '../auth.js';
import config from '../config.js';

window.renderMobilePlanning = async function (dateStr = new Date().toISOString().split('T')[0], mode = 'day') {
    document.getElementById('categories-view').classList.add('hidden');
    document.getElementById('search-results-view').classList.add('hidden');
    const searchContainer = document.querySelector('.mobile-search-container');
    if (searchContainer) searchContainer.classList.add('hidden');

    const docList = document.getElementById('document-list');
    docList.classList.remove('hidden');
    docList.style.background = 'var(--ios-bg)';
    docList.style.minHeight = '100vh';

    document.getElementById('selected-category-title').innerText = "Planning";
    document.getElementById('mobile-upload-btn').style.display = 'none';

    window.mobileCurrentPath = "planning";
    localStorage.setItem('pouchain_last_app', 'planning');
    const navHeader = document.querySelector('.nav-header');
    if (navHeader) navHeader.style.display = 'none';

    // Inject Redesign Styles
    if (!document.getElementById('planning-redesign-style')) {
        const style = document.createElement('style');
        style.id = 'planning-redesign-style';
        style.innerHTML = `
            .planning-container {
                display: flex;
                flex-direction: column;
                height: 100%;
                background: var(--ios-bg);
            }
            .planning-header {
                position: fixed;
                top: 60px;
                left: 0;
                right: 0;
                z-index: 1000;
                background: var(--ios-header-bg);
                backdrop-filter: blur(20px);
                -webkit-backdrop-filter: blur(20px);
                border-bottom: 1px solid var(--ios-border);
                padding: 12px 20px;
            }
            .ios-segment {
                display: flex;
                background: var(--ios-segment-bg);
                padding: 2px;
                border-radius: 10px;
                margin-bottom: 12px;
            }
            .ios-segment button {
                flex: 1;
                border: none;
                background: transparent;
                padding: 6px;
                border-radius: 8px;
                font-size: 13px;
                font-weight: 600;
                color: var(--text-primary);
                transition: 0.2s;
            }
            .ios-segment button.active {
                background: var(--ios-segment-active);
                box-shadow: 0 2px 8px rgba(0,0,0,0.12);
            }
            .ios-date-picker {
                display: flex;
                align-items: center;
                justify-content: space-between;
                background: var(--ios-card-bg);
                padding: 10px 14px;
                border-radius: 14px;
                margin-bottom: 12px;
                box-shadow: var(--ios-shadow);
            }
            .ios-date-label {
                font-size: 16px;
                font-weight: 700;
                color: var(--text-primary);
                flex: 1;
                text-align: center;
            }
            .ios-nav-btn {
                background: var(--ios-btn-bg);
                border: none;
                width: 32px;
                height: 32px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                color: var(--primary-color);
                font-size: 18px;
            }
            .task-card {
                background: var(--ios-card-bg);
                border-radius: 20px;
                padding: 18px;
                margin-bottom: 16px;
                box-shadow: var(--ios-shadow);
                border: 1px solid var(--ios-border);
                transition: transform 0.2s, opacity 0.2s;
                position: relative;
                overflow: hidden;
            }
            .task-card:active {
                transform: scale(0.98);
            }
            .task-card.done {
                opacity: 0.6;
            }
            .task-card-header {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                margin-bottom: 10px;
            }
            .task-time {
                font-size: 13px;
                font-weight: 700;
                color: var(--primary-color);
                background: var(--primary-alpha);
                padding: 4px 10px;
                border-radius: 10px;
            }
            .task-title {
                font-size: 18px;
                font-weight: 800;
                color: var(--text-primary);
                line-height: 1.3;
                margin-bottom: 6px;
            }
            .task-card.done .task-title {
                text-decoration: line-through;
                color: var(--text-secondary);
            }
            .ios-checkbox {
                width: 26px;
                height: 26px;
                border-radius: 50%;
                border: 2px solid var(--ios-border);
                display: flex;
                align-items: center;
                justify-content: center;
                transition: 0.2s;
            }
            .ios-checkbox.checked {
                background: var(--success-color);
                border-color: var(--success-color);
            }
            .ios-checkbox svg {
                color: white;
                opacity: 0;
                transform: scale(0.5);
                transition: 0.2s;
            }
            .ios-checkbox.checked svg {
                opacity: 1;
                transform: scale(1);
            }
            .add-task-fab {
                position: fixed;
                bottom: 25px;
                right: 25px;
                width: 60px;
                height: 60px;
                border-radius: 50%;
                background: var(--primary-color);
                color: white;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 32px;
                box-shadow: 0 10px 25px rgba(255, 59, 48, 0.5);
                z-index: 2000;
                border: none;
                transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
            }
            .add-task-fab:active {
                transform: scale(0.9);
            }

            :root {
                --ios-bg: #F2F2F7;
                --ios-header-bg: rgba(255, 255, 255, 0.85);
                --ios-card-bg: #FFFFFF;
                --ios-border: rgba(0, 0, 0, 0.05);
                --ios-segment-bg: #E5E5EA;
                --ios-segment-active: #FFFFFF;
                --ios-btn-bg: rgba(0, 0, 0, 0.05);
                --ios-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
                --primary-alpha: rgba(255, 59, 48, 0.1);
            }
            :root[data-theme="dark"] {
                --ios-bg: #000000;
                --ios-header-bg: rgba(28, 28, 30, 0.85);
                --ios-card-bg: #1C1C1E;
                --ios-border: rgba(255, 255, 255, 0.08);
                --ios-segment-bg: #2C2C2E;
                --ios-segment-active: #636366;
                --ios-btn-bg: rgba(255, 255, 255, 0.1);
                --ios-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
                --primary-alpha: rgba(255, 59, 48, 0.2);
            }
            @keyframes modalPop {
                from { transform: scale(0.95); opacity: 0; }
                to { transform: scale(1); opacity: 1; }
            }
            @keyframes taskIn {
                from { transform: translateY(10px); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
            }
            .task-card {
                animation: taskIn 0.3s cubic-bezier(0.1, 0.7, 0.1, 1) both;
                cursor: pointer;
                user-select: none;
                -webkit-user-select: none;
            }
            body {
                -webkit-user-select: none;
                user-select: none;
                -webkit-tap-highlight-color: transparent;
            }
            input, textarea {
                -webkit-user-select: text;
                user-select: text;
            }
        `;
        document.head.appendChild(style);
    }

    if (!document.getElementById('spin-style')) {
        const style = document.createElement('style');
        style.id = 'spin-style';
        style.innerHTML = `@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`;
        document.head.appendChild(style);
    }

    // Show top loader if not first render
    const existingContent = document.getElementById('list-content');
    if (existingContent && existingContent.innerHTML !== '') {
        const topLoader = document.getElementById('top-loader');
        if (topLoader) topLoader.classList.remove('hidden');
    } else {
        // Prepare immediate UI shell
        const d_init = new Date(dateStr + 'T12:00:00');
        const dayNum_init = d_init.getDay();
        const diff_init = d_init.getDate() - dayNum_init + (dayNum_init === 0 ? -6 : 1);
        const mon_init = new Date(d_init.setDate(diff_init));
        const sun_init = new Date(new Date(mon_init).setDate(mon_init.getDate() + 6));
        const rangeLabel_init = `${mon_init.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} - ${sun_init.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}`;

        document.getElementById('list-content').innerHTML = `
            <div class="planning-container">
                <div class="planning-header">
                    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px;">
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <button class="ios-nav-btn" onclick="document.getElementById('back-btn').click()" style="background: transparent; width: auto; font-size: 16px; font-weight: 600; color: var(--primary-color); display: flex; align-items: center; gap: 4px; padding: 0;">
                                <span style="font-size: 24px;">‹</span> Retour
                            </button>
                        </div>
                        <div class="ios-segment" style="margin-bottom: 0; width: 140px;">
                            <button class="${mode === 'day' ? 'active' : ''}" onclick="renderMobilePlanning(new Date().toISOString().split('T')[0], 'day')">Jour</button>
                            <button class="${mode === 'week' ? 'active' : ''}" onclick="renderMobilePlanning('${dateStr}', 'week')">Sem.</button>
                        </div>
                    </div>
                    <div class="ios-date-picker">
                        <button class="ios-nav-btn" onclick="changeMobileDay('${dateStr}', -1)">‹</button>
                        <div class="ios-date-label">
                            ${mode === 'day' ? `<span>Chargement...</span>` : `<span>${rangeLabel_init}</span>`}
                        </div>
                        <button class="ios-nav-btn" onclick="changeMobileDay('${dateStr}', 1)">›</button>
                    </div>
                </div>
                <div id="planning-tasks-area" style="padding: ${mode === 'day' ? '200px' : '160px'} 20px 100px 20px; flex: 1; overflow-y: auto;">
                    <div style="text-align:center; padding: 60px;"><div class="loader" style="border: 3px solid var(--ios-border); border-top-color: var(--primary-color); border-radius: 50%; width: 32px; height: 32px; animation: spin 1s linear infinite; margin: 0 auto;"></div></div>
                </div>
            </div>
        `;
    }

    try {
        let tasks = [];
        let weekRange = null;

        if (mode === 'day') {
            tasks = await api.getTasks(dateStr);
        } else {
            // Week Mode
            const d = new Date(dateStr + 'T12:00:00');
            const dayNum = d.getDay();
            const diff = d.getDate() - dayNum + (dayNum === 0 ? -6 : 1);
            const monday = new Date(d.setDate(diff));
            const sunday = new Date(monday);
            sunday.setDate(monday.getDate() + 6);

            const startDate = monday.toISOString().split('T')[0];
            const endDate = sunday.toISOString().split('T')[0];
            weekRange = { startDate, endDate };
            tasks = await api.getTasks({ startDate, endDate });
        }

        // Helper to change day
        window.changeMobileDay = (current, offset) => {
            const d = new Date(current + 'T12:00:00');
            d.setDate(d.getDate() + (mode === 'week' ? offset * 7 : offset));
            renderMobilePlanning(d.toISOString().split('T')[0], mode);
        };

        let html = `
            <div class="planning-container">
                <!-- Premium Header -->
                <div class="planning-header">
                    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px;">
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <button class="ios-nav-btn" onclick="document.getElementById('back-btn').click()" style="background: transparent; width: auto; font-size: 16px; font-weight: 600; color: var(--primary-color); display: flex; align-items: center; gap: 4px; padding: 0;">
                                <span style="font-size: 24px;">‹</span> Retour
                            </button>
                        </div>
                        <div class="ios-segment" style="margin-bottom: 0; width: 140px;">
                            <button class="${mode === 'day' ? 'active' : ''}" onclick="renderMobilePlanning(new Date().toISOString().split('T')[0], 'day')">Jour</button>
                            <button class="${mode === 'week' ? 'active' : ''}" onclick="renderMobilePlanning('${dateStr}', 'week')">Sem.</button>
                        </div>
                    </div>

                    <div class="ios-date-picker">
                        <button class="ios-nav-btn" onclick="changeMobileDay('${dateStr}', -1)">‹</button>
                        <div class="ios-date-label">
                            ${mode === 'day'
                ? `<input type="date" value="${dateStr}" onchange="renderMobilePlanning(this.value, 'day')" style="border:none; background:transparent; font-weight:bold; font-size:16px; color:inherit; font-family:inherit; text-align:center; width:100%;">`
                : `<span>${new Date(weekRange.startDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} - ${new Date(weekRange.endDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</span>`
            }
                        </div>
                        <button class="ios-nav-btn" onclick="changeMobileDay('${dateStr}', 1)">›</button>
                    </div>
                    
                    ${mode === 'day' ? `
                        <div style="font-size: 28px; font-weight: 800; color: var(--text-primary); margin-top: 8px; text-transform: capitalize;">
                            ${new Date(dateStr + 'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'long' })}
                            <span style="color: var(--text-secondary); font-weight: 600; font-size: 20px;">${new Date(dateStr + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}</span>
                        </div>
                    ` : ''}
                </div>

                <!-- Floating Action Button -->
                <button class="add-task-fab" onclick="openMobileAddTaskModal('${dateStr}')">+</button>

                <!-- Scrollable Content -->
                <div style="flex: 1; overflow-y: auto; padding: ${mode === 'day' ? '200px' : '160px'} 20px 100px 20px;">
        `;

        if (tasks.length === 0) {
            html += `
                <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; padding: 60px 20px; text-align:center; color: var(--text-secondary);">
                    <div style="font-size: 64px; margin-bottom: 16px; opacity: 0.5;">📅</div>
                    <div style="font-size: 18px; font-weight: 700;">Aucune tâche</div>
                    <div style="font-size: 14px; margin-top: 4px;">Profitez de votre journée !</div>
                </div>
            `;
        } else {
            if (mode === 'day') {
                tasks.sort((a, b) => {
                    const doneA = a.done === 'true' ? 1 : 0;
                    const doneB = b.done === 'true' ? 1 : 0;
                    if (doneA !== doneB) return doneA - doneB;
                    const isAllDayA = (a.start_time.indexOf('00:00') === 0 && a.end_time.indexOf('00:00') === 0);
                    const isAllDayB = (b.start_time.indexOf('00:00') === 0 && b.end_time.indexOf('00:00') === 0);
                    if (isAllDayA !== isAllDayB) return isAllDayA ? -1 : 1;
                    return a.start_time.localeCompare(b.start_time);
                });
                tasks.forEach(t => { html += renderMobileTaskCard(t, dateStr, mode); });
            } else {
                const grouped = {};
                tasks.forEach(t => {
                    if (!grouped[t.date]) grouped[t.date] = [];
                    grouped[t.date].push(t);
                });

                Object.keys(grouped).sort().forEach(date => {
                    const dayTasks = grouped[date];
                    dayTasks.sort((a, b) => {
                        const doneA = a.done === 'true' ? 1 : 0;
                        const doneB = b.done === 'true' ? 1 : 0;
                        if (doneA !== doneB) return doneA - doneB;
                        const isAllDayA = (a.start_time.indexOf('00:00') === 0 && a.end_time.indexOf('00:00') === 0);
                        const isAllDayB = (b.start_time.indexOf('00:00') === 0 && b.end_time.indexOf('00:00') === 0);
                        if (isAllDayA !== isAllDayB) return isAllDayA ? -1 : 1;
                        return a.start_time.localeCompare(b.start_time);
                    });
                    const d = new Date(date + 'T12:00:00');
                    const dayLabel = d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'short' });

                    html += `
                        <div style="margin-bottom: 24px;">
                            <div style="font-size: 13px; font-weight: 700; text-transform: uppercase; color: var(--text-secondary); margin-bottom: 12px; padding-left: 4px; letter-spacing: 0.5px;">
                                ${dayLabel}
                            </div>
                    `;
                    dayTasks.forEach(t => { html += renderMobileTaskCard(t, dateStr, mode); });
                    html += `</div>`;
                });
            }
        }

        html += `
                </div>
            </div>
        `;

        const topLoader = document.getElementById('top-loader');
        if (topLoader) topLoader.classList.add('hidden');

        document.getElementById('list-content').innerHTML = html;

        window.openMobileAddTaskModal = (selectedDate) => {
            const _dk = document.documentElement.getAttribute('data-theme') === 'dark';
            const _inputBg = _dk ? '#2C2C2E' : '#f2f2f7';
            const _textColor = _dk ? '#FFFFFF' : '#1c1c1e';

            const modal = document.createElement('div');
            modal.className = 'modal-overlay';
            modal.style.zIndex = "10000";
            modal.innerHTML = `
                <div class="modal-box" style="padding: 24px; border-radius: 28px; animation: modalPop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); text-align: left; max-width: 90%; width: 400px;">
                    <div style="font-weight: 800; font-size: 22px; margin-bottom: 20px; color: ${_textColor};">Nouvelle tâche</div>
                    
                    <div style="margin-bottom: 16px;">
                        <label style="display: block; font-size: 14px; color: #8E8E93; margin-bottom: 6px;">Titre</label>
                        <input type="text" id="task-title" style="width: 100%; padding: 12px; border: none; border-radius: 12px; background: ${_inputBg}; color: ${_textColor}; font-size: 16px;" placeholder="Ex: Maintenance machine...">
                    </div>

                    <div style="margin-bottom: 16px;">
                        <label style="display: block; font-size: 14px; color: #8E8E93; margin-bottom: 6px;">Description (Optionnel)</label>
                        <textarea id="task-desc" style="width: 100%; padding: 12px; border: none; border-radius: 12px; background: ${_inputBg}; color: ${_textColor}; font-size: 16px; height: 80px; resize: none;" placeholder="Détails..."></textarea>
                    </div>

                    <div style="margin-bottom: 16px;">
                        <label style="display: block; font-size: 14px; color: #8E8E93; margin-bottom: 6px;">Date</label>
                        <input type="date" id="task-date" value="${selectedDate}" style="width: 100%; padding: 12px; border: none; border-radius: 12px; background: ${_inputBg}; color: ${_textColor}; font-size: 16px;">
                    </div>

                    <div style="margin-bottom: 16px; display: flex; align-items: center; gap: 10px; background: ${_inputBg}; padding: 12px; border-radius: 12px;">
                        <input type="checkbox" id="task-allday" style="width: 20px; height: 20px; accent-color: #FF3B30;">
                        <label for="task-allday" style="font-size: 15px; font-weight: 600; color: ${_textColor};">Toute la journée</label>
                    </div>

                    <div id="time-inputs-container" style="display: flex; gap: 12px; margin-bottom: 16px; transition: 0.3s;">
                        <div style="flex: 1;">
                            <label style="display: block; font-size: 14px; color: #8E8E93; margin-bottom: 6px;">Début</label>
                            <input type="time" id="task-start" value="08:00" style="width: 100%; padding: 12px; border: none; border-radius: 12px; background: ${_inputBg}; color: ${_textColor}; font-size: 16px;">
                        </div>
                        <div style="flex: 1;">
                            <label style="display: block; font-size: 14px; color: #8E8E93; margin-bottom: 6px;">Fin</label>
                            <input type="time" id="task-end" value="17:00" style="width: 100%; padding: 12px; border: none; border-radius: 12px; background: ${_inputBg}; color: ${_textColor}; font-size: 16px;">
                        </div>
                    </div>

                    <div style="margin-bottom: 16px; display: flex; align-items: center; gap: 10px; background: ${_inputBg}; padding: 12px; border-radius: 12px;">
                        <input type="checkbox" id="task-remind-tomorrow" style="width: 20px; height: 20px; accent-color: #FF3B30;">
                        <label for="task-remind-tomorrow" style="font-size: 15px; font-weight: 600; color: ${_textColor};">Rappeler la veille (15h30)</label>
                    </div>

                    <div style="display: flex; gap: 12px; margin-top: 24px;">
                        <button class="btn-secondary" onclick="this.closest('.modal-overlay').remove()" style="flex: 1;">Annuler</button>
                        <button class="btn-primary" id="save-task-btn" style="flex: 1; background: #FF3B30;">Enregistrer</button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);

            const allDayCheck = document.getElementById('task-allday');
            const timeInputs = document.getElementById('time-inputs-container');
            allDayCheck.onchange = (e) => {
                timeInputs.style.opacity = e.target.checked ? '0.3' : '1';
                timeInputs.style.pointerEvents = e.target.checked ? 'none' : 'auto';
            };

            document.getElementById('save-task-btn').onclick = async () => {
                const title = document.getElementById('task-title').value.trim();
                const desc = document.getElementById('task-desc').value.trim();
                const start = document.getElementById('task-start').value;
                const end = document.getElementById('task-end').value;
                const remindTomorrow = document.getElementById('task-remind-tomorrow').checked;

                if (!title) {
                    alert("Veuillez saisir un titre.");
                    return;
                }

                const btn = document.getElementById('save-task-btn');
                btn.disabled = true;
                btn.innerText = "Enregistrement...";

                try {
                    const finalDate = document.getElementById('task-date').value;
                    const isAllDay = document.getElementById('task-allday').checked;
                    const fullTitle = desc ? `${title}:::DESC:::${desc}` : title;

                    await api.createTask({
                        title: fullTitle,
                        date: finalDate,
                        start_time: isAllDay ? "00:00:00" : (start + ":00"),
                        end_time: isAllDay ? "00:00:00" : (end + ":00"),
                        remind_tomorrow: remindTomorrow,
                        done: 'false'
                    });
                    modal.remove();
                    renderMobilePlanning(finalDate, mode);
                } catch (e) {
                    alert("Erreur: " + e.message);
                    btn.disabled = false;
                    btn.innerText = "Enregistrer";
                }
            };
        };

        window.toggleMobileTaskDone = async (taskId, isChecked, date, mode) => {
            try {
                await api.updateTask(taskId, { done: isChecked ? 'true' : 'false' });
                renderMobilePlanning(date, mode);
            } catch (e) {
                alert("Erreur: " + e.message);
            }
        };

    } catch (e) {
        console.error(e);
        document.getElementById('list-content').innerHTML = `<div style="color:red; margin:20px; padding: 16px; background: #ffe5e5; border-radius: 12px; border: 1px solid #ffcccc;">Erreur: ${e.message}</div>`;
    }
};

// Helper to render task card
function renderMobileTaskCard(t, dateStr, mode) {
    const parts = (t.title || "").split(':::DESC:::');
    const mainTitle = parts[0];
    const desc = parts[1] || '';
    const isAllDay = (t.start_time.indexOf('00:00') === 0 && t.end_time.indexOf('00:00') === 0);
    const isDone = t.done === 'true';

    return `
        <div class="task-card ${isDone ? 'done' : ''}" onclick="toggleMobileTaskDone('${t.id}', ${!isDone}, '${dateStr}', '${mode}')">
            <div class="task-card-header">
                ${!isAllDay ? `<div class="task-time">${t.start_time.substring(0, 5)} - ${t.end_time.substring(0, 5)}</div>` : '<div class="task-time">Journée</div>'}
                <div class="ios-checkbox ${isDone ? 'checked' : ''}">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                </div>
            </div>
            
            <div class="task-title">${window.escapeHTML(mainTitle)}</div>
            
            ${desc ? `
                <div style="font-size: 14px; color: var(--text-secondary); margin-top: 8px; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
                    ${window.escapeHTML(desc)}
                </div>
                <button style="background: transparent; color: var(--primary-color); font-weight: 700; border: none; padding: 12px 0 0 0; font-size: 14px; cursor: pointer; display: flex; align-items: center; gap: 4px;" 
                    onclick="event.stopPropagation(); openMobileTaskDetailModal('${window.escapeHTML(mainTitle)}', \`${window.escapeHTML(desc).replace(/`/g, '\\`').replace(/\n/g, '\\n')}\`)">
                    Voir les détails <span>›</span>
                </button>
            ` : ''}
        </div>
    `;
}
