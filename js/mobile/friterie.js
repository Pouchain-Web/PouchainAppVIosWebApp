import { api } from '../api.js';
import { auth } from '../auth.js';
import config from '../config.js';

window.renderMobileFriterie = async function () {
    document.getElementById('categories-view').classList.add('hidden');
    document.getElementById('search-results-view').classList.add('hidden');
    const searchContainer = document.querySelector('.mobile-search-container');
    if (searchContainer) searchContainer.classList.add('hidden');
    document.getElementById('document-list').classList.remove('hidden');

    document.getElementById('selected-category-title').innerText = "Friterie 🍟";
    document.getElementById('mobile-upload-btn').style.display = 'none';

    window.mobileCurrentPath = "friterie";

    const container = document.getElementById('list-content');
    const dk = document.documentElement.getAttribute('data-theme') === 'dark';
    const cardBg = dk ? '#1C1C1E' : '#fff';
    const textColor = dk ? '#FFFFFF' : '#1c1c1e';
    const subtleBorder = dk ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)';

    const deleteAllBtn = `
        <button class="btn-primary" onclick="window.adminDeleteAllFritOrders()" style="width: 100%; height: 50px; background: #FF3B30; color: #fff; font-size: 14px; margin-top: 12px; border-radius: 12px; font-weight:600; border:none; display:flex; align-items:center; justify-content:center; gap:8px;">
            <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
            Tout effacer
        </button>
    `;

    container.innerHTML = `
        <div style="padding: 16px; display: flex; flex-direction: column; gap: 20px; padding-bottom: 100px;">
            <div style="background: ${cardBg}; border: 1px solid ${subtleBorder}; border-radius: 20px; padding: 20px; text-align: center; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
                <div style="font-size: 40px; margin-bottom: 12px;">🇧🇪</div>
                <h2 style="margin: 0; color: ${textColor}; font-size: 20px;">Friterie Pouchain</h2>
                <p style="color: #8E8E93; font-size: 14px; margin: 8px 0 20px 0;">Faites votre commande hebdomadaire une belle frite belge !</p>
                <button class="btn-primary" onclick="window.openNewFritOrderModal()" style="width: 100%; height: 54px; background: #FFD60A; color: #000; font-size: 16px; font-weight:800; border-radius: 15px; border:none; box-shadow: 0 4px 12px rgba(255, 214, 10, 0.3);">
                    + Ajouter à ma commande
                </button>
                <button class="btn-secondary" onclick="window.renderColleaguesFritOrders()" style="width: 100%; height: 50px; background: rgba(142, 142, 147, 0.12); border: 1px solid ${subtleBorder}; color: ${textColor}; font-size: 14px; margin-top: 12px; border-radius: 12px; font-weight:600;">
                    👁️ Voir la commande de tout le monde
                </button>
                <a href="tel:0608811644" style="text-decoration:none; width: 100%; height: 50px; background: rgba(52, 199, 89, 0.12); border: 1px solid rgba(52, 199, 89, 0.2); color: #34C759; font-size: 14px; margin-top: 12px; border-radius: 12px; font-weight:600; display:flex; align-items:center; justify-content:center; gap:8px;">
                    📞 Appeler la friterie
                </a>
                <button class="btn-secondary" onclick="window.open('${config.api.workerUrl}/get/archives/Menu_le_temps_une_frite.jpg', '_blank')" style="width: 100%; height: 50px; background: rgba(88, 86, 214, 0.1); border: 1px solid rgba(88, 86, 214, 0.2); color: #5856D6; font-size: 14px; margin-top: 12px; border-radius: 12px; font-weight:600; display:flex; align-items:center; justify-content:center; gap:8px;">
                    📋 Voir la carte (Menu)
                </button>
                ${deleteAllBtn}
            </div>

            <div id="active-frit-orders" style="display: flex; flex-direction: column; gap: 12px;">
                <div style="color: #8E8E93; font-size: 13px; font-weight: 600; text-transform: uppercase; padding-left: 8px;">Ma commande actuelle</div>
                <div id="frit-order-list" style="color: #8E8E93; text-align: center; padding: 20px;">Chargement...</div>
            </div>
        </div>
    `;

    // Fetch and show current orders
    try {
        const response = await fetch(`${config.api.workerUrl}/friterie/order`, {
            headers: { 'Authorization': `Bearer ${(await auth.getSession()).access_token}` }
        });
        const orders = response.ok ? await response.json() : [];
        const orderList = document.getElementById('frit-order-list');

        if (!orders || orders.length === 0) {
            orderList.innerHTML = `<div style="background: ${cardBg}; border-radius: 15px; padding: 30px; border: 1px dashed ${subtleBorder}; color: #8E8E93; font-style: italic;">Aucun article dans votre commande</div>`;
        } else {
            orderList.innerHTML = orders.map(o => `
                <div style="background: ${cardBg}; border: 1px solid ${subtleBorder}; border-radius: 16px; padding: 16px; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: start; position: relative;">
                    <div style="text-align: left;">
                        <div style="color: ${textColor}; font-weight: 700; font-size: 15px;">${o.item_name}</div>
                        <div style="color: #8E8E93; font-size: 12px; margin-top: 4px;">
                            ${o.details ? `<span>${o.details}</span>` : ''}
                            ${o.sauce ? `<span style="display:block; color: #FF9500; font-weight:600;">Sauce: ${o.sauce}</span>` : ''}
                        </div>
                    </div>
                    <button onclick="window.deleteFritOrderItem(${o.id})" style="background: rgba(255, 59, 48, 0.1); color: #FF3B30; border: none; padding: 8px; border-radius: 10px;">
                        <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                    </button>
                </div>
            `).join('');
        }
    } catch (e) {
        document.getElementById('frit-order-list').innerHTML = `Erreur: ${e.message}`;
    }
}

