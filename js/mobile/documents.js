import { api } from '../api.js';
import { auth } from '../auth.js';
import config from '../config.js';

function handleMobileSearch(query) {
    const categoriesView = document.getElementById('categories-view');
    const searchView = document.getElementById('search-results-view');
    const docListView = document.getElementById('document-list');

    const normalizedQuery = query.toLowerCase().trim();

    if (normalizedQuery.length === 0) {
        // Show Categories, Hide Search Results
        categoriesView.classList.remove('hidden');
        searchView.classList.add('hidden');
        docListView.classList.add('hidden');
        return;
    }

    // Hide others
    categoriesView.classList.add('hidden');
    docListView.classList.add('hidden');
    searchView.classList.remove('hidden');

    // Filter — exclude internal config files (.keep, .meta_color_*)
    const isInternalFile = (key) => {
        const name = key.split('/').pop();
        return name.endsWith('.keep') || name.startsWith('.meta_') || name.startsWith('.');
    };
    const results = window.mobileFilesCache.filter(f => {
        // Exclude internal files
        if (isInternalFile(f.key)) return false;

        // Exclude archive files/folders
        const fileName = f.key.split('/').pop().toLowerCase();
        const isInArchiveFolder = f.key.toLowerCase().startsWith('archive/');
        if (isInArchiveFolder || fileName.includes('archive')) return false;

        // Exclude reports_photos files
        if (f.key.startsWith('reports_photos/')) return false;

        // Check against search query
        return f.key.toLowerCase().includes(normalizedQuery);
    });
    const container = document.getElementById('search-results-list');
    container.innerHTML = '';

    if (results.length === 0) {
        container.innerHTML = `<div style="text-align:center; color:#8E8E93; margin-top:40px;">Aucun résultat</div>`;
        return;
    }

    results.forEach(doc => {
        renderMobileDocItem(doc, container);
    });
}
window.handleMobileSearch = handleMobileSearch;

