import { api } from '../api.js';
import { auth } from '../auth.js';
import config from '../config.js';

window.renderMobileVehiclesList = async function (myVehicleData) {
    document.getElementById('categories-view').classList.add('hidden');
    document.getElementById('search-results-view').classList.add('hidden');
    const searchContainer = document.querySelector('.mobile-search-container');
    if (searchContainer) searchContainer.classList.add('hidden');
    document.getElementById('document-list').classList.remove('hidden');

    document.getElementById('selected-category-title').innerText = "Véhicules";
    document.getElementById('mobile-upload-btn').style.display = 'none';

    window.mobileCurrentPath = "vehicule_list";

    const container = document.getElementById('list-content');
    const dk = document.documentElement.getAttribute('data-theme') === 'dark';
    const cardBg = dk ? '#1C1C1E' : '#fff';
    const textColor = dk ? '#FFFFFF' : '#1c1c1e';
    const border = dk ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)';

    let html = `<div style="padding: 16px;">`;

    // Button to log rental fuel directly
    html += `
        <button style="width: 100%; display: flex; align-items: center; justify-content: center; gap: 10px; padding: 16px; background: #FF9500; border: none; border-radius: 20px; cursor: pointer; color: white; font-weight: bold; margin-bottom: 24px; font-size: 15px; box-shadow: 0 4px 12px rgba(255, 149, 0, 0.2);" onclick="window.logMobileRentalFuel()">
            <span style="font-size: 22px;">⛽</span>
            <span>Saisie Carburant Location/GE</span>
        </button>
    `;

    if (myVehicleData && myVehicleData.assigned) {
        html += `
            <h3 style="color: #8E8E93; font-size: 13px; text-transform: uppercase; margin: 10px 0 12px 4px; letter-spacing: 0.5px;">Mon Véhicule</h3>
            <div onclick="window.renderMobileVehicleApp(${JSON.stringify(myVehicleData.assigned).replace(/"/g, '&quot;')})" style="background: ${cardBg}; border: 1px solid ${border}; border-radius: 20px; padding: 16px; display: flex; align-items: center; gap: 16px; margin-bottom: 24px; box-shadow: 0 4px 12px rgba(0,0,0,0.04);">
                <div style="width: 48px; height: 48px; background: #34C759; border-radius: 14px; display: flex; align-items: center; justify-content: center; overflow:hidden;">
                    <img src="${config.api.workerUrl}/get/vehicles/photos/${myVehicleData.assigned.id}.png?t=${Date.now()}" onerror="this.src='https://cdn-icons-png.flaticon.com/512/3202/3202926.png'; this.style.filter='invert(1)'; this.style.opacity='0.2'; this.style.width='24px';" style="width: 100%; height: 100%; object-fit: cover;">
                </div>
                <div style="flex: 1;">
                    <div style="font-weight: 700; color: ${textColor}; font-size: 17px;">${myVehicleData.assigned.make} ${myVehicleData.assigned.model}</div>
                    <div style="font-size: 14px; color: #8E8E93; font-family: monospace;">${myVehicleData.assigned.plate_number}</div>
                </div>
                <div style="color: #8E8E93; font-size: 20px;">›</div>
            </div>
        `;
    }

    if (myVehicleData && myVehicleData.common && myVehicleData.common.length > 0) {
        const filteredCommon = myVehicleData.common.filter(cv => cv.plate_number !== 'LOCATION');
        if (filteredCommon.length > 0) {
            html += `<h3 style="color: #8E8E93; font-size: 13px; text-transform: uppercase; margin: 0 0 12px 4px; letter-spacing: 0.5px;">Véhicules Communs</h3>`;
            filteredCommon.forEach(cv => {
                html += `
                    <div onclick="window.renderMobileVehicleApp(${JSON.stringify(cv).replace(/"/g, '&quot;')})" style="background: ${cardBg}; border: 1px solid ${border}; border-radius: 20px; padding: 16px; display: flex; align-items: center; gap: 16px; margin-bottom: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.04);">
                        <div style="width: 48px; height: 48px; background: #007AFF; border-radius: 14px; display: flex; align-items: center; justify-content: center; overflow:hidden;">
                            <img src="${config.api.workerUrl}/get/vehicles/photos/${cv.id}.png?t=${Date.now()}" onerror="this.src='https://cdn-icons-png.flaticon.com/512/3202/3202926.png'; this.style.filter='invert(1)'; this.style.opacity='0.2'; this.style.width='24px';" style="width: 100%; height: 100%; object-fit: cover;">
                        </div>
                        <div style="flex: 1;">
                            <div style="font-weight: 700; color: ${textColor}; font-size: 17px;">${cv.make} ${cv.model}</div>
                            <div style="font-size: 14px; color: #8E8E93; font-family: monospace;">${cv.plate_number}</div>
                        </div>
                        <div style="color: #8E8E93; font-size: 20px;">›</div>
                    </div>
                `;
            });
        }
    }

    html += `</div>`;
    container.innerHTML = html;
};

// --- MOBILE VEHICLE APP ---
window.renderMobileVehicleApp = async function (vehicle) {
    document.getElementById('categories-view').classList.add('hidden');
    document.getElementById('search-results-view').classList.add('hidden');
    const searchContainer = document.querySelector('.mobile-search-container');
    if (searchContainer) searchContainer.classList.add('hidden');
    document.getElementById('document-list').classList.remove('hidden');

    document.getElementById('selected-category-title').innerText = "Véhicule";
    document.getElementById('mobile-upload-btn').style.display = 'none';

    window.mobileCurrentPath = "auto_detail";

    const container = document.getElementById('list-content');
    container.innerHTML = `<div style="text-align:center; padding: 40px;"><div class="loader-spinner"></div></div>`;

    try {
        const logs = await api.getVehicleAllLogs(vehicle.id);
        const dk = document.documentElement.getAttribute('data-theme') === 'dark';
        const cardBg = dk ? '#1C1C1E' : '#fff';
        const textColor = dk ? '#FFFFFF' : '#1c1c1e';
        const border = dk ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)';

        let html = `
            <div style="padding: 16px; padding-bottom: 100px;">
                <!-- Vehicle Card -->
                <div style="background: linear-gradient(135deg, #1a1a1c, #2a2a2c); border-radius: 28px; overflow: hidden; margin-bottom: 24px; box-shadow: 0 12px 24px rgba(0,0,0,0.15); border: 1px solid rgba(255,255,255,0.05);">
                    <div style="width: 100%; height: 160px; position: relative;">
                         <img src="${config.api.workerUrl}/get/vehicles/photos/${vehicle.id}.png?t=${Date.now()}" onerror="this.src='https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80&w=800'; this.style.opacity='0.1';" style="width: 100%; height: 100%; object-fit: cover;">
                         <div style="position: absolute; bottom: 0; left: 0; right: 0; padding: 20px; background: linear-gradient(transparent, rgba(0,0,0,0.8));">
                             <div style="font-size: 13px; color: rgba(255,255,255,0.7); font-weight: 500;">${vehicle.assigned_user_id ? 'Mon véhicule' : 'Véhicule commun'}</div>
                             <div style="font-size: 22px; font-weight: 800; color: white;">${vehicle.make || ''} ${vehicle.model || 'Auto'}</div>
                         </div>
                    </div>
                    <div style="padding: 20px; display: flex; gap: 12px; align-items: center; background: rgba(52, 199, 89, 0.1);">
                        <span style="background: white; color: black; padding: 4px 12px; border-radius: 6px; font-weight: 800; font-family: monospace; font-size: 16px;">${vehicle.plate_number}</span>
                    </div>
                </div>

                <!-- Contrôle Technique Card -->
                <div style="background: ${cardBg}; border: 1px solid ${border}; border-radius: 20px; padding: 20px; margin-bottom: 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <div style="font-size: 12px; color: #8E8E93; text-transform: uppercase; font-weight: 600; margin-bottom: 8px;">Contrôle Technique</div>
                        <div style="font-size: 18px; font-weight: 800; color: ${textColor};">
                            ${(() => {
                if (!vehicle.last_ct_date) return '<span style="color:#FF9500;">Non renseigné</span>';
                const today = new Date();
                const lastCt = new Date(vehicle.last_ct_date);
                const interval = vehicle.ct_interval_months || 12;
                const nextCt = new Date(lastCt.setMonth(lastCt.getMonth() + interval));
                const diffDays = Math.ceil((nextCt - today) / (1000 * 60 * 60 * 24));

                if (diffDays <= 0) return `<span style="color:#FF3B30;">Expiré depuis ${Math.abs(diffDays)}j</span>`;
                if (diffDays <= 60) return `<span style="color:#FF9500;">Expire dans ${diffDays}j</span>`;
                return `<span style="color:#34C759;">Valide (${nextCt.toLocaleDateString('fr-FR')})</span>`;
            })()}
                        </div>
                    </div>
                    <button class="btn-primary" onclick="window.updateMobileCT('${vehicle.id}', '${vehicle.last_ct_date || ''}')" style="padding: 10px 20px; border-radius: 12px; background: #007AFF;">Modifier</button>
                </div>

                <!-- Mileage Card -->
                <div style="background: ${cardBg}; border: 1px solid ${border}; border-radius: 20px; padding: 20px; margin-bottom: 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                        <div>
                            <div style="font-size: 12px; color: #8E8E93; text-transform: uppercase; font-weight: 600;">Kilométrage actuel</div>
                            <div style="font-size: 32px; font-weight: 800; color: ${textColor};">${(vehicle.last_mileage || 0).toLocaleString()} <span style="font-size: 16px; font-weight: 600; color: #8E8E93;">km</span></div>
                        </div>
                        <button class="btn-primary" onclick="window.updateMobileMileage('${vehicle.id}', ${vehicle.last_mileage || 0})" style="padding: 10px 20px; border-radius: 12px; background: #34C759;">Mettre à jour</button>
                    </div>
                    <div style="font-size: 12px; color: #8E8E93;">Dernier relevé : ${vehicle.updated_at ? new Date(vehicle.updated_at).toLocaleDateString('fr-FR') : '--'}</div>
                </div>

                <!-- Quick Actions -->
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 24px;">
                    <button style="display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 20px; background: ${cardBg}; border: 1px solid ${border}; border-radius: 20px; cursor: pointer;" onclick="reportMobileVehicleIssue('${vehicle.id}')">
                        <span style="font-size: 24px;">⚠️</span>
                        <span style="font-weight: 600; color: ${textColor}; font-size: 14px;">Signaler un souci</span>
                    </button>
                    <button style="display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 20px; background: ${cardBg}; border: 1px solid ${border}; border-radius: 20px; cursor: pointer;" onclick="window.logMobileFuel('${vehicle.id}', '${vehicle.dkv_card || ''}')">
                        <span style="font-size: 24px;">⛽</span>
                        <span style="font-weight: 600; color: ${textColor}; font-size: 14px;">Plein essence</span>
                    </button>
                </div>

                <!-- History -->
                <h3 style="font-size: 18px; margin: 0 0 16px 4px; color: ${textColor};">Historique récent</h3>
        `;

        if (logs.length === 0) {
            html += `<div style="text-align:center; padding: 24px; color: #8E8E93;">Aucun historique</div>`;
        } else {
            logs.slice(0, 5).forEach(log => {
                const icon = log.type === 'mileage' ? '📍' : (log.type === 'issue' ? '⚠️' : (log.type === 'fuel' ? '⛽' : '🔧'));
                html += `
                    <div style="background: ${cardBg}; border: 1px solid ${border}; border-radius: 16px; padding: 14px; margin-bottom: 10px; display: flex; gap: 14px; align-items: center;">
                        <div style="font-size: 20px; background: ${dk ? '#2C2C2E' : '#f2f2f7'}; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; border-radius: 12px;">${icon}</div>
                        <div style="flex: 1;">
                            <div style="font-weight: 600; color: ${textColor}; font-size: 14px;">
                                ${log.type === 'mileage' ? `Mise à jour : ${parseInt(log.value).toLocaleString()} km` : (log.type === 'fuel' ? `Plein : ${log.value} € ${log.is_personal ? '(Carte Perso)' : ''}` : log.description)}
                            </div>
                            <div style="font-size: 11px; color: #8E8E93;">${new Date(log.created_at).toLocaleDateString('fr-FR')} à ${new Date(log.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</div>
                        </div>
                    </div>
                `;
            });
        }

        html += `</div>`;
        container.innerHTML = html;

    } catch (e) {
        container.innerHTML = `<div style="color:red; text-align:center; padding:40px;">Erreur: ${e.message}</div>`;
    }
};