window.renderColleaguesFritOrders = async function () {
    const container = document.getElementById('list-content');
    const dk = document.documentElement.getAttribute('data-theme') === 'dark';
    const cardBg = dk ? '#1C1C1E' : '#fff';
    const textColor = dk ? '#FFFFFF' : '#1c1c1e';
    const subtleBorder = dk ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)';

    container.innerHTML = `
        <div style="padding: 16px; display: flex; flex-direction: column; gap: 20px; padding-bottom: 100px;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px;">
                <h3 style="margin: 0; color: ${textColor};">Commande de tout le monde</h3>
                <button onclick="renderMobileFriterie()" style="background: rgba(142,142,147,0.2); border:none; padding: 8px 15px; border-radius: 10px; color: ${textColor}; font-size: 13px; font-weight:600;">Retour</button>
            </div>
            <div id="colleagues-order-list" style="text-align: center; color: #8E8E93; padding: 20px;">Chargement du récapitulatif...</div>
        </div>
    `;

    try {
        const response = await fetch(`${config.api.workerUrl}/friterie/all-orders`, {
            headers: { 'Authorization': `Bearer ${(await auth.getSession()).access_token}` }
        });
        const orders = response.ok ? await response.json() : [];
        const orderList = document.getElementById('colleagues-order-list');

        if (!orders || orders.length === 0) {
            orderList.innerHTML = `<div style="background: ${cardBg}; border-radius: 15px; padding: 40px; border: 1px dashed ${subtleBorder}; color: #8E8E93; font-style: italic;">Personne n'a encore commandé pour le moment.</div>`;
            return;
        }

        // Group by user
        const grouped = {};
        const session = await auth.getSession();
        window.currentUserId = session?.user?.id;

        orders.forEach(o => {
            let profile = o.profiles;
            // Handle both object and array response from Supabase Join
            if (Array.isArray(profile)) profile = profile[0];

            let userName = 'Inconnu';
            if (profile && (profile.first_name || profile.last_name)) {
                userName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
            } else if (o.user_id === window.currentUserId) {
                userName = "Moi (Ma commande)";
            } else {
                userName = "Utilisateur #" + (o.user_id ? o.user_id.substring(0, 5) : '???');
            }

            if (!grouped[userName]) grouped[userName] = [];
            grouped[userName].push(o);
        });

        let html = '';
        // Put "Moi" at the top
        const userNames = Object.keys(grouped).sort((a, b) => {
            if (a === "Moi (Ma commande)") return -1;
            if (b === "Moi (Ma commande)") return 1;
            return a.localeCompare(b);
        });

        userNames.forEach(name => {
            const userOrders = grouped[name];
            html += `
                <div style="background: ${cardBg}; border: 1px solid ${subtleBorder}; border-radius: 18px; padding: 16px; margin-bottom: 15px; text-align: left; box-shadow: 0 4px 10px rgba(0,0,0,0.02);">
                    <div style="color: ${textColor}; font-weight: 800; font-size: 16px; margin-bottom: 12px; border-bottom: 1px solid ${subtleBorder}; padding-bottom: 8px; display:flex; align-items:center; gap:8px;">
                        <span style="background: #FFD60A; color: #000; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items:center; justify-content:center; font-size: 14px;">${name.charAt(0)}</span>
                        ${name}
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 8px;">
                        ${userOrders.map(o => {
                const date = o.created_at ? new Date(o.created_at) : null;
                const timeStr = date ? `à ${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}` : '';
                return `
                                <div style="padding-left: 10px; border-left: 3px solid #FFD60A; position: relative;">
                                    <div style="color: ${textColor}; font-size: 14px; font-weight: 600;">
                                        ${o.item_name} ${o.details ? `<span style="font-weight:400; color:#8E8E93;">(${o.details})</span>` : ''}
                                        <span style="font-size: 11px; color: #8E8E93; font-weight: 400; float: right;">${timeStr}</span>
                                    </div>
                                    ${o.sauce ? `<div style="color: #FF9500; font-size: 12px; font-weight: 600; margin-top: 2px;">Sauce: ${o.sauce}</div>` : ''}
                                </div>
                            `;
            }).join('')}
                    </div>
                </div>
            `;
        });

        orderList.innerHTML = html;
        orderList.style.textAlign = 'initial';

    } catch (e) {
        document.getElementById('colleagues-order-list').innerHTML = `Erreur: ${e.message}`;
    }
}