function generateMobileCategories(files, myVehicle = null, userSecteur = 'Tout', userProfile = null) {
    const grid = document.getElementById('categories-grid');
    grid.innerHTML = '';

    const categories = new Map();
    const uncategorized = [];

    files.forEach(file => {
        const parts = file.key.split('/');
        if (parts.length > 1) {
            const folder = parts[0];
            if (folder.toLowerCase() === 'archive' || folder === 'reports_photos' || folder.toLowerCase() === 'autres') return;
            if (!categories.has(folder)) {
                categories.set(folder, { files: [], color: null, emoji: '📁', order: 999, row: 1 });
            }
            const catData = categories.get(folder);

            if (parts[1].startsWith('.meta_color_')) {
                catData.color = parts[1].replace('.meta_color_', '#');
            } else if (parts[1].startsWith('.meta_emoji_')) {
                catData.emoji = decodeURIComponent(parts[1].replace('.meta_emoji_', ''));
            } else if (parts[1].startsWith('.meta_order_')) {
                catData.order = parseInt(parts[1].replace('.meta_order_', ''), 10) || 999;
            } else if (parts[1].startsWith('.meta_row_')) {
                catData.row = parseInt(parts[1].replace('.meta_row_', ''), 10) || 1;
            } else if (!file.key.endsWith('.keep') && !parts[1].startsWith('.meta_')) {
                catData.files.push(file);
            }
        } else {
            if (file.key.toLowerCase().includes('archive')) return;
            uncategorized.push(file);
        }
    });

    const colors = ['rgba(255, 255, 255, 0.2)'];
    let colorIdx = 0;

    const sortedCategories = Array.from(categories.entries()).sort((a, b) => {
        if (a[1].row !== b[1].row) return a[1].row - b[1].row;
        if (a[1].order !== b[1].order) return a[1].order - b[1].order;
        return a[0].localeCompare(b[0]);
    });

    // ─── Config secteurs mobiles ────────────────────────────────────────────────
    const SECTOR_FEATURES = {
        'AIA': { planning: true, matos: true, stock: true, stock_gt: true, stock_aspi: true, vehicles: true, friterie: true, parc: true },
        'HT': { planning: true, matos: true, stock: false, stock_gt: false, stock_aspi: false, vehicles: true, friterie: false, parc: false },
        'Tout': { planning: true, matos: true, stock: true, stock_gt: true, stock_aspi: true, vehicles: true, friterie: true, parc: true },
    };
    const features = SECTOR_FEATURES[userSecteur] ?? SECTOR_FEATURES['AIA'];

    const cardsToRender = [];

    // Add S3 folder cards
    sortedCategories.forEach(([catName, data]) => {
        if (catName.toLowerCase() === 'archive') return;
        const color = data.color || colors[colorIdx % colors.length];
        colorIdx++;
        cardsToRender.push({
            id: `folder_${catName}`,
            emoji: data.emoji,
            title: catName,
            color: color,
            onclick: () => openMobileFolder(catName)
        });
    });

    // Add feature cards if enabled
    cardsToRender.push({
        id: 'feat_pointage',
        emoji: '📝',
        title: 'Pointage',
        color: 'linear-gradient(135deg, #FF3B30 0%, #FF9500 100%)',
        onclick: () => window.renderMobilePointage()
    });

    cardsToRender.push({
        id: 'feat_overtime',
        emoji: '⏰',
        title: 'Heures Sup',
        color: '#5856D6',
        onclick: () => window.renderMobileOvertime()
    });

    if (features.matos) {
        cardsToRender.push({
            id: 'feat_matos',
            emoji: '📦',
            title: 'Mon Matos',
            color: '#FF9500',
            onclick: () => renderMobileMaterialRequests()
        });
    }

    if (features.vehicles && myVehicle && (myVehicle.assigned || (myVehicle.common && myVehicle.common.length > 0))) {
        cardsToRender.push({
            id: 'feat_vehicles',
            emoji: '🚗',
            title: 'Véhicules',
            color: '#34C759',
            onclick: () => window.renderMobileVehiclesList(myVehicle)
        });
    }

    if (features.parc) {
        cardsToRender.push({
            id: 'feat_parc',
            emoji: '🚜',
            title: 'Échéances',
            color: '#AF52DE',
            onclick: () => window.renderMobileParc()
        });
    }

    if (features.friterie) {
        cardsToRender.push({
            id: 'feat_friterie',
            emoji: '🍟',
            title: 'Friterie',
            color: '#FFD60A',
            onclick: () => renderMobileFriterie()
        });
    }

    if (features.stock) {
        cardsToRender.push({
            id: 'feat_stock',
            emoji: '📦',
            title: 'Stock ATS',
            color: '#5856D6',
            onclick: () => renderMobileMaterialTracking()
        });
    }

    if (features.stock_gt) {
        cardsToRender.push({
            id: 'feat_stock_gt',
            emoji: '🗄️',
            title: 'Stock GT',
            color: 'linear-gradient(135deg, #5856D6 0%, #3634A3 100%)',
            onclick: () => renderMobileMaterialGTTracking()
        });
    }

    if (features.stock_aspi) {
        cardsToRender.push({
            id: 'feat_stock_aspi',
            emoji: '🧹',
            title: 'Stock Aspi',
            color: 'linear-gradient(135deg, #FF9500 0%, #FF5E3A 100%)',
            onclick: () => renderMobileMaterialAspiTracking()
        });
    }

    if (features.planning) {
        cardsToRender.push({
            id: 'feat_planning',
            emoji: '📅',
            title: 'Planning',
            color: 'linear-gradient(135deg, #5856D6 0%, #AF52DE 100%)',
            onclick: () => renderMobilePlanning()
        });
        cardsToRender.push({
            id: 'feat_planning_previsionnel',
            emoji: '📊',
            title: 'Maint. Prév.',
            color: 'linear-gradient(135deg, #007AFF 0%, #00C7BE 100%)',
            onclick: () => window.renderMobilePlanningPrevisionnel()
        });
    }

    if (userSecteur === 'HT' || userSecteur === 'Tout') {
        cardsToRender.push({
            id: 'feat_torque',
            emoji: '🔧',
            title: 'Couples HT',
            color: 'linear-gradient(135deg, #8E8E93 0%, #636366 100%)',
            onclick: () => window.renderMobileHTTorques()
        });
    }

    cardsToRender.push({
        id: 'feat_settings',
        emoji: '⚙️',
        title: 'Paramètres',
        color: '#8E8E93',
        onclick: () => window.renderMobileSettings()
    });

    cardsToRender.push({
        id: 'feat_conges',
        emoji: '🌴',
        title: 'Congés',
        color: 'linear-gradient(135deg, #00C6FF 0%, #0072FF 100%)',
        onclick: () => window.renderMobileConges()
    });

    cardsToRender.push({
        id: 'feat_reports',
        emoji: '🐛',
        title: 'Bug/amélioration',
        color: 'linear-gradient(135deg, #FF3B30 0%, #AF52DE 100%)',
        onclick: () => window.renderMobileReports()
    });

    const pendingPrevCount = Math.max(0, (window.window.prevPlansCount || 0) - (window.window.prevSigsCount || 0));
    cardsToRender.push({
        id: 'feat_prevention',
        emoji: '📋',
        title: 'Plan prévention',
        color: 'linear-gradient(135deg, #FF9500 0%, #FF2D55 100%)',
        badge: pendingPrevCount > 0 ? pendingPrevCount : null,
        onclick: () => window.renderMobilePreventionApp()
    });

    const userAllowedRTT = userProfile && (
        ((userProfile.first_name || '').toLowerCase().trim() === 'patrick' && (userProfile.last_name || '').toLowerCase().trim() === 'prayez') ||
        ((userProfile.first_name || '').toLowerCase().trim() === 'quentin' && (userProfile.last_name || '').toLowerCase().trim() === 'vert')
    );
    if (userAllowedRTT) {
        cardsToRender.push({
            id: 'feat_rtt',
            emoji: '⚡',
            title: 'RTT',
            color: 'linear-gradient(135deg, #FF9500 0%, #FFCC00 100%)',
            onclick: () => window.renderMobileRTT()
        });
    }

    // Sort according to user preference or default order
    const DEFAULT_ORDER = [
        'feat_pointage',
        'feat_overtime',
        'feat_planning',
        'feat_prevention',
        'feat_matos',
        'feat_vehicles',
        'feat_parc',
        'feat_friterie',
        'feat_stock',
        'feat_stock_gt',
        'feat_stock_aspi',
        'feat_torque',
        'feat_conges',
        'feat_rtt',
        'feat_reports',
        'feat_settings'
    ];

    const savedOrder = (userProfile && userProfile.preferences && userProfile.preferences.apps_order) || [];
    cardsToRender.sort((a, b) => {
        let idxA = savedOrder.indexOf(a.id);
        let idxB = savedOrder.indexOf(b.id);
        
        if (idxA !== -1 && idxB !== -1) return idxA - idxB;
        if (idxA !== -1) return -1;
        if (idxB !== -1) return 1;
        
        let defA = DEFAULT_ORDER.indexOf(a.id);
        let defB = DEFAULT_ORDER.indexOf(b.id);
        if (defA !== -1 && defB !== -1) return defA - defB;
        if (defA !== -1) return -1;
        if (defB !== -1) return 1;
        
        return a.title.localeCompare(b.title);
    });

    let blockNextClick = false;

    // Render the cards
    grid.innerHTML = '';
    cardsToRender.forEach(c => {
        const card = document.createElement('div');
        card.className = 'category-card';
        card.setAttribute('data-id', c.id);
        card.innerHTML = `
            <div style="position: relative; display: inline-block;">
                <div class="category-icon" style="background: ${c.color};">${c.emoji}</div>
                ${c.badge ? `<div class="category-badge" style="position: absolute; top: 2px; right: 2px; background: #FF3B30; color: white; border-radius: 11px; min-width: 22px; height: 22px; padding: 0 6px; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: bold; border: 2px solid var(--background-color, #f2f2f7); z-index: 10; box-sizing: border-box; animation: pulse-badge 1.8s infinite ease-in-out;">${c.badge}</div>` : ''}
            </div>
            <div class="category-title" style="font-weight:bold;">${c.title}</div>
        `;
        
        card.onclick = (e) => {
            if (blockNextClick) {
                blockNextClick = false;
                e.preventDefault();
                e.stopPropagation();
                return;
            }
            if (grid.classList.contains('editing-mode') || activeDragElement || editMode) {
                e.preventDefault();
                e.stopPropagation();
                return;
            }
            c.onclick();
        };
        
        grid.appendChild(card);
    });

    // Blinking red arrow indicating off-screen notifications
    let arrow = document.getElementById('scroll-notif-arrow');
    if (!arrow) {
        arrow = document.createElement('div');
        arrow.id = 'scroll-notif-arrow';
        arrow.style.cssText = 'position: fixed; bottom: 85px; left: 50%; transform: translateX(-50%); display: none; z-index: 9999; animation: fade-red-arrow 1.5s infinite ease-in-out; pointer-events: auto; cursor: pointer; filter: drop-shadow(0 0 4px white) drop-shadow(0 2px 6px rgba(255,59,48,0.4));';
        arrow.innerHTML = `<svg viewBox="0 0 24 24" width="80" height="80" fill="none" stroke="#FF3B30" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9l8 6 8-6" /></svg>`;
        arrow.onclick = (e) => {
            e.stopPropagation();
            const cards = document.querySelectorAll('.category-card');
            for (const card of cards) {
                const badgeEl = card.querySelector('.category-badge');
                if (badgeEl && badgeEl.textContent && parseInt(badgeEl.textContent) > 0) {
                    card.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    break;
                }
            }
        };
        document.body.appendChild(arrow);
    }

    window.updateScrollArrowVisibility = function() {
        const arrowEl = document.getElementById('scroll-notif-arrow');
        if (!arrowEl) return;

        // Hide arrow if a modal/app overlay is currently open
        if (document.querySelector('.modal-overlay') || document.querySelector('.modal')) {
            arrowEl.style.display = 'none';
            return;
        }

        const categoriesView = document.getElementById('categories-view');
        if (categoriesView && categoriesView.classList.contains('hidden')) {
            arrowEl.style.display = 'none';
            return;
        }

        const cards = document.querySelectorAll('.category-card');
        let hasHiddenBadgeBelow = false;
        const viewportHeight = window.innerHeight;

        cards.forEach(card => {
            const badgeEl = card.querySelector('.category-badge');
            if (badgeEl && badgeEl.textContent && parseInt(badgeEl.textContent) > 0) {
                const rect = card.getBoundingClientRect();
                if (rect.top > viewportHeight - 110) {
                    hasHiddenBadgeBelow = true;
                }
            }
        });

        if (hasHiddenBadgeBelow) {
            arrowEl.style.display = 'flex';
        } else {
            arrowEl.style.display = 'none';
        }
    };

    window.removeEventListener('scroll', window.updateScrollArrowVisibility);
    window.removeEventListener('resize', window.updateScrollArrowVisibility);
    window.addEventListener('scroll', window.updateScrollArrowVisibility, { passive: true });
    window.addEventListener('resize', window.updateScrollArrowVisibility, { passive: true });

    // Monitor modal opening/closing (childList on body) and categories-view class changes
    if (window.scrollArrowObserver) {
        window.scrollArrowObserver.disconnect();
    }
    window.scrollArrowObserver = new MutationObserver(() => {
        if (window.updateScrollArrowVisibility) window.updateScrollArrowVisibility();
    });
    window.scrollArrowObserver.observe(document.body, { childList: true });
    
    const catView = document.getElementById('categories-view');
    if (catView) {
        window.scrollArrowObserver.observe(catView, { attributes: true, attributeFilter: ['class'] });
    }

    setTimeout(() => {
        if (window.updateScrollArrowVisibility) window.updateScrollArrowVisibility();
    }, 200);

    // Long press and Drag & Drop initialization
    let editMode = false;
    let longPressTimeout = null;
    let activeDragElement = null;
    let dragStartX = 0;
    let dragStartY = 0;
    let touchOffsetX = 0;
    let touchOffsetY = 0;
    let placeholder = null;

    const blockMultiTouch = (e) => {
        if (activeDragElement && !activeDragElement.contains(e.target)) {
            e.preventDefault();
            e.stopPropagation();
        }
    };

    function enterEditMode() {
        if (editMode) return;
        editMode = true;
        grid.classList.add('editing-mode');
        
        document.querySelectorAll('.category-card').forEach(card => {
            if (card !== activeDragElement) {
                card.classList.add('wiggle');
            }
        });

        // Register window-level capture phase event blockers to freeze all other elements
        window.addEventListener('touchstart', blockMultiTouch, { capture: true, passive: false });
        window.addEventListener('touchmove', blockMultiTouch, { capture: true, passive: false });
        window.addEventListener('touchend', blockMultiTouch, { capture: true, passive: false });
        window.addEventListener('click', blockMultiTouch, { capture: true });
    }

    async function exitEditMode() {
        if (!editMode) return;
        editMode = false;
        grid.classList.remove('editing-mode');
        
        document.querySelectorAll('.category-card').forEach(card => {
            card.classList.remove('wiggle');
            card.classList.remove('dragging');
        });

        // Remove window-level capture phase event blockers
        window.removeEventListener('touchstart', blockMultiTouch, { capture: true });
        window.removeEventListener('touchmove', blockMultiTouch, { capture: true });
        window.removeEventListener('touchend', blockMultiTouch, { capture: true });
        window.removeEventListener('click', blockMultiTouch, { capture: true });
        
        const newOrder = Array.from(document.querySelectorAll('.category-card')).map(card => card.getAttribute('data-id'));
        
        if (window.supabaseClient && userProfile) {
            try {
                let currentPreferences = userProfile.preferences || {};
                if (typeof currentPreferences === 'string') currentPreferences = JSON.parse(currentPreferences);
                
                currentPreferences.apps_order = newOrder;
                userProfile.preferences = currentPreferences;
                
                const userId = window.currentUserId || (window.supabaseClient.auth.session && window.supabaseClient.auth.session()?.user?.id);
                if (userId) {
                    const role = window.userRole || await auth.getUserRole();
                    if (role !== 'visiteur') {
                        await window.supabaseClient
                            .from('profiles')
                            .update({ preferences: currentPreferences })
                            .eq('id', userId);
                    }
                }
            } catch (err) {
                console.error('Error saving app order preferences:', err);
            }
        }
    }

    document.querySelectorAll('.category-card').forEach(card => {
        card.addEventListener('touchstart', (e) => {
            if (editMode || activeDragElement || e.touches.length > 1) return;
            const touch = e.touches[0];
            dragStartX = touch.clientX;
            dragStartY = touch.clientY;
            
            longPressTimeout = setTimeout(() => {
                if (activeDragElement || editMode) return;
                activeDragElement = card;
                
                const rect = card.getBoundingClientRect();
                const width = rect.width;
                const height = rect.height;
                
                touchOffsetX = dragStartX - rect.left;
                touchOffsetY = dragStartY - rect.top;
                
                // Create placeholder
                placeholder = document.createElement('div');
                placeholder.className = 'category-card placeholder';
                placeholder.style.width = `${width}px`;
                placeholder.style.height = `${height}px`;
                placeholder.style.visibility = 'hidden';
                
                // Insert placeholder
                card.parentNode.insertBefore(placeholder, card);
                
                // Set card style to float
                card.style.position = 'fixed';
                card.style.width = `${width}px`;
                card.style.height = `${height}px`;
                card.style.left = `${rect.left}px`;
                card.style.top = `${rect.top}px`;
                card.style.margin = '0';
                card.style.zIndex = '10000';
                card.classList.add('dragging');
                
                enterEditMode();
                if (navigator.vibrate) navigator.vibrate(50);
            }, 600);
        }, { passive: true });
        
        card.addEventListener('touchmove', (e) => {
            const touch = e.touches[0];
            
            if (!activeDragElement) {
                if (Math.abs(touch.clientX - dragStartX) > 10 || Math.abs(touch.clientY - dragStartY) > 10) {
                    clearTimeout(longPressTimeout);
                }
                return;
            }
            
            e.preventDefault();
            
            const left = touch.clientX - touchOffsetX;
            const top = touch.clientY - touchOffsetY;
            card.style.left = `${left}px`;
            card.style.top = `${top}px`;
            
            const elementUnderTouch = document.elementFromPoint(touch.clientX, touch.clientY);
            if (!elementUnderTouch) return;
            
            const targetCard = elementUnderTouch.closest('.category-card');
            if (targetCard && targetCard !== card && targetCard !== placeholder) {
                const cards = Array.from(document.querySelectorAll('.category-card:not(.dragging)'));
                const placeholderIndex = cards.indexOf(placeholder);
                const targetIndex = cards.indexOf(targetCard);
                
                const allCardsToAnimate = Array.from(document.querySelectorAll('.category-card'));
                const rects = allCardsToAnimate.map(c => c.getBoundingClientRect());
                
                if (placeholderIndex < targetIndex) {
                    placeholder.parentNode.insertBefore(placeholder, targetCard.nextSibling);
                } else {
                    placeholder.parentNode.insertBefore(placeholder, targetCard);
                }
                
                allCardsToAnimate.forEach((c, index) => {
                    if (c === card) return;
                    
                    const oldRect = rects[index];
                    const newRect = c.getBoundingClientRect();
                    
                    const dX = oldRect.left - newRect.left;
                    const dY = oldRect.top - newRect.top;
                    
                    if (dX !== 0 || dY !== 0) {
                        c.style.transition = 'none';
                        c.style.transform = `translate3d(${dX}px, ${dY}px, 0)`;
                        c.offsetHeight;
                        c.style.transition = 'transform 0.22s cubic-bezier(0.2, 0, 0.2, 1)';
                        c.style.transform = 'translate3d(0, 0, 0)';
                    }
                });
            }
        }, { passive: false });
        
        card.addEventListener('touchend', (e) => {
            clearTimeout(longPressTimeout);
            
            if (activeDragElement === card) {
                blockNextClick = true;
                setTimeout(() => { blockNextClick = false; }, 350);
                
                card.classList.remove('dragging');
                card.style.position = '';
                card.style.width = '';
                card.style.height = '';
                card.style.left = '';
                card.style.top = '';
                card.style.margin = '';
                card.style.zIndex = '';
                
                if (placeholder && placeholder.parentNode) {
                    placeholder.parentNode.replaceChild(card, placeholder);
                }
                placeholder = null;
                activeDragElement = null;
                
                exitEditMode();
            }
        }, { passive: true });
    });
}
window.generateMobileCategories = generateMobileCategories;