window.updateMobileMileage = function (vehicleId, current) {
    const dk = document.documentElement.getAttribute('data-theme') === 'dark';
    const bg = dk ? '#1C1C1E' : '#ffffff';
    const textColor = dk ? '#ffffff' : '#1c1c1e';
    const inputBg = dk ? '#2C2C2E' : '#f2f2f7';

    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.style.zIndex = "10001";
    modal.innerHTML = `
        <div class="modal-box" style="padding: 24px; border-radius: 28px; background: ${bg}; width: 90%; max-width: 400px; text-align: left; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
            <h2 style="margin-top: 0; margin-bottom: 20px; color: ${textColor}; font-size: 20px;">Mettre à jour le compteur</h2>
            
            <div style="margin-bottom: 24px;">
                <label style="display: block; font-size: 14px; color: #8E8E93; margin-bottom: 8px;">Kilométrage actuel (km)</label>
                <input type="number" id="new-mileage-input" style="width: 100%; padding: 16px; border: none; border-radius: 16px; background: ${inputBg}; color: ${textColor}; font-size: 20px; font-weight: bold;" value="${current || 0}">
                <p style="font-size: 11px; color: #8E8E93; margin-top: 8px;">Dernier relevé : ${current || 0} km</p>
            </div>
            
            <div style="display: flex; gap: 12px;">
                <button class="btn-secondary" style="flex: 1;" onclick="this.closest('.modal-overlay').remove()">Annuler</button>
                <button id="save-mileage-btn" class="btn-primary" style="flex: 1; background: #34C759;">Enregistrer</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    const input = document.getElementById('new-mileage-input');
    input.focus();
    input.select();

    document.getElementById('save-mileage-btn').onclick = async () => {
        const val = parseInt(input.value);
        if (isNaN(val) || val < current) {
            window.mobileAlert("Kilométrage invalide", "Veuillez entrer un kilométrage supérieur ou égal à l'actuel (" + current + " km).");
            return;
        }

        const btn = document.getElementById('save-mileage-btn');
        btn.disabled = true;
        btn.innerText = "Enregistrement...";

        try {
            await api.submitVehicleLog({ vehicle_id: vehicleId, type: 'mileage', value: val.toString() });
            const updatedData = await api.getMyVehicle();
            window.mobileVehicleCache = updatedData;

            let targetVehicle = null;
            if (updatedData.assigned && updatedData.assigned.id === vehicleId) targetVehicle = updatedData.assigned;
            else if (updatedData.common) targetVehicle = updatedData.common.find(v => v.id === vehicleId);

            modal.remove();
            if (targetVehicle) window.renderMobileVehicleApp(targetVehicle);
            else window.renderMobileVehiclesList(updatedData);
        } catch (e) {
            window.mobileAlert("Erreur", e.message);
            btn.disabled = false;
            btn.innerText = "Enregistrer";
        }
    };
};

window.updateMobileCT = function (vehicleId, current) {
    const dk = document.documentElement.getAttribute('data-theme') === 'dark';
    const bg = dk ? '#1C1C1E' : '#ffffff';
    const textColor = dk ? '#ffffff' : '#1c1c1e';
    const inputBg = dk ? '#2C2C2E' : '#f2f2f7';

    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.style.zIndex = "10001";
    modal.innerHTML = `
        <div class="modal-box" style="padding: 24px; border-radius: 28px; background: ${bg}; width: 90%; max-width: 400px; text-align: left; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
            <h2 style="margin-top: 0; margin-bottom: 20px; color: ${textColor}; font-size: 20px;">Contrôle Technique</h2>
            
            <div style="margin-bottom: 24px;">
                <label style="display: block; font-size: 14px; color: #8E8E93; margin-bottom: 8px;">Date du dernier contrôle</label>
                <input type="date" id="new-ct-input" style="width: 100%; padding: 16px; border: none; border-radius: 16px; background: ${inputBg}; color: ${textColor}; font-size: 18px;" value="${current || ''}">
                <p style="font-size: 11px; color: #8E8E93; margin-top: 8px;">Cette date sera utilisée pour calculer le prochain rappel.</p>
            </div>
            
            <div style="display: flex; gap: 12px;">
                <button class="btn-secondary" style="flex: 1;" onclick="this.closest('.modal-overlay').remove()">Annuler</button>
                <button id="save-ct-btn" class="btn-primary" style="flex: 1; background: #007AFF;">Enregistrer</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    document.getElementById('save-ct-btn').onclick = async () => {
        const val = document.getElementById('new-ct-input').value;
        if (!val) {
            window.mobileAlert("Date manquante", "Veuillez sélectionner une date.");
            return;
        }

        const btn = document.getElementById('save-ct-btn');
        btn.disabled = true;
        btn.innerText = "Envoi...";

        try {
            await fetch(`${config.api.workerUrl}/my-vehicle`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    ...(await auth.getAuthHeaders())
                },
                body: JSON.stringify({ id: vehicleId, last_ct_date: val })
            });

            await api.submitVehicleLog({
                vehicle_id: vehicleId,
                type: 'inspection',
                description: `Contrôle technique effectué le ${new Date(val).toLocaleDateString('fr-FR')}`
            });

            const updatedData = await api.getMyVehicle();
            window.mobileVehicleCache = updatedData;

            let targetVehicle = null;
            if (updatedData.assigned && updatedData.assigned.id === vehicleId) targetVehicle = updatedData.assigned;
            else if (updatedData.common) targetVehicle = updatedData.common.find(v => v.id === vehicleId);

            modal.remove();
            if (targetVehicle) window.renderMobileVehicleApp(targetVehicle);
            else window.renderMobileVehiclesList(updatedData);
        } catch (e) {
            window.mobileAlert("Erreur", e.message);
            btn.disabled = false;
            btn.innerText = "Enregistrer";
        }
    };
};

window.reportMobileVehicleIssue = function (vehicleId) {
    const dk = document.documentElement.getAttribute('data-theme') === 'dark';
    const bg = dk ? '#1C1C1E' : '#ffffff';
    const textColor = dk ? '#ffffff' : '#1c1c1e';
    const inputBg = dk ? '#2C2C2E' : '#f2f2f7';

    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.style.zIndex = "10001";
    modal.innerHTML = `
        <div class="modal-box" style="padding: 24px; border-radius: 28px; background: ${bg}; width: 90%; max-width: 400px; text-align: left; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
            <h2 style="margin-top: 0; margin-bottom: 20px; color: ${textColor}; font-size: 20px;">Signaler un souci</h2>
            
            <div style="margin-bottom: 24px;">
                <label style="display: block; font-size: 14px; color: #8E8E93; margin-bottom: 8px;">Description du problème</label>
                <textarea id="issue-desc-input" style="width: 100%; height: 120px; padding: 16px; border: none; border-radius: 16px; background: ${inputBg}; color: ${textColor}; font-size: 15px; resize: none;" placeholder="Bruit suspect, voyant moteur, choc carrosserie..."></textarea>
            </div>
            
            <div style="display: flex; gap: 12px;">
                <button class="btn-secondary" style="flex: 1;" onclick="this.closest('.modal-overlay').remove()">Annuler</button>
                <button id="save-issue-btn" class="btn-primary" style="flex: 1; background: #FF3B30;">Signaler</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    document.getElementById('issue-desc-input').focus();

    document.getElementById('save-issue-btn').onclick = async () => {
        const desc = document.getElementById('issue-desc-input').value.trim();
        if (!desc) {
            window.mobileAlert("Description manquante", "Veuillez décrire brièvement le problème rencontré.");
            return;
        }

        const btn = document.getElementById('save-issue-btn');
        btn.disabled = true;
        btn.innerText = "Envoi...";

        try {
            await api.submitVehicleLog({ vehicle_id: vehicleId, type: 'issue', description: desc });
            const updatedData = await api.getMyVehicle();
            window.mobileVehicleCache = updatedData;

            let targetVehicle = null;
            if (updatedData.assigned && updatedData.assigned.id === vehicleId) targetVehicle = updatedData.assigned;
            else if (updatedData.common) targetVehicle = updatedData.common.find(v => v.id === vehicleId);

            modal.remove();
            if (targetVehicle) window.renderMobileVehicleApp(targetVehicle);
            else window.renderMobileVehiclesList(updatedData);
        } catch (e) {
            window.mobileAlert("Erreur", e.message);
            btn.disabled = false;
            btn.innerText = "Signaler";
        }
    };
};

window.logMobileFuel = async function (vehicleId, dkvCard) {
    const dk = document.documentElement.getAttribute('data-theme') === 'dark';
    const bg = dk ? '#1C1C1E' : '#ffffff';
    const textColor = dk ? '#ffffff' : '#1c1c1e';
    const inputBg = dk ? '#2C2C2E' : '#f2f2f7';

    // Fetch DKV cards for selection if it's a common vehicle OR if we want to allow picking
    let allCards = [];
    try { allCards = await api.getDkvCards(); } catch (e) { }

    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.style.zIndex = "10001";
    modal.innerHTML = `
        <div class="modal-box" style="padding: 24px; border-radius: 28px; background: ${bg}; width: 90%; max-width: 400px; text-align: left; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
            <h2 style="margin-top: 0; margin-bottom: 20px; color: ${textColor}; font-size: 20px;">Enregistrer un plein</h2>
            
            <div style="margin-bottom: 20px;">
                <label style="display: block; font-size: 13px; color: #8E8E93; margin-bottom: 6px;">Carte DKV utilisée</label>
                <select id="fuel-dkv" style="width: 100%; padding: 12px; border: none; border-radius: 12px; background: ${inputBg}; color: ${textColor}; font-size: 15px; font-weight: bold;">
                    ${dkvCard ? `<option value="${dkvCard}">Carte du véhicule (${dkvCard})</option>` : ''}
                    <option value="">-- Utiliser une autre carte --</option>
                    ${allCards.map(c => `<option value="${c.card_number}" ${dkvCard === c.card_number ? 'disabled' : ''}>${c.card_number} (${c.description || 'DKV'})</option>`).join('')}
                </select>
            </div>

            <div style="margin-bottom: 20px; display: flex; align-items: center; gap: 8px;">
                <input type="checkbox" id="fuel-is-personal" style="width: 18px; height: 18px; accent-color: #34C759; cursor: pointer;">
                <label for="fuel-is-personal" style="font-size: 13px; color: ${textColor}; font-weight: bold; cursor: pointer;">Plein effectué avec ma carte perso</label>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px;">
                <div>
                    <label style="display: block; font-size: 13px; color: #8E8E93; margin-bottom: 6px;">Volume (Litre)</label>
                    <input type="number" id="fuel-volume" step="0.01" style="width: 100%; padding: 12px; border: none; border-radius: 12px; background: ${inputBg}; color: ${textColor}; font-size: 16px; font-weight: bold;" placeholder="Ex: 45.5">
                </div>
                <div>
                    <label style="display: block; font-size: 13px; color: #8E8E93; margin-bottom: 6px;">Montant (€)</label>
                    <input type="number" id="fuel-amount" step="0.01" style="width: 100%; padding: 12px; border: none; border-radius: 12px; background: ${inputBg}; color: ${textColor}; font-size: 16px; font-weight: bold;" placeholder="Ex: 85.20">
                </div>
            </div>

            <div style="margin-bottom: 24px;">
                <label style="display: block; font-size: 13px; color: #8E8E93; margin-bottom: 6px;">Kilométrage au compteur</label>
                <input type="number" id="fuel-km" style="width: 100%; padding: 12px; border: none; border-radius: 12px; background: ${inputBg}; color: ${textColor}; font-size: 16px; font-weight: bold;" placeholder="Km actuel">
            </div>
            
            <div style="display: flex; gap: 12px;">
                <button class="btn-secondary" style="flex: 1;" onclick="this.closest('.modal-overlay').remove()">Annuler</button>
                <button id="save-fuel-btn" class="btn-primary" style="flex: 1; background: #34C759;">Enregistrer</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    const checkbox = document.getElementById('fuel-is-personal');
    const dkvSelect = document.getElementById('fuel-dkv');
    checkbox.onchange = () => {
        if (checkbox.checked) {
            dkvSelect.disabled = true;
            dkvSelect.style.opacity = '0.5';
        } else {
            dkvSelect.disabled = false;
            dkvSelect.style.opacity = '1';
        }
    };

    document.getElementById('fuel-volume').focus();

    document.getElementById('save-fuel-btn').onclick = async () => {
        const volume = document.getElementById('fuel-volume').value;
        const amount = document.getElementById('fuel-amount').value;
        const km = document.getElementById('fuel-km').value;
        const usedDkv = dkvSelect.value;
        const isPersonal = checkbox.checked;

        if (!volume || !amount || !km || (!isPersonal && !usedDkv)) {
            window.mobileAlert("Champs manquants", "Veuillez remplir le volume, le montant, le kilométrage et la carte.");
            return;
        }

        const btn = document.getElementById('save-fuel-btn');
        btn.disabled = true;
        btn.innerText = "Envoi...";

        const cardLabel = isPersonal ? 'Carte Perso' : usedDkv;
        const description = `Plein : ${volume} L pour ${amount} € à ${km} km (Carte : ${cardLabel})`;

        try {
            await api.submitVehicleLog({
                vehicle_id: vehicleId,
                type: 'fuel',
                value: amount,
                description: description,
                current_mileage: km,
                is_personal: isPersonal
            });
            const updatedData = await api.getMyVehicle();
            window.mobileVehicleCache = updatedData;

            let targetVehicle = null;
            if (updatedData.assigned && updatedData.assigned.id === vehicleId) targetVehicle = updatedData.assigned;
            else if (updatedData.common) targetVehicle = updatedData.common.find(v => v.id === vehicleId);

            modal.remove();
            if (targetVehicle) window.renderMobileVehicleApp(targetVehicle);
            else window.renderMobileVehiclesList(updatedData);
        } catch (e) {
            window.mobileAlert("Erreur", e.message);
            btn.disabled = false;
            btn.innerText = "Enregistrer";
        }
    };
};

