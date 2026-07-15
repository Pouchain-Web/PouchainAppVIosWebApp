import { auth } from './auth.js';
import { api } from './api.js';
import config from './config.js';
import { updater } from './updater.js';

// Beautiful Custom Alert for Visitor block on Mobile
window.showVisitorAlert = function() {
    if (document.getElementById('visitor-blocked-modal')) return;

    const modal = document.createElement('div');
    modal.id = 'visitor-blocked-modal';
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100%';
    modal.style.height = '100%';
    modal.style.backgroundColor = 'rgba(0,0,0,0.6)';
    modal.style.backdropFilter = 'blur(8px)';
    modal.style.webkitBackdropFilter = 'blur(8px)';
    modal.style.zIndex = '999999';
    modal.style.display = 'flex';
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';
    modal.style.animation = 'fadeIn 0.25s ease-out';

    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const bg = isDark ? '#1C1C1E' : '#FFFFFF';
    const textColor = isDark ? '#FFFFFF' : '#1C1C1E';
    const btnBg = '#FF9500'; // Sleek warning orange

    modal.innerHTML = `
        <div style="background: ${bg}; color: ${textColor}; padding: 30px; border-radius: 28px; width: 85%; max-width: 320px; text-align: center; box-shadow: 0 10px 30px rgba(0,0,0,0.3); animation: scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);">
            <div style="font-size: 50px; margin-bottom: 16px;">🛡️</div>
            <h3 style="margin: 0 0 12px 0; font-size: 20px; font-weight: 800;">Accès Limité</h3>
            <p style="margin: 0 0 24px 0; font-size: 14px; color: #8E8E93; line-height: 1.5; text-align: center;">
                Désolé, mais vous ne pouvez pas modifier d'informations avec votre niveau d'accès. Votre compte visiteur est dédié uniquement à la visualisation de l'application mobile.
            </p>
            <button onclick="document.getElementById('visitor-blocked-modal').remove()" style="width: 100%; padding: 14px; background: ${btnBg}; color: white; border: none; border-radius: 16px; font-size: 16px; font-weight: 700; cursor: pointer; box-shadow: 0 4px 12px rgba(255, 149, 0, 0.3); outline: none;">
                Compris
            </button>
        </div>
        <style>
            @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            @keyframes scaleIn { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        </style>
    `;
    document.body.appendChild(modal);
};

// Global Interceptors to block visitor modifications
const originalFetch = window.fetch;
window.fetch = async function (input, init) {
    const method = (init && init.method || 'GET').toUpperCase();
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
        const role = window.userRole || (await auth.getUserRole().catch(() => null));
        if (role === 'visiteur') {
            window.showVisitorAlert();
            throw new Error("Action interdite pour les visiteurs");
        }
    }
    return originalFetch.apply(this, arguments);
};

const originalOpen = XMLHttpRequest.prototype.open;
XMLHttpRequest.prototype.open = function(method, url, async, user, password) {
    this._method = method;
    return originalOpen.apply(this, arguments);
};

const originalSend = XMLHttpRequest.prototype.send;
XMLHttpRequest.prototype.send = function(body) {
    if (this._method && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(this._method.toUpperCase())) {
        if (window.userRole === 'visiteur') {
            window.showVisitorAlert();
            throw new Error("Action interdite pour les visiteurs");
        }
    }
    return originalSend.apply(this, arguments);
};

// Mobile Module Imports
import './mobile/planning.js';
import './mobile/planning_previsionnel.js';
import './mobile/conges.js';
import './mobile/rtt.js';
import './mobile/material.js';
import './mobile/vehicles.js';
import './mobile/friterie.js';
import './mobile/ht_torques.js';
import './mobile/prevention.js';
import './mobile/documents.js';
import './mobile/settings.js';
import './mobile/reports.js';
import './mobile/overtime.js';
import './mobile/pointage.js';



window.mobileFilesCache = [];
window.mobileVehicleCache = null;
window.mobileCurrentPath = null;
window.isMobileView = true;
window.currentUserId = null;
window.currentUserProfile = null;
window.prevPlans = [];
window.prevSigs = [];
window.prevPlansCount = 0;
window.prevSigsCount = 0;
window.supabaseClient = null;

window.formatOvertimeDuration = function (decimalHours) {
    if (decimalHours === 0) return "0h";
    const isNegative = decimalHours < 0;
    const absoluteHours = Math.abs(decimalHours);
    const h = Math.floor(absoluteHours);
    const m = Math.round((absoluteHours - h) * 60);
    const sign = isNegative ? "-" : "+";
    if (h === 0) return sign + m + " min";
    if (m === 0) return sign + h + "h";
    return sign + h + "h" + (m < 10 ? "0" : "") + m;
};


