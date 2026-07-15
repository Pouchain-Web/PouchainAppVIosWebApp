import { api } from '../api.js';
import { auth } from '../auth.js';
import config from '../config.js';

window.renderMobilePreventionApp = async function() {
    document.getElementById('categories-view').classList.add('hidden');
    document.getElementById('search-results-view').classList.add('hidden');
    const searchContainer = document.querySelector('.mobile-search-container');
    if (searchContainer) searchContainer.classList.add('hidden');
    document.getElementById('document-list').classList.remove('hidden');
    document.getElementById('selected-category-title').innerText = "Plan de prévention";
    
    window.mobileCurrentPath = "prevention";
    localStorage.setItem('pouchain_last_app', 'prevention');
    
    const container = document.getElementById('list-content');
    container.innerHTML = `
        <div style="display:flex; justify-content:center; padding: 40px;">
            <div class="loader" style="border: 3px solid rgba(0,0,0,0.1); border-top-color: var(--primary-color); border-radius: 50%; width: 30px; height: 30px; animation: spin 1s linear infinite;"></div>
        </div>
    `;

    try {
        const [plans, signatures] = await Promise.all([
            api.getPreventionPlans().catch(() => []),
            api.getPreventionSignatures().catch(() => [])
        ]);

        window.window.prevPlansCount = plans.length;
        window.window.prevSigsCount = signatures.length;
        window.window.prevPlans = plans;
        window.window.prevSigs = signatures;

        const dk = document.documentElement.getAttribute('data-theme') === 'dark';
        const bg = dk ? '#1c1c1e' : '#ffffff';
        const textColor = dk ? '#ffffff' : '#000000';

        if (plans.length === 0) {
            container.innerHTML = `
                <div style="text-align:center; padding: 40px; color:#8E8E93;">
                    <div style="font-size: 48px; margin-bottom: 15px;">📋</div>
                    Aucun plan de prévention disponible.
                </div>
            `;
            return;
        }

        let html = `
            <div style="padding: 15px 15px 0 15px;">
                <button class="btn-primary" style="width:100%; padding:14px; font-weight:bold; border-radius:14px; background:var(--primary-color); display:flex; align-items:center; justify-content:center; gap:8px;" onclick="window.openSubcontractorBulkSignModal()">
                    🤝 Faire signer un sous-traitant
                </button>
            </div>
            <div style="padding:15px; display:flex; flex-direction:column; gap:12px;">
        `;
        plans.forEach(p => {
            const sig = signatures.find(s => s.plan_id === p.id);
            const statusColor = sig ? 'var(--success-color)' : 'var(--danger-color)';
            const statusText = sig ? `✓ Signé le ${new Date(sig.signed_at).toLocaleDateString()}` : '✕ À signer';

            html += `
                <div style="background:${bg}; padding:16px; border-radius:16px; box-shadow: var(--shadow-card); display:flex; justify-content:space-between; align-items:center;" onclick="window.openPreventionPlanDetail('${p.id}')">
                    <div style="flex:1; margin-right: 15px;">
                        <h4 style="margin:0; font-size:16px; color:${textColor};">${window.escapeHTML(p.title)}</h4>
                        <div style="font-size:12px; color:#8E8E93; margin-top:4px;">Secteur : ${p.secteur}</div>
                    </div>
                    <div style="color:${statusColor}; font-weight:700; font-size:13px; white-space:nowrap;">
                        ${statusText}
                    </div>
                </div>
            `;
        });
        html += `</div>`;
        container.innerHTML = html;
    } catch(e) {
        container.innerHTML = `<div style="color:red; padding:20px;">Erreur : ${e.message}</div>`;
    }
};