window.logMobileRentalFuel = async function () {
    const dk = document.documentElement.getAttribute('data-theme') === 'dark';
    const bg = dk ? '#1C1C1E' : '#ffffff';
    const textColor = dk ? '#ffffff' : '#1c1c1e';
    const inputBg = dk ? '#2C2C2E' : '#f2f2f7';

    let dkvCards = [];
    try {
        dkvCards = await api.getDkvCards();
    } catch (e) {
        console.error("Error loading DKV cards:", e);
    }

    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.style.zIndex = "10001";
    modal.innerHTML = `
        <div class="modal-box" style="padding: 24px; border-radius: 28px; background: ${bg}; width: 90%; max-width: 400px; text-align: left; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
            <h2 style="margin-top: 0; margin-bottom: 20px; color: ${textColor}; font-size: 20px;">⛽ Plein de location/GE</h2>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px;">
                <div>
                    <label style="display: block; font-size: 13px; color: #8E8E93; margin-bottom: 6px;">Volume (L)</label>
                    <input type="number" id="rental-fuel-volume" step="0.01" style="width: 100%; padding: 12px; border: none; border-radius: 12px; background: ${inputBg}; color: ${textColor}; font-size: 16px; font-weight: bold;" placeholder="ex: 45.50">
                </div>
                <div>
                    <label style="display: block; font-size: 13px; color: #8E8E93; margin-bottom: 6px;">Montant (€)</label>
                    <input type="number" id="rental-fuel-amount" step="0.01" style="width: 100%; padding: 12px; border: none; border-radius: 12px; background: ${inputBg}; color: ${textColor}; font-size: 16px; font-weight: bold;" placeholder="ex: 85.20">
                </div>
            </div>

            <div style="margin-bottom: 16px;">
                <label style="display: block; font-size: 13px; color: #8E8E93; margin-bottom: 6px;">Carte DKV</label>
                <select id="rental-fuel-dkv" style="width: 100%; padding: 12px; border: none; border-radius: 12px; background: ${inputBg}; color: ${textColor}; font-size: 15px; font-weight: bold;">
                    <option value="">-- Sélectionner une carte --</option>
                    ${dkvCards.map(c => `<option value="${c.card_number}">${c.card_number} (${c.description || 'DKV'})</option>`).join('')}
                </select>
            </div>

            <div style="margin-bottom: 24px;">
                <label style="display: block; font-size: 13px; color: #8E8E93; margin-bottom: 6px;">Type de véhicule</label>
                <input type="text" id="rental-fuel-type" style="width: 100%; padding: 12px; border: none; border-radius: 12px; background: ${inputBg}; color: ${textColor}; font-size: 16px; font-weight: bold;" placeholder="ex: Master, Kangoo...">
            </div>
            
            <div style="display: flex; gap: 12px;">
                <button class="btn-secondary" style="flex: 1;" onclick="this.closest('.modal-overlay').remove()">Annuler</button>
                <button id="save-rental-fuel-btn" class="btn-primary" style="flex: 1; background: #FF9500;">Enregistrer</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    document.getElementById('rental-fuel-volume').focus();

    document.getElementById('save-rental-fuel-btn').onclick = async () => {
        const volume = document.getElementById('rental-fuel-volume').value;
        const amount = document.getElementById('rental-fuel-amount').value;
        const dkvCard = document.getElementById('rental-fuel-dkv').value;
        const vehicleType = document.getElementById('rental-fuel-type').value.trim();

        if (!volume || !amount || !dkvCard || !vehicleType) {
            window.mobileAlert("Champs manquants", "Veuillez remplir tous les champs.");
            return;
        }

        const btn = document.getElementById('save-rental-fuel-btn');
        btn.disabled = true;
        btn.innerText = "Envoi...";

        try {
            const vehicles = await api.getVehicles();
            let locationVehicle = vehicles.find(v => v.plate_number === 'LOCATION');

            if (!locationVehicle) {
                locationVehicle = await api.saveVehicle({
                    make: 'Véhicule de Location',
                    model: 'Générique',
                    plate_number: 'LOCATION',
                    assigned_user_id: null,
                    dkv_card: '',
                    toll_card: ''
                });
            }

            await api.submitVehicleLog({
                vehicle_id: locationVehicle.id,
                type: 'rental_fuel',
                value: amount,
                description: `Type : ${vehicleType} | Volume : ${volume} L | Carte DKV : ${dkvCard}`,
                is_personal: false
            });

            modal.remove();
            window.mobileAlert("Succès", "Plein de carburant location enregistré avec succès.");
        } catch (e) {
            window.mobileAlert("Erreur", e.message);
            btn.disabled = false;
            btn.innerText = "Enregistrer";
        }
    };
};

window.updateVehicleSidebarBadge = function (vehicles) {
    let alertCount = 0;
    const today = new Date();

    const activeVehicles = vehicles.filter(v => v.plate_number !== 'LOCATION');

    activeVehicles.forEach(v => {
        let isAlert = false;
        if (v.next_maintenance_km && (v.next_maintenance_km - v.last_mileage <= 2000)) isAlert = true;
        if (v.next_maintenance_date) {
            const target = new Date(v.next_maintenance_date);
            const diffDays = Math.ceil((target - today) / (1000 * 60 * 60 * 24));
            if (diffDays <= 30) isAlert = true;
        }

        // CT alert
        if (v.last_ct_date) {
            const lastCt = new Date(v.last_ct_date);
            const interval = v.ct_interval_months || 12;
            const target = new Date(lastCt.setMonth(lastCt.getMonth() + interval));
            const diffDays = Math.ceil((target - today) / (1000 * 60 * 60 * 24));
            if (diffDays <= 60) isAlert = true;
        } else {
            isAlert = true; // CT missing is an alert
        }

        if (isAlert) alertCount++;
    });

    const badge = document.getElementById('vehicle-badge');
    if (badge) {
        if (alertCount > 0) {
            badge.textContent = alertCount;
            badge.style.display = 'flex';
        } else {
            badge.style.display = 'none';
        }
    }
};

window.openVehicleDetailModal = async function (vehicleId) {
    try {
        const [vehicles, logs] = await Promise.all([
            api.getVehicles(),
            api.getVehicleAllLogs(vehicleId)
        ]);
        const v = vehicles.find(veh => veh.id === vehicleId);
        if (!v) return;

        const existing = document.getElementById('vehicle-detail-modal');
        if (existing) existing.remove();

        const modal = document.createElement('div');
        modal.id = 'vehicle-detail-modal';
        modal.className = 'modal-overlay';
        modal.style.zIndex = '100010';

        modal.innerHTML = `
            <div class="modal-box" style="width: 900px; max-width: 95vw; padding: 0; overflow: hidden; display: flex; flex-direction: column; background: #ffffff; border-radius: 24px; box-shadow: 0 10px 40px rgba(0,0,0,0.15);">
                <!-- Header -->
                <div style="padding: 32px; background: #f8f9fa; border-bottom: 1px solid #dee2e6; display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <div style="font-size: 11px; color: #888; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 4px; font-weight: 700;">Administration de flotte</div>
                        <h2 style="margin: 0; font-size: 28px; font-weight: 800; color: #1a1a1c;">
                            ${v.make || ''} ${v.model || 'Inconnu'} 
                            <span style="background: #000; color: #fff; padding: 4px 12px; border-radius: 8px; font-family: 'JetBrains Mono', monospace; font-size: 18px; margin-left: 12px; vertical-align: middle;">${v.plate_number}</span>
                        </h2>
                    </div>
                    <div style="display:flex; gap:12px;">
                        <button class="btn-primary" onclick="openAddVehicleEventModal('${v.id}')" style="padding: 10px 20px; border-radius: 12px; background: #FF3B30; color: #fff; border: none; font-weight: 700;">➕ Ajouter événement</button>
                        <button class="btn-secondary" onclick="this.closest('.modal-overlay').remove()" style="padding: 10px 20px; border-radius: 12px; background: #eee; color: #333; border: none; font-weight: 700;">Fermer</button>
                    </div>
                </div>

                <div style="display: grid; grid-template-columns: 320px 1fr; height: 600px;">
                    <!-- Left Column: Info -->
                    <div style="padding: 32px; background: #ffffff; border-right: 1px solid #eee; overflow-y: auto;">
                        <!-- Vehicle Image -->
                        <div style="width: 100%; height: 180px; background: #f8f9fa; border-radius: 20px; overflow: hidden; margin-bottom: 24px; border: 1px solid #eee; display: flex; align-items: center; justify-content: center;">
                            <img src="${config.api.workerUrl}/get/vehicles/photos/${v.id}.png?t=${Date.now()}" onerror="this.src='https://cdn-icons-png.flaticon.com/512/3202/3202926.png'; this.style.opacity='0.1'; this.style.width='64px'; this.style.height='64px';" style="width: 100%; height: 100%; object-fit: cover;">
                        </div>

                        <h3 style="font-size: 12px; color: #999; text-transform: uppercase; margin-bottom: 16px; letter-spacing: 1px; font-weight: 700;">Cartes & Badges</h3>
                        <div style="padding: 20px; border-radius: 20px; margin-bottom: 32px; background: #f8f9fa; border: 1px solid #f1f3f5;">
                            <div style="margin-bottom: 16px;">
                                <div style="font-size: 11px; color: #888; margin-bottom: 4px; font-weight: 600;">Carte DKV / Essence</div>
                                <div style="font-family: 'JetBrains Mono', monospace; font-size: 15px; color: #1a1a1c; font-weight: 700;">${v.dkv_card || '<span style="color:#ccc; font-weight:400;">Non renseigné</span>'}</div>
                            </div>
                            <div>
                                <div style="font-size: 11px; color: #888; margin-bottom: 4px; font-weight: 600;">Badge Télépéage</div>
                                <div style="font-family: 'JetBrains Mono', monospace; font-size: 15px; color: #1a1a1c; font-weight: 700;">${v.toll_card || '<span style="color:#ccc; font-weight:400;">Non renseigné</span>'}</div>
                            </div>
                        </div>

                        <h3 style="font-size: 12px; color: #999; text-transform: uppercase; margin-bottom: 16px; letter-spacing: 1px; font-weight: 700;">Contrôle Technique</h3>
                        <div style="padding: 20px; border-radius: 20px; background: #f8f9fa; border: 1px solid #f1f3f5;">
                            <div style="margin-bottom: 16px;">
                                <div style="font-size: 11px; color: #888; margin-bottom: 4px; font-weight: 600;">Dernière inspection</div>
                                <div style="font-family: 'JetBrains Mono', monospace; font-size: 15px; color: #1a1a1c; font-weight: 700;">${v.last_ct_date ? new Date(v.last_ct_date).toLocaleDateString('fr-FR') : '<span style="color:#ccc; font-weight:400;">Non renseigné</span>'}</div>
                            </div>
                            <div>
                                <div style="font-size: 11px; color: #888; margin-bottom: 4px; font-weight: 600;">Prochain passage estimé</div>
                                <div style="font-family: 'JetBrains Mono', monospace; font-size: 15px; color: #34C759; font-weight: 700;">
                                    ${(() => {
                if (!v.last_ct_date) return '--';
                const date = new Date(v.last_ct_date);
                date.setMonth(date.getMonth() + (v.ct_interval_months || 12));
                return date.toLocaleDateString('fr-FR');
            })()}
                                </div>
                            </div>
                        </div>
                        </div>

                        <h3 style="font-size: 12px; color: #999; text-transform: uppercase; margin-bottom: 16px; letter-spacing: 1px; font-weight: 700;">Entretien Prévu</h3>
                        <div style="padding: 20px; border-radius: 20px; margin-bottom: 32px; background: #fff; border: 1px solid #eee; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
                            <div style="margin-bottom: 16px;">
                                <div style="font-size: 11px; color: #888; margin-bottom: 4px; font-weight: 600;">Échéance Kilométrique</div>
                                <div style="font-size: 20px; font-weight: 900; color: #34C759;">${v.next_maintenance_km ? v.next_maintenance_km.toLocaleString() + ' km' : '--'}</div>
                            </div>
                            <div>
                                <div style="font-size: 11px; color: #888; margin-bottom: 4px; font-weight: 600;">Échéance Date</div>
                                <div style="font-size: 20px; font-weight: 900; color: #FF9500;">${v.next_maintenance_date ? new Date(v.next_maintenance_date).toLocaleDateString() : '--'}</div>
                            </div>
                        </div>

                        <h3 style="font-size: 12px; color: #999; text-transform: uppercase; margin-bottom: 16px; letter-spacing: 1px; font-weight: 700;">Historique</h3>
                        <div style="display: flex; flex-direction: column; gap: 12px;">
                            ${logs.slice(0, 5).map(l => `
                                <div style="font-size: 12px; padding: 12px; border-radius: 14px; background: #f8f9fa; border: 1px solid #f1f3f5; position: relative;">
                                    <div style="display: flex; justify-content: space-between; margin-bottom: 4px; padding-right: 20px;">
                                        <div>
                                            <span style="font-weight: 800; color: ${l.type === 'issue' ? '#FF3B30' : (l.type === 'event' ? '#007AFF' : '#495057')}; font-size: 10px;">${l.type.toUpperCase()}</span>
                                            <span style="color: #adb5bd; font-size: 10px; font-weight:700; margin-left: 8px;">${new Date(l.created_at).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                    <button onclick="handleDeleteVehicleLog('${l.id}', '${vehicleId}')" style="position: absolute; top: 12px; right: 12px; background: none; border: none; color: #ff3b30; cursor: pointer; font-size: 16px; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; opacity: 0.5; font-weight: 900;" title="Supprimer">&times;</button>
                                    <div style="color: #212529; font-weight: 500; word-break: break-word; padding-right: 20px;">
                                        ${l.type === 'mileage' ? '<b>' + l.value + '</b> km' : l.description}
                                        ${l.image_path ? `<br><a href="${config.api.workerUrl}/get/${l.image_path}" target="_blank" style="color:var(--primary); font-size:10px; text-decoration:none; display:inline-flex; align-items:center; gap:4px; margin-top:5px; font-weight:700;">📎 Voir pièce jointe</a>` : ''}
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    <!-- Right Column: Charts & Stats -->
                    <div style="padding: 32px; display: flex; flex-direction: column; gap: 20px; overflow: hidden; background: #fcfcfd;">
                        
                        <!-- Tab Switcher -->
                        <div style="display: flex; background: #f0f0f0; padding: 4px; border-radius: 14px; width: fit-content;">
                            <button id="tab-mil" onclick="window.switchVehicleView('mileage')" style="border: none; background: #fff; padding: 8px 20px; border-radius: 10px; font-weight: 700; font-size: 13px; cursor: pointer; color: #1a1a1c; box-shadow: 0 2px 8px rgba(0,0,0,0.05); transition: 0.2s;">📍 Kilométrage</button>
                            <button id="tab-fue" onclick="window.switchVehicleView('fuel')" style="border: none; background: transparent; padding: 8px 20px; border-radius: 10px; font-weight: 700; font-size: 13px; cursor: pointer; color: #888; transition: 0.2s;">⛽ Essence</button>
                        </div>

                        <!-- View Container -->
                        <div id="vehicle-tabs-container" style="flex: 1; display: flex; flex-direction: column;">
                            
                            <!-- Mileage View -->
                            <div id="view-mileage" style="flex: 1; display: flex; flex-direction: column; gap: 20px;">
                                <div style="flex: 1; background: #ffffff; border-radius: 24px; padding: 24px; border: 1px solid #eee; box-shadow: 0 4px 15px rgba(0,0,0,0.02); display: flex; flex-direction: column; min-height: 0;">
                                    <h3 style="margin-top: 0; font-size: 16px; color: #1a1a1c; font-weight: 800; margin-bottom: 24px;">📈 Historique du compteur</h3>
                                    <div style="flex: 1; position: relative;"><canvas id="mileageChart"></canvas></div>
                                </div>
                                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                                    <div style="padding: 20px; border-radius: 20px; background: #fff; border: 1px solid #eee;">
                                        <div style="font-size: 10px; color: #888; font-weight: 800; text-transform: uppercase; margin-bottom: 4px;">Dernière Activité</div>
                                        <div style="font-size: 16px; font-weight: 800;">${v.profiles ? v.profiles.first_name + ' ' + v.profiles.last_name : 'N/A'}</div>
                                    </div>
                                    <div style="padding: 20px; border-radius: 20px; background: #fff; border: 1px solid #eee;">
                                        <div style="font-size: 10px; color: #888; font-weight: 800; text-transform: uppercase; margin-bottom: 4px;">Compteur Actuel</div>
                                        <div style="font-size: 22px; font-weight: 900; color: #34C759;">${(v.last_mileage || 0).toLocaleString()} km</div>
                                    </div>
                                </div>
                            </div>

                            <!-- Fuel View (Hidden by default) -->
                            <div id="view-fuel" style="flex: 1; display: none; flex-direction: column; gap: 20px;">
                                <div id="fuel-stats-grid-tabs" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px;"></div>
                                <div style="flex: 1; background: #ffffff; border-radius: 24px; padding: 24px; border: 1px solid #eee; box-shadow: 0 4px 15px rgba(0,0,0,0.02); display: flex; flex-direction: column; min-height: 0;">
                                    <h3 style="margin-top: 0; font-size: 16px; color: #007AFF; font-weight: 800; margin-bottom: 24px;">⛽ Évolution des Coûts (€)</h3>
                                    <div style="flex: 1; position: relative;"><canvas id="fuelChart"></canvas></div>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        // --- Data Processing ---
        const fuelLogs = logs.filter(l => l.type === 'fuel').sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        const mileageLogs = logs.filter(l => l.type === 'mileage').sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

        let totalEuro = 0, totalLiters = 0, avgCons = 0, totalPersonalEuro = 0;
        const fuelDataPoints = fuelLogs.map(l => {
            const match = l.description.match(/Plein : ([\d.]+) L pour ([\d.]+) € à ([\d.]+) km/);
            if (match) {
                const [_, vol, eur, kms] = match;
                const cost = parseFloat(eur);
                totalEuro += cost;
                totalLiters += parseFloat(vol);
                if (l.is_personal) {
                    totalPersonalEuro += cost;
                }
                return { date: l.created_at, vol: parseFloat(vol), eur: cost, kms: parseFloat(kms) };
            }
            return null;
        }).filter(d => d !== null);

        if (fuelDataPoints.length >= 2) {
            const totalKm = fuelDataPoints[fuelDataPoints.length - 1].kms - fuelDataPoints[0].kms;
            const litersForPeriod = fuelDataPoints.slice(1).reduce((sum, d) => sum + d.vol, 0);
            if (totalKm > 0) avgCons = (litersForPeriod / totalKm) * 100;
        }

        // --- View Switching Logic ---
        window.switchVehicleView = (view) => {
            const vMil = document.getElementById('view-mileage');
            const vFue = document.getElementById('view-fuel');
            const tMil = document.getElementById('tab-mil');
            const tFue = document.getElementById('tab-fue');

            if (view === 'mileage') {
                vMil.style.display = 'flex'; vFue.style.display = 'none';
                tMil.style.background = '#fff'; tMil.style.color = '#1a1a1c'; tMil.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)';
                tFue.style.background = 'transparent'; tFue.style.color = '#888'; tFue.style.boxShadow = 'none';
            } else {
                vMil.style.display = 'none'; vFue.style.display = 'flex';
                tFue.style.background = '#fff'; tFue.style.color = '#007AFF'; tFue.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)';
                tMil.style.background = 'transparent'; tMil.style.color = '#888'; tMil.style.boxShadow = 'none';

                // Init Fuel Stats if in fuel view
                document.getElementById('fuel-stats-grid-tabs').innerHTML = `
                    <div style="background: rgba(52, 199, 89, 0.05); padding: 8px; border-radius: 16px; border: 1px solid rgba(52,199,89,0.1); text-align: center;">
                        <div style="font-size: 8px; color: #34C759; font-weight: 800; text-transform: uppercase;">Conso.</div>
                        <div style="font-size: 13px; font-weight: 900;">${avgCons > 0 ? avgCons.toFixed(1) : '--'}</div>
                    </div>
                    <div style="background: rgba(0, 122, 255, 0.05); padding: 8px; border-radius: 16px; border: 1px solid rgba(0,122,255,0.1); text-align: center;">
                        <div style="font-size: 8px; color: #007AFF; font-weight: 800; text-transform: uppercase;">Budget T.</div>
                        <div style="font-size: 13px; font-weight: 900;">${totalEuro.toLocaleString()}€</div>
                    </div>
                    <div style="background: rgba(255, 59, 48, 0.05); padding: 8px; border-radius: 16px; border: 1px solid rgba(255,59,48,0.1); text-align: center;">
                        <div style="font-size: 8px; color: #FF3B30; font-weight: 800; text-transform: uppercase;">Perso</div>
                        <div style="font-size: 13px; font-weight: 900;">${totalPersonalEuro.toLocaleString()}€</div>
                    </div>
                    <div style="background: rgba(255, 149, 0, 0.05); padding: 8px; border-radius: 16px; border: 1px solid rgba(255,149,0,0.1); text-align: center;">
                        <div style="font-size: 8px; color: #FF9500; font-weight: 800; text-transform: uppercase;">Volume</div>
                        <div style="font-size: 13px; font-weight: 900;">${totalLiters.toLocaleString()}L</div>
                    </div>
                `;
            }
        };

        // --- Initial Charts ---
        // 1. Mileage
        new Chart(document.getElementById('mileageChart').getContext('2d'), {
            type: 'line',
            data: {
                labels: mileageLogs.map(l => new Date(l.created_at).toLocaleDateString()),
                datasets: [{
                    label: 'Compteur',
                    data: mileageLogs.map(l => parseInt(l.value)),
                    borderColor: '#34C759',
                    backgroundColor: 'rgba(52, 199, 89, 0.05)',
                    borderWidth: 3, fill: true, tension: 0.4,
                    pointRadius: 4, pointBackgroundColor: '#fff', pointBorderColor: '#34C759'
                }]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
        });

        // 2. Fuel
        new Chart(document.getElementById('fuelChart').getContext('2d'), {
            type: 'bar',
            data: {
                labels: fuelDataPoints.map(d => new Date(d.date).toLocaleDateString()),
                datasets: [{
                    label: 'Coût (€)',
                    data: fuelDataPoints.map(d => d.eur),
                    backgroundColor: 'rgba(0, 122, 255, 0.2)',
                    borderColor: '#007AFF',
                    borderWidth: 2, borderRadius: 6
                }]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
        });

    } catch (e) {
        alert("Erreur: " + e.message);
    }
};

// Start
// Event Modal for Vehicle
window.openAddVehicleEventModal = function (vehicleId) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.style.zIndex = '100020';
    modal.innerHTML = `
        <div class="modal-box" style="width: 450px; background: #fff; border-radius: 20px; padding: 24px; box-shadow: 0 10px 40px rgba(0,0,0,0.2);">
            <h3 style="margin-top:0; color:#1a1a1c; font-weight:800; font-size:20px;">Nouvel événement</h3>
            <div style="display:flex; flex-direction:column; gap:18px; margin-top:20px;">
                <div>
                    <label style="display:block; font-size:12px; color:#888; margin-bottom:6px; font-weight:700; text-transform:uppercase;">Date de l'événement</label>
                    <input type="date" id="event-date" class="form-control" value="${new Date().toISOString().split('T')[0]}" style="width:100%; padding:12px; border-radius:10px; border:1px solid #ddd;">
                </div>
                <div>
                    <label style="display:block; font-size:12px; color:#888; margin-bottom:6px; font-weight:700; text-transform:uppercase;">Nom / Description</label>
                    <input type="text" id="event-desc" class="form-control" placeholder="Ex: Facture révision, Contrôle technique..." style="width:100%; padding:12px; border-radius:10px; border:1px solid #ddd;">
                </div>
                <div>
                    <label style="display:block; font-size:12px; color:#888; margin-bottom:6px; font-weight:700; text-transform:uppercase;">Pièce jointe (PDF, Image...)</label>
                    <input type="file" id="event-file" class="form-control" style="width:100%; padding:10px; border:1px dashed #ccc; border-radius:10px; background:#fcfcfd;">
                </div>
                
                <div style="display:flex; gap:12px; margin-top:10px;">
                    <button class="btn-secondary" onclick="this.closest('.modal-overlay').remove()" style="flex:1; padding:12px; border-radius:12px; border:none; background:#eee; color:#333; font-weight:700;">Annuler</button>
                    <button class="btn-primary" id="save-event-btn" style="flex:2; padding:12px; border-radius:12px; border:none; background:#FF3B30; color:#fff; font-weight:700;">Enregistrer l'événement</button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    const saveBtn = modal.querySelector('#save-event-btn');
    saveBtn.onclick = async () => {
        const dateStr = modal.querySelector('#event-date').value;
        const desc = modal.querySelector('#event-desc').value;
        const fileInput = modal.querySelector('#event-file');

        if (!desc) return alert("Veuillez saisir une description");

        saveBtn.disabled = true;
        saveBtn.innerText = "Téléchargement en cours...";

        try {
            let filePath = null;
            if (fileInput.files.length > 0) {
                const uploadRes = await api.uploadFile(fileInput.files[0], 'fleet/events/');
                filePath = uploadRes.key;
            }

            saveBtn.innerText = "Enregistrement...";
            await api.submitVehicleLog({
                vehicle_id: vehicleId,
                type: 'event',
                description: desc,
                event_date: dateStr ? (new Date(dateStr + 'T12:00:00')).toISOString() : new Date().toISOString(),
                image_path: filePath
            });

            modal.remove();
            await window.openVehicleDetailModal(vehicleId);
        } catch (e) {
            console.error(e);
            alert("Erreur: " + e.message);
            saveBtn.disabled = false;
            saveBtn.innerText = "Enregistrer l'événement";
        }
    };
};

window.renderMobileMap = async function () {
    window.stopPlacingMachine();
    document.body.classList.remove('hide-main-nav');
    const container = document.getElementById('list-content');
    if (container) {
        container.style.position = '';
        container.style.inset = '';
        container.style.zIndex = '';
        container.classList.remove('landscape-mode');
    }
    document.getElementById('categories-view').classList.add('hidden');
    document.getElementById('search-results-view').classList.add('hidden');
    const searchContainer = document.querySelector('.mobile-search-container');
    if (searchContainer) searchContainer.classList.add('hidden');
    document.getElementById('document-list').classList.remove('hidden');
    document.getElementById('selected-category-title').innerText = "Plans Bâtiments";
    window.mobileCurrentPath = "map";
    try {
        const buildings = await api.getBuildings();
        container.innerHTML = `
            <div style="padding: 20px; display: grid; gap: 15px; background: var(--bg-color);">
                <div style="position: relative;">
                    <input type="text" id="mobile-machine-search" placeholder="🔍 Rechercher N° MI..." style="width:100%; padding: 14px; border-radius: 14px; border:none; background: rgba(142, 142, 147, 0.12); color: var(--text-color);">
                    <div id="m-suggestions" style="display:none; position: absolute; left:0; right:0; top: 100%; max-height: 200px; overflow-y: auto; background: var(--bg-color); border-radius: 0 0 14px 14px; box-shadow: 0 10px 15px rgba(0,0,0,0.2); z-index: 1000; border-top: 1px solid rgba(142,142,147,0.1);"></div>
                </div>
                ${buildings.map(b => `
                    <div style="background: rgba(142, 142, 147, 0.1); padding: 20px; border-radius: 20px; display: flex; align-items: center; gap: 15px;" onclick="window.renderBuildingSchematic('${b.id}')">
                        <div style="font-size: 32px;">🏢</div>
                        <div style="flex:1;"><div style="font-weight: bold; color: var(--text-color);">${b.name}</div><div style="font-size: 12px; color: #8E8E93;">Voir le plan</div></div>
                        <div style="color: #8E8E93;">→</div>
                    </div>
                `).join('')}
            </div>
        `;
        const mSearch = document.getElementById('mobile-machine-search');
        const mSugg = document.getElementById('m-suggestions');
        mSearch.oninput = async (e) => {
            const val = e.target.value.trim().toUpperCase();
            if (val.length < 2) { mSugg.style.display = 'none'; return; }
            const machines = await api.getMachines();
            const filtered = machines.filter(m => (m.machine_id || "").toUpperCase().includes(val)).slice(0, 5);
            if (filtered.length > 0) {
                mSugg.style.display = 'block';
                mSugg.innerHTML = filtered.map(m => `
                    <div onclick="window.renderBuildingSchematic('${m.building_id}', '${m.id}')" style="padding: 12px 15px; border-bottom: 1px solid rgba(142,142,147,0.1); color: var(--text-color); display: flex; justify-content: space-between;">
                        <span>${m.machine_id}</span>
                        <small style="opacity: 0.6;">Bât. ${m.building_id ? buildings.find(b => b.id === m.building_id)?.name : 'N/A'}</small>
                    </div>
                `).join('');
            } else { mSugg.style.display = 'none'; }
        };
    } catch (e) { container.innerHTML = `<p style="padding:20px;">Erreur: ${e.message}</p>`; }
};

window.renderBuildingSchematic = async function (buildingId, highlightMachineId = null) {
    const isMobile = window.innerWidth <= 768;
    const container = isMobile ? document.getElementById('list-content') : document.getElementById('admin-content');

    // Si c'est mobile et qu'on cherche une machine, on passe en plein écran horizontal (rotation 90)
    if (isMobile && highlightMachineId) {
        document.body.classList.add('hide-main-nav');
        container.classList.add('landscape-mode');
    } else if (isMobile) {
        document.body.classList.remove('hide-main-nav');
        container.classList.remove('landscape-mode');
    }

    try {
        const buildings = await api.getBuildings();
        const b = buildings.find(x => x.id === buildingId);
        if (!b) return console.error('Building not found:', buildingId);
        console.log('Loading Building Plan:', b.name, b.svg_url);
        const machines = await api.getMachines();
        const bMachines = machines.filter(m => m.building_id === buildingId);

        container.innerHTML = `
            <div style="height: 100%; display: flex; flex-direction: column; background: #000; position: relative;">
                ${(isMobile && highlightMachineId) ? `
                    <!-- Bouton retour flottant supprimé au profit du bouton retour Android -->
                ` : `
                    <div style="padding: 15px 20px; background: rgba(0,0,0,0.4); display: flex; align-items: center; gap: 15px; border-bottom: 1px solid rgba(255,255,255,0.1); backdrop-filter: blur(10px); z-index: 10;">
                        <button onclick="${isMobile ? 'window.renderMobileMap()' : 'window.renderAdminMap()'}" style="background: none; border: none; color: white; cursor: pointer; display: flex; align-items: center; gap: 5px;">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
                            ${isMobile ? '' : 'Retour'}
                        </button>
                        <h3 style="margin: 0; color: white; flex: 1;">${b.name}</h3>
                        ${localStorage.getItem('pouchain_role') === 'admin' ? `
                            <button id="add-m-btn" class="btn-primary" style="padding: 8px 15px; font-size: 13px;" onclick="window.startPlacingMachine('${buildingId}')">+ Machine</button>
                            <button id="cancel-m-btn" class="btn-secondary" style="padding: 8px 15px; font-size: 13px; display:none;" onclick="window.stopPlacingMachine()">Annuler</button>
                        ` : ''}
                    </div>
                `}
                <div id="placement-hint" style="display:none; background: #FF9500; color: white; text-align: center; padding: 5px; font-size: 13px; font-weight: bold;">Mode Placement : Cliquez n'importe où sur le plan pour placer la machine</div>
                <div id="schematic-viewport" style="flex: 1; position: relative; overflow: ${(isMobile && highlightMachineId) ? 'hidden' : 'auto'}; display: flex; align-items: center; justify-content: center; background: radial-gradient(rgba(255,255,255,0.05) 1px, transparent 1px); background-size: 30px 30px; width: 100%; height: 100%;">
                    <div id="schematic-container" style="position: relative; max-width: 100%; max-height: 100%; display: flex; align-items: center; justify-content: center;">
                        <img src="${b.svg_url}" id="schematic-img" style="width: auto; height: auto; max-width: 100%; max-height: 100%; display: block; border-radius: 4px; box-shadow: 0 0 20px rgba(0,0,0,0.5);" onerror="console.error('Plan Load Failed:', this.src); alert('Erreur: Impossible de charger le plan (PNG/JPG).')">
                    </div>
                </div>
                ${(isMobile && highlightMachineId) ? '' : `
                    <div style="height: 60px; background: #1C1C1E; border-top: 1px solid rgba(255,255,255,0.1); display: flex; align-items: center; padding: 0 20px; overflow-x: auto; gap: 10px;">
                        <span style="font-size: 12px; color: #8E8E93; margin-right: 10px;">Machines:</span>
                        ${bMachines.map(m => `<div onclick="window.focusMachineOnSchematic('${m.id}')" style="background: rgba(255,255,255,0.1); padding: 5px 12px; border-radius: 15px; font-size: 13px; color: white; cursor: pointer; white-space: nowrap;">${m.machine_id}</div>`).join('')}
                    </div>
                `}
            </div>
        `;
        const schematicImg = document.getElementById('schematic-img');
        schematicImg.onload = () => {
            const sc = document.getElementById('schematic-container');
            sc.onclick = (e) => {
                if (!window.isPlacingMachine) return;
                const rect = schematicImg.getBoundingClientRect();
                const x = ((e.clientX - rect.left) / rect.width) * 100;
                const y = ((e.clientY - rect.top) / rect.height) * 100;
                window.openAddMachineModal(x, y, buildingId);
            };

            bMachines.forEach(m => {
                if (m.x_pos !== null && m.y_pos !== null) {
                    const pin = document.createElement('div');
                    pin.id = `pin-${m.id}`;
                    pin.className = 'machine-pin' + (m.id === highlightMachineId ? ' pin-searched' : '');
                    pin.style.cssText = `position: absolute; left: ${m.x_pos}%; top: ${m.y_pos}%; width: 32px; height: 32px; margin: -16px; display: flex; align-items: center; justify-content: center; font-size: 20px; background: rgba(255,255,255,0.25); border: 2px solid white; border-radius: 50%; box-shadow: 0 0 10px rgba(0,0,0,0.3); cursor: pointer; z-index: ${m.id === highlightMachineId ? 10000 : 100}; transition: all 0.2s ease; backdrop-filter: blur(5px);`;
                    pin.innerHTML = m.emoji || '🔧';
                    pin.onclick = (ev) => {
                        ev.stopPropagation();
                        if (window.isPlacingMachine) return;
                        window.renderMachineDetailsUI(m.id);
                    };
                    sc.appendChild(pin);
                }
            });
            if (highlightMachineId) window.focusMachineOnSchematic(highlightMachineId);
        };
    } catch (e) { alert("Erreur: " + e.message); }
};

window.openAddBuildingModal = function () {
    const dk = document.documentElement.getAttribute('data-theme') === 'dark';
    const bg = dk ? '#1C1C1E' : '#FFFFFF';
    const textColor = dk ? '#FFFFFF' : '#000000';
    const inputBg = dk ? '#2C2C2E' : '#f2f2f7';
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.style.zIndex = "15000";
    modal.innerHTML = `
        <div class="modal-box" style="background: ${bg}; color: ${textColor}; width: 90%; max-width: 400px; padding: 25px; border-radius: 25px;">
            <h2 style="margin-top:0;">🏢 Nouveau Bâtiment</h2>
            <div style="margin-bottom: 15px;"><label style="display:block; font-size: 12px; margin-bottom: 5px; opacity: 0.7;">Nom du bâtiment</label><input type="text" id="new-b-name" style="width:100%; padding: 12px; border:none; border-radius: 12px; background: ${inputBg}; color: ${textColor};" required></div>
            <div style="margin-bottom: 20px;"><label style="display:block; font-size: 12px; margin-bottom: 5px; opacity: 0.7;">Plan (PNG recommandé)</label><input type="file" id="new-b-svg" accept=".png,.jpg,.jpeg,.svg" style="width:100%;"></div>
            <div style="display:flex; gap: 10px;"><button class="btn-secondary" style="flex:1;" onclick="this.closest('.modal-overlay').remove()">Annuler</button><button class="btn-primary" style="flex:2;" id="save-building-btn">Ajouter</button></div>
        </div>
    `;
    document.body.appendChild(modal);
    document.getElementById('save-building-btn').onclick = async () => {
        const name = document.getElementById('new-b-name').value.trim();
        const fileInput = document.getElementById('new-b-svg');
        if (!name || !fileInput.files[0]) return alert("Nom et fichier requis");
        try {
            const key = `buildings/${Date.now()}_${fileInput.files[0].name}`;
            await api.uploadFile(fileInput.files[0], key);
            const svg_url = `${config.api.workerUrl}/get/${key}`;
            await api.saveBuilding({ name, svg_url });
            modal.remove();
            window.renderAdminMap();
        } catch (e) { alert("Erreur: " + e.message); }
    };
};

window.renderMachineDetailsUI = async function (machineDbId) {
    try {
        const machines = await api.getMachines();
        const machine = machines.find(m => m.id === machineDbId);
        if (!machine) return;
        const logs = await api.getMachineLogs(machineDbId);
        const dk = document.documentElement.getAttribute('data-theme') === 'dark';
        const bg = dk ? '#1C1C1E' : '#FFFFFF';
        const textColor = dk ? '#FFFFFF' : '#000000';
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.style.zIndex = "11000";
        modal.innerHTML = `
            <div class="modal-box" style="padding:0; border-radius: 28px; width: 95%; max-width: 500px; max-height: 85vh; display: flex; flex-direction: column; overflow: hidden; background: ${bg};">
                <div style="position: relative; height: 180px; background: #333;">
                    ${machine.image_url ? `<img src="${machine.image_url}" style="width:100%; height:100%; object-fit: cover;">` : `<div style="display:flex; align-items:center; justify-content:center; height:100%; font-size: 60px;">🔧</div>`}
                    <div style="position: absolute; bottom: 0; left: 0; right: 0; padding: 20px; background: linear-gradient(transparent, rgba(0,0,0,0.8)); color: white;"><h2 style="margin: 0;">${machine.machine_id}</h2><div style="opacity: 0.8;">${machine.type || ''}</div></div>
                    <button onclick="this.closest('.modal-overlay').remove()" style="position: absolute; top: 15px; right: 15px; background: rgba(0,0,0,0.5); border: none; color: white; width: 32px; height: 32px; border-radius: 16px; cursor: pointer;">✕</button>
                </div>
                <div style="flex: 1; overflow-y: auto; padding: 20px;">
                    <div style="display: flex; flex-direction: column; gap: 12px;">
                        ${logs.length === 0 ? `<p style="text-align:center; color:#8E8E93;">Aucun historique.</p>` : logs.map(l => `
                            <div style="background: rgba(142,142,147,0.1); padding: 12px; border-radius: 12px;">
                                <div style="display:flex; justify-content:space-between; margin-bottom:4px;"><strong>${l.action_type}</strong> <small>${new Date(l.created_at).toLocaleDateString()}</small></div>
                                <div style="font-size: 14px; opacity: 0.9;">${l.description || ''}</div>
                                <div style="font-size: 11px; opacity: 0.5; text-align:right; margin-top:5px;">— ${l.profiles ? l.profiles.first_name : 'Inconnu'}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                <div style="padding: 15px; border-top: 1px solid rgba(255,255,255,0.1); display: flex; gap: 10px; background: ${bg};">
                    <button class="btn-primary" style="flex:1;" onclick="openAddMachineLogModal('${machineDbId}')">Ajouter un log</button>
                    ${localStorage.getItem('pouchain_role') === 'admin' ? `<button class="btn-secondary" style="width: 50px;" onclick="handleDeleteMachine('${machineDbId}', '${machine.building_id}')">🗑️</button>` : ''}
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    } catch (e) { alert("Erreur: " + e.message); }
};

window.openAddMachineLogModal = function (machineDbId) {
    const dk = document.documentElement.getAttribute('data-theme') === 'dark';
    const bg = dk ? '#1C1C1E' : '#FFFFFF';
    const textColor = dk ? '#FFFFFF' : '#000000';
    const inputBg = dk ? '#2C2C2E' : '#f2f2f7';
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.style.zIndex = "13000";
    modal.innerHTML = `
        <div class="modal-box" style="background: ${bg}; color: ${textColor}; width: 90%; max-width: 400px; padding: 25px; border-radius: 25px;">
            <h2 style="margin-top:0;">📝 Nouveau Log</h2>
            <div style="margin-bottom: 15px;"><label style="display:block; font-size: 12px; margin-bottom: 5px;">Action</label>
                <select id="log-action" style="width:100%; padding: 12px; border:none; border-radius: 12px; background: ${inputBg}; color: ${textColor};">
                    <option value="Maintenance">🔧 Maintenance</option>
                    <option value="Réparation">🛠️ Réparation</option>
                    <option value="Contrôle">👁️ Contrôle</option>
                    <option value="Déplacement">🚚 Déplacement</option>
                </select>
            </div>
            <div style="margin-bottom: 20px;"><label style="display:block; font-size: 12px; margin-bottom: 5px;">Notes</label><textarea id="log-desc" style="width:100%; height: 80px; padding: 12px; border:none; border-radius: 12px; background: ${inputBg}; color: ${textColor}; resize: none;"></textarea></div>
            <div style="display:flex; gap: 10px;"><button class="btn-secondary" style="flex:1;" onclick="this.closest('.modal-overlay').remove()">Annuler</button><button class="btn-primary" style="flex:2;" id="save-log-btn">Valider</button></div>
        </div>
    `;
    document.body.appendChild(modal);
    document.getElementById('save-log-btn').onclick = async () => {
        const actionType = document.getElementById('log-action').value;
        const desc = document.getElementById('log-desc').value;
        try {
            await api.addMachineLog(machineDbId, actionType, desc);
            document.querySelectorAll('.modal-overlay').forEach(o => o.remove());
            renderMachineDetailsUI(machineDbId);
        } catch (e) { alert("Erreur: " + e.message); }
    };
};

window.renderMobileParc = async function () {
    document.getElementById('categories-view').classList.add('hidden');
    document.getElementById('search-results-view').classList.add('hidden');
    const searchContainer = document.querySelector('.mobile-search-container');
    if (searchContainer) searchContainer.classList.add('hidden');
    document.getElementById('document-list').classList.remove('hidden');

    document.getElementById('selected-category-title').innerText = "Échéances";
    document.getElementById('mobile-upload-btn').style.display = 'none';

    window.window.mobileCurrentPath = "parc_list";

    const container = document.getElementById('list-content');
    const dk = document.documentElement.getAttribute('data-theme') === 'dark';
    const cardBg = dk ? '#1C1C1E' : '#fff';
    const textColor = dk ? '#FFFFFF' : '#1c1c1e';
    const border = dk ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)';

    container.innerHTML = `
        <div style="padding: 16px; padding-bottom: 100px;">
            <div style="display: flex; flex-direction: column; gap: 12px; margin-bottom: 20px;">
                <div style="display: flex; gap: 10px;">
                    <div style="position: relative; flex: 1;">
                        <input type="text" id="mobile-parc-search" placeholder="Rechercher (ID, nom, marque)..." 
                            style="width: 100%; padding: 14px 14px 14px 40px; border-radius: 16px; border: none; background: ${dk ? '#2C2C2E' : '#f2f2f7'}; color: ${textColor}; font-size: 15px;">
                        <span style="position: absolute; left: 14px; top: 50%; transform: translateY(-50%); opacity: 0.5;">🔍</span>
                    </div>
                    <button onclick="window.openMobileMachineEditModal()" style="width: 48px; height: 48px; background: var(--primary,#FF3B30); border: none; border-radius: 14px; color: white; font-size: 24px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(0,0,0,0.1); flex-shrink:0;">+</button>
                </div>
                <!-- Filtre Famille Mobile -->
                <div id="mobile-family-filter-container">
                    <select id="mobile-parc-family" style="width: 100%; padding: 12px; border-radius: 12px; background: ${dk ? '#2C2C2E' : '#f2f2f7'}; color: ${textColor}; border:none; font-size:14px; appearance:none;">
                        <option value="">Toutes les familles</option>
                    </select>
                </div>
            </div>
            <div id="mobile-parc-list">
                <div style="text-align: center; padding: 40px;"><div class="loader-spinner"></div></div>
            </div>
        </div>
    `;

    try {
        const [machines, families] = await Promise.all([
            api.getMachines(),
            api.getMachineFamilies()
        ]);

        const listContainer = document.getElementById('mobile-parc-list');
        const familySelect = document.getElementById('mobile-parc-family');

        // Fill families
        families.forEach(f => {
            const opt = document.createElement('option');
            opt.value = f.name;
            opt.innerText = f.name;
            familySelect.appendChild(opt);
        });

        const renderList = () => {
            const filter = document.getElementById('mobile-parc-search').value.toLowerCase();
            const family = familySelect.value;

            const filtered = machines.filter(m => {
                const matchesSearch = m.machine_id.toLowerCase().includes(filter) ||
                    (m.name && m.name.toLowerCase().includes(filter)) ||
                    (m.description && m.description.toLowerCase().includes(filter)) ||
                    (m.brand && m.brand.toLowerCase().includes(filter)) ||
                    (m.serial_number && m.serial_number.toLowerCase().includes(filter));
                const matchesFamily = !family || m.family === family;
                return matchesSearch && matchesFamily;
            });

            if (filtered.length === 0) {
                listContainer.innerHTML = `<div style="text-align: center; padding: 40px; color: #8E8E93; font-style: italic;">Aucun matériel trouvé</div>`;
                return;
            }

            listContainer.innerHTML = filtered.map(m => {
                const nextDate = m.next_maintenance_date ? new Date(m.next_maintenance_date) : null;
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                let statusColor = '#8E8E93';
                if (nextDate) {
                    if (nextDate < today) statusColor = '#FF3B30';
                    else if (nextDate < new Date(today.getTime() + 15 * 24 * 60 * 60 * 1000)) statusColor = '#FF9500';
                    else statusColor = '#34C759';
                }

                return `
                    <div onclick="window.openMobileMachineDetail('${m.id}')" style="background: ${cardBg}; border: 1px solid ${border}; border-radius: 20px; padding: 16px; display: flex; align-items: center; gap: 14px; margin-bottom: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.04); opacity: ${m.status_active === false ? '0.5' : '1'};">
                        <div style="width: 54px; height: 54px; background: rgba(0,0,0,0.05); border-radius: 12px; overflow: hidden; border: 1px solid ${border}; flex-shrink: 0;">
                            <img src="${config.api.workerUrl}/get/machines_photos/${m.id}.png?t=${Date.now()}" onerror="this.src='https://cdn-icons-png.flaticon.com/512/3202/3202926.png'; this.style.opacity='0.2'; this.style.filter='invert(1)';" style="width: 100%; height: 100%; object-fit: cover;">
                        </div>
                        <div style="flex: 1; min-width: 0;">
                            <div style="font-weight: 800; color: ${textColor}; font-size: 15px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: flex; align-items: center; gap: 8px;">
                                ${window.escapeHTML(m.machine_id)}
                                ${m.vgp_status === 'OK' ? '<span style="color: #34C759; font-size: 10px;">✅ VGP</span>' : (m.vgp_status === 'KO' ? '<span style="color: #FF3B30; font-size: 10px;">⚠️ VGP KO</span>' : '')}
                            </div>
                            <div style="font-size: 13px; color: ${textColor}; opacity: 0.8; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${window.escapeHTML(m.name || 'Sans nom')}</div>
                            <div style="font-size: 11px; color: #8E8E93; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-top: 2px;">
                                ${m.family ? `📁 ${m.family}` : 'Non classé'} • SN: ${m.serial_number || '--'}
                            </div>
                            <div style="font-size: 11px; margin-top: 6px; display: flex; align-items: center; gap: 6px;">
                                <span style="width: 7px; height: 7px; border-radius: 50%; background: ${statusColor};"></span>
                                <span style="color: ${statusColor}; font-weight: 700;">Échéance : ${m.next_maintenance_date ? new Date(m.next_maintenance_date).toLocaleDateString('fr-FR') : '--'}</span>
                            </div>
                        </div>
                        <div style="color: #8E8E93; font-size: 18px; opacity: 0.4;">›</div>
                    </div>
                `;
            }).join('');
        };

        renderList();
        document.getElementById('mobile-parc-search').oninput = renderList;
        familySelect.onchange = renderList;

    } catch (e) {
        document.getElementById('mobile-parc-list').innerHTML = `<div style="color:red; text-align:center; padding:20px;">Erreur: ${e.message}</div>`;
    }
};

window.openMobileMachineDetail = async function (id) {
    window.window.mobileCurrentPath = "parc_detail";
    const container = document.getElementById('list-content');
    container.innerHTML = `<div style="text-align:center; padding: 40px;"><div class="loader-spinner"></div></div>`;

    try {
        const machines = await api.getMachines();
        const m = machines.find(item => item.id === id);
        if (!m) return window.renderMobileParc();

        const history = await api.getMachineMaintenanceHistory(m.id);
        const dk = document.documentElement.getAttribute('data-theme') === 'dark';
        const cardBg = dk ? '#1C1C1E' : '#fff';
        const textColor = dk ? '#FFFFFF' : '#1c1c1e';
        const border = dk ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)';

        container.innerHTML = `
            <div style="padding: 16px; padding-bottom: 100px;">
                <!-- Header Card -->
                <div style="background: linear-gradient(135deg, #1a1a1c, #2a2a2c); border-radius: 24px; overflow: hidden; margin-bottom: 20px; box-shadow: 0 12px 24px rgba(0,0,0,0.15); border: 1px solid rgba(255,255,255,0.05);">
                    <div style="width: 100%; height: 180px; position: relative;">
                         <img src="${config.api.workerUrl}/get/machines_photos/${m.id}.png?t=${Date.now()}" onerror="this.src='https://cdn-icons-png.flaticon.com/512/3202/3202926.png'; this.style.opacity='0.1';" style="width: 100%; height: 100%; object-fit: cover;">
                         <div style="position: absolute; bottom: 0; left: 0; right: 0; padding: 20px; background: linear-gradient(transparent, rgba(0,0,0,0.85));">
                             <div style="font-size: 24px; font-weight: 800; color: white; line-height:1.1;">${window.escapeHTML(m.name || m.machine_id)}</div>
                             <div style="font-size: 14px; color: rgba(255,255,255,0.7); margin-top: 6px;"><strong>ID :</strong> ${window.escapeHTML(m.machine_id)}</div>
                         </div>
                         <button onclick="window.openMobileMachineEditModal('${m.id}')" style="position: absolute; top: 16px; right: 16px; background: rgba(255,255,255,0.15); backdrop-filter: blur(8px); border: none; width: 42px; height: 42px; border-radius: 50%; color: white; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(0,0,0,0.2);">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                         </button>
                    </div>
                    <div style="padding: 16px; display: grid; grid-template-columns: 1fr 1fr; gap: 12px; background: rgba(255,255,255,0.03);">
                        <div style="text-align: center;">
                            <div style="font-size: 10px; color: #8E8E93; text-transform: uppercase; font-weight:700; letter-spacing:0.05em;">Marque</div>
                            <div style="color: white; font-weight: 700; font-size:14px; margin-top:2px;">${window.escapeHTML(m.brand || '--')}</div>
                        </div>
                        <div style="text-align: center; border-left: 1px solid rgba(255,255,255,0.08);">
                            <div style="font-size: 10px; color: #8E8E93; text-transform: uppercase; font-weight:700; letter-spacing:0.05em;">Famille</div>
                            <div style="color: white; font-weight: 700; font-size:14px; margin-top:2px;">${window.escapeHTML(m.family || '--')}</div>
                        </div>
                    </div>
                </div>

                <!-- Info Grid -->
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px;">
                    <div style="background: ${cardBg}; border: 1px solid ${border}; border-radius: 18px; padding: 14px; box-shadow: 0 2px 8px rgba(0,0,0,0.02);">
                        <div style="font-size: 10px; color: #8E8E93; text-transform: uppercase; font-weight: 700; margin-bottom: 4px;">N° de Série</div>
                        <div style="font-weight: 800; color: ${textColor}; font-family: monospace;">${window.escapeHTML(m.serial_number || '--')}</div>
                    </div>
                    <div style="background: ${cardBg}; border: 1px solid ${border}; border-radius: 18px; padding: 14px; box-shadow: 0 2px 8px rgba(0,0,0,0.02);">
                        <div style="font-size: 10px; color: #8E8E93; text-transform: uppercase; font-weight: 700; margin-bottom: 4px;">Periodicité</div>
                        <div style="font-weight: 800; color: ${textColor};">${m.periodicity || '--'} mois</div>
                    </div>
                </div>

                <!-- Technical Status -->
                <div style="background: ${cardBg}; border: 1px solid ${border}; border-radius: 20px; padding: 18px; margin-bottom: 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 15px;">
                        <div>
                            <div style="font-size: 11px; color: #8E8E93; text-transform: uppercase; font-weight: 700;">Dernière VGP</div>
                            <div style="font-size: 18px; font-weight: 800; color: ${textColor}; margin-top: 2px;">${m.last_vgp_date ? new Date(m.last_vgp_date).toLocaleDateString('fr-FR') : 'Non renseigné'}</div>
                        </div>
                        <div style="text-align: right;">
                            <div style="font-size: 11px; color: #8E8E93; text-transform: uppercase; font-weight: 700;">Statut VGP</div>
                            <div style="margin-top: 4px;">
                                ${m.vgp_status === 'OK' ? '<span style="background: #34C759; color: white; padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 800;">CONFORME</span>' :
                (m.vgp_status === 'KO' ? '<span style="background: #FF3B30; color: white; padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 800;">A REPARER</span>' :
                    '<span style="background: #8E8E93; color: white; padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 800;">INCONNU</span>')}
                            </div>
                        </div>
                    </div>
                    <div style="padding-top: 15px; border-top: 1px solid ${border}; display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <div style="font-size: 11px; color: #8E8E93; text-transform: uppercase; font-weight: 700;">Validité Maint.</div>
                            <div style="font-size: 18px; font-weight: 800; color: #FF9500; margin-top: 2px;">${m.next_maintenance_date ? new Date(m.next_maintenance_date).toLocaleDateString('fr-FR') : '--'}</div>
                        </div>
                        <button class="btn-primary" onclick="window.addMobileMaintenance('${m.id}')" style="padding: 12px 20px; border-radius: 14px; background: #34C759; font-weight: 800; border: none; color: white; box-shadow: 0 4px 10px rgba(52, 199, 89, 0.2);">INTERVENTION</button>
                    </div>
                </div>

                <!-- Attachments Section (Mobile) -->
                ${m.attachments && m.attachments.length > 0 ? `
                    <h3 style="font-size: 18px; margin: 20px 0 16px 4px; color: ${textColor}; font-weight: 800;">📎 Fichiers Liés</h3>
                    <div style="background: ${cardBg}; border: 1px solid ${border}; border-radius: 20px; padding: 12px; margin-bottom: 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); display: flex; flex-direction: column; gap: 8px;">
                        ${m.attachments.map(file => {
                        const sizeStr = file.size ? `(${(file.size / (1024 * 1024)).toFixed(2)} Mo)` : '';
                        return `
                                <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(0,0,0,0.02); padding: 10px 14px; border-radius: 12px;">
                                    <span style="font-size: 13px; font-weight: 600; color: ${textColor}; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 200px;">📄 ${file.name}</span>
                                    <a href="${config.api.workerUrl}/get/${encodeURIComponent(file.key)}" target="_blank" style="background: rgba(255, 149, 0, 0.1); color: #FF9500; border: 1px solid rgba(255,149,0,0.2); padding: 5px 12px; border-radius: 8px; font-weight: 700; text-decoration: none; font-size: 12px; display: inline-block;">Ouvrir</a>
                                </div>
                            `;
                    }).join('')}
                    </div>
                ` : ''}

                <!-- History Section -->
                <h3 style="font-size: 18px; margin: 0 0 16px 4px; color: ${textColor}; font-weight: 800;">📋 Historique</h3>
                
                ${history.length === 0 ? `
                    <div style="text-align: center; padding: 40px 20px; color: #8E8E93; background: ${cardBg}; border-radius: 20px; border: 1px dashed ${border}; font-size: 14px;">
                        Aucune maintenance enregistrée.
                    </div>
                ` : history.map(h => `
                    <div style="background: ${cardBg}; border: 1px solid ${border}; border-radius: 18px; padding: 18px; margin-bottom: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.02);">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 8px; align-items: center;">
                            <div style="font-weight: 800; color: ${textColor}; font-size: 15px; display: flex; align-items: center; gap: 8px;">
                                ${new Date(h.date).toLocaleDateString('fr-FR')}
                                <span style="font-size: 11px; opacity: 0.7;">(${h.last_control_type || 'Maint.'})</span>
                            </div>
                            <div style="font-size: 11px; color: #34C759; background: rgba(52, 199, 89, 0.1); padding: 4px 10px; border-radius: 10px; font-weight:700;">${h.profiles ? (h.profiles.first_name) : 'Admin'}</div>
                        </div>
                        <div style="font-size: 14px; color: #8E8E93; line-height: 1.5; font-weight:500;">${window.escapeHTML(h.details || 'Contrôle périodique.')}</div>
                        ${h.vgp_status ? `<div style="font-size: 12px; margin-top: 8px; font-weight: 700; color: ${h.vgp_status === 'OK' ? '#34C759' : '#FF3B30'}">VGP: ${h.vgp_status} ${h.vgp_observations ? `• ${h.vgp_observations}` : ''}</div>` : ''}
                        ${h.next_maintenance_date ? `<div style="font-size: 11px; color: #FF9500; margin-top: 10px; font-weight:700; display:flex; align-items:center; gap:4px;">🗓️ Prochaine: ${new Date(h.next_maintenance_date).toLocaleDateString('fr-FR')}</div>` : ''}
                    </div>
                `).join('')}
            </div>
        `;
    } catch (e) {
        container.innerHTML = `<div style="color:red; text-align:center; padding:40px;">Erreur: ${e.message}</div>`;
    }
};