// --- MISE À JOUR IN-APP ---
(async () => {
    // Helper global pour comparer les versions
    window.compareVersions = (v1, v2) => {
        if (!v1 || !v2) return 0;
        const s1 = String(v1).toLowerCase().startsWith('v') ? String(v1).slice(1) : String(v1);
        const s2 = String(v2).toLowerCase().startsWith('v') ? String(v2).slice(1) : String(v2);
        const a = s1.split('.').map(Number);
        const b = s2.split('.').map(Number);
        for (let i = 0; i < Math.max(a.length, b.length); i++) {
            const valA = a[i] || 0;
            const valB = b[i] || 0;
            if (valA > valB) return 1;
            if (valA < valB) return -1;
        }
        return 0;
    };

    try {
        console.log("[Dashboard] Initialisation de l'updater...");
        const isUpdating = await updater.init();
        if (isUpdating) {
            console.log("[Dashboard] Blocage pour mise à jour.");
            return;
        }
        console.log("[Dashboard] Pas de mise à jour, lancement du dashboard.");
        initDashboard();
    } catch (e) {
        console.error("[Dashboard] ERREUR CRITIQUE UPDATER:", e);
        alert("ERREUR CRITIQUE AU LANCEMENT: " + e.message);
        // On lance quand même le dashboard en cas d'erreur de l'updater pour ne pas bloquer l'app
        initDashboard();
    }
})();

// Utilitaires de sécurité
window.escapeHTML = function (str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
};

// Helper to show brief toast notifications on mobile
window.showToast = function (message) {
    const toast = document.createElement('div');
    toast.innerText = message;
    toast.style.position = 'fixed';
    toast.style.bottom = '30px';
    toast.style.left = '50%';
    toast.style.transform = 'translateX(-50%)';
    toast.style.background = 'rgba(30, 30, 35, 0.9)';
    toast.style.color = 'white';
    toast.style.padding = '12px 24px';
    toast.style.borderRadius = '50px';
    toast.style.zIndex = '10000001';
    toast.style.backdropFilter = 'blur(10px)';
    toast.style.fontSize = '14px';
    toast.style.fontWeight = '600';
    toast.style.border = '1px solid rgba(255,255,255,0.1)';
    toast.style.boxShadow = '0 10px 30px rgba(0,0,0,0.5)';
    toast.style.animation = 'modalPop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)';
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
};

// Helper to determine if a date is a French public holiday
window.isJoursFerieFrance = function (dateStr) {
    const d = new Date(dateStr);
    const y = d.getFullYear(), m = d.getMonth() + 1, day = d.getDate();
    const md = String(m).padStart(2, '0') + "-" + String(day).padStart(2, '0');
    if (["01-01", "05-01", "05-08", "07-14", "08-15", "11-01", "11-11", "12-25"].includes(md)) return true;

    // Pâques
    let a = y % 19, b = Math.floor(y / 100), c = y % 100, d1 = Math.floor(b / 4), e = b % 4;
    let f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d1 - g + 15) % 30;
    let i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7;
    let m1 = Math.floor((a + 11 * h + 22 * l) / 451);
    let n = Math.floor((h + l - 7 * m1 + 114) / 31) - 1, p = ((h + l - 7 * m1 + 114) % 31) + 1;
    let paques = new Date(y, n, p);
    let lPaq = new Date(paques); lPaq.setDate(paques.getDate() + 1);
    let asc = new Date(paques); asc.setDate(paques.getDate() + 39);
    let lPent = new Date(paques); lPent.setDate(paques.getDate() + 50);

    const isSame = (d1, d2) => d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();
    return isSame(d, lPaq) || isSame(d, asc) || isSame(d, lPent);
};

// Controller Logic
/**
 * Conversion utility for VAPID Public Key
 */
function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

/**
 * Initialize Push Notifications for Mobile (PWA & Native APK)
 */