function showMobileRootFiles(docs) {
    window.mobileCurrentPath = "Autres"; // Fake path for UI
    renderMobileList("Autres", [], docs);
}
window.showMobileRootFiles = showMobileRootFiles;

async function openMobileFolder(folderPath) {
    window.mobileCurrentPath = folderPath;
    const title = folderPath.split('/').pop();

    // 1. Immediate Render from Cache (Fast)
    renderFromCache(folderPath, title);

    // 2. Background Refresh from API (ensure latest data)
    try {
        const freshFiles = await api.listFiles();
        window.mobileFilesCache = freshFiles;
        // Re-render only if the user is still on this folder
        if (window.mobileCurrentPath === folderPath) {
            renderFromCache(folderPath, title);
        }
    } catch (e) {
        console.warn("Background refresh failed:", e);
    }
}
window.openMobileFolder = openMobileFolder;

function renderFromCache(folderPath, title) {
    const currentPrefix = folderPath + '/';
    const subfolders = new Set();
    const files = [];

    window.mobileFilesCache.forEach(f => {
        if (f.key.startsWith('reports_photos/')) return;
        if (!f.key.startsWith(currentPrefix)) return;

        const relative = f.key.substring(currentPrefix.length);
        const parts = relative.split('/');

        if (parts.length > 1) {
            if (parts[0]) subfolders.add(parts[0]);
        } else {
            const name = parts[0];
            if (name && !name.startsWith('.meta') && !name.endsWith('.keep')) {
                files.push(f);
            }
        }
    });

    renderMobileList(title, Array.from(subfolders).sort(), files);
}