window.openPreventionPlanDetail = function(planId) {
    const plan = window.window.prevPlans.find(p => p.id === planId);
    const sig = window.window.prevSigs.find(s => s.plan_id === planId);
    
    if (!plan) return;

    const dk = document.documentElement.getAttribute('data-theme') === 'dark';
    const bg = dk ? '#1C1C1E' : '#FFFFFF';
    const textColor = dk ? '#FFFFFF' : '#000000';
    const inputBg = dk ? '#2C2C2E' : '#f2f2f7';

    const pdfUrl = `${config.api.workerUrl}/get/${encodeURIComponent(plan.pdf_url)}`;
    const googleViewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(pdfUrl)}&embedded=true`;

    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.style.zIndex = "100020";

    modal.innerHTML = `
        <div id="prevention-modal-body" class="modal-box" style="padding: 0; border-radius: 28px; width: 95%; max-width: 600px; max-height: 90vh; display: flex; flex-direction: column; overflow-y: auto; background: ${bg}; position: relative;">
            <div style="position: sticky; top: 0; background: ${bg}; padding: 20px; border-bottom: 1px solid rgba(142,142,147,0.2); display:flex; justify-content:space-between; align-items:center; z-index:100;">
                <h3 style="margin: 0; color: ${textColor}; font-size: 18px; max-width:80%; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${window.escapeHTML(plan.title)}</h3>
                <button onclick="this.closest('.modal-overlay').remove()" style="background: rgba(0,0,0,0.05); border: none; color: ${textColor}; width: 32px; height: 32px; border-radius: 16px; cursor: pointer; font-size:18px; font-weight:bold;">✕</button>
            </div>
            
            <div style="padding: 20px; display:flex; flex-direction:column; gap:16px;">
                <p style="font-size:13px; color:#8E8E93; margin:0;">
                    Veuillez lire le plan de prévention ci-dessous. Faites défiler cette fenêtre jusqu'au bas pour activer la signature.
                </p>
                
                <div style="height: 350px; width: 100%; border: 1px solid rgba(142,142,147,0.3); border-radius: 14px; overflow: hidden; background:#fff;">
                    <iframe src="${googleViewerUrl}" style="width:100%; height:100%; border:none;"></iframe>
                </div>

                ${sig ? `
                    <div style="background: rgba(52, 199, 89, 0.1); border: 1px solid var(--success-color); padding: 15px; border-radius: 14px; text-align: center;">
                        <div style="color: var(--success-color); font-weight: bold; margin-bottom: 8px;">✓ Vous avez signé ce plan de prévention</div>
                        <div style="font-size:12px; color:#8E8E93;">Le ${new Date(sig.signed_at).toLocaleString()}</div>
                        <img src="${sig.signature_data}" style="max-height:80px; margin-top: 10px; background:#white; border-radius:8px; border:1px solid rgba(142,142,147,0.2);">
                    </div>
                ` : `
                    <div id="sig-section" style="display:flex; flex-direction:column; gap:15px; opacity: 0.4; pointer-events: none; transition: opacity 0.3s ease;">
                        <label style="display:flex; align-items:center; gap:10px; font-size:14px; color:${textColor}; font-weight:600;">
                            <input type="checkbox" id="prev-agree" style="width:20px; height:20px; accent-color:var(--primary-color);">
                            J'ai lu et j'accepte le plan de prévention (Collaborateur)
                        </label>
                        
                        <div id="canvas-container" style="display:none; flex-direction:column; gap:10px;">
                            <span style="font-size:13px; color:#8E8E93;">Dessinez votre signature ci-dessous :</span>
                            <canvas id="signature-canvas" width="450" height="150" style="border: 2px dashed rgba(142,142,147,0.4); border-radius: 14px; background: #ffffff; cursor: crosshair; touch-action: none; width:100%; height: 150px;"></canvas>
                            <div style="display:flex; gap:10px;">
                                <button class="btn-secondary" style="padding: 8px 16px; font-size: 13px;" onclick="window.clearPreventionSignature()">Effacer</button>
                                <button id="submit-sig-btn" class="btn-primary" style="flex:1; padding: 8px 16px; font-size: 13px; background:var(--primary-color);" disabled>Valider ma signature</button>
                            </div>
                        </div>
                    </div>
                `}
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    const modalBody = document.getElementById('prevention-modal-body');
    const sigSection = document.getElementById('sig-section');

    // Scroll check
    modalBody.onscroll = () => {
        if (modalBody.scrollTop + modalBody.clientHeight >= modalBody.scrollHeight - 60) {
            if (sigSection) {
                sigSection.style.opacity = "1";
                sigSection.style.pointerEvents = "auto";
            }
        }
    };

    // Fallback if no scrollbar
    setTimeout(() => {
        if (modalBody.scrollHeight <= modalBody.clientHeight + 10) {
            if (sigSection) {
                sigSection.style.opacity = "1";
                sigSection.style.pointerEvents = "auto";
            }
        }
    }, 1000);

    // User canvas drawing setup
    if (!sig) {
        const checkbox = document.getElementById('prev-agree');
        const canvasContainer = document.getElementById('canvas-container');
        const canvas = document.getElementById('signature-canvas');
        const submitBtn = document.getElementById('submit-sig-btn');

        checkbox.onchange = () => {
            if (checkbox.checked) {
                canvasContainer.style.display = "flex";
                initCanvasSignature(canvas, submitBtn);
                setTimeout(() => {
                    modalBody.scrollTop = modalBody.scrollHeight;
                }, 100);
            } else {
                canvasContainer.style.display = "none";
                submitBtn.disabled = true;
            }
        };

        submitBtn.onclick = async () => {
            submitBtn.disabled = true;
            submitBtn.innerText = "Signature...";
            try {
                const sigData = canvas.toDataURL('image/png');
                await api.submitPreventionSignature(plan.id, sigData);
                
                // Refresh local copies
                const [plans, signatures] = await Promise.all([
                    api.getPreventionPlans().catch(() => []),
                    api.getPreventionSignatures().catch(() => [])
                ]);

                window.window.prevPlansCount = plans.length;
                window.window.prevSigsCount = signatures.length;
                window.window.prevPlans = plans;
                window.window.prevSigs = signatures;

                modal.remove();
                window.showToast("Signature enregistrée avec succès !");
                window.renderMobilePreventionApp();
            } catch(err) {
                alert("Erreur lors de la signature : " + err.message);
                submitBtn.disabled = false;
                submitBtn.innerText = "Valider la signature";
            }
        };
    }
};