async function initPushNotifications() {
    // 1. Logic for NATIVE APK (Capacitor)
    if (window.Capacitor && window.Capacitor.isNativePlatform()) {
        console.log("Capacitor Native Platform detected. Using Native Push.");
        try {
            const { PushNotifications } = window.Capacitor.Plugins;
            if (!PushNotifications) {
                console.error("Capacitor PushNotifications plugin not found.");
                return;
            }

            let permStatus = await PushNotifications.checkPermissions();
            if (permStatus.receive === 'prompt') {
                permStatus = await PushNotifications.requestPermissions();
            }

            if (permStatus.receive !== 'granted') {
                console.warn('Native Push permission denied.');
                return;
            }

            // 1. Listeners (Register BEFORE register() to catch all events)
            await PushNotifications.addListener('registration', async (token) => {
                console.log('Native Push Registration success, token:', token.value);
                const subObj = { token: token.value, type: 'capacitor' };
                try {
                    await api.subscribePush(subObj);
                    console.log("Appareil enregistré dans la base de données.");
                } catch (e) {
                    console.error("Erreur enregistrement serveur:", e.message);
                }
            });

            await PushNotifications.addListener('registrationError', (error) => {
                console.error('Native Push Registration error:', error);
            });

            await PushNotifications.addListener('pushNotificationReceived', (notification) => {
                console.log("Foreground notification received:", notification);
            });

            await PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
                console.log("Action de notification effectuée:", notification);
                const data = notification.notification.data;
                if (data && data.url) {
                    // Si l'URL est externe ou un schéma d'app (://), on l'ouvre
                    if (data.url.startsWith('http') || data.url.includes('://')) {
                        console.log("Opening external URL from notification:", data.url);
                        window.open(data.url, '_blank');
                    } else if (data.url && data.url.includes('.html')) {
                        // Navigation interne seulement si on n'est pas déjà sur la page
                        if (!window.location.href.includes(data.url)) {
                            window.location.href = data.url;
                        }
                    }
                }
            });

            // 2. Channel Creation
            try {
                await PushNotifications.createChannel({
                    id: 'pouchain_notifications',
                    name: 'Pouchain App Notifications',
                    description: 'Alertes et rappels de pointage KIZEO',
                    importance: 5,
                    visibility: 1,
                    vibration: true
                });
            } catch (ce) {
                console.error("Channel creation error:", ce);
            }

            // 3. Register with FCM
            await PushNotifications.register();

            return; // Native logic handled
        } catch (err) {
            console.error("Native Push Init Error:", err);
            // Fallback to web push if possible (though unlikely to work if native fails)
        }
    }

    // 2. Logic for WEB / PWA (Standard Web Push)
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        console.warn('Push mapping non supporté sur ce navigateur.');
        return;
    }

    try {
        const registration = await navigator.serviceWorker.getRegistration() || await navigator.serviceWorker.register('sw.js');
        console.log('Service Worker ready:', registration);

        let permission = Notification.permission;
        if (permission !== 'granted') {
            const confirmed = confirm("🔔 Pour recevoir les rappels de pointage KIZEO et les messages des administrateurs, souhaitez-vous activer les notifications sur cet appareil ?");
            if (!confirmed) return;
            permission = await Notification.requestPermission();
        }

        if (permission !== 'granted') return;

        let subscription = await registration.pushManager.getSubscription();
        if (!subscription) {
            const subscribeOptions = {
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(config.vapidPublicKey)
            };
            subscription = await registration.pushManager.subscribe(subscribeOptions);
        }

        await api.subscribePush(subscription);
        console.log('Web Push subscription verified on backend.');
    } catch (error) {
        console.error('Error during web push initialization:', error);
    }
}

async function initDashboard() {
    // 1. Check Auth
    const session = await auth.getSession();
    if (!session) {
        window.location.href = 'index.html';
        return;
    }

    // 2. Determine View
    const role = await auth.getUserRole();
    window.userRole = role;
    const isMobile = window.innerWidth <= 768; // Simple check

    // Gestion du bouton retour physique Android (Capacitor)
    if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.App) {
        window.Capacitor.Plugins.App.addListener('backButton', ({ canGoBack }) => {
            console.log("Hardware back button pressed.");

            // 1. Fermer les modales ouvertes
            const modal = document.querySelector('.modal-overlay');
            if (modal) {
                console.log("Closing modal via back button");
                modal.remove();
                return;
            }

            // 2. Gestion du mode paysage (plans)
            const isLandscape = document.querySelector('.landscape-mode');
            if (isLandscape) {
                if (typeof window.renderMobileMap === "function") {
                    window.renderMobileMap();
                    return;
                }
            }

            // 3. Gestion de la recherche
            const searchInput = document.getElementById('search-input');
            const searchView = document.getElementById('search-results-view');
            if (searchInput && searchView && !searchView.classList.contains('hidden')) {
                console.log("Clearing search via back button");
                searchInput.value = '';
                // Simule l'input pour remettre l'interface à zéro (catégories)
                const event = new Event('input', { bubbles: true });
                searchInput.dispatchEvent(event);
                return;
            }

            // 4. Navigation logique (Bouton retour de l'interface)
            const docList = document.getElementById('document-list');
            if (docList && !docList.classList.contains('hidden')) {
                const backBtn = document.getElementById('back-btn');
                if (backBtn) {
                    console.log("Simulating interface back button");
                    backBtn.click();
                    return;
                }
            }

            // 5. Quitter uniquement si on est à la racine
            if (canGoBack) {
                window.history.back();
            } else {
                console.log("Exiting app...");
                window.Capacitor.Plugins.App.exitApp();
            }
        });

        // Deep link : app déjà ouverte et on reçoit pouchainapp://material?ref=XXX
        window.Capacitor.Plugins.App.addListener('appUrlOpen', (event) => {
            const match = (event.url || '').match(/[?&]ref=([^&]+)/);
            if (match) openMaterialByRef(decodeURIComponent(match[1]));
        });

        // Deep link : app lancée directement depuis le lien
        window.Capacitor.Plugins.App.getLaunchUrl().then((result) => {
            if (result && result.url) {
                const match = result.url.match(/[?&]ref=([^&]+)/);
                if (match) openMaterialByRef(decodeURIComponent(match[1]));
            }
        });
    }

    // 3. Render View
    if (role === 'admin' && !isMobile) {
        await renderAdminView(session);
    } else {
        await renderMobileView();
    }

    // 4. Initialisation des notifications Push
    initPushNotifications();

    // 5. Deep link fallback pour plateforme Web non-native (iOS Safari)
    if (!window.Capacitor || !window.Capacitor.isNativePlatform()) {
        const urlParams = new URLSearchParams(window.location.search);
        const ref = urlParams.get('ref');
        if (ref) {
            console.log("Web deep link detected for ref:", ref);
            setTimeout(() => {
                if (typeof window.openMaterialByRef === "function") {
                    window.openMaterialByRef(ref);
                }
            }, 800);
        }
    }
}