window.addMobileMaintenance = async function (machineId) {
    const dk = document.documentElement.getAttribute('data-theme') === 'dark';
    const bg = dk ? '#1C1C1E' : '#ffffff';
    const textColor = dk ? '#ffffff' : '#1c1c1e';
    const inputBg = dk ? '#2C2C2E' : '#f2f2f7';
    const border = dk ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)';

    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.style.zIndex = "10001";
    modal.innerHTML = `
        <div class="modal-box" style="padding: 24px; border-radius: 28px; background: ${bg}; width: 92%; max-width: 440px; text-align: left; box-shadow: 0 10px 30px rgba(0,0,0,0.5); animation: modalIn 0.3s cubic-bezier(0.1, 0.8, 0.1, 1);">
            <h2 style="margin-top: 0; margin-bottom: 24px; color: ${textColor}; font-size: 20px; font-weight: 800;">Nouvelle Intervention</h2>
            
            <div style="margin-bottom: 20px;">
                <label style="display: block; font-size: 13px; color: #8E8E93; margin-bottom: 8px; font-weight: 600;">Type de contrôle</label>
                <div style="display: flex; gap: 8px;">
                    ${['Maintenance', 'VGP', 'Remise en service'].map(type => `
                        <div class="control-type-pill" onclick="window.setControlType('${type}')" data-type="${type}" style="flex: 1; text-align: center; padding: 10px; border-radius: 12px; background: ${inputBg}; font-size: 12px; font-weight: 700; cursor: pointer; transition: all 0.2s;">${type}</div>
                    `).join('')}
                </div>
                <input type="hidden" id="mob-control-type" value="Maintenance">
            </div>

            <!-- VGP Specific Section -->
            <div id="mob-vgp-section" style="display: none; margin-bottom: 20px; padding: 16px; background: rgba(52, 199, 89, 0.05); border: 1px solid rgba(52, 199, 89, 0.1); border-radius: 16px;">
                <label style="display: block; font-size: 13px; color: #34C759; margin-bottom: 12px; font-weight: 700;">Résultat de la VGP</label>
                <div style="display: flex; gap: 10px; margin-bottom: 12px;">
                    <div id="vgp-ok-btn" onclick="window.setVgpStatus('OK')" style="flex:1; padding: 12px; border-radius: 12px; background: rgba(52, 199, 89, 0.1); border: 2px solid transparent; color: #34C759; text-align: center; font-weight: 800; font-size:13px;">CONFORME</div>
                    <div id="vgp-ko-btn" onclick="window.setVgpStatus('KO')" style="flex:1; padding: 12px; border-radius: 12px; background: rgba(255, 59, 48, 0.1); border: 2px solid transparent; color: #FF3B30; text-align: center; font-weight: 800; font-size:13px;">A REPARER</div>
                </div>
                <input type="hidden" id="mob-vgp-status" value="">
                <input type="text" id="mob-vgp-obs" placeholder="Observations VGP..." style="width: 100%; padding: 12px; border: none; border-radius: 12px; background: ${bg}; color: ${textColor}; font-size: 14px; border: 1px solid ${border};">
            </div>

            <div style="margin-bottom: 20px;">
                <label style="display: block; font-size: 13px; color: #8E8E93; margin-bottom: 8px; font-weight: 600;">Notes additionnelles</label>
                <textarea id="mob-maint-details" style="width: 100%; height: 80px; padding: 14px; border: none; border-radius: 16px; background: ${inputBg}; color: ${textColor}; font-size: 15px; resize: none; font-family: inherit;" placeholder="Notes..."></textarea>
            </div>

            <div style="margin-bottom: 30px;">
                <label style="display: block; font-size: 13px; color: #8E8E93; margin-bottom: 10px; font-weight: 600;">Echéance validité (en mois)</label>
                <div style="background: ${inputBg}; padding: 16px; border-radius: 16px;">
                    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 15px;">
                        <span id="mob-maint-val" style="font-weight: 800; color: var(--primary); font-size: 18px;">12 mois</span>
                        <div id="mob-maint-date-preview" style="font-size: 12px; color: #8E8E93; font-weight: 700;">Expire le: <strong>-</strong></div>
                    </div>
                    <input type="range" id="mob-maint-slider" min="1" max="24" value="12" style="width: 100%; accent-color: var(--primary);">
                </div>
            </div>
            
            <div style="display: flex; gap: 12px;">
                <button class="btn-secondary" style="flex: 1; height: 52px; border-radius: 16px; font-weight: 700;" onclick="this.closest('.modal-overlay').remove()">Annuler</button>
                <button id="mob-save-maint-btn" class="btn-primary" style="flex: 1; height: 52px; border-radius: 16px; background: #34C759; border: none; color: white; font-weight: 800;">Valider</button>
            </div>
        </div>
        <style>
            .control-type-pill.active { background: var(--primary) !important; color: white !important; }
            @keyframes modalIn { from { transform: scale(0.9) translateY(20px); opacity: 0; } to { transform: scale(1) translateY(0); opacity: 1; } }
        </style>
    `;
    document.body.appendChild(modal);

    window.setVgpStatus = (status) => {
        document.getElementById('mob-vgp-status').value = status;
        document.getElementById('vgp-ok-btn').style.borderColor = (status === 'OK') ? '#34C759' : 'transparent';
        document.getElementById('vgp-ko-btn').style.borderColor = (status === 'KO') ? '#FF3B30' : 'transparent';
    };

    // Par défaut
    window.setControlType('Maintenance');

    const slider = document.getElementById('mob-maint-slider');
    const valText = document.getElementById('mob-maint-val');
    const preview = document.getElementById('mob-maint-date-preview');

    const updatePreview = () => {
        valText.innerText = `${slider.value} mois`;
        const date = new Date();
        date.setMonth(date.getMonth() + parseInt(slider.value));
        preview.innerHTML = `Expire le : <strong>${date.toLocaleDateString('fr-FR')}</strong>`;
        return date.toISOString().split('T')[0];
    };

    slider.oninput = updatePreview;
    updatePreview();

    document.getElementById('mob-save-maint-btn').onclick = async () => {
        const type = document.getElementById('mob-control-type').value;
        const details = document.getElementById('mob-maint-details').value.trim();
        const nextDate = updatePreview();
        const vgpStatus = (type === 'VGP') ? document.getElementById('mob-vgp-status').value : null;
        const vgpObs = (type === 'VGP') ? document.getElementById('mob-vgp-obs').value.trim() : null;

        if (type === 'VGP' && !vgpStatus) return alert("Veuillez indiquer si la VGP est conforme.");

        const btn = document.getElementById('mob-save-maint-btn');
        btn.disabled = true;
        btn.innerText = "Validation...";

        try {
            await api.saveMachineMaintenance(machineId, details, nextDate, vgpStatus, vgpObs, type);
            modal.remove();
            window.openMobileMachineDetail(machineId);
        } catch (e) {
            alert("Erreur: " + e.message);
            btn.disabled = false;
            btn.innerText = "Valider";
        }
    };
};