function initCanvasSignature(canvas, submitBtn) {
    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;
    let isDrawing = false;
    let hasDrawn = false;

    const getPos = (e) => {
        const rect = canvas.getBoundingClientRect();
        const clientX = (e.touches && e.touches.length > 0) ? e.touches[0].clientX : e.clientX;
        const clientY = (e.touches && e.touches.length > 0) ? e.touches[0].clientY : e.clientY;
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        return {
            x: (clientX - rect.left) * scaleX,
            y: (clientY - rect.top) * scaleY
        };
    };

    window.clearPreventionSignature = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        submitBtn.disabled = true;
        hasDrawn = false;
    };

    const startDraw = (e) => {
        isDrawing = true;
        const pos = getPos(e);
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
        e.preventDefault();
    };

    const draw = (e) => {
        if (!isDrawing) return;
        const pos = getPos(e);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
        hasDrawn = true;
        submitBtn.disabled = false;
        e.preventDefault();
    };

    const stopDraw = () => {
        isDrawing = false;
    };

    canvas.addEventListener('mousedown', startDraw);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDraw);
    canvas.addEventListener('mouseleave', stopDraw);

    canvas.addEventListener('touchstart', startDraw, { passive: false });
    canvas.addEventListener('touchmove', draw, { passive: false });
    canvas.addEventListener('touchend', stopDraw);
}