function renderMobileList(title, subfolders, files) {
    // Switch Views
    document.getElementById('categories-view').classList.add('hidden');
    document.getElementById('search-results-view').classList.add('hidden');
    document.querySelector('.mobile-search-container').classList.add('hidden');
    document.getElementById('document-list').classList.remove('hidden');

    // Update Title
    document.getElementById('selected-category-title').innerText = title;

    // Show upload button if inside a real folder (not the fake 'Autres' view)
    const uploadBtn = document.getElementById('mobile-upload-btn');
    if (uploadBtn) {
        uploadBtn.style.display = window.mobileCurrentPath && window.mobileCurrentPath !== 'Autres' ? 'flex' : 'none';
    }

    const container = document.getElementById('list-content');
    container.innerHTML = '';

    // Drag & Drop zone on container
    container.ondragover = (e) => { e.preventDefault(); container.style.outline = '2px dashed var(--primary-color, #FF3B30)'; };
    container.ondragleave = () => { container.style.outline = ''; };
    container.ondrop = async (e) => {
        e.preventDefault();
        container.style.outline = '';
        if (e.dataTransfer.files.length > 0 && window.mobileCurrentPath && window.mobileCurrentPath !== 'Autres') {
            const filesToUpload = await window.promptForFileNamesAndReturn(e.dataTransfer.files);
            window.addToUploadQueue(filesToUpload, window.mobileCurrentPath + '/');
        }
    };

    // Render Subfolders
    subfolders.forEach(sub => {
        const item = document.createElement('div');
        item.className = 'document-item';
        item.style.cursor = 'pointer';
        item.innerHTML = `
            <div style="display:flex; align-items:center;">
                <div style="font-size:24px; margin-right:12px;">📁</div>
                <div class="document-info">
                    <span class="document-name" style="font-weight:600">${sub}</span>
                </div>
            </div>
            <div style="color:var(--primary-color)">›</div>
        `;
        item.onclick = () => openMobileFolder(window.mobileCurrentPath + '/' + sub);
        container.appendChild(item);
    });

    // Render Files
    files.forEach(doc => {
        renderMobileDocItem(doc, container);
    });

    if (subfolders.length === 0 && files.length === 0) {
        container.innerHTML = `
            <div style="text-align:center; padding:40px; color:#8E8E93">
                <div style="font-size:48px; margin-bottom:12px;">📂</div>
                <div style="font-weight:600; margin-bottom:8px;">Dossier vide</div>
                <div style="font-size:13px; margin-bottom:20px;">Appuyez sur "Upload" ou glissez des fichiers ici</div>
            </div>`;
    }
}