window.openMobileMachineEditModal = async function (id = null) {
    let existing = null;
    let families = [];
    try {
        const [machines, familiesData] = await Promise.all([
            api.getMachines(),
            api.getMachineFamilies()
        ]);
        families = familiesData;
        if (id) existing = machines.find(m => m.id === id);
    } catch (e) { console.error(e); }

    const dk = document.documentElement.getAttribute('data-theme') === 'dark';
    const bg = dk ? '#1C1C1E' : '#ffffff';
    const textColor = dk ? '#ffffff' : '#1c1c1e';
    const inputBg = dk ? '#2C2C2E' : '#f2f2f7';

    let mobAttachments = existing?.attachments || [];

    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.style.zIndex = "10001";
    modal.innerHTML = `
        <div class="modal-box" style="padding: 24px; border-radius: 28px; background: ${bg}; width: 94%; max-width: 500px; max-height: 90vh; overflow-y: auto; text-align: left; box-shadow: 0 10px 30px rgba(0,0,0,0.5); animation: modalIn 0.3s cubic-bezier(0.1, 0.8, 0.1, 1);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h2 style="margin: 0; color: ${textColor}; font-size: 20px; font-weight: 800;">${id ? 'Modifier' : 'Nouveau'} Matériel</h2>
                <button onclick="this.closest('.modal-overlay').remove()" style="background: none; border: none; color: #8E8E93; font-size: 20px;">✕</button>
            </div>
            
            <div style="margin-bottom: 24px; display: flex; align-items: center; gap: 16px; background: rgba(0,0,0,0.03); padding: 15px; border-radius: 20px;">
                <div id="mob-m-preview" style="width: 90px; height: 90px; border-radius: 18px; background: ${inputBg}; display: flex; align-items: center; justify-content: center; overflow: hidden; border: 1px dashed rgba(142, 142, 147, 0.5); position: relative; flex-shrink: 0;">
                    <img src="${id ? `${config.api.workerUrl}/get/machines_photos/${id}.png?t=${Date.now()}` : ''}" onerror="this.style.display='none'" onload="this.style.display='block'" style="width: 100%; height: 100%; object-fit: cover;">
                    <span style="font-size: 28px; opacity: 0.2; position: absolute;">📷</span>
                </div>
                <div style="flex: 1;">
                    <p style="font-size: 13px; color: #8E8E93; margin: 0 0 8px 0; font-weight: 600;">Photo du matériel</p>
                    <button onclick="document.getElementById('mob-m-file').click()" style="width: 100%; height: 40px; border-radius: 12px; background: var(--primary); color: white; border: none; font-size: 13px; font-weight: 700;">Prendre / Choisir</button>
                    <input type="file" id="mob-m-file" accept="image/*" style="display: none;" onchange="
                        const reader = new FileReader();
                        reader.onload = (e) => { 
                            const img = document.querySelector('#mob-m-preview img');
                            img.src = e.target.result;
                            img.style.display = 'block';
                        };
                        reader.readAsDataURL(this.files[0]);
                    ">
                </div>
            </div>

            <div style="margin-bottom: 20px;">
                <label style="display: block; font-size: 12px; color: #8E8E93; margin-bottom: 6px; font-weight: 700; text-transform: uppercase;">Identification</label>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                    <input type="text" id="mob-m-id" value="${existing?.machine_id || ''}" style="width: 100%; padding: 14px; border: none; border-radius: 14px; background: ${inputBg}; color: ${textColor}; font-size: 16px; font-weight: 700;" placeholder="ID (ex: MI_123)">
                    <input type="text" id="mob-m-sn" value="${existing?.serial_number || ''}" style="width: 100%; padding: 14px; border: none; border-radius: 14px; background: ${inputBg}; color: ${textColor}; font-size: 16px; font-weight: 700;" placeholder="N° de Série">
                </div>
            </div>

            <div style="margin-bottom: 20px;">
                <label style="display: block; font-size: 12px; color: #8E8E93; margin-bottom: 6px; font-weight: 700; text-transform: uppercase;">Désignation & Famille</label>
                <input type="text" id="mob-m-name" value="${existing?.name || ''}" style="width: 100%; padding: 14px; border: none; border-radius: 14px; background: ${inputBg}; color: ${textColor}; font-size: 15px; margin-bottom: 12px;" placeholder="Nom (ex: Mini-pelle 3T)">
                <input type="text" id="mob-m-family" list="mob-m-family-list" value="${existing?.family || ''}" style="width: 100%; padding: 14px; border: none; border-radius: 14px; background: ${inputBg}; color: ${textColor}; font-size: 15px;" placeholder="Famille (ex: Mini-pelles)">
                <datalist id="mob-m-family-list">
                    ${families.map(f => `<option value="${f.name}"></option>`).join('')}
                </datalist>
            </div>

            <div style="margin-bottom: 20px;">
                <label style="display: block; font-size: 12px; color: #8E8E93; margin-bottom: 6px; font-weight: 700; text-transform: uppercase;">Marque & Attribution</label>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                    <input type="text" id="mob-m-brand" value="${existing?.brand || ''}" style="width: 100%; padding: 14px; border: none; border-radius: 14px; background: ${inputBg}; color: ${textColor}; font-size: 15px;" placeholder="Marque (ex: JCB)">
                    <input type="text" id="mob-m-assigned" value="${existing?.assigned_to || ''}" style="width: 100%; padding: 14px; border: none; border-radius: 14px; background: ${inputBg}; color: ${textColor}; font-size: 15px;" placeholder="Attribué à...">
                </div>
            </div>

            <div style="margin-bottom: 20px;">
                <label style="display: block; font-size: 12px; color: #8E8E93; margin-bottom: 10px; font-weight: 700; text-transform: uppercase;">Durée de validité (mois)</label>
                <div style="background: rgba(0,0,0,0.03); padding: 15px; border-radius: 16px;">
                    <div style="display:flex; justify-content: space-between; margin-bottom: 8px;">
                        <span id="mob-edit-period-val" style="font-weight: 800; color: var(--primary);">${existing?.periodicity || 12} mois</span>
                    </div>
                    <input type="range" id="mob-m-period" min="1" max="24" value="${existing?.periodicity || 12}" style="width: 100%; accent-color: var(--primary);" oninput="document.getElementById('mob-edit-period-val').innerText = this.value + ' mois'">
                </div>
            </div>

            <div style="margin-bottom: 24px; display: flex; align-items: center; justify-content: space-between; padding: 12px; background: rgba(0,0,0,0.03); border-radius: 14px;">
                <span style="font-size: 14px; font-weight: 700; color: ${textColor};">Matériel actif</span>
                <div style="position: relative; display: inline-block; width: 60px; height: 34px;">
                    <input type="checkbox" id="mob-m-active" ${existing?.status_active !== false ? 'checked' : ''} style="opacity: 0; width: 0; height: 0;">
                    <span onclick="this.previousElementSibling.click(); this.classList.toggle('checked')" class="toggle-slider ${existing?.status_active !== false ? 'checked' : ''}" style="position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #ccc; transition: .4s; border-radius: 34px;"></span>
                </div>
            </div>

            <!-- SECTION: DOCUMENTS JOINTS (MOBILE) -->
            <div style="margin-bottom: 20px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                    <label style="display: block; font-size: 12px; color: #8E8E93; font-weight: 700; text-transform: uppercase; margin: 0;">📎 Fichiers liés (R2)</label>
                    <button type="button" onclick="document.getElementById('mob-attachments-input').click()" style="background: var(--primary); border: none; color: white; padding: 5px 12px; border-radius: 8px; font-size: 11px; font-weight: 700; cursor: pointer;">Ajouter</button>
                </div>
                <input type="file" id="mob-attachments-input" multiple style="display: none;" onchange="window.handleUploadMobileAttachments(this)">
                <div id="mob-attachments-list" style="display: flex; flex-direction: column; gap: 8px; background: rgba(0,0,0,0.03); padding: 12px; border-radius: 14px; min-height: 40px;">
                    <!-- Rendered dynamically -->
                </div>
            </div>

            <div style="display: flex; gap: 12px; margin-top: 10px;">
                <button class="btn-secondary" style="flex: 1; height: 52px; border-radius: 16px; font-weight: 700;" onclick="this.closest('.modal-overlay').remove()">Annuler</button>
                <button id="mob-save-m-btn" class="btn-primary" style="flex: 1; height: 52px; border-radius: 16px; background: var(--primary); border: none; color: white; font-weight: 800;">Enregistrer</button>
            </div>
            
            ${id ? `
            <div style="text-align: center; margin-top: 24px;">
                <button onclick="window.deleteAdminMachineMobile('${id}')" style="background: none; border: none; color: #FF3B30; font-size: 13px; font-weight: 700; text-decoration: underline;">Supprimer ce matériel</button>
            </div>
            ` : ''}
        </div>
        <style>
            .toggle-slider:before { position: absolute; content: ""; height: 26px; width: 26px; left: 4px; bottom: 4px; background-color: white; transition: .4s; border-radius: 50%; }
            .toggle-slider.checked { background-color: #34C759; }
            .toggle-slider.checked:before { transform: translateX(26px); }
        </style>
    `;
    document.body.appendChild(modal);

    const cleanUpMobHelpers = () => {
        delete window.removeMobileAttachment;
        delete window.handleUploadMobileAttachments;
    };

    window.removeMobileAttachment = (index) => {
        mobAttachments.splice(index, 1);
        renderMobAttachments();
    };

    window.handleUploadMobileAttachments = async (input) => {
        if (!input.files || input.files.length === 0) return;
        const files = Array.from(input.files);
        const listDiv = document.getElementById('mob-attachments-list');

        input.disabled = true;

        for (const file of files) {
            const loadingDiv = document.createElement('div');
            loadingDiv.style.cssText = "display: flex; align-items: center; gap: 10px; font-size: 12px; color: #888;";
            loadingDiv.innerHTML = `<span>⏳ Upload de ${file.name}...</span>`;
            listDiv.appendChild(loadingDiv);

            try {
                const uploaded = await api.uploadMachineAttachment(file);
                mobAttachments.push({ name: uploaded.name, key: uploaded.key, size: uploaded.size });
            } catch (e) {
                alert(`Erreur: ` + e.message);
            }
        }

        input.disabled = false;
        input.value = "";
        renderMobAttachments();
    };

    const renderMobAttachments = () => {
        const listDiv = document.getElementById('mob-attachments-list');
        if (!listDiv) return;
        if (mobAttachments.length === 0) {
            listDiv.innerHTML = `<div style="text-align: center; color: #8E8E93; font-size: 12px; padding: 4px 0; font-style: italic;">Aucun document lié</div>`;
            return;
        }
        listDiv.innerHTML = mobAttachments.map((file, index) => {
            const sizeStr = file.size ? `(${(file.size / (1024 * 1024)).toFixed(2)} Mo)` : '';
            return `
                <div style="display: flex; justify-content: space-between; align-items: center; background: ${inputBg}; padding: 8px 12px; border-radius: 8px;">
                    <a href="${config.api.workerUrl}/get/${encodeURIComponent(file.key)}" target="_blank" style="color: var(--primary); text-decoration: underline; font-size: 13px; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 250px;">📄 ${file.name}</a>
                    <button type="button" onclick="window.removeMobileAttachment(${index})" style="background: none; border: none; color: #FF3B30; font-weight: 900; cursor: pointer; font-size: 16px;">&times;</button>
                </div>
            `;
        }).join('');
    };

    renderMobAttachments();

    document.getElementById('mob-save-m-btn').onclick = async () => {
        const data = {
            id: id,
            machine_id: document.getElementById('mob-m-id').value.trim(),
            name: document.getElementById('mob-m-name').value.trim(),
            serial_number: document.getElementById('mob-m-sn').value.trim(),
            brand: document.getElementById('mob-m-brand').value.trim(),
            family: document.getElementById('mob-m-family').value.trim(),
            assigned_to: document.getElementById('mob-m-assigned').value.trim(),
            periodicity: parseInt(document.getElementById('mob-m-period').value),
            status_active: document.getElementById('mob-m-active').checked,
            attachments: mobAttachments,
            // Legacy mapping for compatibility
            description: document.getElementById('mob-m-sn').value.trim(),
            type: document.getElementById('mob-m-family').value.trim()
        };

        if (!data.machine_id) return alert("L'identifiant est obligatoire.");

        const btn = document.getElementById('mob-save-m-btn');
        btn.disabled = true;
        btn.innerText = "Patientez...";

        try {
            const saved = await api.saveMachine(data);
            const photoInput = document.getElementById('mob-m-file');
            if (photoInput.files.length > 0) {
                btn.innerText = "Upload photo...";
                await api.uploadMachinePhoto(saved.id || id, photoInput.files[0]);
            }
            cleanUpMobHelpers();
            modal.remove();
            if (id) window.openMobileMachineDetail(id);
            else window.renderMobileParc();
        } catch (e) {
            alert("Erreur: " + e.message);
            btn.disabled = false;
            btn.innerText = "Enregistrer";
        }
    };
};