// Global utility for opening files
window.openFile = function (key) {
    if (!key) return;

    // Properly encode key segments (for spaces, #, %, etc.)
    const encodedKey = key.split('/').map(segment => encodeURIComponent(segment)).join('/');
    const url = `${config.api.workerUrl}/get/${encodedKey}`;

    const ext = key.split('.').pop().toLowerCase();
    const isViewable = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf', 'mp4', 'mov'].includes(ext);

    if (isViewable) {
        window.viewMobileFile(key, url, ext);
    } else {
        window.open(url, '_blank');
    }
};

window.viewMobileFile = function (key, url, ext) {
    const filename = key.split('/').pop();
    const modal = document.createElement('div');
    modal.className = 'file-viewer-overlay modal-overlay';
    modal.id = 'active-file-viewer';
    modal.style.zIndex = '1000000';

    let renderHtml = '';
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) {
        renderHtml = `<img src="${url}" alt="${filename}" style="width:100%; height:auto; max-height:100%; object-fit: contain;">`;
    } else if (ext === 'pdf') {
        // Fallback for Android: Use Google Docs Viewer to ensure direct viewing without download
        const googleViewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`;
        renderHtml = `
            <iframe src="${googleViewerUrl}" style="width:100%; height:100%; border:none; background:#fff;"></iframe>
        `;
    } else if (['mp4', 'mov'].includes(ext)) {
        renderHtml = `<video src="${url}" controls autoplay style="width:100%; max-height:100%;"></video>`;
    } else {
        // For other files, try to open in a new window (which triggers the system browser)
        window.open(url, '_blank');
        return;
    }

    modal.innerHTML = `
        <div class="viewer-header">
            <span class="viewer-title">${filename}</span>
            <button class="close-viewer-btn" onclick="this.closest('.file-viewer-overlay').remove()">×</button>
        </div>
        <div class="viewer-body" style="background:#000; overflow:hidden;">
            ${renderHtml}
        </div>
    `;
    document.body.appendChild(modal);
};

// --- Mobile View (User / Mobile) ---
window.mobileFilesCache = []; // Cache for search
window.mobileVehicleCache = null; // Track vehicle data for the list
window.mobileCurrentPath = null; // Track current folder path
window.isMobileView = false; // Flag to know which view is active

async function renderMobileView() {
    window.isMobileView = true;
    // Ensure favicon is present (survives body rewrite)
    if (!document.getElementById('app-favicon')) {
        const favicon = document.createElement('link');
        favicon.id = 'app-favicon';
        favicon.rel = 'icon';
        favicon.type = 'image/png';
        favicon.href = 'favicon.png';
        document.head.appendChild(favicon);
    }
    // Load CSS
    if (!document.getElementById('mobile-css')) {
        const link = document.createElement('link');
        link.id = 'mobile-css';
        link.rel = 'stylesheet';
        link.href = 'css/style.css';
        document.head.appendChild(link);
    }

    // Inject file viewer styles
    if (!document.getElementById('file-viewer-styles')) {
        const style = document.createElement('style');
        style.id = 'file-viewer-styles';
        style.innerHTML = `
            .file-viewer-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: #000000;
                z-index: 100050;
                display: flex;
                flex-direction: column;
                animation: viewerIn 0.3s cubic-bezier(0.1, 0.7, 0.1, 1);
            }
            @keyframes viewerIn { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
            .viewer-header {
                height: 60px;
                padding: 0 16px;
                display: flex;
                align-items: center;
                justify-content: space-between;
                background: rgba(28, 28, 30, 0.85);
                backdrop-filter: blur(10px);
                border-bottom: 1px solid rgba(255,255,255,0.1);
                color: #fff;
            }
            .viewer-title { font-size: 14px; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-right: 15px; }
            .close-viewer-btn { background: #38383A; color: #fff; border: none; border-radius: 50%; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; font-size: 20px; font-weight: bold; }
            .viewer-body {
                flex: 1;
                width: 100%;
                display: flex;
                align-items: center;
                justify-content: center;
                overflow: hidden;
                position: relative;
                background: #111;
            }
            .viewer-body img { max-width: 100%; max-height: 100%; object-fit: contain; }
            .viewer-body video { width: 100%; max-height: 100%; }
            .viewer-body object { width: 100%; height: 100%; border: none; display: block; background: #fff; }
        `;
        document.head.appendChild(style);
    }

    // Local theme logic
    const applyMobileTheme = (isDark) => {
        document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
        const themeBtn = document.getElementById('theme-toggle');
        if (themeBtn) {
            themeBtn.innerHTML = isDark ? `
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="5"></circle>
                    <line x1="12" y1="1" x2="12" y2="3"></line>
                    <line x1="12" y1="21" x2="12" y2="23"></line>
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                    <line x1="1" y1="12" x2="3" y2="12"></line>
                    <line x1="21" y1="12" x2="23" y2="12"></line>
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                </svg>
            ` : `
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                </svg>
            `;
        }
    };

    // Structure
    document.body.innerHTML = `
    <!-- Fixed Top Bar -->
    <div class="mobile-top-bar">
        <div class="mobile-header-content">
            <div class="logo-container" onclick="window.goHome()" style="cursor: pointer;">
                <img src="logo-pouchain.svg" alt="Pouchain" class="header-logo" style="height: 32px; width: auto; max-width: 60vw; object-fit: contain;">
            </div>
            <div style="display:flex; gap: 12px; align-items: center;">
                <div id="top-loader" class="hidden" style="margin-right: 4px;">
                    <div class="loader" style="border: 2px solid rgba(0,0,0,0.1); border-top-color: var(--primary-color); border-radius: 50%; width: 18px; height: 18px; animation: spin 1s linear infinite;"></div>
                </div>
                <button id="theme-toggle" class="header-btn theme-toggle-btn" title="Changer le thème" style="background: rgba(142, 142, 147, 0.12); color: #8E8E93;">
                   <!-- Icon dynamically filled -->
                </button>
                <button id="logout-btn" class="header-btn" title="Déconnexion">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                        <polyline points="16 17 21 12 16 7"></polyline>
                        <line x1="21" y1="12" x2="9" y2="12"></line>
                    </svg>
                </button>
            </div>
        </div>
        <!-- Search Bar in Top Header -->
        <div class="mobile-search-container">
            <input type="text" class="search-bar" id="search-input" placeholder="Rechercher un document">
        </div>
    </div>

    <div class="dashboard-content" id="main-view">
        <!-- Categories View -->
        <div id="categories-view" class="view-transition">
            <div class="categories-grid" id="categories-grid">
                <div style="grid-column: 1 / -1; width: 100%; text-align: center; color: #8E8E93; margin-top: 40px;">Chargement...</div>
            </div>
        </div>

        <!-- Search Results View -->
        <div id="search-results-view" class="hidden view-transition" style="padding-bottom: 20px;">
            <div id="search-results-list"></div>
        </div>

        <!-- Document List View (Category Drill-down) -->
        <div id="document-list" class="hidden">
            <div class="nav-header">
                <div class="back-button" id="back-btn">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:4px;">
                        <path d="M15 18L9 12L15 6"></path>
                    </svg>
                    Retour
                </div>
                <div class="nav-title" id="selected-category-title">Catégorie</div>
            </div>
            
            <!-- Mobile Upload Button (shown only inside a folder) -->
            <button id="mobile-upload-btn" onclick="mobileTriggerUpload()" title="Uploader un fichier"
                style="display:none; position:fixed; bottom:24px; right:24px; z-index:9999; align-items:center; justify-content:center; gap:8px; padding:14px 20px; background:var(--primary-color,#FF3B30); color:white; border:none; border-radius:30px; font-size:16px; font-weight:600; cursor:pointer; box-shadow:0 4px 12px rgba(0,0,0,0.3);">
                📤 Upload
            </button>

            <div id="list-content" class="view-transition" style="padding-bottom: 90px;"></div>
        </div>
    </div>
    `;

    // Event Listeners
    document.getElementById('logout-btn').onclick = () => auth.logout();

    // Back Button Logic
    document.getElementById('back-btn').onclick = () => {
        if (window.mobileCurrentPath === 'auto_detail') {
            window.renderMobileVehiclesList(window.mobileVehicleCache);
            return;
        }
        if (window.mobileCurrentPath === 'parc_detail' || window.mobileCurrentPath === 'ht_torques' || window.mobileCurrentPath === 'planning' || window.mobileCurrentPath === 'friterie' || window.mobileCurrentPath === 'matos_tracking' || window.mobileCurrentPath === 'prevention') {
            window.goHome();
            return;
        }
        if (window.mobileCurrentPath && window.mobileCurrentPath.includes('/')) {
            // Go up one level
            const parts = window.mobileCurrentPath.split('/');
            parts.pop();
            const parentPath = parts.join('/');
            openMobileFolder(parentPath);
        } else {
            window.goHome();
        }
    };

    window.goHome = () => {
        document.getElementById('categories-view').classList.remove('hidden');
        document.getElementById('document-list').classList.add('hidden');
        document.getElementById('search-results-view').classList.add('hidden');
        const searchContainer = document.querySelector('.mobile-search-container');
        if (searchContainer) searchContainer.classList.remove('hidden');

        const navHeader = document.querySelector('.nav-header');
        if (navHeader) navHeader.style.display = 'flex';

        const uploadBtn = document.getElementById('mobile-upload-btn');
        if (uploadBtn) uploadBtn.style.display = 'none';

        window.mobileCurrentPath = null;
        localStorage.removeItem('pouchain_last_app');

        if (window.updateScrollArrowVisibility) {
            setTimeout(window.updateScrollArrowVisibility, 100);
        }
    };

    // Search Logic
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            window.handleMobileSearch(e.target.value);
        });
    }

    // Load Data
    try {
        const session = await auth.getSession();
        const userId = session ? session.user.id : null;

        // Fetch user profile to get preferences
        let profile = null;
        if (session) {
            try {
                const supabaseClient = window.supabase.createClient(config.supabase.url, config.supabase.anonKey);
                window.supabaseClient = supabaseClient;
                window.currentUserId = session.user.id;
                const { data: pData } = await supabaseClient
                    .from('profiles')
                    .select('preferences, secteur, first_name, last_name, societe, assigned_markets')
                    .eq('id', session.user.id)
                    .single();
                profile = pData;
                window.currentUserProfile = pData;

                let currentPreferences = (profile && profile.preferences) || {};
                if (typeof currentPreferences === 'string') currentPreferences = JSON.parse(currentPreferences);

                // Set initial theme
                const isDarkMode = currentPreferences.mobile_dark_mode === true;
                applyMobileTheme(isDarkMode);

                // Theme Toggle Handler
                const themeBtn = document.getElementById('theme-toggle');
                if (themeBtn) {
                    themeBtn.onclick = async () => {
                        const isNewDark = document.documentElement.getAttribute('data-theme') !== 'dark';
                        applyMobileTheme(isNewDark);

                        // Re-render if in planning
                        if (window.mobileCurrentPath === 'planning') {
                            const dateInput = document.querySelector('input[type="date"]');
                            window.renderMobilePlanning(dateInput ? dateInput.value : undefined);
                        }

                        // Save to DB
                        if (window.userRole !== 'visiteur') {
                            currentPreferences.mobile_dark_mode = isNewDark;
                            await supabaseClient
                                .from('profiles')
                                .update({ preferences: currentPreferences })
                                .eq('id', session.user.id);
                        }
                    };
                }
            } catch (prefError) {
                console.warn("Could not handle user profile details for mobile theme", prefError);
            }
        }

        const [files, myVehicle, prevPlans, prevSigs] = await Promise.all([
            api.listFiles(userId),
            api.getMyVehicle(),
            api.getPreventionPlans().catch(() => []),
            api.getPreventionSignatures().catch(() => [])
        ]);
        window.mobileFilesCache = files;
        window.mobileVehicleCache = myVehicle;
        window.prevPlansCount = prevPlans.length;
        window.prevSigsCount = prevSigs.length;
        window.prevPlans = prevPlans;
        window.prevSigs = prevSigs;
        const userSecteur = (profile && profile.secteur) || 'Tout';
        window.generateMobileCategories(files, myVehicle, userSecteur, profile);

        // Auto-open logic (if needed, e.g. from push notification or last used)
        const urlParams = new URLSearchParams(window.location.search);
        const urlTab = urlParams.get('tab');
        const lastApp = localStorage.getItem('pouchain_last_app');
        if (urlTab === 'planning-previsionnel' || lastApp === 'planning_previsionnel') {
            window.renderMobilePlanningPrevisionnel();
        } else if (lastApp === 'planning') {
            window.renderMobilePlanning();
        } else if (lastApp === 'prevention') {
            window.renderMobilePreventionApp(prevPlans, prevSigs);
        }

        // Check for missing vehicle information ONLY for assigned vehicle
        const assignedVehicle = myVehicle ? myVehicle.assigned : null;
        if (assignedVehicle) {
            const missing = [];
            if (!assignedVehicle.next_maintenance_date) missing.push("Date limite d'entretien");
            if (!assignedVehicle.next_maintenance_km && assignedVehicle.next_maintenance_km !== 0) missing.push("Prochain entretien (km)");
            if (!assignedVehicle.toll_card) missing.push("Badge Télépéage");
            if (!assignedVehicle.dkv_card) missing.push("Carte DKV");

            if (missing.length > 0) {
                const dk = document.documentElement.getAttribute('data-theme') === 'dark';
                const bg = dk ? '#1C1C1E' : '#ffffff';
                const textColor = dk ? '#ffffff' : '#1c1c1e';
                const inputBg = dk ? '#2C2C2E' : '#f2f2f7';

                const modal = document.createElement('div');
                modal.className = 'modal-overlay';
                modal.style.zIndex = "10000";

                modal.innerHTML = `
                    <div id="missing-info-alert" class="modal-box" style="padding: 24px; border-radius: 28px; background: ${bg}; width: 90%; max-width: 400px; text-align: center; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
                        <div style="font-size: 40px; margin-bottom: 16px;">⚠️</div>
                        <h2 style="margin-top: 0; margin-bottom: 16px; color: ${textColor}; font-size: 20px;">Informations manquantes</h2>
                        <div style="font-size: 15px; color: #8E8E93; margin-bottom: 24px; line-height: 1.5;">
                            Votre véhicule (<strong>${window.escapeHTML(assignedVehicle.plate_number)}</strong>) requiert la mise à jour des informations suivantes :
                            <ul style="text-align: left; margin-top: 12px; color: ${textColor}; padding-left: 20px;">
                                ${missing.map(m => `<li>${m}</li>`).join('')}
                                ${!assignedVehicle.last_ct_date ? `<li>📅 Contrôle Technique</li>` : ''}
                            </ul>
                        </div>
                        <div style="display: flex; flex-direction: column; gap: 12px;">
                            <button id="fill-info-btn" class="btn-primary" style="width: 100%; padding: 14px; font-size: 16px; background: #FF9500;">Remplir les informations</button>
                            <button class="btn-primary" style="width: 100%; padding: 14px; font-size: 16px; background: #8E8E93;" onclick="this.closest('.modal-overlay').remove()">Ignorer pour le moment</button>
                        </div>
                    </div>
                    
                    <div id="missing-info-form" class="modal-box hidden" style="padding: 24px; border-radius: 28px; background: ${bg}; width: 90%; max-width: 400px; text-align: left; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
                        <h2 style="margin-top: 0; margin-bottom: 20px; color: ${textColor}; font-size: 20px;">Mettre à jour mon auto</h2>
                        
                        <div style="margin-bottom: 16px;">
                            <label style="display: block; font-size: 14px; color: #8E8E93; margin-bottom: 6px;">Date limite d'entretien</label>
                            <input type="date" id="mi-date" style="width: 100%; padding: 12px; border: none; border-radius: 12px; background: ${inputBg}; color: ${textColor};" value="${assignedVehicle.next_maintenance_date || ''}">
                        </div>
                        <div style="margin-bottom: 16px;">
                            <label style="display: block; font-size: 14px; color: #8E8E93; margin-bottom: 6px;">Dernier Contrôle Technique</label>
                            <input type="date" id="mi-ct" style="width: 100%; padding: 12px; border: none; border-radius: 12px; background: ${inputBg}; color: ${textColor};" value="${assignedVehicle.last_ct_date || ''}">
                        </div>
                        <div style="margin-bottom: 16px;">
                            <label style="display: block; font-size: 14px; color: #8E8E93; margin-bottom: 6px;">Prochain entretien (km)</label>
                            <input type="number" id="mi-km" style="width: 100%; padding: 12px; border: none; border-radius: 12px; background: ${inputBg}; color: ${textColor};" placeholder="Ex: 50000" value="${assignedVehicle.next_maintenance_km || ''}">
                        </div>
                        <div style="margin-bottom: 16px;">
                            <label style="display: block; font-size: 14px; color: #8E8E93; margin-bottom: 6px;">Badge Télépéage</label>
                            <input type="text" id="mi-toll" style="width: 100%; padding: 12px; border: none; border-radius: 12px; background: ${inputBg}; color: ${textColor};" placeholder="N° du badge" value="${assignedVehicle.toll_card || ''}">
                        </div>
                        <div style="margin-bottom: 24px;">
                            <label style="display: block; font-size: 14px; color: #8E8E93; margin-bottom: 6px;">Carte DKV</label>
                            <input type="text" id="mi-dkv" style="width: 100%; padding: 12px; border: none; border-radius: 12px; background: ${inputBg}; color: ${textColor};" placeholder="N° de carte" value="${assignedVehicle.dkv_card || ''}">
                        </div>
                        
                        <div style="display: flex; gap: 12px;">
                            <button class="btn-secondary" style="flex: 1;" onclick="document.getElementById('missing-info-form').classList.add('hidden'); document.getElementById('missing-info-alert').classList.remove('hidden');">Retour</button>
                            <button id="mi-save" class="btn-primary" style="flex: 1; background: #FF3B30;">Enregistrer</button>
                        </div>
                    </div>
                `;
                document.body.appendChild(modal);

                document.getElementById('fill-info-btn').onclick = () => {
                    document.getElementById('missing-info-alert').classList.add('hidden');
                    document.getElementById('missing-info-form').classList.remove('hidden');
                };

                const saveBtn = document.getElementById('mi-save');
                saveBtn.onclick = async () => {
                    const maintenanceDate = document.getElementById('mi-date').value;
                    const ctDate = document.getElementById('mi-ct').value;
                    const maintenanceKm = document.getElementById('mi-km').value;
                    const toll = document.getElementById('mi-toll').value;
                    const dkv = document.getElementById('mi-dkv').value;

                    saveBtn.disabled = true;
                    saveBtn.innerText = "Enregistrement...";

                    try {
                        const payload = {
                            id: assignedVehicle.id,
                            next_maintenance_date: maintenanceDate || null,
                            last_ct_date: ctDate || null,
                            next_maintenance_km: maintenanceKm ? parseInt(maintenanceKm) : null,
                            toll_card: toll || null,
                            dkv_card: dkv || null
                        };

                        const response = await fetch(`${config.api.workerUrl}/my-vehicle`, {
                            method: 'PATCH',
                            headers: {
                                'Content-Type': 'application/json',
                                ...(await auth.getAuthHeaders())
                            },
                            body: JSON.stringify(payload)
                        });

                        if (!response.ok) throw new Error(await response.text());

                        modal.remove();
                        window.location.reload();
                    } catch (e) {
                        alert("Erreur: " + e.message);
                        saveBtn.disabled = false;
                        saveBtn.innerText = "Enregistrer";
                    }
                };
            }
        }
    } catch (e) {
        console.error(e);
        document.getElementById('categories-grid').innerHTML = `<div style="color:red; text-align:center;">Erreur de chargement: ${e.message}</div>`;
    }
}
window.debugPushNotifications = async function () {
    let message = "--- Diagnostic Notifications ---\n\n";
    try {
        if (window.Capacitor && window.Capacitor.isNativePlatform()) {
            message += "Plateforme : ANDROID (NATIVE)\n";
            const { PushNotifications } = window.Capacitor.Plugins;
            if (!PushNotifications) throw new Error("Le plugin PushNotifications n'est pas chargé.");

            message += "1. Permissions : ";
            let permStatus = await PushNotifications.checkPermissions();
            message += `${permStatus.receive}\n`;

            if (permStatus.receive !== 'granted') {
                message += "-> Demande permission...\n";
                permStatus = await PushNotifications.requestPermissions();
                message += `Nouvel état: ${permStatus.receive}\n`;
            }

            if (permStatus.receive === 'granted') {
                message += "2. Inscription FCM en cours...\n";

                // On fixe un témoin pour voir si la réponse arrive
                let tokenReceived = false;

                const registrationListener = await PushNotifications.addListener('registration', (token) => {
                    tokenReceived = true;
                    alert("✅ TOKEN REÇU !\n\nVotre jeton Firebase est : \n" + token.value + "\n\n(Ce Token a été envoyé au serveur)");
                    registrationListener.remove();
                });

                const errorListener = await PushNotifications.addListener('registrationError', (err) => {
                    tokenReceived = true;
                    alert("❌ ERREUR FIREBASE :\n\n" + (err.error || "Problème d'enregistrement. Vérifiez vos clés Firebase."));
                    errorListener.remove();
                });

                await PushNotifications.register();

                alert(message + "\nAttente de Firebase pendant 10s...");

                // Timeout au bout de 10s si rien n'est reçu
                setTimeout(() => {
                    if (!tokenReceived) {
                        alert("⏳ Pas de réponse de Firebase au bout de 10s.\n\nVérifiez que :\n- Le téléphone a internet\n- Les services Google Play sont à jour\n- Le fichier google-services.json est le bon.");
                        registrationListener.remove();
                        errorListener.remove();
                    }
                }, 10000);

                return;
            } else {
                throw new Error("Permission refusée.");
            }
        }

        // Web Fallback
        message += "Plateforme : WEB / PWA\n";
        const reg = await navigator.serviceWorker.getRegistration();
        if (!reg) throw new Error("Service Worker absent.");
        const sub = await reg.pushManager.getSubscription();
        if (!sub) {
            await initPushNotifications();
        } else {
            await api.subscribePush(sub);
            alert("✅ Web Push OK.");
        }
    } catch (e) {
        alert(message + "\n❌ ERREUR : " + e.message);
    }
};