function renderMobileDocItem(doc, container) {
    const item = document.createElement('div');
    item.className = 'document-item';
    item.onclick = () => window.openFile(doc.key);

    const fullName = doc.key.split('/').pop();
    const extDot = fullName.includes('.') ? '.' + fullName.split('.').pop() : '';
    const baseName = fullName.includes('.') ? fullName.slice(0, fullName.lastIndexOf('.')) : fullName;
    const maxBase = 25 - 3 - extDot.length; // 25 total − '...' − extension
    const displayName = fullName.length > 25
        ? baseName.substring(0, Math.max(maxBase, 1)) + '...' + extDot
        : fullName;
    const ext = extDot.replace('.', '').toLowerCase();
    let icon = '📄';
    if (['pdf'].includes(ext)) icon = '📕';
    if (['jpg', 'jpeg', 'png', 'gif'].includes(ext)) icon = '🖼️';
    if (['doc', 'docx'].includes(ext)) icon = '📘';
    if (['xls', 'xlsx', 'csv'].includes(ext)) icon = '📊';

    item.innerHTML = `
        <div style="display:flex; align-items:center;">
            <div style="font-size:24px; margin-right:12px;">${icon}</div>
            <div class="document-info">
                <span class="document-name" title="${fullName}">${displayName}</span>
                <span class="document-meta">${(doc.size / 1024).toFixed(1)} KB</span>
            </div>
        </div>
        <div class="doc-download-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
            </svg>
        </div>
    `;
    container.appendChild(item);
}


