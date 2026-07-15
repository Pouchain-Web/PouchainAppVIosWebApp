import { api } from '../api.js';
import { auth } from '../auth.js';
import config from '../config.js';

window.renderMobileReports = async function () {
    document.getElementById('categories-view').classList.add('hidden');
    document.getElementById('search-results-view').classList.add('hidden');
    const searchContainer = document.querySelector('.mobile-search-container');
    if (searchContainer) searchContainer.classList.add('hidden');
    document.getElementById('document-list').classList.remove('hidden');

    document.getElementById('selected-category-title').innerText = "Bug / Amélioration 🐛";
    document.getElementById('mobile-upload-btn').style.display = 'none';

    window.mobileCurrentPath = "reports";
    const container = document.getElementById('list-content');
    container.innerHTML = `<div style="text-align:center; padding: 40px;"><div class="loader-spinner"></div></div>`;

    if (!document.getElementById('reports-mobile-styles')) {
        const style = document.createElement('style');
        style.id = 'reports-mobile-styles';
        style.innerHTML = `
            .rep-dashboard { display: flex; flex-direction: column; gap: 20px; padding: 16px; padding-bottom: 100px; }
            .rep-card { background: var(--card-background, #fff); border: 1px solid var(--border-color, rgba(0,0,0,0.05)); border-radius: 24px; padding: 20px; box-shadow: 0 4px 15px rgba(0,0,0,0.03); }
            .rep-btn { display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%; height: 50px; border-radius: 14px; border: none; font-size: 15px; font-weight: 700; cursor: pointer; transition: 0.2s; }
            .rep-btn-primary { background: linear-gradient(135deg, #FF3B30, #AF52DE); color: white; }
            .rep-btn-secondary { background: rgba(142, 142, 147, 0.12); color: var(--text-primary, #1c1c1e); }
            
            .rep-segmented { display: flex; background: rgba(142, 142, 147, 0.12); padding: 4px; border-radius: 12px; margin-bottom: 10px; }
            .rep-segment-btn { flex: 1; text-align: center; padding: 10px; border-radius: 9px; font-size: 13px; font-weight: 700; border: none; background: transparent; color: #8E8E93; cursor: pointer; transition: 0.2s; }
            .rep-segment-btn.active { background: var(--card-background, #fff); color: var(--text-primary, #1c1c1e); box-shadow: 0 2px 8px rgba(0,0,0,0.08); }

            .rep-form-group { display: flex; flex-direction: column; gap: 8px; margin-bottom: 16px; }
            .rep-form-label { font-size: 14px; font-weight: 600; color: #8E8E93; }
            .rep-input-select { width: 100%; height: 48px; border-radius: 12px; border: 1px solid rgba(142,142,147,0.2); background: var(--card-background, #fff); color: var(--text-primary, #1c1c1e); padding: 0 12px; font-size: 15px; }
            .rep-textarea { width: 100%; border-radius: 12px; border: 1px solid rgba(142,142,147,0.2); background: var(--card-background, #fff); color: var(--text-primary, #1c1c1e); padding: 12px; font-size: 15px; min-height: 100px; resize: none; font-family: inherit; box-sizing: border-box; }
            .rep-photo-preview { width: 100%; height: 180px; object-fit: cover; border-radius: 14px; margin-top: 10px; display: none; }
            
            .rep-item { border-bottom: 1px solid rgba(142,142,147,0.15); padding: 14px 0; }
            .rep-item:last-child { border-bottom: none; }
            .rep-status-badge { font-size: 11px; font-weight: 700; text-transform: uppercase; padding: 4px 8px; border-radius: 8px; }
            .rep-badge-pending { background: rgba(255, 149, 0, 0.15); color: #FF9500; }
            .rep-badge-resolved { background: rgba(52, 199, 89, 0.15); color: #34C759; }
        `;
        document.head.appendChild(style);
    }

    let activeTab = 'submit'; // 'submit' or 'list'
    let selectedFile = null;

    function renderView() {
        const dk = document.documentElement.getAttribute('data-theme') === 'dark';
        const textColor = dk ? '#FFFFFF' : '#1c1c1e';

        let html = `
            <div class="rep-dashboard">
                <div class="rep-segmented">
                    <button class="rep-segment-btn ${activeTab === 'submit' ? 'active' : ''}" id="rep-tab-submit">Signaler</button>
                    <button class="rep-segment-btn ${activeTab === 'list' ? 'active' : ''}" id="rep-tab-list">Mes retours</button>
                </div>
                
                <div id="rep-content-area"></div>
            </div>
        `;
        container.innerHTML = html;

        document.getElementById('rep-tab-submit').onclick = () => {
            activeTab = 'submit';
            renderTabContent();
            document.getElementById('rep-tab-submit').classList.add('active');
            document.getElementById('rep-tab-list').classList.remove('active');
        };

        document.getElementById('rep-tab-list').onclick = () => {
            activeTab = 'list';
            renderTabContent();
            document.getElementById('rep-tab-list').classList.add('active');
            document.getElementById('rep-tab-submit').classList.remove('active');
        };

        renderTabContent();
    }

    async function renderTabContent() {
        const contentArea = document.getElementById('rep-content-area');
        if (!contentArea) return;

        const dk = document.documentElement.getAttribute('data-theme') === 'dark';
        const textColor = dk ? '#FFFFFF' : '#1c1c1e';

        if (activeTab === 'submit') {
            contentArea.innerHTML = `
                <div class="rep-card">
                    <div class="rep-form-group">
                        <label class="rep-form-label">Type de signalement</label>
                        <select class="rep-input-select" id="rep-type">
                            <option value="bug">🐛 Bug (Dysfonctionnement)</option>
                            <option value="improvement">💡 Amélioration (Suggestion)</option>
                        </select>
                    </div>
                    
                    <div class="rep-form-group">
                        <label class="rep-form-label">Message / Description</label>
                        <textarea class="rep-textarea" id="rep-message" placeholder="Décrivez le bug rencontré ou l'amélioration souhaitée..."></textarea>
                    </div>

                    <div class="rep-form-group">
                        <label class="rep-form-label">Photo (Optionnel)</label>
                        <button class="rep-btn rep-btn-secondary" id="rep-photo-trigger">📷 Prendre / Sélectionner une photo</button>
                        <input type="file" id="rep-photo-input" accept="image/*" style="display:none;">
                        <img class="rep-photo-preview" id="rep-preview">
                    </div>

                    <button class="rep-btn rep-btn-primary" id="rep-submit-btn" style="margin-top: 10px;">
                        Envoyer
                    </button>
                </div>
            `;

            const photoInput = document.getElementById('rep-photo-input');
            const previewImg = document.getElementById('rep-preview');

            document.getElementById('rep-photo-trigger').onclick = () => {
                photoInput.click();
            };

            photoInput.onchange = (e) => {
                const file = e.target.files[0];
                if (file) {
                    selectedFile = file;
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        previewImg.src = event.target.result;
                        previewImg.style.display = 'block';
                    };
                    reader.readAsDataURL(file);
                }
            };

            const submitBtn = document.getElementById('rep-submit-btn');
            submitBtn.onclick = async () => {
                const type = document.getElementById('rep-type').value;
                const message = document.getElementById('rep-message').value.trim();

                if (!message) {
                    alert("Veuillez saisir une description.");
                    return;
                }

                submitBtn.disabled = true;
                submitBtn.innerText = "Envoi en cours...";

                try {
                    let imagePath = null;
                    const reportId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2);

                    if (selectedFile) {
                        const uploadRes = await api.uploadReportPhoto(reportId, selectedFile);
                        imagePath = uploadRes.key;
                    }

                    await api.submitReport(type, message, imagePath);

                    alert("Merci ! Votre signalement a été envoyé et va être analysé par l'équipe administrative.");
                    selectedFile = null;
                    activeTab = 'list';
                    renderView();
                } catch (e) {
                    alert("Erreur lors de la soumission : " + e.message);
                    submitBtn.disabled = false;
                    submitBtn.innerText = "Envoyer";
                }
            };

        } else {
            contentArea.innerHTML = `<div style="text-align:center; padding:20px; color:#8E8E93;">Chargement de l'historique...</div>`;
            try {
                const reports = await api.getReports();
                if (reports.length === 0) {
                    contentArea.innerHTML = `
                        <div style="text-align:center; padding: 40px; color:#8E8E93;">
                            Aucun signalement envoyé pour le moment.
                        </div>
                    `;
                    return;
                }

                let listHtml = `<div class="rep-card" style="display:flex; flex-direction:column; gap:4px;">`;
                reports.forEach(r => {
                    const statusClass = r.status === 'resolved' ? 'rep-badge-resolved' : 'rep-badge-pending';
                    const statusLabel = r.status === 'resolved' ? 'Résolu' : 'En attente';
                    const dateStr = new Date(r.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
                    const typeLabel = r.type === 'bug' ? '🐛 Bug' : '💡 Amélioration';

                    listHtml += `
                        <div class="rep-item">
                            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                                <span style="font-weight:700; color:${textColor};">${typeLabel}</span>
                                <span class="rep-status-badge ${statusClass}">${statusLabel}</span>
                            </div>
                            <div style="font-size:14px; color:${dk ? '#E5E5EA' : '#3a3a3c'}; line-height:1.4; white-space:pre-wrap; margin-bottom:8px;">${window.escapeHTML(r.message)}</div>
                            
                            ${r.image_path ? `
                            <div style="margin-bottom:8px;">
                                <img src="${config.api.workerUrl}/get/${r.image_path}" style="max-width:80px; max-height:80px; border-radius:8px; object-fit:cover; border: 1px solid rgba(142,142,147,0.2);" onclick="window.open('${config.api.workerUrl}/get/${r.image_path}', '_blank')">
                            </div>
                            ` : ''}

                            <div style="font-size:11px; color:#8E8E93;">Envoyé le ${dateStr}</div>
                        </div>
                    `;
                });
                listHtml += `</div>`;
                contentArea.innerHTML = listHtml;
            } catch (e) {
                contentArea.innerHTML = `<div style="color:#FF3B30; padding:10px;">Erreur lors de la récupération des rapports : ${e.message}</div>`;
            }
        }
    }
    renderView();
};