window.generateUserPreventionPDF = async function(profile, plans, signatures) {
    if (!profile) return;
    try {
        const { PDFDocument, rgb, StandardFonts } = window.PDFLib;
        
        const pdfDoc = await PDFDocument.create();
        let page = pdfDoc.addPage([595.276, 841.890]);
        const { width, height } = page.getSize();
        
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
        
        // Header
        page.drawText("FICHE DE SIGNATURES - PRISE EN COMPTE DES PLANS DE PRÉVENTION", {
            x: 50,
            y: height - 60,
            size: 14,
            font: fontBold,
            color: rgb(0.18, 0.63, 0.25)
        });
        
        page.drawLine({
            start: { x: 50, y: height - 75 },
            end: { x: width - 50, y: height - 75 },
            thickness: 1.5,
            color: rgb(0.8, 0.8, 0.8)
        });
        
        // Info Box
        page.drawText(`Collaborateur : ${profile.first_name || ''} ${profile.last_name || ''}`, {
            x: 50,
            y: height - 105,
            size: 12,
            font: fontBold,
            color: rgb(0.1, 0.1, 0.1)
        });
        
        page.drawText(`Société : ${profile.societe || 'Pouchain'}`, {
            x: 50,
            y: height - 125,
            size: 11,
            font: font,
            color: rgb(0.3, 0.3, 0.3)
        });
        
        page.drawText(`Secteur : ${profile.secteur || 'Tout'}`, {
            x: 50,
            y: height - 145,
            size: 11,
            font: font,
            color: rgb(0.3, 0.3, 0.3)
        });
        
        page.drawText(`Date de mise à jour : ${new Date().toLocaleDateString('fr-FR')}`, {
            x: width - 200,
            y: height - 105,
            size: 11,
            font: font,
            color: rgb(0.4, 0.4, 0.4)
        });
        
        // Table Header
        let yPos = height - 190;
        
        page.drawRectangle({
            x: 50,
            y: yPos - 5,
            width: width - 100,
            height: 25,
            color: rgb(0.9, 0.9, 0.95)
        });
        
        page.drawText("Plan de prévention", { x: 60, y: yPos, size: 10, font: fontBold, color: rgb(0.1, 0.1, 0.1) });
        page.drawText("Date de signature", { x: 300, y: yPos, size: 10, font: fontBold, color: rgb(0.1, 0.1, 0.1) });
        page.drawText("Signature", { x: 450, y: yPos, size: 10, font: fontBold, color: rgb(0.1, 0.1, 0.1) });
        
        page.drawLine({
            start: { x: 50, y: yPos - 5 },
            end: { x: width - 50, y: yPos - 5 },
            thickness: 1,
            color: rgb(0.7, 0.7, 0.7)
        });
        
        yPos -= 35;
        
        const userPlans = plans.filter(pl => pl.secteur === 'Tout' || pl.secteur === profile.secteur || profile.secteur === 'Tout');
        for (const plan of userPlans) {
            const sig = signatures.find(s => s.plan_id === plan.id);
            
            page.drawLine({
                start: { x: 50, y: yPos - 5 },
                end: { x: width - 50, y: yPos - 5 },
                thickness: 0.5,
                color: rgb(0.8, 0.8, 0.8)
            });
            
            const maxTitleLen = 35;
            let titleText = plan.title;
            if (titleText.length > maxTitleLen) titleText = titleText.substring(0, maxTitleLen) + "...";
            
            page.drawText(titleText, { x: 60, y: yPos + 10, size: 10, font: font, color: rgb(0.1, 0.1, 0.1) });
            
            if (sig) {
                const dateStr = new Date(sig.signed_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'numeric', year: 'numeric' });
                page.drawText(dateStr, { x: 300, y: yPos + 10, size: 9, font: font, color: rgb(0.1, 0.6, 0.2) });
                
                try {
                    const sigImageBytes = await fetch(sig.signature_data).then(res => res.arrayBuffer());
                    const sigImage = await pdfDoc.embedPng(sigImageBytes);
                    page.drawImage(sigImage, {
                        x: 450,
                        y: yPos - 2,
                        width: 70,
                        height: 30
                    });
                } catch(imgErr) {
                    console.error("Error drawing signature image in PDF:", imgErr);
                    page.drawText("[Erreur image]", { x: 450, y: yPos + 10, size: 8, font: font, color: rgb(0.8, 0.1, 0.1) });
                }
            } else {
                page.drawText("Non signé", { x: 300, y: yPos + 10, size: 9, font: font, color: rgb(0.8, 0.1, 0.1) });
            }
            
            yPos -= 45;
            
            if (yPos < 60) {
                page = pdfDoc.addPage([595.276, 841.890]);
                yPos = height - 60;
            }
        }
        
        const pdfBytes = await pdfDoc.save();
        const pdfBlob = new Blob([pdfBytes], { type: 'application/pdf' });
        const pdfFile = new File([pdfBlob], `Signatures_${profile.last_name || ''}_${profile.first_name || ''}.pdf`, { type: 'application/pdf' });
        
        const key = `Plan de prévention/_Signatures/Signatures_${profile.last_name || ''}_${profile.first_name || ''}.pdf`;
        await api.uploadFile(pdfFile, key);
        console.log("PDF updated successfully in R2");
    } catch(err) {
        console.error("PDF generation failed:", err);
    }
};