// --- Admin View (Desktop) ---
let adminCurrentFolder = null; // Track current view
let adminFilesCache = []; // Cache files to avoid re-fetching
let currentAdminSession = null;

function updateMobileUploadOverlay() {
    const overlay = document.getElementById('mobile-upload-overlay');
    if (!overlay) return;

    const pending = uploadQueue.filter(i => i.status === 'pending').length;
    const uploading = uploadQueue.filter(i => i.status === 'uploading').length;
    const success = uploadQueue.filter(i => i.status === 'success').length;
    const errors = uploadQueue.filter(i => i.status === 'error').length;
    const total = uploadQueue.length;
    const done = success + errors;
    const globalProgress = total > 0 ? Math.round((done / total) * 100) : 0;
    const isAllDone = done === total && total > 0;

    overlay.innerHTML = `
        <div style="text-align:center; color:white;">
            <div style="font-size:48px; margin-bottom:12px;">${isAllDone ? (errors > 0 ? '⚠️' : '✅') : '📤'}</div>
            <div style="font-size:20px; font-weight:700; margin-bottom:6px;">
                ${isAllDone ? (errors > 0 ? 'Upload terminé avec des erreurs' : 'Upload terminé !') : 'Upload en cours...'}
            </div>
            ${!isAllDone ? `<div style="font-size:13px; color:rgba(255,255,255,0.7); margin-bottom:20px;">⚠️ Veuillez ne pas quitter cette page</div>` : ''}
        </div>

        <div style="width:100%; max-width:400px; background:rgba(255,255,255,0.15); border-radius:12px; height:10px; overflow:hidden;">
            <div style="height:100%; width:${globalProgress}%; background:var(--primary-color, #FF3B30); border-radius:12px; transition:width 0.3s ease;"></div>
        </div>
        <div style="font-size:13px; color:rgba(255,255,255,0.8);">${done} / ${total} fichier(s)</div>

        <div style="width:100%; max-width:400px; display:flex; flex-direction:column; gap:10px; max-height:40vh; overflow-y:auto;">
            ${uploadQueue.map(item => {
        const statusIcon = item.status === 'success' ? '✅' : item.status === 'error' ? '❌' : item.status === 'uploading' ? '⏳' : '🕐';
        const progressBar = item.status === 'uploading'
            ? `<div style="background:rgba(255,255,255,0.2); border-radius:6px; height:6px; margin-top:5px;"><div style="height:100%; width:${item.progress}%; background:white; border-radius:6px; transition:width 0.2s;"></div></div>`
            : '';
        return `
                <div style="background:rgba(255,255,255,0.12); border-radius:10px; padding:10px 14px;">
                    <div style="display:flex; gap:8px; align-items:center; color:white; font-size:13px;">
                        <span>${statusIcon}</span>
                        <span style="flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${item.file.name}</span>
                        <span style="font-size:11px; opacity:0.7;">${item.progress}%</span>
                    </div>
                    ${progressBar}
                    ${item.error ? `<div style="font-size:11px; color:#FF6B6B; margin-top:4px;">${item.error}</div>` : ''}
                </div>`;
    }).join('')}
        </div>

        ${isAllDone ? `<button onclick="closeMobileUploadOverlay()" style="margin-top:8px; padding:14px 40px; background:var(--primary-color, #FF3B30); color:white; border:none; border-radius:24px; font-size:16px; font-weight:700; cursor:pointer;">Fermer</button>` : ''}
    `;
}

