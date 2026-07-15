import { api } from '../api.js';
import { auth } from '../auth.js';
import config from '../config.js';

window.renderMobileMaterialRequests = async function () {
    document.getElementById('categories-view').classList.add('hidden');
    document.getElementById('search-results-view').classList.add('hidden');
    const searchContainer = document.querySelector('.mobile-search-container');
    if (searchContainer) searchContainer.classList.add('hidden');
    document.getElementById('document-list').classList.remove('hidden');

    document.getElementById('selected-category-title').innerText = "Mon Matos";
    document.getElementById('mobile-upload-btn').style.display = 'none';

    window.mobileCurrentPath = "matos";

    const container = document.getElementById('list-content');
    const dk = document.documentElement.getAttribute('data-theme') === 'dark';
    const cardBg = dk ? '#1C1C1E' : '#fff';
    const textColor = dk ? '#FFFFFF' : '#1c1c1e';
    const subtleBorder = dk ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)';

    // 1. Render immediate Shell (Button first)
    container.innerHTML = `
        <div style="padding: 16px; padding-bottom: 100px;">
            <button class="btn-primary" onclick="window.openNewMaterialRequestModal()" 
                style="width: 100%; height: 56px; background: #174286; font-size: 16px; margin-bottom: 24px; border-radius: 16px; font-weight: 700; border: none; color: white; box-shadow: 0 8px 20px rgba(23, 66, 134, 0.25); display: flex; align-items: center; justify-content: center; gap: 10px; transition: all 0.2s;">
                <span style="font-size: 22px;">+</span> Nouvelle demande
            </button>
            <div id="matos-list-area">
                <div style="text-align:center; padding: 40px;">
                    <div class="loader-spinner"></div>
                    <div style="margin-top: 10px; color: #8E8E93; font-size: 14px;">Chargement de vos demandes...</div>
                </div>
            </div>
            <div style="margin-top: 20px;">
                <button id="matos-history-btn" onclick="window.openMaterialHistoryModal()" 
                    style="width: 100%; height: 50px; background: ${dk ? 'rgba(255,255,255,0.05)' : '#E5E5EA'}; color: ${textColor}; border-radius: 14px; border: none; font-weight: 600; font-size: 14px; display: none;">
                    📜 Voir l'historique complet
                </button>
            </div>
        </div>
    `;

    try {
        const session = await auth.getSession();
        // Fetch categories in parallel to save time
        const [requests, categories] = await Promise.all([
            api.getMaterialRequests(session.user.id),
            api.getMaterialCategories()
        ]);

        const listArea = document.getElementById('matos-list-area');
        let html = "";

        if (requests.length === 0) {
            html = `<div style="text-align:center; color:#8E8E93; padding: 40px;">Aucune demande de matériel</div>`;
        } else {
            // Group by status
            const groups = {
                'requested': { label: 'En attente', color: '#8E8E93', icon: '⏳' },
                'ordered': { label: 'Commandé', color: '#007AFF', icon: '📦' },
                'refused': { label: 'Refusé', color: '#FF3B30', icon: '❌' },
                'received': { label: 'Reçu / Acquitté', color: '#34C759', icon: '✅' }
            };

            const sortedKeys = ['requested', 'ordered'];

            sortedKeys.forEach(status => {
                const groupRequests = requests.filter(r => r.status === status);
                if (groupRequests.length > 0) {
                    html += `<h3 style="color: ${groups[status].color}; font-size: 14px; text-transform: uppercase; margin: 24px 0 12px 4px; display: flex; align-items: center; gap: 8px; font-weight: 700; letter-spacing: 0.5px;">
                            ${groups[status].icon} ${groups[status].label}
                        </h3>`;

                    groupRequests.forEach(req => {
                        const statusInfo = groups[req.status];
                        html += `
                        <div style="background: ${cardBg}; border: 1px solid ${subtleBorder}; border-radius: 20px; padding: 18px; margin-bottom: 16px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); position: relative; overflow: hidden;">
                            <div style="position: absolute; left: 0; top: 0; bottom: 0; width: 4px; background: ${statusInfo.color}; opacity: 0.8;"></div>
                            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                                <div>
                                    <div style="font-weight: 800; font-size: 18px; color: ${textColor}; line-height: 1.2;">${window.escapeHTML(req.material_name)}</div>
                                    <div style="font-size: 13px; color: #8E8E93; margin-top: 2px;">${window.escapeHTML(req.category || 'Non classé')}</div>
                                </div>
                                <div style="background: ${statusInfo.color}15; color: ${statusInfo.color}; padding: 4px 10px; border-radius: 10px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; display: flex; align-items: center; gap: 4px; white-space: nowrap;">
                                    ${statusInfo.icon} ${statusInfo.label}
                                </div>
                            </div>
                            
                            ${req.comment ? `
                                <div style="font-size: 14px; color: ${textColor}; background: ${dk ? 'rgba(255,255,255,0.03)' : '#f9f9fb'}; padding: 12px; border-radius: 14px; line-height: 1.5; margin-top: 10px; border: 1px solid ${subtleBorder};">
                                    ${window.escapeHTML(req.comment)}
                                </div>
                            ` : ''}
                            ${req.admin_comment ? `
                                <div style="font-size: 14px; color: #34C759; background: ${dk ? 'rgba(52, 199, 89, 0.05)' : '#f2fbf5'}; padding: 12px; border-radius: 14px; line-height: 1.5; margin-top: 8px; border: 1px solid rgba(52, 199, 89, 0.2);">
                                    <strong>Réponse Admin :</strong> ${window.escapeHTML(req.admin_comment)}
                                </div>
                            ` : ''}

                            <div style="margin-top: 12px; display: flex; justify-content: space-between; align-items: center;">
                                <div style="font-size: 12px; color: #8E8E93;">Demandé le ${new Date(req.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}</div>
                                ${req.image_path ? `
                                    <div style="width: 40px; height: 40px; border-radius: 8px; background: #eee; overflow: hidden; border: 1px solid ${subtleBorder};" onclick="window.openImageModal('${req.image_path}')">
                                        <img src="${api.getFileUrl(req.image_path)}" style="width: 100%; height: 100%; object-fit: cover;">
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                    `;
                    });
                }
            });
        }

        listArea.innerHTML = html || `<div style="text-align:center; color:#8E8E93; padding: 40px;">Aucune demande active</div>`;

        // Show history button
        const historyBtn = document.getElementById('matos-history-btn');
        if (historyBtn) historyBtn.style.display = 'block';

        window.openMaterialHistoryModal = async () => {
            const modal = document.createElement('div');
            modal.className = 'modal-overlay';
            modal.style.zIndex = "10000";

            modal.innerHTML = `
                <div class="modal-box" style="padding: 24px; border-radius: 28px; width: 95%; max-width: 450px; height: 80vh; display: flex; flex-direction: column;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                        <h2 style="margin: 0; color: ${textColor};">Historique Complet</h2>
                        <button onclick="this.closest('.modal-overlay').remove()" style="background: none; border: none; font-size: 24px; color: #8E8E93;">✕</button>
                    </div>
                    <div id="history-modal-content" style="flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 12px;">
                        <div style="text-align: center; padding: 40px;">
                            <div class="loader-spinner"></div>
                            <p style="color: #8E8E93; margin-top: 10px; font-size: 14px;">Récupération des archives...</p>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);

            try {
                const historyContent = document.getElementById('history-modal-content');
                const [session, archivedFiles] = await Promise.all([
                    auth.getSession(),
                    api.getArchivedMaterialRequests()
                ]);

                let fullHistory = [...requests]; // Start with active requests

                // Fetch and parse R2 archives
                if (archivedFiles && archivedFiles.length > 0) {
                    const archiveContents = await Promise.all(
                        archivedFiles.map(async f => {
                            try {
                                const r = await fetch(`${config.api.workerUrl}/get/${f.key}?t=${Date.now()}`);
                                if (!r.ok) return null;
                                return await r.text();
                            } catch (e) { return null; }
                        })
                    );

                    archiveContents.forEach(csv => {
                        if (!csv) return;
                        const lines = csv.split('\n').filter(l => l.trim());
                        if (lines.length <= 1) return;

                        const rows = lines.slice(1);
                        rows.forEach(row => {
                            // Simple CSV parse
                            const cols = row.split(',').map(c => c.replace(/^"|"$/g, '').trim());
                            if (cols.length < 8) return;

                            const rowUserId = cols[1];
                            // Only keep requests for current user
                            if (rowUserId === session.user.id) {
                                fullHistory.push({
                                    id: cols[0],
                                    material_name: cols[4],
                                    comment: cols[6],
                                    status: cols[7],
                                    created_at: cols[8]
                                });
                            }
                        });
                    });
                }

                // Sort by date desc
                fullHistory.sort((a, b) => new Date(b.created_at || b.date) - new Date(a.created_at || a.date));

                if (fullHistory.length === 0) {
                    historyContent.innerHTML = `<div style="text-align:center; color:#8E8E93; padding: 20px;">Aucun historique trouvé</div>`;
                } else {
                    let html = "";
                    fullHistory.forEach(req => {
                        const isDone = req.status === 'received';
                        const isRefused = req.status === 'refused';
                        let statusColor = '#8E8E93';
                        let statusLabel = req.status.toUpperCase();

                        if (isDone) { statusColor = '#34C759'; statusLabel = 'LIVRÉ'; }
                        else if (isRefused) { statusColor = '#FF3B30'; statusLabel = 'REFUSÉ'; }
                        else if (req.status === 'ordered') { statusColor = '#007AFF'; statusLabel = 'COMMANDÉ'; }
                        else if (req.status === 'requested') { statusColor = '#FF9500'; statusLabel = 'EN ATTENTE'; }

                        html += `
                            <div style="background: ${dk ? 'rgba(255,255,255,0.03)' : '#f9f9fb'}; border-radius: 16px; padding: 14px; border: 1px solid ${subtleBorder}; display: flex; justify-content: space-between; align-items: center;">
                                <div>
                                    <div style="font-weight: 700; color: ${textColor}; font-size: 15px;">${window.escapeHTML(req.material_name)}</div>
                                    <div style="font-size: 12px; color: #8E8E93;">${new Date(req.created_at || req.date).toLocaleDateString('fr-FR')}</div>
                                </div>
                                <div style="color: ${statusColor}; font-weight: 800; font-size: 12px; text-transform: uppercase;">
                                    ${statusLabel}
                                </div>
                            </div>
                        `;
                    });
                    historyContent.innerHTML = html;
                }
            } catch (e) {
                document.getElementById('history-modal-content').innerHTML = `<div style="color:red; text-align:center;">Erreur: ${e.message}</div>`;
            }
        };

        window.openNewMaterialRequestModal = () => {
            const _dk = document.documentElement.getAttribute('data-theme') === 'dark';
            const _inputBg = _dk ? '#2C2C2E' : '#f2f2f7';
            const _textColor = _dk ? '#FFFFFF' : '#000000';

            const modal = document.createElement('div');
            modal.className = 'modal-overlay';
            modal.style.zIndex = "10000";

            let categoryOptions = categories.map(c => `<option value="${c.name}">${c.name}</option>`).join('');

            modal.innerHTML = `
                <div class="modal-box" style="padding: 24px; border-radius: 28px; width: 90%; max-width: 400px;">
                    <h2 style="margin-top: 0; margin-bottom: 20px; color: ${_textColor};">Nouvelle demande</h2>
                    
                    <div style="margin-bottom: 16px;">
                        <label style="display: block; font-size: 14px; color: #8E8E93; margin-bottom: 6px; text-align: left;">Matériel désiré</label>
                        <input type="text" id="req-name" style="width: 100%; padding: 12px; border: none; border-radius: 12px; background: ${_inputBg}; color: ${_textColor}; font-size: 16px;" placeholder="Ex: Perceuse, Gants...">
                    </div>
                    
                    <div style="margin-bottom: 16px;">
                        <label style="display: block; font-size: 14px; color: #8E8E93; margin-bottom: 6px; text-align: left;">Catégorie</label>
                        <select id="req-category" style="width: 100%; padding: 12px; border: none; border-radius: 12px; background: ${_inputBg}; color: ${_textColor}; font-size: 16px;">
                            ${categoryOptions}
                        </select>
                    </div>

                    <div style="margin-bottom: 24px;">
                        <label style="display: block; font-size: 14px; color: #8E8E93; margin-bottom: 6px; text-align: left;">Commentaire / Pourquoi ?</label>
                        <textarea id="req-comment" style="width: 100%; padding: 12px; border: none; border-radius: 12px; background: ${_inputBg}; color: ${_textColor}; font-size: 16px; height: 100px; resize: none;" placeholder="Expliquez votre besoin..."></textarea>
                    </div>

                    <div style="margin-bottom: 24px;">
                        <label style="display: block; font-size: 14px; color: #8E8E93; margin-bottom: 6px; text-align: left;">Photo (Optionnel)</label>
                        <label id="photo-label" for="req-photo-input" style="display: flex; align-items: center; justify-content: center; gap: 10px; width: 100%; padding: 16px; border-radius: 16px; background: ${_inputBg}; color: ${_textColor}; text-align: center; border: 2px dashed rgba(255,255,255,0.1); cursor: pointer; transition: 0.3s; font-weight: 600;">
                            <span>📷 Prendre une photo</span>
                        </label>
                        <input type="file" id="req-photo-input" accept="image/*" capture="environment" style="display: none;" onchange="handleMaterialPhotoSelection(this)">
                    </div>

                    <div style="display: flex; gap: 12px; margin-top: 24px;">
                        <button class="btn-secondary" onclick="this.closest('.modal-overlay').remove()" style="flex: 1;">Annuler</button>
                        <button class="btn-primary" id="submit-req-btn" style="flex: 1; background: #174286;">Envoyer</button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);

            let selectedFile = null;
            window.handleMaterialPhotoSelection = (input) => {
                if (input.files && input.files[0]) {
                    selectedFile = input.files[0];
                    const label = document.getElementById('photo-label');
                    label.innerHTML = `<span>✅ ${selectedFile.name.substring(0, 20)}${selectedFile.name.length > 20 ? '...' : ''}</span>`;
                    label.style.borderColor = "#174286";
                    label.style.color = "#174286";
                    label.style.background = "rgba(23, 66, 134, 0.05)";
                }
            };

            document.getElementById('submit-req-btn').onclick = async () => {
                const name = document.getElementById('req-name').value.trim();
                const category = document.getElementById('req-category').value;
                const comment = document.getElementById('req-comment').value.trim();

                if (!name) {
                    alert("Veuillez indiquer le nom du matériel.");
                    return;
                }

                const btn = document.getElementById('submit-req-btn');
                btn.disabled = true;
                btn.innerText = "Envoi...";

                try {
                    let image_path = null;
                    if (selectedFile) {
                        btn.innerText = "Upload photo...";
                        const timestamp = Date.now();
                        const safeFileName = selectedFile.name.replace(/[^a-z0-9.]/gi, '_').toLowerCase();
                        const fileName = `${timestamp}_${safeFileName}`;
                        const renamedFile = new File([selectedFile], fileName, { type: selectedFile.type });

                        await api.uploadFile(renamedFile, 'material_requests/');
                        image_path = 'material_requests/' + fileName;
                    }

                    btn.innerText = "Création...";
                    await api.createMaterialRequest({
                        material_name: name,
                        category: category,
                        comment: comment,
                        image_path: image_path
                    });
                    modal.remove();
                    renderMobileMaterialRequests();
                } catch (e) {
                    alert("Erreur: " + e.message);
                    btn.disabled = false;
                    btn.innerText = "Envoyer";
                }
            };
        };

    } catch (e) {
        container.innerHTML = `<div style="color:red; margin:20px;">Erreur: ${e.message}</div>`;
    }
};

// Image Preview Modal
window.renderMobileMaterialTracking = async function () {
    document.getElementById('categories-view').classList.add('hidden');
    document.getElementById('search-results-view').classList.add('hidden');
    const searchContainer = document.querySelector('.mobile-search-container');
    if (searchContainer) searchContainer.classList.add('hidden');
    document.getElementById('document-list').classList.remove('hidden');

    document.getElementById('selected-category-title').innerText = "Suivi matériel ATS 🛠️";
    document.getElementById('mobile-upload-btn').style.display = 'none';

    window.mobileCurrentPath = "matos_tracking";

    const container = document.getElementById('list-content');
    const dk = document.documentElement.getAttribute('data-theme') === 'dark';
    const cardBg = dk ? '#1C1C1E' : '#fff';
    const textColor = dk ? '#FFFFFF' : '#1c1c1e';
    const subtleBorder = dk ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)';

    container.innerHTML = `
        <div style="padding: 16px;">
            <button onclick="openQrScanner()" style="width:100%; padding:14px; border-radius:14px; background:#5856D6; color:white; border:none; font-size:16px; font-weight:800; cursor:pointer; margin-bottom:16px; box-shadow:0 4px 12px rgba(88,86,214,0.3);">
                📷 Scanner un QR code
            </button>
            <div style="margin-bottom: 20px;">
                <input type="text" id="matos-search" placeholder="Rechercher un matériel..."
                    style="width: 100%; padding: 14px; border-radius: 12px; border: 1px solid ${subtleBorder}; background: ${cardBg}; color: ${textColor}; font-size: 15px;">
            </div>
            <div id="matos-list-container" style="display: flex; flex-direction: column; gap: 12px;">
                <div style="text-align: center; color: #8E8E93; padding: 40px;">Chargement...</div>
            </div>
        </div>
    `;

    try {
        const stock = await api.getMaterialStock();
        const listContainer = document.getElementById('matos-list-container');

        const renderList = (items) => {
            if (items.length === 0) {
                listContainer.innerHTML = `<div style="text-align: center; color: #8E8E93; padding: 40px;">Aucun matériel trouvé</div>`;
                return;
            }
            listContainer.innerHTML = items.map(item => `
                <div class="material-item-card" onclick="openMaterialDetailsModal('${item.id}')" 
                    style="background: ${cardBg}; border: 1px solid ${subtleBorder}; border-radius: 16px; padding: 16px; display: flex; align-items: center; gap: 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.02);">
                    <div style="background: #F2F2F7; width: 50px; height: 50px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 24px; overflow: hidden;">
                        ${item.photo_url ?
                    `<img src="${config.api.workerUrl}/get/${item.photo_url}" style="width: 100%; height: 100%; object-fit: cover;">` :
                    (item.type === 'Électroportatif' ? '🔌' : '🛠️')
                }
                    </div>
                    <div style="flex: 1;">
                        <div style="font-weight: 800; color: ${textColor}; font-size: 15px;">${item.designation || 'Sans nom'}</div>
                        ${item.reference_fournisseur ? `<div style="font-size: 11px; color: #8E8E93; margin-top: 2px;">Réf: ${item.reference_fournisseur}</div>` : ''}
                        <div style="display: flex; align-items: center; gap: 8px; margin-top: 4px; flex-wrap: wrap;">
                            <span style="color: #8E8E93; font-size: 12px;">Qté: <b>${item.stock_reel || 0}</b></span>
                            ${(item.nb_souhaite || 0) > (item.stock_reel || 0) ? `<span style="color: #FF3B30; font-size: 12px; font-weight: 700;">(manquant: ${item.nb_souhaite - item.stock_reel})</span>` : ''}
                            <span style="color: #8E8E93; font-size: 12px;">•</span>
                            <span style="color: #34C759; font-size: 12px; font-weight: 600;">${item.lieu_de_stockage || 'Non localisé'}</span>
                        </div>
                    </div>
                    <div style="color: #8E8E93;">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"></path></svg>
                    </div>
                </div>
            `).join('');
        };

        renderList(stock);

        document.getElementById('matos-search').addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            const filtered = stock.filter(i =>
                (i.designation || '').toLowerCase().includes(query) ||
                (i.reference_fournisseur && i.reference_fournisseur.toLowerCase().includes(query)) ||
                (i.qr_ref && i.qr_ref.toLowerCase().includes(query)) ||
                (i.fournisseur && i.fournisseur.toLowerCase().includes(query)) ||
                (i.lieu_de_stockage && i.lieu_de_stockage.toLowerCase().includes(query))
            );
            renderList(filtered);
        });

    } catch (e) {
        document.getElementById('matos-list-container').innerHTML = `<div style="color: red; text-align: center;">Erreur: ${e.message}</div>`;
    }
};

window.openMaterialDetailsModal = async function (id) {
    const dk = document.documentElement.getAttribute('data-theme') === 'dark';
    const bg = dk ? '#1C1C1E' : '#FFFFFF';
    const textColor = dk ? '#FFFFFF' : '#1C1C1E';
    const inputBg = dk ? '#2C2C2E' : '#F2F2F7';
    const subtleBorder = dk ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)';

    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.style.zIndex = '10000';
    modal.innerHTML = `<div class="modal-box" style="background: ${bg}; padding: 0; overflow: hidden; display: flex; flex-direction: column; max-height: 90vh; width: 90%; max-width: 400px; border-radius: 24px;">
        <div style="padding: 20px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid ${subtleBorder};">
            <div style="width: 32px;"></div>
            <h2 style="margin: 0; color: ${textColor}; font-size: 18px; text-align: center;">Détails Matériel</h2>
            <button id="edit-mode-btn" style="background: rgba(88, 86, 214, 0.1); color: #5856D6; border: none; width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
                ✏️
            </button>
        </div>
        <div id="material-details-content" style="padding: 20px; overflow-y: auto; flex: 1;">
            <div style="text-align: center; padding: 20px;">Chargement...</div>
        </div>
    </div>`;
    document.body.appendChild(modal);

    try {
        const stock = await api.getMaterialStock();
        const item = stock.find(i => i.id === id);
        if (!item) throw new Error("Matériel non trouvé");

        // Extract unique locations for the dropdown
        const locations = [...new Set(stock.map(s => s.lieu_de_stockage).filter(l => l && l.trim() !== ""))].sort();

        const detailsContent = document.getElementById('material-details-content');
        detailsContent.innerHTML = `
            <div style="display: flex; flex-direction: column; gap: 20px;">
                <div style="background: ${inputBg}; padding: 16px; border-radius: 16px; display: flex; gap: 16px; align-items: center;">
                    <div style="background: #F2F2F7; width: 70px; height: 70px; border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 32px; overflow: hidden; flex-shrink: 0;">
                        ${item.photo_url ?
                `<img src="${config.api.workerUrl}/get/${item.photo_url}" style="width: 100%; height: 100%; object-fit: cover;">` :
                (item.type === 'Électroportatif' ? '🔌' : '🛠️')
            }
                    </div>
                    <div style="flex: 1;">
                        <div style="font-size: 12px; color: #8E8E93; text-transform: uppercase; font-weight: 700; margin-bottom: 4px;">Matériel</div>
                        <div style="font-size: 16px; font-weight: 800; color: ${textColor};">${item.designation || 'Sans nom'}</div>
                    </div>
                </div>

                <div style="background: ${inputBg}; padding: 16px; border-radius: 16px;">
                    <div style="display: flex; flex-direction: column; gap: 4px;">
                        ${item.reference_fournisseur ? `<div style="font-size: 13px; color: #8E8E93;"><span style="font-weight: 700;">Réf:</span> ${item.reference_fournisseur}</div>` : ''}
                        ${item.fournisseur ? `<div style="font-size: 13px; color: #8E8E93;"><span style="font-weight: 700;">Fournisseur:</span> ${item.fournisseur}</div>` : ''}
                        ${item.type ? `<div style="font-size: 13px; color: #8E8E93;"><span style="font-weight: 700;">Catégorie:</span> ${item.type}</div>` : ''}
                    </div>
                    <div style="font-size: 13px; color: #34C759; margin-top: 12px; font-weight: 700;">Actuel : ${item.stock_reel || 0} unité(s) à ${item.lieu_de_stockage || 'Lieu inconnu'}</div>
                </div>

                <div>
                    <label style="display: block; font-size: 13px; font-weight: 700; color: #8E8E93; margin-bottom: 8px; text-transform: uppercase;">Nouvelle Quantité</label>
                    <input type="number" id="new-quantity" value="${item.stock_reel || 0}" 
                        style="width: 100%; padding: 16px; border-radius: 14px; border: 1px solid ${subtleBorder}; background: ${bg}; color: ${textColor}; font-size: 16px; font-weight: 600;">
                </div>

                <div>
                    <label style="display: block; font-size: 13px; font-weight: 700; color: #8E8E93; margin-bottom: 8px; text-transform: uppercase;">Nouvel Emplacement</label>
                    <select id="new-location-select" style="width: 100%; padding: 16px; border-radius: 14px; border: 1px solid ${subtleBorder}; background: ${bg}; color: ${textColor}; font-size: 16px; font-weight: 600; appearance: none; -webkit-appearance: none;">
                        <option value="">-- Sélectionner un lieu --</option>
                        ${locations.map(loc => `<option value="${loc}" ${loc === item.lieu_de_stockage ? 'selected' : ''}>${loc}</option>`).join('')}
                        <option value="NEW_LOC">+ Autre emplacement...</option>
                    </select>
                    <input type="text" id="custom-location" placeholder="Saisir le nouveau lieu..." 
                        style="width: 100%; padding: 16px; border-radius: 14px; border: 1px solid ${subtleBorder}; background: ${bg}; color: ${textColor}; font-size: 16px; margin-top: 8px; display: none;">
                </div>

                <div>
                    <label style="display: block; font-size: 13px; font-weight: 700; color: #8E8E93; margin-bottom: 8px; text-transform: uppercase;">Commentaire / Justification *</label>
                    <textarea id="edit-request-comment" placeholder="Expliquez la raison de cette modification..." required
                        style="width: 100%; height: 70px; padding: 16px; border-radius: 14px; border: 1px solid ${subtleBorder}; background: ${bg}; color: ${textColor}; font-size: 16px; resize: none;"></textarea>
                </div>

                <button id="submit-request-btn" class="btn-primary" 
                    style="width: 100%; height: 56px; border-radius: 16px; background: #5856D6; color: white; font-size: 16px; font-weight: 800; border: none; box-shadow: 0 4px 12px rgba(88, 86, 214, 0.3); margin-top: 10px;">
                    Faire une demande de modification
                </button>

                <div style="margin-top: 10px;">
                    <div style="font-size: 13px; font-weight: 700; color: #8E8E93; margin-bottom: 12px; text-transform: uppercase;">Historique</div>
                    <div id="material-history-list" style="display: flex; flex-direction: column; gap: 10px;"></div>
                </div>

                <button class="btn-secondary" style="width: 100%; height: 50px; border-radius: 14px; background: ${inputBg}; color: ${textColor}; border: none; font-weight: 700;" 
                    onclick="this.closest('.modal-overlay').remove()">Annuler</button>
            </div>
        `;

        window.loadMaterialHistory(id, 'material-history-list');

        const editBtn = document.getElementById('edit-mode-btn');
        let isEditMode = false;

        const toggleEditMode = async () => {
            isEditMode = !isEditMode;
            editBtn.style.background = isEditMode ? '#5856D6' : 'rgba(88, 86, 214, 0.1)';
            editBtn.style.color = isEditMode ? '#FFFFFF' : '#5856D6';

            if (isEditMode) {
                const categories = await api.getMaterialCategories();
                detailsContent.innerHTML = `
                    <div style="display: flex; flex-direction: column; gap: 16px;">
                        <div style="background: #174286; color: white; padding: 12px; border-radius: 12px; font-size: 13px; font-weight: 600; text-align: center;">
                            ⚠️ Mode modification intégrale activé. Les changements seront soumis à validation.
                        </div>
                        
                        <div>
                            <label style="display: block; font-size: 12px; font-weight: 700; color: #8E8E93; margin-bottom: 6px; text-transform: uppercase;">Désignation</label>
                            <input type="text" id="edit-designation" value="${item.designation || ''}" 
                                style="width: 100%; padding: 12px; border-radius: 10px; border: 1px solid ${subtleBorder}; background: ${inputBg}; color: ${textColor}; font-size: 15px;">
                        </div>

                        <div>
                            <label style="display: block; font-size: 12px; font-weight: 700; color: #8E8E93; margin-bottom: 6px; text-transform: uppercase;">Référence</label>
                            <input type="text" id="edit-reference" value="${item.reference_fournisseur || ''}" 
                                style="width: 100%; padding: 12px; border-radius: 10px; border: 1px solid ${subtleBorder}; background: ${inputBg}; color: ${textColor}; font-size: 15px;">
                        </div>

                        <div>
                            <label style="display: block; font-size: 12px; font-weight: 700; color: #8E8E93; margin-bottom: 6px; text-transform: uppercase;">Catégorie</label>
                            <select id="edit-type" style="width: 100%; padding: 12px; border-radius: 10px; border: 1px solid ${subtleBorder}; background: ${inputBg}; color: ${textColor}; font-size: 15px;">
                                ${categories.map(c => `<option value="${c.name}" ${c.name === item.type ? 'selected' : ''}>${c.name}</option>`).join('')}
                            </select>
                        </div>

                        <div style="margin-top: 8px; border-top: 1px solid ${subtleBorder}; padding-top: 16px;">
                            <label style="display: block; font-size: 12px; font-weight: 700; color: #8E8E93; margin-bottom: 6px; text-transform: uppercase;">Photo du matériel</label>
                            <div style="display: flex; gap: 12px; align-items: center;">
                                <div id="photo-preview-container" style="width: 80px; height: 80px; border-radius: 12px; border: 2px dashed ${subtleBorder}; display: flex; align-items: center; justify-content: center; overflow: hidden; background: ${bg};">
                                    ${item.photo_url ? `<img src="${config.api.workerUrl}/get/${item.photo_url}" style="width: 100%; height: 100%; object-fit: cover;">` : '📷'}
                                </div>
                                <button id="take-photo-btn" style="flex: 1; padding: 12px; border-radius: 10px; border: 1px solid ${subtleBorder}; background: ${inputBg}; color: ${textColor}; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;">
                                    <span>📸 Prendre / Choisir une photo</span>
                                </button>
                                <input type="file" id="photo-input" accept="image/*" capture="camera" style="display: none;">
                            </div>
                        </div>

                        <div style="margin-top: 8px; border-top: 1px solid ${subtleBorder}; padding-top: 16px;">
                            <label style="display: block; font-size: 12px; font-weight: 700; color: #8E8E93; margin-bottom: 6px; text-transform: uppercase;">Nouvelle Quantité</label>
                            <input type="number" id="new-quantity" value="${item.stock_reel || 0}" 
                                style="width: 100%; padding: 12px; border-radius: 10px; border: 1px solid ${subtleBorder}; background: ${inputBg}; color: ${textColor}; font-size: 15px;">
                        </div>

                        <div>
                            <label style="display: block; font-size: 12px; font-weight: 700; color: #8E8E93; margin-bottom: 6px; text-transform: uppercase;">Nouvel Emplacement</label>
                            <select id="new-location-select" style="width: 100%; padding: 12px; border-radius: 10px; border: 1px solid ${subtleBorder}; background: ${inputBg}; color: ${textColor}; font-size: 15px;">
                                <option value="">-- Sélectionner un lieu --</option>
                                ${locations.map(loc => `<option value="${loc}" ${loc === item.lieu_de_stockage ? 'selected' : ''}>${loc}</option>`).join('')}
                                <option value="NEW_LOC">+ Autre emplacement...</option>
                            </select>
                            <input type="text" id="custom-location" placeholder="Saisir le nouveau lieu..." 
                                style="width: 100%; padding: 12px; border-radius: 10px; border: 1px solid ${subtleBorder}; background: ${inputBg}; color: ${textColor}; font-size: 15px; margin-top: 8px; display: none;">
                        </div>

                        <div style="margin-top: 8px; border-top: 1px solid ${subtleBorder}; padding-top: 16px;">
                            <label style="display: block; font-size: 12px; font-weight: 700; color: #8E8E93; margin-bottom: 6px; text-transform: uppercase;">Commentaire / Justification *</label>
                            <textarea id="edit-request-comment" placeholder="Expliquez la raison de cette modification..." required
                                style="width: 100%; height: 70px; padding: 12px; border-radius: 10px; border: 1px solid ${subtleBorder}; background: ${inputBg}; color: ${textColor}; font-size: 15px; resize: none;"></textarea>
                        </div>

                        <button id="submit-request-btn" class="btn-primary" 
                            style="width: 100%; height: 50px; border-radius: 12px; background: #5856D6; color: white; font-size: 15px; font-weight: 800; border: none; margin-top: 10px;">
                            Soumettre toutes les modifications
                        </button>
                        
                        <button class="btn-secondary" style="width: 100%; height: 44px; border-radius: 12px; background: ${inputBg}; color: ${textColor}; border: none; font-weight: 700;" 
                            onclick="window.openMaterialDetailsModal('${id}')">Annuler</button>
                    </div>
                `;
            } else {
                window.openMaterialDetailsModal(id);
            }

            // Re-bind listeners for the new content
            if (isEditMode) {
                const locSelect = document.getElementById('new-location-select');
                const customLocInput = document.getElementById('custom-location');
                const photoInput = document.getElementById('photo-input');
                const takePhotoBtn = document.getElementById('take-photo-btn');
                const previewContainer = document.getElementById('photo-preview-container');
                let selectedPhotoFile = null;

                takePhotoBtn.onclick = () => photoInput.click();
                photoInput.onchange = (e) => {
                    const file = e.target.files[0];
                    if (file) {
                        selectedPhotoFile = file;
                        const reader = new FileReader();
                        reader.onload = (re) => {
                            previewContainer.innerHTML = `<img src="${re.target.result}" style="width: 100%; height: 100%; object-fit: cover;">`;
                        };
                        reader.readAsDataURL(file);
                    }
                };

                locSelect.addEventListener('change', () => {
                    customLocInput.style.display = locSelect.value === 'NEW_LOC' ? 'block' : 'none';
                });

                document.getElementById('submit-request-btn').onclick = async () => {
                    const comment = document.getElementById('edit-request-comment').value.trim();
                    if (!comment) return alert("Veuillez saisir un commentaire obligatoire.");

                    const newDesignation = document.getElementById('edit-designation').value.trim();
                    const newReference = document.getElementById('edit-reference').value.trim();
                    const newType = document.getElementById('edit-type').value;
                    const newQty = parseFloat(document.getElementById('new-quantity').value);
                    let newLoc = locSelect.value;
                    if (newLoc === 'NEW_LOC') newLoc = customLocInput.value.trim();

                    const extraFields = { comment };
                    if (newDesignation !== item.designation) extraFields.new_designation = newDesignation;
                    if (newReference !== item.reference_fournisseur) extraFields.new_reference_fournisseur = newReference;
                    if (newType !== item.type) extraFields.new_type = newType;

                    if (!selectedPhotoFile && Object.keys(extraFields).length === 1 && newQty === item.stock_reel && newLoc === item.lieu_de_stockage) {
                        return alert("Aucune modification détectée.");
                    }

                    const btn = document.getElementById('submit-request-btn');
                    btn.disabled = true;
                    btn.innerText = "Traitement en cours...";

                    try {
                        // 1. Upload photo if selected
                        if (selectedPhotoFile) {
                            btn.innerText = "Upload photo...";
                            const uploadRes = await api.uploadMaterialPhoto(id, selectedPhotoFile, true);
                            extraFields.new_photo_url = uploadRes.key;
                        }

                        btn.innerText = "Envoi de la demande...";
                        await api.submitMaterialStockRequest(id, newQty, newLoc, extraFields);
                        alert("Demande de modification envoyée avec succès !");
                        modal.remove();
                    } catch (e) {
                        alert("Erreur: " + e.message);
                        btn.disabled = false;
                        btn.innerText = "Soumettre toutes les modifications";
                    }
                };
            }
        };

        editBtn.onclick = toggleEditMode;

        const locSelect = document.getElementById('new-location-select');
        const customLocInput = document.getElementById('custom-location');
        locSelect.addEventListener('change', () => {
            customLocInput.style.display = locSelect.value === 'NEW_LOC' ? 'block' : 'none';
        });

        document.getElementById('submit-request-btn').onclick = async () => {
            const comment = document.getElementById('edit-request-comment').value.trim();
            if (!comment) return alert("Veuillez saisir un commentaire obligatoire.");

            const newQty = parseFloat(document.getElementById('new-quantity').value);
            let newLoc = locSelect.value;
            if (newLoc === 'NEW_LOC') newLoc = customLocInput.value.trim();

            if (newQty === item.stock_reel && newLoc === item.lieu_de_stockage) {
                return alert("Aucune modification détectée.");
            }
            if (!newLoc) return alert("Veuillez sélectionner un emplacement.");

            const btn = document.getElementById('submit-request-btn');
            btn.disabled = true;
            btn.innerText = "Envoi en cours...";

            try {
                await api.submitMaterialStockRequest(id, newQty, newLoc, { comment });
                alert("Demande envoyée aux administrateurs !");
                modal.remove();
            } catch (e) {
                alert("Erreur: " + e.message);
                btn.disabled = false;
                btn.innerText = "Faire une demande de modification";
            }
        };

    } catch (e) {
        document.getElementById('material-details-content').innerHTML = `<div style="color: red; text-align: center;">Erreur: ${e.message}</div>`;
    }
};

window.loadMaterialHistory = async function (materialId, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const dk = document.documentElement.getAttribute('data-theme') === 'dark';
    const textColor = dk ? '#FFFFFF' : '#1c1c1e';

    try {
        const logs = await api.getMaterialHistory(materialId);
        if (!logs || logs.length === 0) {
            container.innerHTML = `<div style="color: #8E8E93; font-size: 13px; text-align: center; padding: 10px;">Aucun historique disponible</div>`;
            return;
        }

        container.innerHTML = logs.map(log => {
            const date = new Date(log.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
            let userName = 'Système';
            if (log.profiles) {
                userName = `${log.profiles.first_name || ''} ${log.profiles.last_name || ''}`.trim() || 'Utilisateur inconnu';
            }
            return `
                <div style="padding: 12px; border-left: 3px solid #5856D6; background: rgba(88, 86, 214, 0.05); border-radius: 0 10px 10px 0;">
                    <div style="font-size: 11px; color: #8E8E93; font-weight: 600;">${date} • ${userName}</div>
                    <div style="font-size: 13px; color: ${textColor}; font-weight: 500; margin-top: 4px;">${log.details}</div>
                </div>
            `;
        }).join('');
    } catch (e) {
        container.innerHTML = `<div style="color: red; font-size: 12px;">Erreur historique: ${e.message}</div>`;
    }
};

// Ouvre la fiche d'un matériel à partir de sa référence QR
window.openMaterialByRef = async function (ref) {
    try {
        const stock = await api.getMaterialStock();
        const item = stock.find(i => i.qr_ref === ref);
        if (!item) {
            alert(`Matériel introuvable pour la référence : ${ref}`);
            return;
        }
        await window.renderMobileMaterialTracking();
        window.openMaterialDetailsModal(item.id);
    } catch (e) {
        alert('Erreur lors de la recherche du matériel : ' + e.message);
    }
};

window.openGTMaterialByRef = async function (ref) {
    try {
        const stock = window._mobileGTStock || await api.getMaterialGTStock();
        window._mobileGTStock = stock;
        const item = stock.find(i => i.qr_ref === ref);
        if (!item) {
            alert(`Pièce GT introuvable pour la référence : ${ref}`);
            return;
        }
        await window.renderMobileMaterialGTTracking();
        window.openMaterialGTDetailsModal(item.id);
    } catch (e) {
        alert('Erreur lors de la recherche GT : ' + e.message);
    }
};

window.openAspiMaterialByRef = async function (ref) {
    try {
        const stock = window._mobileAspiStock || await api.getMaterialAspiStock();
        window._mobileAspiStock = stock;
        const item = stock.find(i => i.qr_ref === ref);
        if (!item) {
            alert(`Pièce Aspi introuvable pour la référence : ${ref}`);
            return;
        }
        await window.renderMobileMaterialAspiTracking();
        window.openMaterialAspiDetailsModal(item.id);
    } catch (e) {
        alert('Erreur lors de la recherche Aspi : ' + e.message);
    }
};

window.openQrScanner = function () {
    if (typeof jsQR === 'undefined') {
        alert('Bibliothèque de scan non chargée.');
        return;
    }

    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:#000;z-index:999999;';
    overlay.innerHTML = `
        <video id="qr-video" style="width:100%;height:100%;object-fit:cover;" playsinline muted></video>
        <canvas id="qr-canvas" style="display:none;"></canvas>
        <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-60%);width:240px;height:240px;border:3px solid #5856D6;border-radius:20px;box-shadow:0 0 0 9999px rgba(0,0,0,0.55);pointer-events:none;"></div>
        <div style="position:absolute;top:calc(50% - 60px - 24px);left:50%;transform:translateX(-50%);color:white;font-size:15px;font-weight:700;text-shadow:0 1px 4px rgba(0,0,0,0.8);white-space:nowrap;">Pointez vers un QR code</div>
        <button id="qr-close-btn" style="position:absolute;bottom:50px;left:50%;transform:translateX(-50%);padding:14px 48px;background:#FF3B30;color:white;border:none;border-radius:16px;font-size:16px;font-weight:800;">Annuler</button>
    `;
    document.body.appendChild(overlay);

    const video = document.getElementById('qr-video');
    const canvas = document.getElementById('qr-canvas');
    const ctx = canvas.getContext('2d');
    let scanning = true;
    let stream = null;

    const stop = () => {
        scanning = false;
        if (stream) stream.getTracks().forEach(t => t.stop());
        overlay.remove();
    };

    document.getElementById('qr-close-btn').onclick = stop;

    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
        .then(s => {
            stream = s;
            video.srcObject = s;
            video.play();
            requestAnimationFrame(tick);
        })
        .catch(err => {
            stop();
            alert('Impossible d\'accéder à la caméra : ' + err.message);
        });

    function tick() {
        if (!scanning) return;
        if (video.readyState === video.HAVE_ENOUGH_DATA) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: 'dontInvert' });
            if (code) {
                stop();
                const matchUrl = code.data.match(/[?&]ref=([^&]+)/);
                const matchRaw = code.data.match(/PCH01\d{4}/) || code.data.match(/PCH02\d{4}/) || code.data.match(/PCH03\d{4}/);
                const ref = matchUrl ? decodeURIComponent(matchUrl[1]) : (matchRaw ? matchRaw[0] : code.data);
                if (ref.startsWith('PCH01')) {
                    window.openMaterialByRef(ref);
                } else if (ref.startsWith('PCH02')) {
                    window.openGTMaterialByRef(ref);
                } else if (ref.startsWith('PCH03')) {
                    window.openAspiMaterialByRef(ref);
                } else {
                    window.openMaterialByRef(ref);
                }
                return;
            }
        }
        requestAnimationFrame(tick);
    }
};

window.renderMobileMaterialGTTracking = async function () {
    document.getElementById('categories-view').classList.add('hidden');
    document.getElementById('search-results-view').classList.add('hidden');
    const searchContainer = document.querySelector('.mobile-search-container');
    if (searchContainer) searchContainer.classList.add('hidden');
    document.getElementById('document-list').classList.remove('hidden');

    document.getElementById('selected-category-title').innerText = 'Stock GT 🗄️';
    document.getElementById('mobile-upload-btn').style.display = 'none';

    window.mobileCurrentPath = 'matos_gt_tracking';

    const container = document.getElementById('list-content');
    const dk = document.documentElement.getAttribute('data-theme') === 'dark';
    const cardBg = dk ? '#1C1C1E' : '#fff';
    const textColor = dk ? '#FFFFFF' : '#1c1c1e';
    const subtleBorder = dk ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)';

    const GT_COMPAT = ['t1', 't2', 'v1', 'v2', 'v3', 'v4', 'v5'];

    container.innerHTML = `
        <div style="padding: 16px;">
            <button onclick="openGTQrScanner()" style="width:100%; padding:14px; border-radius:14px; background:linear-gradient(135deg,#5856D6,#3634A3); color:white; border:none; font-size:16px; font-weight:800; cursor:pointer; margin-bottom:16px; box-shadow:0 4px 12px rgba(88,86,214,0.35);">
                📷 Scanner un QR code GT
            </button>
            <div style="display:flex; gap:10px; margin-bottom:16px;">
                <div style="flex:1; position:relative;">
                    <input type="text" id="matos-gt-search" placeholder="Rechercher..."
                        style="width:100%; padding:14px; border-radius:12px; border:1px solid ${subtleBorder}; background:${cardBg}; color:${textColor}; font-size:15px;">
                </div>
                <select id="matos-gt-compat-filter" style="padding:0 12px; border-radius:12px; border:1px solid ${subtleBorder}; background:${cardBg}; color:${textColor}; font-size:14px; font-weight:700; min-width:90px;">
                    <option value="">Compat.</option>
                    <option value="t1">T1</option>
                    <option value="t2">T2</option>
                    <option value="v1">V1</option>
                    <option value="v2">V2</option>
                    <option value="v3">V3</option>
                    <option value="v4">V4</option>
                    <option value="v5">V5</option>
                </select>
            </div>
            <div id="matos-gt-list-container" style="display:flex; flex-direction:column; gap:12px;">
                <div style="text-align:center; color:#8E8E93; padding:40px;">Chargement...</div>
            </div>
        </div>
    `;

    try {
        const stock = await api.getMaterialGTStock();
        window._mobileGTStock = stock;
        const listContainer = document.getElementById('matos-gt-list-container');

        const renderList = (items) => {
            if (items.length === 0) {
                listContainer.innerHTML = `<div style="text-align:center; color:#8E8E93; padding:40px;">Aucune pièce trouvée</div>`;
                return;
            }
            listContainer.innerHTML = items.map(item => {
                const compatBadges = GT_COMPAT
                    .filter(k => item[k])
                    .map(k => `<span style="font-size:9px; color:#5856D6; background:rgba(88,86,214,0.1); padding:2px 6px; border-radius:4px; font-weight:800; border:1px solid rgba(88,86,214,0.2);">${k.toUpperCase()}</span>`)
                    .join('');
                return `
                    <div onclick="openMaterialGTDetailsModal('${item.id}')"
                        style="background:${cardBg}; border:1px solid ${subtleBorder}; border-radius:16px; padding:16px; display:flex; align-items:center; gap:14px; box-shadow:0 2px 8px rgba(0,0,0,0.04); cursor:pointer; position:relative; overflow:hidden;">
                        <div style="background:rgba(88,86,214,0.1); width:50px; height:50px; border-radius:12px; display:flex; align-items:center; justify-content:center; font-size:22px; overflow:hidden; flex-shrink:0;">
                            ${item.photo_url ? `<img src="${config.api.workerUrl}/get/${item.photo_url}" style="width:100%; height:100%; object-fit:cover;">` : '⚙️'}
                        </div>
                        <div style="flex:1; min-width:0;">
                            <div style="font-weight:800; color:${textColor}; font-size:15px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${item.designation || 'Sans nom'}</div>
                            <div style="display:flex; gap:6px; margin-top:4px; flex-wrap:wrap;">
                                ${item.qr_ref ? `<span style="font-size:10px; color:#174286; font-family:monospace; font-weight:800;">${item.qr_ref}</span>` : ''}
                                <span style="color:#8E8E93; font-size:12px;">Qté: <b style="color:#5856D6;">${item.quantite || '0'}</b></span>
                                ${item.lieu_de_stockage ? `<span style="color:#34C759; font-size:12px; font-weight:600;">📍${item.lieu_de_stockage}</span>` : ''}
                            </div>
                            ${compatBadges ? `<div style="display:flex; gap:4px; margin-top:6px; flex-wrap:wrap;">${compatBadges}</div>` : ''}
                        </div>
                        <div style="color:#8E8E93; flex-shrink:0;">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"></path></svg>
                        </div>
                        <div style="position:absolute; left:0; top:0; width:3px; height:100%; background:linear-gradient(135deg,#5856D6,#3634A3);"></div>
                    </div>
                `;
            }).join('');
        };

        renderList(stock);

        const searchInput = document.getElementById('matos-gt-search');
        const compatFilter = document.getElementById('matos-gt-compat-filter');

        const handleFilter = () => {
            const query = searchInput.value.toLowerCase();
            const compat = compatFilter.value;
            const filtered = stock.filter(i =>
                (!query ||
                    (i.designation || '').toLowerCase().includes(query) ||
                    (i.ref || '').toLowerCase().includes(query) ||
                    (i.qr_ref || '').toLowerCase().includes(query) ||
                    (i.lieu_de_stockage || '').toLowerCase().includes(query)) &&
                (!compat || i[compat] === true)
            );
            renderList(filtered);
        };

        searchInput.addEventListener('input', handleFilter);
        compatFilter.addEventListener('change', handleFilter);

    } catch (e) {
        document.getElementById('matos-gt-list-container').innerHTML =
            `<div style="color:red; text-align:center;">Erreur: ${e.message}</div>`;
    }
};

window.openMaterialGTDetailsModal = async function (id) {
    const dk = document.documentElement.getAttribute('data-theme') === 'dark';
    const bg = dk ? '#1C1C1E' : '#FFFFFF';
    const textColor = dk ? '#FFFFFF' : '#1C1C1E';
    const inputBg = dk ? '#2C2C2E' : '#F2F2F7';
    const subtleBorder = dk ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)';

    const GT_COMPAT = ['t1', 't2', 'v1', 'v2', 'v3', 'v4', 'v5'];

    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.style.zIndex = '10000';
    modal.innerHTML = `<div class="modal-box" style="background:${bg}; padding:0; overflow:hidden; display:flex; flex-direction:column; max-height:90vh; width:90%; max-width:420px; border-radius:24px;">
        <div style="padding:20px; display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid ${subtleBorder};">
            <button onclick="this.closest('.modal-overlay').remove()" style="background:none; border:none; color:#8E8E93; font-size:22px; cursor:pointer;">←</button>
            <h2 style="margin:0; color:${textColor}; font-size:18px; text-align:center;">Détails Pièce GT</h2>
            <button id="gt-edit-mode-btn" style="background:rgba(88,86,214,0.1); color:#5856D6; border:none; width:34px; height:34px; border-radius:10px; display:flex; align-items:center; justify-content:center; cursor:pointer; font-size:16px;">✏️</button>
        </div>
        <div id="gt-details-content" style="padding:20px; overflow-y:auto; flex:1;">
            <div style="text-align:center; padding:30px; color:#8E8E93;">Chargement...</div>
        </div>
    </div>`;
    document.body.appendChild(modal);

    try {
        const stock = window._mobileGTStock || await api.getMaterialGTStock();
        const item = stock.find(i => i.id === id);
        if (!item) throw new Error('Pièce introuvable');

        const locations = [...new Set(stock.map(s => s.lieu_de_stockage).filter(Boolean))].sort();

        const compatBadges = GT_COMPAT
            .filter(k => item[k])
            .map(k => `<span style="font-size:12px; color:#5856D6; background:rgba(88,86,214,0.1); padding:4px 10px; border-radius:8px; font-weight:800; border:1px solid rgba(88,86,214,0.2);">${k.toUpperCase()}</span>`)
            .join('');

        const content = document.getElementById('gt-details-content');
        content.innerHTML = `
            <div style="display:flex; flex-direction:column; gap:18px;">

                <!-- Photo & Header -->
                <div style="background:${inputBg}; padding:16px; border-radius:16px; display:flex; gap:16px; align-items:center;">
                    <div style="background:rgba(88,86,214,0.1); width:72px; height:72px; border-radius:14px; display:flex; align-items:center; justify-content:center; font-size:32px; overflow:hidden; flex-shrink:0;">
                        ${item.photo_url ? `<img src="${config.api.workerUrl}/get/${item.photo_url}" style="width:100%; height:100%; object-fit:cover;">` : '⚙️'}
                    </div>
                    <div style="flex:1;">
                        <div style="font-size:12px; color:#8E8E93; font-weight:700; text-transform:uppercase; margin-bottom:4px;">Pièce GT</div>
                        <div style="font-size:17px; font-weight:800; color:${textColor}; line-height:1.3;">${item.designation || 'Sans nom'}</div>
                        ${item.qr_ref ? `<div style="font-size:11px; color:#174286; font-family:monospace; font-weight:800; margin-top:4px;">${item.qr_ref}</div>` : ''}
                    </div>
                </div>

                <!-- Infos -->
                <div style="background:${inputBg}; padding:16px; border-radius:16px; display:flex; flex-direction:column; gap:8px;">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <span style="font-size:13px; color:#8E8E93; font-weight:700;">Quantité</span>
                        <span style="font-size:18px; font-weight:900; color:#5856D6;">${item.quantite || '0'}</span>
                    </div>
                    <div style="height:1px; background:${subtleBorder};"></div>
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <span style="font-size:13px; color:#8E8E93; font-weight:700;">Lieu de stockage</span>
                        <span style="font-size:13px; font-weight:600; color:#34C759;">${item.lieu_de_stockage || 'Non défini'}</span>
                    </div>
                    ${item.ref ? `
                    <div style="height:1px; background:${subtleBorder};"></div>
                    <div>
                        <div style="font-size:12px; color:#8E8E93; font-weight:700; text-transform:uppercase; margin-bottom:4px;">Référence fournisseur</div>
                        <div style="font-size:12px; color:${textColor}; font-family:monospace; white-space:pre-wrap;">${item.ref}</div>
                    </div>` : ''}
                </div>

                <!-- Compatibility -->
                ${compatBadges ? `
                <div>
                    <div style="font-size:12px; color:#8E8E93; font-weight:700; text-transform:uppercase; margin-bottom:8px;">Compatibilité</div>
                    <div style="display:flex; flex-wrap:wrap; gap:8px;">${compatBadges}</div>
                </div>` : ''}

                <!-- Modification Form -->
                <div style="border-top:1px solid ${subtleBorder}; padding-top:16px;">
                    <div style="font-size:13px; font-weight:700; color:#8E8E93; margin-bottom:10px; text-transform:uppercase;">Demande de modification</div>

                    <label style="display:block; font-size:12px; font-weight:700; color:#8E8E93; margin-bottom:6px; text-transform:uppercase;">Nouvelle Quantité</label>
                    <input type="text" id="gt-new-qty" value="${item.quantite || '0'}"
                        style="width:100%; padding:14px; border-radius:12px; border:1px solid ${subtleBorder}; background:${bg}; color:${textColor}; font-size:16px; font-weight:600; margin-bottom:12px;">

                    <label style="display:block; font-size:12px; font-weight:700; color:#8E8E93; margin-bottom:6px; text-transform:uppercase;">Nouvel Emplacement</label>
                    <select id="gt-new-loc-select" style="width:100%; padding:14px; border-radius:12px; border:1px solid ${subtleBorder}; background:${bg}; color:${textColor}; font-size:16px; font-weight:600; appearance:none; -webkit-appearance:none; margin-bottom:6px;">
                        <option value="">-- Sélectionner --</option>
                        ${locations.map(loc => `<option value="${loc}" ${loc === item.lieu_de_stockage ? 'selected' : ''}>${loc}</option>`).join('')}
                        <option value="NEW_LOC">+ Autre emplacement...</option>
                    </select>
                    <input type="text" id="gt-custom-loc" placeholder="Saisir le nouveau lieu..."
                        style="width:100%; padding:14px; border-radius:12px; border:1px solid ${subtleBorder}; background:${bg}; color:${textColor}; font-size:16px; margin-bottom:12px; display:none;">

                    <!-- Photo -->
                    <label style="display:block; font-size:12px; font-weight:700; color:#8E8E93; margin-bottom:6px; text-transform:uppercase;">Photo (optionnel)</label>
                    <div style="display:flex; gap:10px; align-items:center; margin-bottom:16px;">
                        <div id="gt-photo-preview" style="width:60px; height:60px; border-radius:10px; border:2px dashed ${subtleBorder}; display:flex; align-items:center; justify-content:center; overflow:hidden; background:${bg}; font-size:22px;">
                            ${item.photo_url ? `<img src="${config.api.workerUrl}/get/${item.photo_url}" style="width:100%; height:100%; object-fit:cover;">` : '📷'}
                        </div>
                        <button id="gt-take-photo-btn" style="flex:1; padding:12px; border-radius:10px; border:1px solid ${subtleBorder}; background:${inputBg}; color:${textColor}; font-weight:700; cursor:pointer;">
                            📸 Prendre / Choisir une photo
                        </button>
                        <input type="file" id="gt-photo-input" accept="image/*" capture="camera" style="display:none;">
                    </div>

                    <!-- Comment -->
                    <label style="display:block; font-size:12px; font-weight:700; color:#8E8E93; margin-bottom:6px; text-transform:uppercase;">Commentaire / Justification *</label>
                    <textarea id="gt-request-comment" placeholder="Expliquez la raison de cette modification..." required
                        style="width:100%; height:70px; padding:14px; border-radius:12px; border:1px solid ${subtleBorder}; background:${bg}; color:${textColor}; font-size:16px; resize:none; margin-bottom:12px;"></textarea>

                    <button id="gt-submit-request-btn" class="btn-primary"
                        style="width:100%; height:54px; border-radius:14px; background:linear-gradient(135deg,#5856D6,#3634A3); color:white; font-size:16px; font-weight:800; border:none; box-shadow:0 4px 12px rgba(88,86,214,0.3);">
                        Envoyer la demande de modification
                    </button>
                </div>

                <!-- History -->
                <div>
                    <div style="font-size:12px; font-weight:700; color:#8E8E93; margin-bottom:10px; text-transform:uppercase;">📋 Historique</div>
                    <div id="gt-history-mobile" style="display:flex; flex-direction:column; gap:8px;">
                        <div style="color:#8E8E93; text-align:center; font-size:13px; padding:10px;">Chargement...</div>
                    </div>
                </div>

                <button style="width:100%; height:48px; border-radius:14px; background:${inputBg}; color:${textColor}; border:none; font-weight:700; cursor:pointer;" onclick="this.closest('.modal-overlay').remove()">Fermer</button>
            </div>
        `;

        // Load history
        window.loadMaterialGTHistoryMobile(id, 'gt-history-mobile');

        // Edit mode button (toggles to full edit)
        document.getElementById('gt-edit-mode-btn').onclick = () => {
            window.openMaterialGTDetailsModal(id);
        };

        // Location select
        const locSelect = document.getElementById('gt-new-loc-select');
        const customLoc = document.getElementById('gt-custom-loc');
        locSelect.addEventListener('change', () => {
            customLoc.style.display = locSelect.value === 'NEW_LOC' ? 'block' : 'none';
        });

        // Photo
        let selectedPhotoFile = null;
        document.getElementById('gt-take-photo-btn').onclick = () => document.getElementById('gt-photo-input').click();
        document.getElementById('gt-photo-input').onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                selectedPhotoFile = file;
                const reader = new FileReader();
                reader.onload = (re) => {
                    document.getElementById('gt-photo-preview').innerHTML =
                        `<img src="${re.target.result}" style="width:100%; height:100%; object-fit:cover;">`;
                };
                reader.readAsDataURL(file);
            }
        };

        // Submit
        document.getElementById('gt-submit-request-btn').onclick = async () => {
            const comment = document.getElementById('gt-request-comment').value.trim();
            if (!comment) return alert("Veuillez saisir un commentaire obligatoire.");

            const newQty = document.getElementById('gt-new-qty').value.trim();
            let newLoc = locSelect.value;
            if (newLoc === 'NEW_LOC') newLoc = customLoc.value.trim();

            if (newQty === (item.quantite || '0') && newLoc === item.lieu_de_stockage && !selectedPhotoFile) {
                return alert('Aucune modification détectée.');
            }
            if (!newLoc) return alert('Veuillez sélectionner un emplacement.');

            const btn = document.getElementById('gt-submit-request-btn');
            btn.disabled = true;
            btn.innerText = 'Envoi en cours...';

            try {
                const payload = {
                    new_quantite: newQty,
                    new_lieu_de_stockage: newLoc,
                    comment: comment
                };

                if (selectedPhotoFile) {
                    btn.innerText = 'Upload photo...';
                    const uploadRes = await api.uploadMaterialGTPhoto(id, selectedPhotoFile, true);
                    payload.new_photo_url = uploadRes.key;
                }

                btn.innerText = 'Envoi de la demande...';
                await api.submitMaterialGTStockRequest(id, payload);
                alert('Demande envoyée aux administrateurs !');
                modal.remove();
            } catch (e) {
                alert('Erreur: ' + e.message);
                btn.disabled = false;
                btn.innerText = 'Envoyer la demande de modification';
            }
        };

    } catch (e) {
        document.getElementById('gt-details-content').innerHTML =
            `<div style="color:red; text-align:center; padding:20px;">Erreur: ${e.message}</div>`;
    }
};

window.openGTQrScanner = function () {
    if (typeof jsQR === 'undefined') {
        alert('Bibliothèque de scan non chargée.');
        return;
    }

    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:#000;z-index:999999;';
    overlay.innerHTML = `
        <video id="gt-qr-video" style="width:100%;height:100%;object-fit:cover;" playsinline muted></video>
        <canvas id="gt-qr-canvas" style="display:none;"></canvas>
        <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-60%);width:240px;height:240px;border:3px solid #5856D6;border-radius:20px;box-shadow:0 0 0 9999px rgba(0,0,0,0.55);pointer-events:none;"></div>
        <div style="position:absolute;top:calc(50% - 60px - 24px);left:50%;transform:translateX(-50%);color:white;font-size:15px;font-weight:700;text-shadow:0 1px 4px rgba(0,0,0,0.8);white-space:nowrap;">Pointez vers un QR code GT</div>
        <button id="gt-qr-close-btn" style="position:absolute;bottom:50px;left:50%;transform:translateX(-50%);padding:14px 48px;background:#FF3B30;color:white;border:none;border-radius:16px;font-size:16px;font-weight:800;">Annuler</button>
    `;
    document.body.appendChild(overlay);

    const video = document.getElementById('gt-qr-video');
    const canvas = document.getElementById('gt-qr-canvas');
    const ctx = canvas.getContext('2d');
    let scanning = true;
    let stream = null;

    const stop = () => {
        scanning = false;
        if (stream) stream.getTracks().forEach(t => t.stop());
        overlay.remove();
    };

    document.getElementById('gt-qr-close-btn').onclick = stop;

    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
        .then(s => {
            stream = s;
            video.srcObject = s;
            video.play();
            requestAnimationFrame(tick);
        })
        .catch(err => {
            stop();
            alert("Impossible d'accéder à la caméra : " + err.message);
        });

    function tick() {
        if (!scanning) return;
        if (video.readyState === video.HAVE_ENOUGH_DATA) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: 'dontInvert' });
            if (code) {
                stop();
                const matchUrl = code.data.match(/[?&]ref=([^&]+)/);
                const matchRaw = code.data.match(/PCH01\d{4}/) || code.data.match(/PCH02\d{4}/) || code.data.match(/PCH03\d{4}/);
                const ref = matchUrl ? decodeURIComponent(matchUrl[1]) : (matchRaw ? matchRaw[0] : code.data);
                if (ref.startsWith('PCH01')) {
                    window.openMaterialByRef(ref);
                } else if (ref.startsWith('PCH02')) {
                    window.openGTMaterialByRef(ref);
                } else if (ref.startsWith('PCH03')) {
                    window.openAspiMaterialByRef(ref);
                } else {
                    alert('QR code non reconnu : ' + code.data);
                }
                return;
            }
        }
        requestAnimationFrame(tick);
    }
};


window.renderMobileMaterialAspiTracking = async function () {
    document.getElementById('categories-view').classList.add('hidden');
    document.getElementById('search-results-view').classList.add('hidden');
    const searchContainer = document.querySelector('.mobile-search-container');
    if (searchContainer) searchContainer.classList.add('hidden');
    document.getElementById('document-list').classList.remove('hidden');

    document.getElementById('selected-category-title').innerText = 'Stock Aspi 🧹';
    document.getElementById('mobile-upload-btn').style.display = 'none';

    window.mobileCurrentPath = 'matos_aspi_tracking';

    const container = document.getElementById('list-content');
    const dk = document.documentElement.getAttribute('data-theme') === 'dark';
    const cardBg = dk ? '#1C1C1E' : '#fff';
    const textColor = dk ? '#FFFFFF' : '#1c1c1e';
    const subtleBorder = dk ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)';

    const ASPI_COMPAT = ['aspi_h13', 'aspi_hz390', 'aspi_hzd900'];
    const COMPAT_LABELS = {
        'aspi_h13': 'H13 HZ200/HZ200',
        'aspi_hz390': 'HZ 390S-2 / HZ 390S',
        'aspi_hzd900': 'HZD 900 / HZDQ900'
    };

    container.innerHTML = `
        <div style="padding: 16px;">
            <button onclick="openAspiQrScanner()" style="width:100%; padding:14px; border-radius:14px; background: #174286; color:white; border:none; font-size:16px; font-weight:800; cursor:pointer; margin-bottom:16px; box-shadow:0 4px 12px rgba(23,66,134,0.35);">
                📷 Scanner un QR code Aspi
            </button>
            <div style="display:flex; gap:10px; margin-bottom:16px;">
                <div style="flex:1; position:relative;">
                    <input type="text" id="matos-aspi-search" placeholder="Rechercher..."
                        style="width:100%; padding:14px; border-radius:12px; border:1px solid ${subtleBorder}; background:${cardBg}; color:${textColor}; font-size:15px;">
                </div>
                <select id="matos-aspi-compat-filter" style="padding:0 12px; border-radius:12px; border:1px solid ${subtleBorder}; background:${cardBg}; color:${textColor}; font-size:14px; font-weight:700; min-width:90px;">
                    <option value="">Compat.</option>
                    <option value="aspi_h13">H13 HZ200/HZ200</option>
                    <option value="aspi_hz390">HZ 390S-2 / HZ 390S</option>
                    <option value="aspi_hzd900">HZD 900 / HZDQ900</option>
                </select>
            </div>
            <div id="matos-aspi-list-container" style="display:flex; flex-direction:column; gap:12px;">
                <div style="text-align:center; color:#8E8E93; padding:40px;">Chargement...</div>
            </div>
        </div>
    `;

    try {
        const stock = await api.getMaterialAspiStock();
        window._mobileAspiStock = stock;
        const listContainer = document.getElementById('matos-aspi-list-container');

        const renderList = (items) => {
            if (items.length === 0) {
                listContainer.innerHTML = `<div style="text-align:center; color:#8E8E93; padding:40px;">Aucune pièce trouvée</div>`;
                return;
            }
            listContainer.innerHTML = items.map(item => {
                const compatBadges = ASPI_COMPAT
                    .filter(k => item[k])
                    .map(k => `<span style="font-size:9px; color:#174286; background:rgba(23,66,134,0.1); padding:2px 6px; border-radius:4px; font-weight:800; border:1px solid rgba(23,66,134,0.2);">${COMPAT_LABELS[k] || k.toUpperCase()}</span>`)
                    .join('');

                const currentQty = parseInt(item.quantite) || 0;
                const targetQty = parseInt(item.cible) || 0;
                const isUnderTarget = currentQty < targetQty;

                const accentColor = isUnderTarget ? '#FF3B30' : '#174286';
                const leftStripBg = isUnderTarget ? 'linear-gradient(135deg,#FF3B30,#FF453A)' : '#174286';
                const cardBorderColor = isUnderTarget ? (dk ? 'rgba(255,59,48,0.25)' : 'rgba(255,59,48,0.2)') : subtleBorder;

                return `
                    <div onclick="openMaterialAspiDetailsModal('${item.id}')"
                        style="background:${cardBg}; border:1px solid ${cardBorderColor}; border-radius:16px; padding:16px; display:flex; align-items:center; gap:14px; box-shadow:0 2px 8px rgba(0,0,0,0.04); cursor:pointer; position:relative; overflow:hidden;">
                        <div style="background:rgba(23,66,134,0.1); width:50px; height:50px; border-radius:12px; display:flex; align-items:center; justify-content:center; font-size:22px; overflow:hidden; flex-shrink:0;">
                            ${item.photo_url ? `<img src="${config.api.workerUrl}/get/${item.photo_url}" style="width:100%; height:100%; object-fit:cover;">` : '🧹'}
                        </div>
                        <div style="flex:1; min-width:0;">
                            <div style="font-weight:800; color:${textColor}; font-size:15px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${item.designation || 'Sans nom'}</div>
                            <div style="display:flex; gap:6px; margin-top:4px; flex-wrap:wrap; align-items:center;">
                                ${item.qr_ref ? `<span style="font-size:10px; color:#174286; font-family:monospace; font-weight:800;">${item.qr_ref}</span>` : ''}
                                <span style="color:#8E8E93; font-size:12px;">Qté: <b style="color:${accentColor};">${item.quantite || '0'}</b> <span style="color:#8E8E93; font-size:11px; font-weight:normal;">(cible: ${item.cible || '0'})</span></span>
                                ${item.lieu_de_stockage ? `<span style="color:#34C759; font-size:12px; font-weight:600;">📍${item.lieu_de_stockage}</span>` : ''}
                            </div>
                            ${compatBadges ? `<div style="display:flex; gap:4px; margin-top:6px; flex-wrap:wrap;">${compatBadges}</div>` : ''}
                        </div>
                        <div style="color:#8E8E93; flex-shrink:0;">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"></path></svg>
                        </div>
                        <div style="position:absolute; left:0; top:0; width:3px; height:100%; background:${leftStripBg};"></div>
                    </div>
                `;
            }).join('');
        };

        renderList(stock);

        const searchInput = document.getElementById('matos-aspi-search');
        const compatFilter = document.getElementById('matos-aspi-compat-filter');

        const handleFilter = () => {
            const query = searchInput.value.toLowerCase();
            const compat = compatFilter.value;
            const filtered = stock.filter(i =>
                (!query ||
                    (i.designation || '').toLowerCase().includes(query) ||
                    (i.ref || '').toLowerCase().includes(query) ||
                    (i.qr_ref || '').toLowerCase().includes(query) ||
                    (i.categorie || '').toLowerCase().includes(query) ||
                    (i.lieu_de_stockage || '').toLowerCase().includes(query)) &&
                (!compat || i[compat] === true)
            );
            renderList(filtered);
        };

        searchInput.addEventListener('input', handleFilter);
        compatFilter.addEventListener('change', handleFilter);

    } catch (e) {
        document.getElementById('matos-aspi-list-container').innerHTML =
            `<div style="color:red; text-align:center;">Erreur: ${e.message}</div>`;
    }
};

window.openMaterialAspiDetailsModal = async function (id) {
    const dk = document.documentElement.getAttribute('data-theme') === 'dark';
    const bg = dk ? '#1C1C1E' : '#FFFFFF';
    const textColor = dk ? '#FFFFFF' : '#1C1C1E';
    const inputBg = dk ? '#2C2C2E' : '#F2F2F7';
    const subtleBorder = dk ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)';

    const ASPI_COMPAT = ['aspi_h13', 'aspi_hz390', 'aspi_hzd900'];
    const COMPAT_LABELS = {
        'aspi_h13': 'H13 HZ200/HZ200',
        'aspi_hz390': 'HZ 390S-2 / HZ 390S',
        'aspi_hzd900': 'HZD 900 / HZDQ900'
    };

    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.style.zIndex = '10000';
    modal.innerHTML = `<div class="modal-box" style="background:${bg}; padding:0; overflow:hidden; display:flex; flex-direction:column; max-height:90vh; width:90%; max-width:420px; border-radius:24px;">
        <div style="padding:20px; display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid ${subtleBorder};">
            <button onclick="this.closest('.modal-overlay').remove()" style="background:none; border:none; color:#8E8E93; font-size:22px; cursor:pointer;">←</button>
            <h2 style="margin:0; color:${textColor}; font-size:18px; text-align:center;">Détails Pièce Aspi</h2>
            <button id="aspi-edit-mode-btn" style="background:rgba(23,66,134,0.1); color:#174286; border:none; width:34px; height:34px; border-radius:10px; display:flex; align-items:center; justify-content:center; cursor:pointer; font-size:16px;">✏️</button>
        </div>
        <div id="aspi-details-content" style="padding:20px; overflow-y:auto; flex:1;">
            <div style="text-align:center; padding:30px; color:#8E8E93;">Chargement...</div>
        </div>
    </div>`;
    document.body.appendChild(modal);

    try {
        const stock = window._mobileAspiStock || await api.getMaterialAspiStock();
        const item = stock.find(i => i.id === id);
        if (!item) throw new Error('Pièce introuvable');

        const locations = [...new Set(stock.map(s => s.lieu_de_stockage).filter(Boolean))].sort();

        const compatBadges = ASPI_COMPAT
            .filter(k => item[k])
            .map(k => `<span style="font-size:12px; color:#174286; background:rgba(23,66,134,0.1); padding:4px 10px; border-radius:8px; font-weight:800; border:1px solid rgba(23,66,134,0.2);">${COMPAT_LABELS[k] || k.toUpperCase()}</span>`)
            .join('');

        const content = document.getElementById('aspi-details-content');
        content.innerHTML = `
            <div style="display:flex; flex-direction:column; gap:18px;">

                <!-- Photo & Header -->
                <div style="background:${inputBg}; padding:16px; border-radius:16px; display:flex; gap:16px; align-items:center;">
                    <div style="background:rgba(23,66,134,0.1); width:72px; height:72px; border-radius:14px; display:flex; align-items:center; justify-content:center; font-size:32px; overflow:hidden; flex-shrink:0;">
                        ${item.photo_url ? `<img src="${config.api.workerUrl}/get/${item.photo_url}" style="width:100%; height:100%; object-fit:cover;">` : '🧹'}
                    </div>
                    <div style="flex:1;">
                        <div style="font-size:12px; color:#8E8E93; font-weight:700; text-transform:uppercase; margin-bottom:4px;">Pièce Aspirateur</div>
                        <div style="font-size:17px; font-weight:800; color:${textColor}; line-height:1.3;">${item.designation || 'Sans nom'}</div>
                        ${item.qr_ref ? `<div style="font-size:11px; color:#174286; font-family:monospace; font-weight:800; margin-top:4px;">${item.qr_ref}</div>` : ''}
                    </div>
                </div>

                <!-- Infos -->
                <div style="background:${inputBg}; padding:16px; border-radius:16px; display:flex; flex-direction:column; gap:8px;">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <span style="font-size:13px; color:#8E8E93; font-weight:700;">Quantité</span>
                        <span style="font-size:18px; font-weight:900; color:${(parseInt(item.quantite) || 0) < (parseInt(item.cible) || 0) ? '#FF3B30' : '#174286'};">${item.quantite || '0'}</span>
                    </div>
                    <div style="height:1px; background:${subtleBorder};"></div>
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <span style="font-size:13px; color:#8E8E93; font-weight:700;">Quantité Cible</span>
                        <span style="font-size:15px; font-weight:800; color:${textColor};">${item.cible || '0'}</span>
                    </div>
                    <div style="height:1px; background:${subtleBorder};"></div>
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <span style="font-size:13px; color:#8E8E93; font-weight:700;">Lieu de stockage</span>
                        <span style="font-size:13px; font-weight:600; color:#34C759;">${item.lieu_de_stockage || 'Non défini'}</span>
                    </div>
                    ${item.ref ? `
                    <div style="height:1px; background:${subtleBorder};"></div>
                    <div>
                        <div style="font-size:12px; color:#8E8E93; font-weight:700; text-transform:uppercase; margin-bottom:4px;">Référence fournisseur</div>
                        <div style="font-size:12px; color:${textColor}; font-family:monospace; white-space:pre-wrap;">${item.ref}</div>
                    </div>` : ''}
                    ${item.categorie ? `
                    <div style="height:1px; background:${subtleBorder};"></div>
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <span style="font-size:13px; color:#8E8E93; font-weight:700;">Catégorie</span>
                        <span style="font-size:13px; font-weight:600; color:${textColor};">${item.categorie}</span>
                    </div>` : ''}
                </div>

                <!-- Compatibility -->
                ${compatBadges ? `
                <div>
                    <div style="font-size:12px; color:#8E8E93; font-weight:700; text-transform:uppercase; margin-bottom:8px;">Compatibilité</div>
                    <div style="display:flex; flex-wrap:wrap; gap:8px;">${compatBadges}</div>
                </div>` : ''}

                <!-- Modification Form -->
                <div style="border-top:1px solid ${subtleBorder}; padding-top:16px;">
                    <div style="font-size:13px; font-weight:700; color:#8E8E93; margin-bottom:10px; text-transform:uppercase;">Demande de modification</div>

                    <label style="display:block; font-size:12px; font-weight:700; color:#8E8E93; margin-bottom:6px; text-transform:uppercase;">Nouvelle Quantité</label>
                    <input type="text" id="aspi-new-qty" value="${item.quantite || '0'}"
                        style="width:100%; padding:14px; border-radius:12px; border:1px solid ${subtleBorder}; background:${bg}; color:${textColor}; font-size:16px; font-weight:600; margin-bottom:12px;">

                    <label style="display:block; font-size:12px; font-weight:700; color:#8E8E93; margin-bottom:6px; text-transform:uppercase;">Nouvel Emplacement</label>
                    <select id="aspi-new-loc-select" style="width:100%; padding:14px; border-radius:12px; border:1px solid ${subtleBorder}; background:${bg}; color:${textColor}; font-size:16px; font-weight:600; appearance:none; -webkit-appearance:none; margin-bottom:6px;">
                        <option value="">-- Sélectionner --</option>
                        ${locations.map(loc => `<option value="${loc}" ${loc === item.lieu_de_stockage ? 'selected' : ''}>${loc}</option>`).join('')}
                        <option value="NEW_LOC">+ Autre emplacement...</option>
                    </select>
                    <input type="text" id="aspi-custom-loc" placeholder="Saisir le nouveau lieu..."
                        style="width:100%; padding:14px; border-radius:12px; border:1px solid ${subtleBorder}; background:${bg}; color:${textColor}; font-size:16px; margin-bottom:12px; display:none;">

                    <!-- Photo -->
                    <label style="display:block; font-size:12px; font-weight:700; color:#8E8E93; margin-bottom:6px; text-transform:uppercase;">Photo (optionnel)</label>
                    <div style="display:flex; gap:10px; align-items:center; margin-bottom:16px;">
                        <div id="aspi-photo-preview" style="width:60px; height:60px; border-radius:10px; border:2px dashed ${subtleBorder}; display:flex; align-items:center; justify-content:center; overflow:hidden; background:${bg}; font-size:22px;">
                            ${item.photo_url ? `<img src="${config.api.workerUrl}/get/${item.photo_url}" style="width:100%; height:100%; object-fit:cover;">` : '📷'}
                        </div>
                        <button id="aspi-take-photo-btn" style="flex:1; padding:12px; border-radius:10px; border:1px solid ${subtleBorder}; background:${inputBg}; color:${textColor}; font-weight:700; cursor:pointer;">
                            📸 Prendre / Choisir une photo
                        </button>
                        <input type="file" id="aspi-photo-input" accept="image/*" capture="camera" style="display:none;">
                    </div>

                    <!-- Comment -->
                    <label style="display:block; font-size:12px; font-weight:700; color:#8E8E93; margin-bottom:6px; text-transform:uppercase;">Commentaire / Justification *</label>
                    <textarea id="aspi-request-comment" placeholder="Expliquez la raison de cette modification..." required
                        style="width:100%; height:70px; padding:14px; border-radius:12px; border:1px solid ${subtleBorder}; background:${bg}; color:${textColor}; font-size:16px; resize:none; margin-bottom:12px;"></textarea>

                    <button id="aspi-submit-request-btn" class="btn-primary"
                        style="width:100%; height:54px; border-radius:14px; background: #174286; color:white; font-size:16px; font-weight:800; border:none; box-shadow:0 4px 12px rgba(23,66,134,0.35);">
                        Envoyer la demande de modification
                    </button>
                </div>

                <!-- History -->
                <div>
                    <div style="font-size:12px; font-weight:700; color:#8E8E93; margin-bottom:10px; text-transform:uppercase;">📋 Historique</div>
                    <div id="aspi-history-mobile" style="display:flex; flex-direction:column; gap:8px;">
                        <div style="color:#8E8E93; text-align:center; font-size:13px; padding:10px;">Chargement...</div>
                    </div>
                </div>

                <button style="width:100%; height:48px; border-radius:14px; background:${inputBg}; color:${textColor}; border:none; font-weight:700; cursor:pointer;" onclick="this.closest('.modal-overlay').remove()">Fermer</button>
            </div>
        `;

        // Load history
        window.loadMaterialAspiHistoryMobile(id, 'aspi-history-mobile');

        // Edit mode button (toggles to full edit)
        document.getElementById('aspi-edit-mode-btn').onclick = () => {
            window.openMaterialAspiDetailsModal(id);
        };

        // Location select
        const locSelect = document.getElementById('aspi-new-loc-select');
        const customLoc = document.getElementById('aspi-custom-loc');
        locSelect.addEventListener('change', () => {
            customLoc.style.display = locSelect.value === 'NEW_LOC' ? 'block' : 'none';
        });

        // Photo
        let selectedPhotoFile = null;
        document.getElementById('aspi-take-photo-btn').onclick = () => document.getElementById('aspi-photo-input').click();
        document.getElementById('aspi-photo-input').onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                selectedPhotoFile = file;
                const reader = new FileReader();
                reader.onload = (re) => {
                    document.getElementById('aspi-photo-preview').innerHTML =
                        `<img src="${re.target.result}" style="width:100%; height:100%; object-fit:cover;">`;
                };
                reader.readAsDataURL(file);
            }
        };

        // Submit
        document.getElementById('aspi-submit-request-btn').onclick = async () => {
            const comment = document.getElementById('aspi-request-comment').value.trim();
            if (!comment) return alert("Veuillez saisir un commentaire obligatoire.");

            const newQty = document.getElementById('aspi-new-qty').value.trim();
            let newLoc = locSelect.value;
            if (newLoc === 'NEW_LOC') newLoc = customLoc.value.trim();

            if (newQty === (item.quantite || '0') && newLoc === item.lieu_de_stockage && !selectedPhotoFile) {
                return alert('Aucune modification détectée.');
            }
            if (!newLoc) return alert('Veuillez sélectionner un emplacement.');

            const btn = document.getElementById('aspi-submit-request-btn');
            btn.disabled = true;
            btn.innerText = 'Envoi en cours...';

            try {
                const payload = {
                    new_quantite: newQty,
                    new_lieu_de_stockage: newLoc,
                    comment: comment
                };

                if (selectedPhotoFile) {
                    btn.innerText = 'Upload photo...';
                    const uploadRes = await api.uploadMaterialAspiPhoto(id, selectedPhotoFile, true);
                    payload.new_photo_url = uploadRes.key;
                }

                btn.innerText = 'Envoi de la demande...';
                await api.submitMaterialAspiStockRequest(id, payload);
                alert('Demande envoyée aux administrateurs !');
                modal.remove();
            } catch (e) {
                alert('Erreur: ' + e.message);
                btn.disabled = false;
                btn.innerText = 'Envoyer la demande de modification';
            }
        };

    } catch (e) {
        document.getElementById('aspi-details-content').innerHTML =
            `<div style="color:red; text-align:center; padding:20px;">Erreur: ${e.message}</div>`;
    }
};

window.openAspiQrScanner = function () {
    if (typeof jsQR === 'undefined') {
        alert('Bibliothèque de scan non chargée.');
        return;
    }

    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:#000;z-index:999999;';
    overlay.innerHTML = `
        <video id="aspi-qr-video" style="width:100%;height:100%;object-fit:cover;" playsinline muted></video>
        <canvas id="aspi-qr-canvas" style="display:none;"></canvas>
        <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-60%);width:240px;height:240px;border:3px solid #174286;border-radius:20px;box-shadow:0 0 0 9999px rgba(0,0,0,0.55);pointer-events:none;"></div>
        <div style="position:absolute;top:calc(50% - 60px - 24px);left:50%;transform:translateX(-50%);color:white;font-size:15px;font-weight:700;text-shadow:0 1px 4px rgba(0,0,0,0.8);white-space:nowrap;">Pointez vers un QR code Aspi</div>
        <button id="aspi-qr-close-btn" style="position:absolute;bottom:50px;left:50%;transform:translateX(-50%);padding:14px 48px;background:#FF3B30;color:white;border:none;border-radius:16px;font-size:16px;font-weight:800;">Annuler</button>
    `;
    document.body.appendChild(overlay);

    const video = document.getElementById('aspi-qr-video');
    const canvas = document.getElementById('aspi-qr-canvas');
    const ctx = canvas.getContext('2d');
    let scanning = true;
    let stream = null;

    const stop = () => {
        scanning = false;
        if (stream) stream.getTracks().forEach(t => t.stop());
        overlay.remove();
    };

    document.getElementById('aspi-qr-close-btn').onclick = stop;

    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
        .then(s => {
            stream = s;
            video.srcObject = s;
            video.play();
            requestAnimationFrame(tick);
        })
        .catch(err => {
            stop();
            alert("Impossible d'accéder à la caméra : " + err.message);
        });

    function tick() {
        if (!scanning) return;
        if (video.readyState === video.HAVE_ENOUGH_DATA) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: 'dontInvert' });
            if (code) {
                stop();
                const matchUrl = code.data.match(/[?&]ref=([^&]+)/);
                const matchRaw = code.data.match(/PCH01\d{4}/) || code.data.match(/PCH02\d{4}/) || code.data.match(/PCH03\d{4}/);
                const ref = matchUrl ? decodeURIComponent(matchUrl[1]) : (matchRaw ? matchRaw[0] : code.data);
                if (ref.startsWith('PCH01')) {
                    window.openMaterialByRef(ref);
                } else if (ref.startsWith('PCH02')) {
                    window.openGTMaterialByRef(ref);
                } else if (ref.startsWith('PCH03')) {
                    window.openAspiMaterialByRef(ref);
                } else {
                    alert('QR code non reconnu : ' + code.data);
                }
                return;
            }
        }
        requestAnimationFrame(tick);
    }
};