window.openSubcontractorBulkSignModal = function() {
    const plans = window.window.prevPlans || [];
    if (plans.length === 0) {
        alert("Aucun plan de prévention disponible.");
        return;
    }

    const dk = document.documentElement.getAttribute('data-theme') === 'dark';
    const bg = dk ? '#1C1C1E' : '#FFFFFF';
    const textColor = dk ? '#FFFFFF' : '#000000';
    const inputBg = dk ? '#2C2C2E' : '#f2f2f7';

    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.style.zIndex = "100020";

    const plansHtml = plans.map(p => `
        <label style="display:flex; align-items:center; gap:10px; padding:12px; border-radius:10px; background:${inputBg}; cursor:pointer; margin-bottom: 6px;">
            <input type="checkbox" class="bulk-plan-checkbox" value="${p.id}" style="width:20px; height:20px; accent-color:var(--primary-color);">
            <span style="font-size:14px; color:${textColor}; font-weight:500;">${window.escapeHTML(p.title)}</span>
        </label>
    `).join('');

    modal.innerHTML = `
        <div id="bulk-prevention-modal-body" class="modal-box" style="padding: 0; border-radius: 28px; width: 95%; max-width: 600px; max-height: 90vh; display: flex; flex-direction: column; overflow-y: auto; background: ${bg}; position: relative;">
            <div style="position: sticky; top: 0; background: ${bg}; padding: 20px; border-bottom: 1px solid rgba(142,142,147,0.2); display:flex; justify-content:space-between; align-items:center; z-index:100;">
                <h3 style="margin: 0; color: ${textColor}; font-size: 18px;">Signature Sous-Traitant</h3>
                <button onclick="this.closest('.modal-overlay').remove()" style="background: rgba(0,0,0,0.05); border: none; color: ${textColor}; width: 32px; height: 32px; border-radius: 16px; cursor: pointer; font-size:18px; font-weight:bold;">✕</button>
            </div>
            
            <div style="padding: 20px; display:flex; flex-direction:column; gap:16px;">
                <div style="display:flex; flex-direction:column; gap:6px;">
                    <span style="font-size:12px; color:#8E8E93; font-weight:600;">Prénom :</span>
                    <input type="text" id="bulk-sub-firstname" style="padding:10px; border:none; border-radius:8px; background:${inputBg}; color:${textColor}; font-size:14px;" placeholder="ex: Quentin">
                </div>
                
                <div style="display:flex; flex-direction:column; gap:6px;">
                    <span style="font-size:12px; color:#8E8E93; font-weight:600;">Nom :</span>
                    <input type="text" id="bulk-sub-lastname" style="padding:10px; border:none; border-radius:8px; background:${inputBg}; color:${textColor}; font-size:14px;" placeholder="ex: Vert">
                </div>
                
                <div style="display:flex; flex-direction:column; gap:6px;">
                    <span style="font-size:12px; color:#8E8E93; font-weight:600;">Entreprise :</span>
                    <input type="text" id="bulk-sub-company" style="padding:10px; border:none; border-radius:8px; background:${inputBg}; color:${textColor}; font-size:14px;" placeholder="ex: Pouchain">
                </div>

                <div style="display:flex; flex-direction:column; gap:10px;">
                    <span style="font-size:12px; color:#8E8E93; font-weight:600;">Plans de prévention à signer :</span>
                    <div style="display:flex; flex-direction:column; gap:4px; max-height: 180px; overflow-y: auto;">
                        ${plansHtml}
                    </div>
                </div>

                <div style="display:flex; gap:10px; margin-top: 10px;">
                    <button class="btn-secondary" style="flex: 1; padding: 12px;" onclick="this.closest('.modal-overlay').remove()">Annuler</button>
                    <button id="start-wizard-btn" class="btn-primary" style="flex: 1; padding: 12px; background:var(--primary-color);">Démarrer la signature</button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    const submitBtn = document.getElementById('start-wizard-btn');

    submitBtn.onclick = () => {
        const fn = document.getElementById('bulk-sub-firstname').value.trim();
        const ln = document.getElementById('bulk-sub-lastname').value.trim();
        const comp = document.getElementById('bulk-sub-company').value.trim();

        if (!fn || !ln || !comp) {
            alert("Veuillez remplir le prénom, le nom et l'entreprise du sous-traitant.");
            return;
        }

        const checkedBoxes = document.querySelectorAll('.bulk-plan-checkbox:checked');
        if (checkedBoxes.length === 0) {
            alert("Veuillez sélectionner au moins un plan de prévention.");
            return;
        }

        const planIds = Array.from(checkedBoxes).map(cb => cb.value);
        modal.remove();

        // Start step-by-step signature wizard
        window.startSubcontractorSignWizard(fn, ln, comp, planIds, 0);
    };
};

window.startSubcontractorSignWizard = function(fn, ln, comp, planIds, index) {
    if (index >= planIds.length) {
        window.showToast("Toutes les signatures sous-traitant ont été enregistrées !");
        window.renderMobilePreventionApp();
        return;
    }

    const planId = planIds[index];
    const plan = window.window.prevPlans.find(p => p.id === planId);
    if (!plan) {
        // Skip invalid plan
        window.startSubcontractorSignWizard(fn, ln, comp, planIds, index + 1);
        return;
    }

    const dk = document.documentElement.getAttribute('data-theme') === 'dark';
    const bg = dk ? '#1C1C1E' : '#FFFFFF';
    const textColor = dk ? '#FFFFFF' : '#000000';
    const inputBg = dk ? '#2C2C2E' : '#f2f2f7';

    const pdfUrl = `${config.api.workerUrl}/get/${encodeURIComponent(plan.pdf_url)}`;
    const googleViewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(pdfUrl)}&embedded=true`;

    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.style.zIndex = "100020";

    const isLast = index === planIds.length - 1;
    const btnText = isLast ? "Valider la signature finale" : `Valider et plan suivant (${index + 2}/${planIds.length})`;

    modal.innerHTML = `
        <div id="sub-wizard-modal-body" class="modal-box" style="padding: 0; border-radius: 28px; width: 95%; max-width: 600px; max-height: 90vh; display: flex; flex-direction: column; overflow-y: auto; background: ${bg}; position: relative;">
            <div style="position: sticky; top: 0; background: ${bg}; padding: 20px; border-bottom: 1px solid rgba(142,142,147,0.2); display:flex; justify-content:space-between; align-items:center; z-index:100;">
                <div style="display:flex; flex-direction:column;">
                    <h3 style="margin: 0; color: ${textColor}; font-size: 18px;">Signature Sous-Traitant (${index + 1}/${planIds.length})</h3>
                    <span style="font-size:12px; color:#8E8E93; margin-top:2px;">Sous-traitant : ${window.escapeHTML(fn)} ${window.escapeHTML(ln)} (${window.escapeHTML(comp)})</span>
                </div>
                <button id="close-wizard-btn" style="background: rgba(0,0,0,0.05); border: none; color: ${textColor}; width: 32px; height: 32px; border-radius: 16px; cursor: pointer; font-size:18px; font-weight:bold;">✕</button>
            </div>
            
            <div style="padding: 20px; display:flex; flex-direction:column; gap:16px;">
                <h4 style="margin: 0; color: ${textColor}; font-size: 15px; font-weight:bold;">Document : ${window.escapeHTML(plan.title)}</h4>
                <p style="font-size:13px; color:#8E8E93; margin:0;">
                    Veuillez lire le plan de prévention ci-dessous. Faites défiler cette fenêtre jusqu'au bas pour activer la signature.
                </p>
                
                <div style="height: 300px; width: 100%; border: 1px solid rgba(142,142,147,0.3); border-radius: 14px; overflow: hidden; background:#fff;">
                    <iframe src="${googleViewerUrl}" style="width:100%; height:100%; border:none;"></iframe>
                </div>

                <div id="wizard-sig-section" style="display:flex; flex-direction:column; gap:15px; opacity: 0.4; pointer-events: none; transition: opacity 0.3s ease;">
                    <label style="display:flex; align-items:center; gap:10px; font-size:14px; color:${textColor}; font-weight:600;">
                        <input type="checkbox" id="wizard-sub-agree" style="width:20px; height:20px; accent-color:var(--primary-color);">
                        Le sous-traitant confirme avoir lu et accepté les consignes de ce plan.
                    </label>
                    
                    <div id="wizard-canvas-container" style="display:none; flex-direction:column; gap:10px;">
                        <span style="font-size:13px; color:#8E8E93;">Dessinez votre signature ci-dessous :</span>
                        <canvas id="wizard-signature-canvas" width="450" height="150" style="border: 2px dashed rgba(142,142,147,0.4); border-radius: 14px; background: #ffffff; cursor: crosshair; touch-action: none; width:100%; height: 150px;"></canvas>
                        <div style="display:flex; gap:10px;">
                            <button class="btn-secondary" style="padding: 8px 16px; font-size: 13px;" onclick="window.clearWizardSignature()">Effacer</button>
                            <button id="wizard-submit-btn" class="btn-primary" style="flex:1; padding: 8px 16px; font-size: 13px; background:var(--primary-color);" disabled>${btnText}</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    const modalBody = document.getElementById('sub-wizard-modal-body');
    const sigSection = document.getElementById('wizard-sig-section');
    const checkbox = document.getElementById('wizard-sub-agree');
    const canvasContainer = document.getElementById('wizard-canvas-container');
    const canvas = document.getElementById('wizard-signature-canvas');
    const submitBtn = document.getElementById('wizard-submit-btn');

    document.getElementById('close-wizard-btn').onclick = () => {
        if (confirm("Abandonner la session de signature sous-traitant en cours ? Les signatures déjà validées seront conservées.")) {
            modal.remove();
        }
    };

    // Scroll check
    modalBody.onscroll = () => {
        if (modalBody.scrollTop + modalBody.clientHeight >= modalBody.scrollHeight - 60) {
            if (sigSection) {
                sigSection.style.opacity = "1";
                sigSection.style.pointerEvents = "auto";
            }
        }
    };

    // Fallback if no scrollbar
    setTimeout(() => {
        if (modalBody.scrollHeight <= modalBody.clientHeight + 10) {
            if (sigSection) {
                sigSection.style.opacity = "1";
                sigSection.style.pointerEvents = "auto";
            }
        }
    }, 1000);

    checkbox.onchange = () => {
        if (checkbox.checked) {
            canvasContainer.style.display = "flex";
            initCanvasSignature(canvas, submitBtn);
            setTimeout(() => {
                modalBody.scrollTop = modalBody.scrollHeight;
            }, 100);
        } else {
            canvasContainer.style.display = "none";
            submitBtn.disabled = true;
        }
    };

    window.clearWizardSignature = () => {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        submitBtn.disabled = true;
    };

    submitBtn.onclick = async () => {
        submitBtn.disabled = true;
        submitBtn.innerText = "Signature...";

        try {
            const sigData = canvas.toDataURL('image/png');
            await api.submitSubcontractorSignature(plan.id, fn, ln, comp, sigData);
            
            modal.remove();
            window.showToast(`Signature enregistrée pour : ${plan.title}`);
            window.startSubcontractorSignWizard(fn, ln, comp, planIds, index + 1);
        } catch(err) {
            alert("Erreur lors de la signature du sous-traitant : " + err.message);
            submitBtn.disabled = false;
            submitBtn.innerText = btnText;
        }
    };
};