function renderUploadQueue() {
    // Never show the desktop widget on mobile — we have the overlay instead
    if (window.isMobileView) return;

    let container = document.getElementById('upload-queue-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'upload-queue-container';
        container.className = 'upload-queue-container hidden';
        document.body.appendChild(container);
    }

    // Visibility
    const activeCount = uploadQueue.length;
    if (activeCount === 0) {
        container.classList.add('hidden');
        return;
    }
    container.classList.remove('hidden');

    // Minimized State
    if (isQueueMinimized) {
        container.classList.add('minimized');
    } else {
        container.classList.remove('minimized');
    }

    // Header Stats
    const pending = uploadQueue.filter(i => ['pending', 'uploading'].includes(i.status)).length;
    const title = pending > 0 ? `Envoi de ${pending} fichier(s)...` : `Uploads terminés`;
    const icon = pending > 0 ? '⏳' : '✅';

    container.innerHTML = `
        <div class="upload-queue-header" onclick="toggleQueueMinimize()">
            <div style="display:flex; align-items:center; gap:8px;">
                <span>${icon}</span>
                <span>${title}</span>
            </div>
            <div style="display:flex; align-items:center; gap:12px;">
                <span style="font-size:18px;">${isQueueMinimized ? '🔼' : '🔽'}</span>
                <span onclick="event.stopPropagation(); closeUploadQueue()" style="font-size:18px;" title="Fermer">✖️</span>
            </div>
        </div>
        <div class="upload-queue-list">
            ${uploadQueue.map(item => {
        let statusIcon = '⏳';
        let statusText = `${item.progress}%`;
        let statusClass = '';

        if (item.status === 'pending') { statusText = 'En attente...'; statusIcon = '✋'; }
        if (item.status === 'uploading') { statusClass = 'uploading'; } // could animate
        if (item.status === 'success') { statusText = 'OK'; statusIcon = '✅'; statusClass = 'success'; }
        if (item.status === 'error') { statusText = 'Erreur'; statusIcon = '⚠️'; statusClass = 'error'; }

        return `
                <div class="upload-queue-item ${statusClass}">
                    <div class="file-icon">📄</div>
                    <div class="file-info">
                        <div class="file-name" title="${item.file.name}">${item.file.name}</div>
                        <div class="file-progress-bar">
                            <div class="file-progress-fill" style="width: ${item.progress}%"></div>
                        </div>
                        <div class="file-status">
                            <span>${statusText}</span>
                            ${item.error ? `<span style="color:var(--danger)" title="${item.error}">Info</span>` : ''}
                        </div>
                    </div>
                </div>
                `;
    }).join('')}
        </div>
        `;
}

