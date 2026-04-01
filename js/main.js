// --- 1. CONFIGURACIÓN GLOBAL ---
const API_URLS = {
    user: '/api/user',
    reinvest: '/api/reinvest'
};

window.state = {
    userId: null,
    totalEarnedUSD: 0,
    totalInvestedUSDT: 0,
    referralCount: 0,
    accumulatedMining: 0,
    refsL1: 0,
    refsL2: 0,
    refsL3: 0,
    refsL4: 0,
    refsL5: 0
};

// --- 2. CAPTURA DE ID MEJORADA ---
function getTelegramUser() {
    const tgData = window.Telegram?.WebApp?.initDataUnsafe;
    const urlParams = new URLSearchParams(window.location.search);
    const id = tgData?.user?.id || urlParams.get('user_id');
    return id ? String(id) : null;
}

// --- 3. SINCRONIZACIÓN Y PANEL ---

async function syncInitialData() {
    // Aseguramos que Telegram esté listo
    if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.ready();
    }

    state.userId = getTelegramUser();
    
    if (!state.userId) {
        const idEl = document.getElementById('user-id');
        if (idEl) idEl.innerText = "ID: No detectado";
        return;
    }

    // --- CORRECCIÓN PARA ENLACES DIRECT APP (/app?startapp=) ---
    // Telegram guarda el valor en 'start_param' dentro de initDataUnsafe
    let startParam = window.Telegram?.WebApp?.initDataUnsafe?.start_param || "";
    
    // Si viene vacío, intentamos buscarlo en la URL por si acaso
    if (!startParam) {
        const urlParams = new URLSearchParams(window.location.search);
        startParam = urlParams.get('tgWebAppStartParam') || "";
    }

    console.log("Invitador detectado:", startParam); 

    try {
        // Enviamos el invitado a la API
        const response = await fetch(`${API_URLS.user}?user_id=${state.userId}&invited_by=${startParam}`);
        const data = await response.json();

        if (data) {
            state.totalEarnedUSD = parseFloat(data.balance || 0);
            state.totalInvestedUSDT = parseFloat(data.invested || 0);
            state.referralCount = data.referrals || 0;

            state.refsL1 = data.refsL1 || data.referrals || 0; 
            state.refsL2 = data.refsL2 || 0;
            state.refsL3 = data.refsL3 || 0;
            state.refsL4 = data.refsL4 || 0;
            state.refsL5 = data.refsL5 || 0;

            updateDashboard();
        }
    } catch (e) {
        console.error("Error:", e);
        updateDashboard();
    }
}

function updateDashboard() {
    const mainBalEl = document.getElementById('main-balance');
    const speedEl = document.getElementById('mining-speed');
    const refEl = document.getElementById('ref-count');
    const idEl = document.getElementById('user-id');
    const refInput = document.getElementById('ref-link');

    if (mainBalEl) mainBalEl.innerText = state.totalEarnedUSD.toFixed(2);
    if (refEl) refEl.innerText = state.referralCount;
    if (idEl) idEl.innerText = `ID: ${state.userId}`;
    
    // Generar el enlace en el formato que te gustó (Direct App)
    if (refInput && state.userId) {
        refInput.value = `https://t.me/DannyDevRobot/app?startapp=${state.userId}`;
    }

    const l1 = document.getElementById('ref-L1');
    const l2 = document.getElementById('ref-L2');
    const l3 = document.getElementById('ref-L3');
    const l4 = document.getElementById('ref-L4');
    const l5 = document.getElementById('ref-L5');

    if (l1) l1.innerText = state.refsL1;
    if (l2) l2.innerText = state.refsL2;
    if (l3) l3.innerText = state.refsL3;
    if (l4) l4.innerText = state.refsL4;
    if (l5) l5.innerText = state.refsL5;
    
    if (speedEl) {
        const currentGHS = (state.totalInvestedUSDT || 0) * 1000;
        speedEl.innerText = `${currentGHS.toLocaleString()} GH/s activos`;
    }
}

// --- 4. ACCIONES ---

