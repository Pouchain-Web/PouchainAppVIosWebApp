import { api } from '../api.js';
import { auth } from '../auth.js';
import config from '../config.js';
import { updater } from '../updater.js';

window.renderMobileSettings = async function () {
    document.getElementById('categories-view').classList.add('hidden');
    document.getElementById('search-results-view').classList.add('hidden');
    const searchContainer = document.querySelector('.mobile-search-container');
    if (searchContainer) searchContainer.classList.add('hidden');
    document.getElementById('document-list').classList.remove('hidden');

    document.getElementById('selected-category-title').innerText = "Paramètres";
    document.getElementById('mobile-upload-btn').style.display = 'none';

    window.mobileCurrentPath = "settings";

    const container = document.getElementById('list-content');
    const dk = document.documentElement.getAttribute('data-theme') === 'dark';
    const textColor = dk ? '#FFFFFF' : '#1c1c1e';
    const subColor = '#8E8E93';
    const cardBg = dk ? '#1C1C1E' : '#FFFFFF';
    const border = dk ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)';

    // Get Native Info
    let nativeInfo = { version: "1.0.0", build: "1" };
    if (window.Capacitor && window.Capacitor.isNativePlatform()) {
        try {
            nativeInfo = await window.Capacitor.Plugins.App.getInfo();
        } catch (e) { }
    }

    const lastDownloadedVersion = localStorage.getItem('pouchain_last_apk_version') || '0.0.0';

    container.innerHTML = `
        <div style="padding: 16px; padding-bottom: 100px;">
            <!-- Version Section -->
            <div style="background: ${cardBg}; border-radius: 20px; padding: 20px; border: 1px solid ${border}; margin-bottom: 24px; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
                <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 20px;">
                    <div style="width: 50px; height: 50px; background: #8E8E93; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 24px;">📱</div>
                    <div>
                        <div style="font-weight: 800; font-size: 18px; color: ${textColor};">Application Pouchain</div>
                        <div style="font-size: 13px; color: ${subColor};">Gérez vos mises à jour et préférences</div>
                    </div>
                </div>

                <div style="display: grid; gap: 12px; border-top: 1px solid ${border}; padding-top: 20px;">
                    <div style="display: flex; justify-content: space-between;">
                        <span style="color: ${subColor};">Version Live</span>
                        <span style="color: ${textColor}; font-weight: 700;">v${updater.currentVersion}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                        <span style="color: ${subColor};">Version Native</span>
                        <span style="color: ${textColor}; font-weight: 700;">v${lastDownloadedVersion}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                        <span style="color: ${subColor};">ID Build</span>
                        <span style="color: ${textColor}; font-weight: 700;">${nativeInfo.build}</span>
                    </div>
                </div>
            </div>

            <!-- Update Section -->
            <h3 style="color: ${textColor}; margin: 0 0 12px 4px; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Mise à jour APK</h3>
            <div id="settings-update-container" style="background: ${cardBg}; border-radius: 20px; padding: 20px; border: 1px solid ${border}; margin-bottom: 24px;">
                <p style="color: ${subColor}; font-size: 14px; line-height: 1.5; margin-bottom: 20px;">
                    Si vous rencontrez des problèmes ou si une nouvelle fonctionnalité a été ajoutée au cœur de l'app, vous pouvez forcer le retéléchargement.
                </p>
                <div style="display: flex; flex-direction: column; gap: 10px;">
                    <button id="check-update-btn" class="btn-primary" style="width: 100%; border-radius: 14px; padding: 14px; font-weight: 700; background: #5856D6;">
                        Rechercher une mise à jour
                    </button>
                    <button id="force-download-btn" style="background: transparent; border: none; color: ${subColor}; font-size: 12px; text-decoration: underline; padding: 5px;">
                        Forcer le téléchargement (PouchainApp.apk)
                    </button>
                </div>
            </div>

            <!-- Danger Zone -->
            <h3 style="color: #FF3B30; margin: 0 0 12px 4px; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Zone de danger</h3>
            <div style="background: ${cardBg}; border-radius: 20px; padding: 20px; border: 1px solid ${border};">
                <button id="clear-cache-btn" class="btn-secondary" style="width: 100%; color: #FF3B30; border: 1px solid rgba(255,59,48,0.2); border-radius: 14px; padding: 14px; font-weight: 700; background: transparent;">
                    Réinitialiser le cache & Déconnexion
                </button>
            </div>
        </div>
    `;

    document.getElementById('clear-cache-btn').onclick = () => {
        if (confirm("Voulez-vous vraiment réinitialiser l'application ? Toutes les données locales seront effacées.")) {
            localStorage.clear();
            window.location.reload();
        }
    };

    document.getElementById('force-download-btn').onclick = async () => {
        if (confirm("Voulez-vous télécharger le fichier APK manuellement ?")) {
            try {
                const res = await fetch(`${config.api.workerUrl}/update/apk-check?t=${Date.now()}`);
                const data = await res.json();
                if (data.version) {
                    localStorage.setItem('pouchain_last_apk_version', data.version);
                }
            } catch (e) { }
            window.open(`${config.api.workerUrl}/get/app_dist/PouchainApp.apk?t=${Date.now()}`, '_system');
        }
    };

    document.getElementById('check-update-btn').onclick = async () => {
        const btn = document.getElementById('check-update-btn');
        btn.disabled = true;
        btn.innerText = "Vérification...";

        try {
            const zipRes = await fetch(`${config.api.workerUrl}/update/check?current_version=${updater.currentVersion}&t=${Date.now()}`);
            if (zipRes.ok) {
                const zipData = await zipRes.json();
                if (zipData.updateAvailable) {
                    btn.disabled = false;
                    btn.innerText = "Rechercher une mise à jour";
                    updater.showUpdateModal(zipData.newVersion, zipData.url);
                    return;
                }
            }

            const apkRes = await fetch(`${config.api.workerUrl}/update/apk-check?current_version=${lastDownloadedVersion}&t=${Date.now()}`);
            if (!apkRes.ok) throw new Error("Erreur serveur ou fichier non trouvé");

            const data = await apkRes.json();
            const serverVersion = data.version;

            const isNewer = window.compareVersions(serverVersion, lastDownloadedVersion) > 0;

            if (isNewer) {
                const updateContainer = document.getElementById('settings-update-container');
                updateContainer.innerHTML = `
                    <div style="text-align: center; padding: 10px;">
                        <div style="font-size: 40px; margin-bottom: 10px;">🎁</div>
                        <div style="font-weight: 800; color: ${textColor}; margin-bottom: 5px;">Mise à jour APK v${serverVersion} disponible !</div>
                        <p style="color: ${subColor}; font-size: 13px; margin-bottom: 20px;">Une nouvelle version native (APK) a été détectée.</p>
                        <div style="display: flex; flex-direction: column; gap: 10px;">
                            <button id="install-apk-btn" class="btn-primary" style="width: 100%; border-radius: 14px; padding: 14px; font-weight: 700; background: #34C759;">Télécharger et Installer</button>
                            <button id="sync-apk-btn" style="background: transparent; border: 1px solid ${border}; color: ${textColor}; border-radius: 14px; padding: 10px; font-size: 13px;">Je suis déjà sur cette version</button>
                        </div>
                    </div>
                `;
                document.getElementById('install-apk-btn').onclick = () => {
                    localStorage.setItem('pouchain_last_apk_version', serverVersion);
                    window.open(data.url, '_system');
                };
                document.getElementById('sync-apk-btn').onclick = () => {
                    localStorage.setItem('pouchain_last_apk_version', serverVersion);
                    alert("Version APK synchronisée ! ✨");
                    window.renderMobileSettings();
                };
            } else {
                alert("Votre application est déjà à jour ! ✨\n\nLive: v" + (updater.currentVersion || "?") + "\nAPK Serveur: v" + serverVersion + "\nAPK Local: v" + lastDownloadedVersion);
                btn.disabled = false;
                btn.innerText = "Rechercher une mise à jour";
            }
        } catch (e) {
            alert("Impossible de vérifier les mises à jour : " + e.message);
            btn.disabled = false;
            btn.innerText = "Rechercher une mise à jour";
        }
    };
};