window.openNewFritOrderModal = function () {
    const dk = document.documentElement.getAttribute('data-theme') === 'dark';
    const bg = dk ? '#1C1C1E' : '#FFFFFF';
    const textColor = dk ? '#FFFFFF' : '#1C1C1E';
    const inputBg = dk ? '#2C2C2E' : '#F2F2F7';

    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.style.zIndex = '10000';

    const sauces = [
        "Mayonnaise", "Ketchup", "Moutarde", "Hannibal", "Burger", "Aioli",
        "Brazil", "Barbecue belge", "Picalili", "Andalouse", "Américaine",
        "Hot mammouth", "Samurai"
    ];

    const burgers = [
        "Le Bicky", "Le classic", "Le Ch'ti", "Le montagnard", "Le biquette", "Le Crunchy", "Le burger du moment"
    ];

    const viandes = [
        "Fricadelle", "Boulette", "Poulycroc", "Mexicanos", "Cervelas",
        "Nugget (X4)", "Nugget (X6)", "Tender X3", "Cheese Cracks",
        "Brochette de poulet", "Steak"
    ];

    modal.innerHTML = `
        <div class="modal-box" style="width: 90%; max-width: 450px; background: ${bg}; border-radius: 28px; padding: 24px; box-shadow: 0 10px 40px rgba(0,0,0,0.5); overflow-y: auto; max-height: 85vh;">
            <h2 style="margin: 0 0 20px 0; font-size: 22px; color: ${textColor}; text-align: center;">Que voulez-vous ? 🍟</h2>
            
            <div id="frit-selection-area" style="display: flex; flex-direction: column; gap: 16px;">
                <!-- Catégorie Principal -->
                <div>
                    <label style="display:block; font-size:14px; font-weight:600; color:#8E8E93; margin-bottom: 8px;">Catégorie</label>
                    <select id="fo-cat" style="width:100%; height:50px; border-radius:12px; background:${inputBg}; color:${textColor}; border:none; padding:0 15px; font-size:16px;" onchange="updateFritChoices()">
                        <option value="burger">🍔 Burgers</option>
                        <option value="viande">🍗 Viandes</option>
                        <option value="frite">🍟 Frites</option>
                        <option value="sauce">🥫 Sauces Seules</option>
                    </select>
                </div>

                <!-- Sous-Choix (Burger ou Viande spécifique) -->
                <div id="sub-item-container">
                    <label style="display:block; font-size:14px; font-weight:600; color:#8E8E93; margin-bottom: 8px;">Choix</label>
                    <select id="fo-item" style="width:100%; height:50px; border-radius:12px; background:${inputBg}; color:${textColor}; border:none; padding:0 15px; font-size:16px;" onchange="updateFritSubOptions()">
                        <!-- Dynamic -->
                    </select>
                </div>

                <!-- Options Spécifiques (Mitraillette/Sandwich/Type) -->
                <div id="options-container">
                    <label style="display:block; font-size:14px; font-weight:600; color:#8E8E93; margin-bottom: 8px;">Préparation</label>
                    <div style="display:flex; gap:10px;" id="option-buttons-group">
                        <!-- Buttons added here -->
                    </div>
                </div>

                <!-- Sauce Selection -->
                <div id="sauce-container">
                    <label style="display:block; font-size:14px; font-weight:600; color:#8E8E93; margin-bottom: 8px;">Sauce</label>
                    <select id="fo-sauce" style="width:100%; height:50px; border-radius:12px; background:${inputBg}; color:${textColor}; border:none; padding:0 15px; font-size:16px;">
                        <option value="">Pas de sauce</option>
                        ${sauces.map(s => `<option value="${s}">${s}</option>`).join('')}
                    </select>
                </div>

                <!-- Crudités Option -->
                <div id="crudites-container" style="display: flex; align-items: center; gap: 8px;">
                    <input type="checkbox" id="fo-sans-crudites" style="width: 20px; height: 20px; accent-color: #FFD60A; cursor: pointer;">
                    <label for="fo-sans-crudites" style="font-size: 15px; font-weight: 600; color: ${textColor}; cursor: pointer;">Sans crudités 🥬</label>
                </div>
            </div>

            <div style="display: flex; gap: 12px; margin-top: 30px;">
                <button class="btn-secondary" style="flex:1;" onclick="this.closest('.modal-overlay').remove()">Annuler</button>
                <button id="submit-fo-btn" class="btn-primary" style="flex:1; background: #FFD60A; color:#000; font-weight:800;">Ajouter</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    let selectedOption = null;

    window.updateFritChoices = function () {
        const cat = document.getElementById('fo-cat').value;
        const subItem = document.getElementById('fo-item');
        const optContainer = document.getElementById('options-container');
        const sauceContainer = document.getElementById('sauce-container');
        const cruditesContainer = document.getElementById('crudites-container');
        const btnGroup = document.getElementById('option-buttons-group');

        btnGroup.innerHTML = '';
        selectedOption = null;

        if (cat === 'burger') {
            subItem.innerHTML = burgers.map(b => `<option value="${b}">${b}</option>`).join('');
            optContainer.style.display = 'block';
            sauceContainer.style.display = 'block';
            cruditesContainer.style.display = 'flex';
            addOptionButton("Burger", "Burger");
            addOptionButton("Mitraillette (pain frites)", "Mitraillette");
        } else if (cat === 'viande') {
            subItem.innerHTML = viandes.map(v => `<option value="${v}">${v}</option>`).join('');
            optContainer.style.display = 'block';
            sauceContainer.style.display = 'block';
            cruditesContainer.style.display = 'flex';
            updateFritSubOptions(); // Check for steak
        } else if (cat === 'frite') {
            subItem.innerHTML = '<option value="Moyennes frites">Moyennes frites</option><option value="Grande frites">Grande frites</option>';
            optContainer.style.display = 'none';
            sauceContainer.style.display = 'block';
            cruditesContainer.style.display = 'none';
        } else if (cat === 'sauce') {
            subItem.innerHTML = sauces.map(s => `<option value="${s}">${s}</option>`).join('');
            optContainer.style.display = 'none';
            sauceContainer.style.display = 'none';
            cruditesContainer.style.display = 'none';
        }
    };

    window.updateFritSubOptions = function () {
        const cat = document.getElementById('fo-cat').value;
        if (cat !== 'viande') return;
        const item = document.getElementById('fo-item').value;
        const btnGroup = document.getElementById('option-buttons-group');
        btnGroup.innerHTML = '';
        selectedOption = null;

        if (item === 'Steak') {
            addOptionButton("Seul", "Seul");
            addOptionButton("Sandwich", "Sandwich");
            addOptionButton("Mitraillette", "Mitraillette");
        } else {
            addOptionButton("Seule", "Seule");
            addOptionButton("Mitraillette", "Mitraillette");
        }
    };

    function addOptionButton(label, value) {
        const btn = document.createElement('button');
        btn.innerText = label;
        btn.style.flex = "1";
        btn.style.height = "44px";
        btn.style.borderRadius = "12px";
        btn.style.border = `1px solid ${dk ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`;
        btn.style.background = dk ? 'rgba(255,255,255,0.05)' : '#fff';
        btn.style.color = textColor;
        btn.style.fontSize = "14px";
        btn.onclick = () => {
            Array.from(btn.parentNode.children).forEach(b => {
                b.style.background = dk ? 'rgba(255,255,255,0.05)' : '#fff';
                b.style.borderColor = dk ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
                b.style.color = textColor;
            });
            btn.style.background = '#FFD60A';
            btn.style.borderColor = '#FFD60A';
            btn.style.color = '#000';
            selectedOption = value;
        };
        document.getElementById('option-buttons-group').appendChild(btn);
    }

    // Init
    updateFritChoices();

    document.getElementById('submit-fo-btn').onclick = async () => {
        const cat = document.getElementById('fo-cat').value;
        const item = document.getElementById('fo-item').value;
        const sauce = document.getElementById('fo-sauce').value;
        const btn = document.getElementById('submit-fo-btn');

        if ((cat === 'burger' || cat === 'viande') && !selectedOption) {
            alert("Veuillez choisir un mode (Burger/Mitraillette/Seul/...)");
            return;
        }

        btn.disabled = true;
        btn.innerText = "Ajout...";

        let details = selectedOption || '';
        if ((cat === 'burger' || cat === 'viande') && document.getElementById('fo-sans-crudites').checked) {
            details = details ? `${details} (sans crudités)` : 'sans crudités';
        }

        try {
            const session = await auth.getSession();
            const res = await fetch(`${config.api.workerUrl}/friterie/order`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({
                    item_name: item,
                    category: cat,
                    details: details,
                    sauce: sauce
                })
            });
            if (!res.ok) throw new Error(await res.text());

            modal.remove();
            renderMobileFriterie(); // Refresh
        } catch (e) {
            alert("Erreur: " + e.message);
            btn.disabled = false;
            btn.innerText = "Ajouter";
        }
    };
};

window.deleteFritOrderItem = async function (id) {
    if (!confirm("Supprimer cet article de votre commande ?")) return;
    try {
        const session = await auth.getSession();
        const res = await fetch(`${config.api.workerUrl}/friterie/order`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`
            },
            body: JSON.stringify({ id })
        });
        if (!res.ok) throw new Error(await res.text());
        renderMobileFriterie(); // Refresh
    } catch (e) {
        alert("Erreur: " + e.message);
    }
};

window.adminDeleteAllFritOrders = async function () {
    if (!confirm("⚠️ ACTION ADMINISTRATIVE : Voulez-vous vraiment effacer TOUTES les commandes de TOUT LE MONDE ? cette action est irréversible (prévu pour le nettoyage hebdomadaire).")) return;

    try {
        const session = await auth.getSession();
        const res = await fetch(`${config.api.workerUrl}/admin/friterie/orders`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${session.access_token}`
            }
        });
        if (!res.ok) throw new Error(await res.text());
        alert("Toutes les commandes ont été effacées.");
        renderMobileFriterie();
    } catch (e) {
        alert("Erreur: " + e.message);
    }
};
