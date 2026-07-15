import { api } from '../api.js';
import { auth } from '../auth.js';
import config from '../config.js';

window.renderMobileOvertime = async function () {
    document.getElementById("categories-view").classList.add("hidden");
    document.getElementById("search-results-view").classList.add("hidden");
    const searchContainer = document.querySelector(".mobile-search-container");
    if (searchContainer) searchContainer.classList.add("hidden");
    document.getElementById("document-list").classList.remove("hidden");

    document.getElementById("selected-category-title").innerText = "Mes Heures Sup";
    document.getElementById("mobile-upload-btn").style.display = "none";

    window.mobileCurrentPath = "overtime";

    const container = document.getElementById("list-content");
    const dk = document.documentElement.getAttribute("data-theme") === "dark";
    const cardBg = dk ? "#1C1C1E" : "#fff";
    const textColor = dk ? "#FFFFFF" : "#1c1c1e";
    const subColor = "#8E8E93";
    const border = dk ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)";

    container.innerHTML = `<div style="text-align: center; padding: 40px; color: ${subColor};"><div class="loader-spinner"></div></div>`;

    try {
        const data = await api.getOvertimeLogs();
        const logs = data.logs || [];
        const total = data.total || 0;
        const totalColor = "#FF3B30";

        const sortedLogs = [...logs].sort((a, b) => new Date(b.date) - new Date(a.date));

        const welcomeSeen = localStorage.getItem('pouchain_overtime_welcome_seen');
        let welcomeHtml = '';
        if (!welcomeSeen) {
            welcomeHtml = `
                <div id="ot-welcome-msg" style="background: rgba(255, 59, 48, 0.1); border: 1px solid rgba(255, 59, 48, 0.2); color: #FF3B30; padding: 16px; border-radius: 16px; margin-bottom: 20px; font-size: 13px; font-weight: 600; line-height: 1.5; position: relative;">
                    👋 Bienvenue ! Voici votre suivi d'heures supplémentaires.
                    <button onclick="localStorage.setItem('pouchain_overtime_welcome_seen', 'true'); document.getElementById('ot-welcome-msg').remove()" style="background: #FF3B30; border: none; color: white; margin-top: 10px; display: block; width: 100%; padding: 8px; border-radius: 8px; font-weight: 800; font-size: 12px;">Compris !</button>
                </div>
            `;
        }

        container.innerHTML = `
            <div style="padding: 10px 20px;">
                ${welcomeHtml}
                <div style="position: relative; height: 200px; border-radius: 28px; overflow: hidden; margin-bottom: 24px; background: ${dk ? '#1C1C1E' : '#FFFFFF'}; border: 1px solid ${border}; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
                    <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; opacity: 0.8;">
                        <canvas id="overtime-mobile-chart"></canvas>
                    </div>
                    <div style="position: relative; z-index: 2; padding: 30px; text-align: center; pointer-events: none; display: flex; flex-direction: column; justify-content: center; height: 100%; background: ${dk ? 'linear-gradient(to bottom, rgba(28,28,30,0.2), rgba(28,28,30,0.8))' : 'linear-gradient(to bottom, rgba(255,255,255,0.1), rgba(255,255,255,0.7))'};">
                        <div style="font-size: 12px; font-weight: 800; color: ${subColor}; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 4px;">Solde Actuel</div>
                        <div style="font-size: 54px; font-weight: 900; color: ${totalColor}; margin: 0; text-shadow: 0 2px 10px ${dk ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.8)'};">
                            ${window.formatOvertimeDuration(total).replace('+', '')}
                        </div>
                        <div style="font-size: 11px; color: ${subColor}; font-weight: 700; margin-top: 5px;">Evolution cumulée des heures</div>
                    </div>
                </div>
                <div style="margin-bottom: 30px;">
                    <button id="request-recup-btn" style="width: 100%; background: #174286; border: none; color: white; padding: 16px; border-radius: 18px; font-weight: 800; font-size: 15px; display: flex; align-items: center; justify-content: center; gap: 8px; box-shadow: 0 4px 12px rgba(23, 66, 134, 0.25); cursor: pointer;"><span style="font-size: 20px;">⏱️</span> Demander une récupération</button>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                    <h3 style="margin: 0; font-size: 17px; font-weight: 800; color: ${textColor};">Historique</h3>
                    <div style="font-size: 12px; color: ${subColor}; font-weight: 600;">${logs.length} entrées</div>
                </div>
                <div id="overtime-history" style="display: flex; flex-direction: column; gap: 12px; padding-bottom: 40px;">
                    ${logs.length === 0 ?
                `<div style="text-align: center; padding: 40px; color: ${subColor}; font-size: 14px;">Aucun historique pour le moment</div>` :
                sortedLogs.map(log => {
                    const isPositive = log.amount >= 0;
                    const dateStr = new Date(log.date).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
                    return `
                                <div style="background: ${cardBg}; border: 1px solid ${border}; padding: 16px; border-radius: 20px; display: flex; align-items: center; gap: 15px; box-shadow: 0 2px 6px rgba(0,0,0,0.02);">
                                    <div style="background: ${isPositive ? "rgba(52, 199, 89, 0.1)" : "rgba(255, 59, 48, 0.1)"}; color: ${isPositive ? "#34C759" : "#FF3B30"}; width: 45px; height: 45px; border-radius: 14px; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 13px; flex-shrink: 0; line-height: 1;">${dateStr}</div>
                                    <div style="flex: 1;">
                                        <div style="font-weight: 800; color: ${textColor}; font-size: 15px; margin-bottom: 2px;">${log.justification || (isPositive ? "Ajout d'heures" : "Retrait d'heures")}</div>
                                        <div style="font-size: 11px; color: ${subColor}; font-weight: 600;">Saisie le ${new Date(log.created_at).toLocaleDateString('fr-FR')}</div>
                                    </div>
                                    <div style="text-align: right; margin-right: 8px;">
                                        <div style="font-weight: 900; color: ${isPositive ? "#34C759" : "#FF3B30"}; font-size: 17px;">${window.formatOvertimeDuration(log.amount)}</div>
                                    </div>
                                </div>
                            `;
                }).join("")
            }
                </div>
            </div>
        `;

        requestAnimationFrame(() => {
            setTimeout(() => {
                const canvas = document.getElementById('overtime-mobile-chart');
                if (!canvas || logs.length === 0) return;
                const sorted = [...logs].sort((a, b) => new Date(a.date) - new Date(b.date));
                let cum = 0;
                const cData = sorted.map(l => {
                    cum += parseFloat(l.amount);
                    return { x: new Date(l.date).getTime(), y: cum };
                });
                const firstTime = cData[0].x;
                cData.unshift({ x: firstTime - 86400000, y: 0 });
                if (cData.length <= 2) {
                    cData.push({ x: Date.now(), y: cum });
                }
                new Chart(canvas.getContext('2d'), {
                    type: 'line',
                    data: {
                        datasets: [{
                            data: cData,
                            borderColor: '#FF3B30',
                            backgroundColor: (context) => {
                                const ctx = context.chart.ctx;
                                const gradient = ctx.createLinearGradient(0, 0, 0, 200);
                                gradient.addColorStop(0, 'rgba(255, 59, 48, 0.4)');
                                gradient.addColorStop(1, 'rgba(255, 59, 48, 0)');
                                return gradient;
                            },
                            borderWidth: 3,
                            fill: true,
                            tension: 0.4,
                            pointRadius: logs.length < 10 ? 4 : 0,
                            pointBackgroundColor: '#FF3B30',
                            pointBorderColor: dk ? '#1C1C1E' : '#FFFFFF',
                            pointBorderWidth: 2
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        layout: { padding: { top: 10, bottom: -10, left: -10, right: -10 } },
                        scales: {
                            x: { type: 'time', display: false, grid: { display: false } },
                            y: { display: false, grid: { display: false }, beginAtZero: true }
                        },
                        plugins: {
                            legend: { display: false },
                            tooltip: { enabled: false }
                        }
                    }
                });
            }, 300);
        });

        document.getElementById("request-recup-btn").onclick = async () => {
            const result = await window.openMobileRecupRequestModal();
            if (!result) return;

            const calculateDuration = (startStr, endStr) => {
                const [sh, sm] = startStr.split(':').map(Number);
                const [eh, em] = endStr.split(':').map(Number);
                let sVal = sh + sm / 60;
                let eVal = eh + em / 60;
                if (eVal < sVal) eVal += 24;
                const rawDur = eVal - sVal;
                const getOverlap = (s, e) => {
                    const oStart = Math.max(s, 11.5);
                    const oEnd = Math.min(e, 12.5);
                    return Math.max(0, oEnd - oStart);
                };
                let overlap = getOverlap(sVal, eVal);
                if (eVal > 24) {
                    overlap += getOverlap(sVal, 24);
                    overlap += getOverlap(0, eVal - 24);
                }
                return Math.max(0, parseFloat((rawDur - overlap).toFixed(2)));
            };

            const hours = calculateDuration(result.start_time, result.end_time);
            if (hours <= 0) {
                alert("La durée de la récupération doit être supérieure à 0 (hors pause).");
                return;
            }

            const btn = document.getElementById("request-recup-btn");
            btn.disabled = true;
            const origText = btn.innerText;
            btn.innerText = "Envoi...";
            try {
                await api.submitRecupRequest(result.date, hours, result.signature, result.start_time, result.end_time);
                window.showToast("Demande de récupération soumise avec succès !");
                window.renderMobileOvertime();
            } catch (err) {
                alert("Erreur lors de la soumission de la demande : " + err.message);
            } finally {
                btn.disabled = false;
                btn.innerText = origText;
            }
        };
    } catch (e) {
        container.innerHTML = `<div style="color: red; padding: 20px;">Erreur: ${e.message}</div>`;
    }
};

window.openMobileRecupRequestModal = function () {
    return new Promise((resolve) => {
        const dk = document.documentElement.getAttribute("data-theme") === "dark";
        const bg = dk ? "#1C1C1E" : "#FFFFFF";
        const textColor = dk ? "#FFFFFF" : "#1C1C1E";
        const border = dk ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)";
        const inputBg = dk ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)";
        const todayStr = new Date().toISOString().split('T')[0];

        // Force body overflow hidden to prevent scrolling in background
        document.body.style.overflow = 'hidden';

        const overlay = document.createElement("div");
        overlay.className = "modal-overlay";
        overlay.style.zIndex = "20000";

        const generateTimeOptions = (selectedVal) => {
            let html = '';
            for (let h = 5; h <= 22; h++) {
                const hh = String(h).padStart(2, '0');
                const t1 = `${hh}:00`;
                const t2 = `${hh}:30`;
                html += `<option value="${t1}" ${selectedVal === t1 ? 'selected' : ''}>${t1}</option>`;
                if (h < 22) {
                    html += `<option value="${t2}" ${selectedVal === t2 ? 'selected' : ''}>${t2}</option>`;
                }
            }
            return html;
        };

        overlay.innerHTML = `
            <div class="modal-box" style="background: ${bg}; padding: 0; overflow: hidden; display: flex; flex-direction: column; width: 90%; max-width: 400px; border-radius: 28px; animation: modalPop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);">
                <div style="padding: 20px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid ${border};">
                    <div style="width: 32px;"></div>
                    <h2 style="margin: 0; color: ${textColor}; font-size: 17px; font-weight: 800; text-align: center;">Demande de récupération</h2>
                    <button id="close-recup-modal" style="background: ${inputBg}; border: none; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 14px; color: ${textColor}; cursor: pointer;">✕</button>
                </div>
                <div style="padding: 24px; display: flex; flex-direction: column; gap: 15px; max-height: 80vh; overflow-y: auto;">
                    <div style="display: flex; flex-direction: column; gap: 6px;">
                        <label style="color: ${textColor}; font-size: 13px; font-weight: 700; text-align: left;">Date :</label>
                        <input type="date" id="recup-req-date" value="${todayStr}" style="background: ${inputBg}; border: 1px solid ${border}; color: ${textColor}; padding: 10px 12px; border-radius: 12px; font-size: 15px; font-weight: 600; width: 100%; outline: none; box-sizing: border-box;">
                    </div>
                    <div style="display: flex; gap: 12px;">
                        <div style="flex: 1; display: flex; flex-direction: column; gap: 6px;">
                            <label style="color: ${textColor}; font-size: 13px; font-weight: 700; text-align: left;">Début :</label>
                            <select id="recup-req-start-time" style="background: ${inputBg}; border: 1px solid ${border}; color: ${textColor}; padding: 10px 12px; border-radius: 12px; font-size: 15px; font-weight: 600; width: 100%; outline: none; box-sizing: border-box; height: 44px; font-family: inherit;">
                                ${generateTimeOptions("08:00")}
                            </select>
                        </div>
                        <div style="flex: 1; display: flex; flex-direction: column; gap: 6px;">
                            <label style="color: ${textColor}; font-size: 13px; font-weight: 700; text-align: left;">Fin :</label>
                            <select id="recup-req-end-time" style="background: ${inputBg}; border: 1px solid ${border}; color: ${textColor}; padding: 10px 12px; border-radius: 12px; font-size: 15px; font-weight: 600; width: 100%; outline: none; box-sizing: border-box; height: 44px; font-family: inherit;">
                                ${generateTimeOptions("12:00")}
                            </select>
                        </div>
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 6px;">
                        <label style="color: ${textColor}; font-size: 13px; font-weight: 700; text-align: left;">Signature :</label>
                        <div style="border: 1px solid ${border}; border-radius: 16px; overflow: hidden; background: #FFFFFF; height: 150px; position: relative;">
                            <canvas id="recup-req-sig-pad" style="width: 100%; height: 100%; display: block; touch-action: none; cursor: crosshair;"></canvas>
                        </div>
                    </div>
                    <div style="display: flex; gap: 10px; margin-top: 10px;">
                        <button id="clear-recup-req-sig" style="flex: 1; height: 50px; border-radius: 14px; border: 1px solid ${border}; background: transparent; color: #FF3B30; font-weight: 800; font-size: 14px; cursor: pointer;">Effacer</button>
                        <button id="submit-recup-req" style="flex: 1; height: 50px; border-radius: 14px; border: none; background: #174286; color: white; font-weight: 800; font-size: 14px; cursor: pointer; box-shadow: 0 4px 12px rgba(23, 66, 134, 0.3);">Valider</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);

        const canvas = document.getElementById('recup-req-sig-pad');
        const ctx = canvas.getContext('2d');
        let drawing = false;
        let isSigned = false;

        // Adjust canvas resolution
        const resizeCanvas = () => {
            const rect = canvas.getBoundingClientRect();
            canvas.width = rect.width;
            canvas.height = rect.height;
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.lineWidth = 3;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.strokeStyle = '#000000';
        };
        resizeCanvas();

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

        const drawStart = (x, y) => {
            drawing = true;
            isSigned = true;
            ctx.beginPath();
            ctx.moveTo(x, y);
        };

        const drawMove = (x, y) => {
            if (!drawing) return;
            ctx.lineTo(x, y);
            ctx.stroke();
        };

        const drawEnd = () => {
            drawing = false;
        };

        // Touch Listeners
        canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const pos = getPos(e);
            drawStart(pos.x, pos.y);
        });
        canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const pos = getPos(e);
            drawMove(pos.x, pos.y);
        });
        canvas.addEventListener('touchend', drawEnd);

        // Mouse Listeners
        canvas.addEventListener('mousedown', (e) => {
            const pos = getPos(e);
            drawStart(pos.x, pos.y);
        });
        canvas.addEventListener('mousemove', (e) => {
            if (!drawing) return;
            const pos = getPos(e);
            drawMove(pos.x, pos.y);
        });
        canvas.addEventListener('mouseup', drawEnd);
        canvas.addEventListener('mouseleave', drawEnd);

        // Clear button
        document.getElementById('clear-recup-req-sig').onclick = () => {
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            isSigned = false;
        };

        // Close/Cancel helper
        const cleanup = () => {
            document.body.style.overflow = '';
            overlay.remove();
        };

        document.getElementById('close-recup-modal').onclick = () => {
            cleanup();
            resolve(null);
        };

        document.getElementById('submit-recup-req').onclick = () => {
            if (!isSigned) {
                alert("Veuillez signer avant de valider.");
                return;
            }
            const dataUrl = canvas.toDataURL('image/png');
            const date = document.getElementById('recup-req-date').value;
            const startTime = document.getElementById('recup-req-start-time').value || "08:00";
            const endTime = document.getElementById('recup-req-end-time').value || "12:00";

            if (!date) {
                alert("Veuillez choisir une date.");
                return;
            }

            const isHalfHourInterval = (timeStr) => {
                if (!timeStr) return false;
                const parts = timeStr.split(':');
                if (parts.length >= 2) {
                    const minutes = parseInt(parts[1], 10);
                    return minutes === 0 || minutes === 30;
                }
                return false;
            };

            if (!isHalfHourInterval(startTime) || !isHalfHourInterval(endTime)) {
                alert("Les horaires doivent être choisis par intervalle de 30 minutes (ex: 08:00, 08:30, 09:00, 09:30).");
                return;
            }

            cleanup();
            resolve({ signature: dataUrl, date, start_time: startTime, end_time: endTime });
        };
    });
};

window.getISOWeekNumber = function (d) {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    var yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    var weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    return weekNo;
};