window.openReinvestModal = function() {
    if (state.totalEarnedUSD < 1) {
        window.showToast("❌ Mínimo 1.00 USDT", "error");
        return;
    }
    const amount = state.totalEarnedUSD;
    const bonus = amount * 0.05;
    const oldModal = document.getElementById('custom-reinvest-modal');
    if (oldModal) oldModal.remove();

    const modalHtml = `
        <div id="custom-reinvest-modal" style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.85); display:flex; align-items:center; justify-content:center; z-index:99999; backdrop-filter:blur(5px);">
            <div style="background:#151e2b; width:85%; max-width:340px; border-radius:24px; padding:25px; text-align:center; border:1px solid #334155; color:white;">
                <h2 style="margin:0 0 15px 0;">Confirmar</h2>
                <div style="background:#0f172a; border-radius:16px; padding:15px; margin-bottom:20px; text-align:left;">
                    <p style="margin:5px 0; color:#94a3b8;">Monto: <b>$${amount.toFixed(2)}</b></p>
                    <p style="margin:5px 0; color:#94a3b8;">Bono (+5%): <b style="color:#10b981;">+$${bonus.toFixed(2)}</b></p>
                </div>
                <div style="display:flex; gap:12px;">
                    <button onclick="document.getElementById('custom-reinvest-modal').remove()" style="flex:1; padding:12px; border-radius:12px; background:#334155; color:white; border:none;">Cerrar</button>
                    <button onclick="executeReinvestDirectly()" style="flex:1; padding:12px; border-radius:12px; background:#0088cc; color:white; border:none; font-weight:bold;">Reinvertir</button>
                </div>
            </div>
        </div>`;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
};

window.executeReinvestDirectly = async function() {
    const modal = document.getElementById('custom-reinvest-modal');
    if (modal) modal.remove();
    try {
        const response = await fetch(API_URLS.reinvest, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: state.userId, amount: state.totalEarnedUSD })
        });
        const result = await response.json();
        if (result.status === "success") {
            state.totalEarnedUSD = parseFloat(result.balance);
            state.totalInvestedUSDT = parseFloat(result.invested);
            updateDashboard();
            window.showToast("✅ Reinversión completada");
        }
    } catch (e) {
        window.showToast("⚠️ Error al procesar", "error");
    }
};

window.claimMining = function() {
    if (state.accumulatedMining <= 0) {
        window.showToast("❌ Nada para reclamar", "error");
        return;
    }
    state.totalEarnedUSD += state.accumulatedMining;
    state.accumulatedMining = 0;
    updateDashboard();
    window.showToast("✅ Saldo reclamado");
};

// --- 5. MOTOR ---

function startMiningEngine() {
    setInterval(() => {
        if (state.totalInvestedUSDT > 0) {
            state.accumulatedMining += (state.totalInvestedUSDT * 1000 * 0.0000001);
            const display = document.getElementById('mining-balance');
            if (display) display.innerText = state.accumulatedMining.toFixed(6);
        }
    }, 1000);
}

function initUserProfile() {
    const user = window.Telegram?.WebApp?.initDataUnsafe?.user;
    if (user) {
        const nameEl = document.getElementById('user-full-name');
        const picEl = document.getElementById('user-pic');
        if (nameEl) nameEl.innerText = `${user.first_name || ''} ${user.last_name || ''}`.trim();
        if (picEl && user.photo_url) picEl.src = user.photo_url;
    }
}

// --- 6. UTILIDADES ---

window.copyLink = function() {
    const copyText = document.getElementById("ref-link");
    if (!copyText) return;
    navigator.clipboard.writeText(copyText.value);
    window.showToast("✅ Enlace copiado");
};

window.showToast = function(message, type = "success") {
    const old = document.querySelector('.toast-notif');
    if (old) old.remove();
    const toast = document.createElement('div');
    toast.className = 'toast-notif';
    toast.innerText = message;
    toast.style.cssText = `position:fixed; bottom:100px; left:50%; transform:translateX(-50%); background:${type==="success"?"#10b981":"#ef4444"}; color:white; padding:12px 24px; border-radius:50px; z-index:10000; font-weight:bold;`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
};

// --- 7. INICIO ---

window.onload = () => {
    if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.ready();
        window.Telegram.WebApp.expand();
    }
    setTimeout(() => {
        initUserProfile();
        syncInitialData();
        startMiningEngine();
    }, 200);
};
