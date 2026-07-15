import { api } from '../api.js';
import { auth } from '../auth.js';
import config from '../config.js';

window.renderMobileHTTorques = async function (searchQuery = '') {
    const docList = document.getElementById('document-list');
    docList.classList.remove('hidden');
    docList.style.background = 'var(--ios-bg)';
    docList.style.minHeight = '100vh';

    document.getElementById('categories-view').classList.add('hidden');
    document.getElementById('search-results-view').classList.add('hidden');
    const searchContainer = document.querySelector('.mobile-search-container');
    if (searchContainer) searchContainer.classList.add('hidden');

    document.getElementById('selected-category-title').innerText = "Couples de Serrage HT";
    window.mobileCurrentPath = "ht_torques";

    const navHeader = document.querySelector('.nav-header');
    if (navHeader) navHeader.style.display = 'flex';

    const container = document.getElementById('list-content');
    const dk = document.documentElement.getAttribute('data-theme') === 'dark';
    const cardBg = dk ? '#1C1C1E' : '#fff';
    const textColor = dk ? '#FFFFFF' : '#1c1c1e';
    const subtleBorder = dk ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)';

    container.innerHTML = `
        <div style="padding: 16px;">
            <div style="margin-bottom: 20px;">
                <input type="text" id="ht-torque-search" placeholder="Rechercher marque ou modèle..."
                    style="width: 100%; padding: 14px; border-radius: 12px; border: 1px solid ${subtleBorder}; background: ${cardBg}; color: ${textColor}; font-size: 15px;">
            </div>
            <div id="ht-torque-list-container" style="display: flex; flex-direction: column; gap: 12px;">
                <div style="text-align: center; color: #8E8E93; padding: 40px;">Chargement...</div>
            </div>
        </div>
    `;

    try {
        const torqueData = await api.getHTTorques();
        const listContainer = document.getElementById('ht-torque-list-container');

        const renderList = (items) => {
            if (items.length === 0) {
                listContainer.innerHTML = `<div style="text-align: center; color: #8E8E93; padding: 40px;">Aucun modèle trouvé</div>`;
                return;
            }
            listContainer.innerHTML = items.map(item => `
            <div class="material-item-card" onclick="openHTTorqueDetailsModal(${JSON.stringify(item).replace(/"/g, '&quot;')})" 
                style="background: ${cardBg}; border: 1px solid ${subtleBorder}; border-radius: 16px; padding: 16px; display: flex; align-items: center; gap: 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.02); animation: taskIn 0.3s ease-out;">
                <div style="background: #AF52DE; width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 20px; color: white;">
                    ⚡
                </div>
                <div style="flex: 1;">
                    <div style="font-size: 11px; font-weight: 700; color: #AF52DE; text-transform: uppercase;">${item.marque}</div>
                    <div style="font-weight: 800; color: ${textColor}; font-size: 16px;">${item.modele}</div>
                    <div style="font-size: 12px; color: #8E8E93; margin-top: 2px;">${item.type !== '-' ? item.type : 'Standard'}</div>
                </div>
                <div style="color: #8E8E93;">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"></path></svg>
                </div>
            </div>
        `).join('');
        };

        renderList(torqueData);

        document.getElementById('ht-torque-search').addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            const filtered = torqueData.filter(i =>
                i.marque.toLowerCase().includes(query) ||
                i.modele.toLowerCase().includes(query) ||
                (i.type && i.type.toLowerCase().includes(query))
            );
            renderList(filtered);
        });

    } catch (e) {
        document.getElementById('ht-torque-list-container').innerHTML = `<div style="color:red; text-align:center; padding:20px;">Erreur: ${e.message}</div>`;
    }

    window.openHTTorqueDetailsModal = (item) => {
        const _dk = document.documentElement.getAttribute('data-theme') === 'dark';
        const _bg = _dk ? '#1C1C1E' : '#FFFFFF';
        const _textColor = _dk ? '#FFFFFF' : '#1C1C1E';
        const _inputBg = _dk ? '#2C2C2E' : '#F2F2F7';
        const _subtleBorder = _dk ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)';

        // Empêcher le scroll du fond
        document.body.style.overflow = 'hidden';

        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.style.zIndex = '10000';

        const closeModal = () => {
            modal.remove();
            document.body.style.overflow = '';
        };

        modal.innerHTML = `<div class="modal-box" style="background: ${_bg}; padding: 0; overflow: hidden; display: flex; flex-direction: column; max-height: 90vh; width: 90%; max-width: 400px; border-radius: 24px; animation: modalPop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);">
            <div style="padding: 20px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid ${_subtleBorder};">
                <div style="width: 32px;"></div>
                <h2 style="margin: 0; color: ${_textColor}; font-size: 18px; text-align: center;">Couples de Serrage</h2>
                <button id="ht-modal-close-x" style="background: ${_inputBg}; border: none; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 14px; color: ${_textColor}; cursor: pointer;">✕</button>
            </div>
            <div style="padding: 24px; overflow-y: auto;">
                <div style="text-align: center; margin-bottom: 24px;">
                    <div style="font-size: 14px; font-weight: 700; color: #AF52DE; text-transform: uppercase; margin-bottom: 4px;">${item.marque}</div>
                    <div style="font-size: 24px; font-weight: 800; color: ${_textColor};">${item.modele}</div>
                    ${item.type !== '-' ? `<div style="font-size: 15px; color: #8E8E93; margin-top: 4px;">${item.type}</div>` : ''}
                </div>

                <div style="display: flex; flex-direction: column; gap: 16px;">
                    ${item.couple_cable ? `
                    <div style="background: ${_inputBg}; padding: 16px; border-radius: 16px;">
                        <div style="font-size: 12px; font-weight: 700; color: #8E8E93; text-transform: uppercase; margin-bottom: 8px;">Couple Câbles HTA</div>
                        <div style="font-size: 20px; font-weight: 800; color: #AF52DE;">${item.couple_cable}</div>
                    </div>` : ''}

                    ${item.couple_barre ? `
                    <div style="background: ${_inputBg}; padding: 16px; border-radius: 16px;">
                        <div style="font-size: 12px; font-weight: 700; color: #8E8E93; text-transform: uppercase; margin-bottom: 8px;">Couple Barres</div>
                        <div style="font-size: 20px; font-weight: 800; color: #AF52DE;">${item.couple_barre}</div>
                    </div>` : ''}

                    ${item.couple_interne ? `
                    <div style="background: ${_inputBg}; padding: 16px; border-radius: 16px;">
                        <div style="font-size: 12px; font-weight: 700; color: #8E8E93; text-transform: uppercase; margin-bottom: 8px;">Connexions Internes / Disjoncteurs</div>
                        <div style="font-size: 20px; font-weight: 800; color: #AF52DE;">${item.couple_interne}</div>
                    </div>` : ''}

                    ${item.extra_torques ? Object.entries(item.extra_torques).map(([label, val]) => `
                    <div style="background: ${_inputBg}; padding: 16px; border-radius: 16px;">
                        <div style="font-size: 12px; font-weight: 700; color: #8E8E93; text-transform: uppercase; margin-bottom: 8px;">${label}</div>
                        <div style="font-size: 20px; font-weight: 800; color: #AF52DE;">${val}</div>
                    </div>`).join('') : ''}
                </div>

                <button id="ht-modal-close-btn" style="width: 100%; margin-top: 32px; padding: 16px; border-radius: 16px; background: ${_textColor}; color: ${_bg}; border: none; font-size: 16px; font-weight: 700;">
                    Fermer
                </button>
            </div>
        </div>`;
        document.body.appendChild(modal);

        modal.querySelector('#ht-modal-close-x').onclick = closeModal;
        modal.querySelector('#ht-modal-close-btn').onclick = closeModal;
        modal.onclick = (e) => { if (e.target === modal) closeModal(); };
    };
};