// Helper to prompt for renaming files before upload
window.promptForFileNamesAndReturn = async function (files) {
    if (!window.isMobileView) {
        return Array.from(files);
    }
    let resultFiles = [];
    const askName = (file) => new Promise(resolve => {
        const originalName = file.name;
        const ext = originalName.includes('.') ? "." + originalName.split('.').pop() : "";
        const baseName = originalName.includes('.') ? originalName.slice(0, originalName.lastIndexOf('.')) : originalName;

        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        overlay.id = 'rename-upload-modal';
        overlay.style.zIndex = '100005';
        overlay.innerHTML = `
            <div class="modal-box">
                <div class="modal-header">Nom du document</div>
                <p style="font-size:14px; color:#666; margin-bottom:12px;">Voulez-vous renommer ce document avant l'envoi ?</p>
                <div class="form-group">
                    <input type="text" class="form-input" id="rename-upload-input" value="${baseName.replace(/"/g, '&quot;')}" autofocus>
                </div>
                <div class="modal-actions">
                    <button class="btn-secondary" id="rename-upload-cancel">Garder l'original</button>
                    <button class="btn-primary" id="rename-upload-confirm">Valider</button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);

        const inputEl = document.getElementById('rename-upload-input');
        inputEl.focus();
        inputEl.select();

        // Allow Enter key to confirm
        inputEl.onkeydown = (e) => {
            if (e.key === 'Enter') document.getElementById('rename-upload-confirm').click();
        };

        const cleanup = () => {
            const el = document.getElementById('rename-upload-modal');
            if (el) el.remove();
        };

        document.getElementById('rename-upload-cancel').onclick = () => {
            cleanup();
            resolve(file); // keep original
        };

        document.getElementById('rename-upload-confirm').onclick = () => {
            const newName = inputEl.value.trim();
            cleanup();
            if (newName && newName !== baseName) {
                // Ensure the extension isn't duplicated if user typed it
                let finalName = newName;
                if (!finalName.toLowerCase().endsWith(ext.toLowerCase())) {
                    finalName += ext;
                }
                const renamedFile = new File([file], finalName, { type: file.type });
                resolve(renamedFile);
            } else {
                resolve(file);
            }
        };
    });

    for (let i = 0; i < files.length; i++) {
        const renamed = await askName(files[i]);
        resultFiles.push(renamed);
    }

    return resultFiles;
};

// --- Upload Queue System ---
const uploadQueue = []; // Items: {id, file, prefix, status: 'pending'|'uploading'|'success'|'error', progress: 0, error: null }
let isQueueProcessing = false;
let isQueueMinimized = false;
let mobileUploadActive = false; // Track mobile upload state

// --- Prevent page close during mobile upload ---
window.addEventListener('beforeunload', (e) => {
    if (window.isMobileView && mobileUploadActive) {
        e.preventDefault();
        e.returnValue = 'Un upload est en cours. Quitter la page pourrait corrompre vos fichiers.';
        return e.returnValue;
    }
});

// Mobile blocking overlay functions
function showMobileUploadOverlay() {
    let overlay = document.getElementById('mobile-upload-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'mobile-upload-overlay';
        overlay.style.cssText = `
            position: fixed; inset: 0; z-index: 99999;
            background: rgba(0,0,0,0.85);
            display: flex; flex-direction: column;
            align-items: center; justify-content: center;
            padding: 32px 24px; gap: 20px;
        `;
        document.body.appendChild(overlay);
    }
    overlay.style.display = 'flex';
    updateMobileUploadOverlay();
}

window.closeMobileUploadOverlay = function () {
    const overlay = document.getElementById('mobile-upload-overlay');
    if (overlay) overlay.style.display = 'none';
    mobileUploadActive = false;
};

window.addToUploadQueue = function (files, prefix) {
    // 1. Add to queue
    Array.from(files).forEach(file => {
        uploadQueue.push({
            id: Date.now() + Math.random().toString(36).substr(2, 9),
            file: file,
            prefix: prefix,
            status: 'pending',
            progress: 0
        });
    });

    // 2. On mobile: show blocking overlay. On desktop: show regular queue widget.
    if (window.isMobileView) {
        mobileUploadActive = true;
        showMobileUploadOverlay();
    } else {
        isQueueMinimized = false;
        renderUploadQueue();
    }

    // 3. Start processing if not already
    if (!isQueueProcessing) {
        processUploadQueue();
    }
};

async function processUploadQueue() {
    if (isQueueProcessing) return;
    isQueueProcessing = true;

    while (true) {
        // Find next pending
        const item = uploadQueue.find(i => i.status === 'pending');
        if (!item) break; // All done

        // Update Status
        item.status = 'uploading';
        if (window.isMobileView) {
            updateMobileUploadOverlay();
        } else {
            renderUploadQueue();
        }

        try {
            await api.uploadFile(item.file, item.prefix, (p) => {
                item.progress = p;
                if (window.isMobileView) {
                    updateMobileUploadOverlay();
                } else {
                    renderUploadQueue();
                }
            });
            item.status = 'success';
            item.progress = 100;

            const targetFolder = item.prefix ? item.prefix.slice(0, -1) : null;

            // Refresh mobile view if on the right folder
            if (window.mobileCurrentPath && window.mobileCurrentPath === targetFolder) {
                try {
                    const session = await auth.getSession();
                    const userId = session ? session.user.id : null;
                    const freshFiles = await api.listFiles(userId);
                    window.mobileFilesCache = freshFiles;
                    openMobileFolder(window.mobileCurrentPath);
                } catch (refreshErr) {
                    console.warn('Mobile folder refresh failed:', refreshErr);
                }
            }

        } catch (e) {
            console.error("Upload error", e);
            item.status = 'error';
            item.error = e.message;
        }

        if (window.isMobileView) {
            updateMobileUploadOverlay();
        } else {
            renderUploadQueue();
        }
    }

    isQueueProcessing = false;
}

window.toggleQueueMinimize = function () {
    isQueueMinimized = !isQueueMinimized;
    renderUploadQueue();
};

window.closeUploadQueue = function () {
    for (let i = uploadQueue.length - 1; i >= 0; i--) {
        if (['success', 'error'].includes(uploadQueue[i].status)) {
            uploadQueue.splice(i, 1);
        }
    }
    renderUploadQueue();
};

// Redirect triggers to new Queue
window.triggerUpload = function (folder) {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.onchange = async (e) => {
        if (e.target.files.length > 0) {
            const filesToUpload = await window.promptForFileNamesAndReturn(e.target.files);
            window.addToUploadQueue(filesToUpload, folder ? folder + "/" : "");
        }
    };
    input.click();
};

// Mobile upload trigger — uses mobileCurrentPath as the folder
window.mobileTriggerUpload = function () {
    if (!window.mobileCurrentPath || window.mobileCurrentPath === 'Autres') return;
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.onchange = async (e) => {
        if (e.target.files.length > 0) {
            const filesToUpload = await window.promptForFileNamesAndReturn(e.target.files);
            window.addToUploadQueue(filesToUpload, window.mobileCurrentPath + "/");
        }
    };
    input.click();
};