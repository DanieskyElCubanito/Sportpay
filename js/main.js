// --- 1. CONFIGURACIÓN GLOBAL ---
const BJS_CONFIG = {
    botId: "8101312620",
    secretKey: "1$MillonDannyMeli*@#€", 
    token: "X6MBnt6bQxIc66AoNZ3xLXHGmKXs7Zq5kx75GWK8" 
};

// Estado único para toda la aplicación
window.state = {
    userId: null,
    totalEarnedUSD: 0,
    totalInvestedUSDT: 0,
    referralCount: 0,
    accumulatedMining: 0
};

// --- 2. CAPTURA DE USUARIO ---
const urlParams = new URLSearchParams(window.location.search);
state.userId = urlParams.get('user_id') || window.Telegram?.WebApp?.initDataUnsafe?.user?.id;

// --- 3. SINCRONIZACIÓN INICIAL CON BJS ---
async function syncInitialData() {
    if (!state.userId) return;

    // La documentación indica que para WebApp los datos pasan por la URL
    const apiURL = `https://api.bots.business/v1/bots/${BJS_CONFIG.botId}/commands/get_user_data?user_id=${state.userId}`;
    
    try {
        const response = await fetch(apiURL, { 
            headers: { "api_key": BJS_CONFIG.token } 
        });
        const data = await response.json();

        if (data.status === "success") {
            state.totalEarnedUSD = parseFloat(data.balance || 0);
            state.totalInvestedUSDT = parseFloat(data.invested || 0);
            state.referralCount = data.referrals || 0;
        }
    } catch (e) {
        console.error("Error en sincronización inicial:", e);
    }
    
    updateDashboard();
}

// --- 4. ACTUALIZACIÓN DE INTERFAZ ---
function updateDashboard() {
    const mainBalEl = document.getElementById('main-balance');
    const speedEl = document.getElementById('mining-speed');
    const refEl = document.getElementById('ref-count');
    const idEl = document.getElementById('user-id');

    if (mainBalEl) mainBalEl.innerText = state.totalEarnedUSD.toFixed(2);
    if (refEl) refEl.innerText = state.referralCount;
    if (idEl) idEl.innerText = `ID: ${state.userId || '---'}`;
    
    if (speedEl) {
        const currentGHS = state.totalInvestedUSDT * 1000;
        speedEl.innerText = `${currentGHS.toLocaleString()} GH/s activos`;
    }
}

// --- 5. LÓGICA DE REINVERSIÓN ---
window.openReinvestModal = function() {
    if (state.totalEarnedUSD < 1) {
        window.showToast("❌ Mínimo 1.00 USDT para reinvertir", "error");
        return;
    }

    const amount = state.totalEarnedUSD;
    const bonus = amount * 0.05;

    const oldModal = document.getElementById('custom-reinvest-modal');
    if (oldModal) oldModal.remove();

    const modalHtml = `
        <div id="custom-reinvest-modal" style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.85); display:flex; align-items:center; justify-content:center; z-index:9999; backdrop-filter:blur(4px);">
            <div style="background:#151e2b; width:85%; max-width:340px; border-radius:24px; padding:25px; text-align:center; border:1px solid #334155;">
                <h2 style="color:white; margin-bottom:15px;">Confirmar Reinversión</h2>
                <div style="background:#0f172a; border-radius:16px; padding:15px; margin-bottom:20px; text-align:left;">
                    <p style="color:#94a3b8;">Monto: <b style="color:white;">$${amount.toFixed(2)}</b></p>
                    <p style="color:#94a3b8;">Bono (+5%): <b style="color:#10b981;">+$${bonus.toFixed(2)}</b></p>
                </div>
                <div style="display:flex; gap:12px;">
                    <button onclick="document.getElementById('custom-reinvest-modal').remove()" style="flex:1; padding:12px; background:#334155; color:white; border-radius:12px; border:none;">Cancelar</button>
                    <button onclick="executeReinvestDirectly()" style="flex:1; padding:12px; background:#0088cc; color:white; border-radius:12px; border:none; font-weight:bold;">Confirmar</button>
                </div>
            </div>
        </div>`;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
};

window.executeReinvestDirectly = async function() {
    const modal = document.getElementById('custom-reinvest-modal');
    if (modal) modal.remove();

    const amount = state.totalEarnedUSD;
    // URL corregida para usar 'options' en BJS
    const apiURL = `https://api.bots.business/v1/bots/${BJS_CONFIG.botId}/commands/api_reinvest?user_id=${state.userId}&amount=${amount}`;

    try {
        const response = await fetch(apiURL, {
            method: 'GET',
            headers: { "api_key": BJS_CONFIG.token, "Accept": "application/json" }
        });

        const result = await response.json();

        if (result && result.status === "success") {
            state.totalEarnedUSD = parseFloat(result.balance);
            state.totalInvestedUSDT = parseFloat(result.invested);
            updateDashboard();
            window.showToast("✅ Reinversión exitosa");
        } else {
            window.showToast("❌ " + (result.message || "Error en el bot"), "error");
        }
    } catch (e) {
        window.showToast("⚠️ Error de conexión", "error");
    }
};

// --- 6. MOTOR DE MINERÍA ---
function startMiningEngine() {
    setInterval(() => {
        if (state.totalInvestedUSDT > 0) {
            // Incremento basado en inversión
            state.accumulatedMining += (state.totalInvestedUSDT * 1000 * 0.0000001);
            const display = document.getElementById('mining-balance');
            if (display) display.innerText = state.accumulatedMining.toFixed(4);
        }
    }, 1000);
}

// --- 7. NOTIFICACIONES (TOAST) ---
window.showToast = function(message, type = "success") {
    const toast = document.createElement('div');
    toast.innerText = message;
    toast.style.cssText = `position:fixed; bottom:100px; left:50%; transform:translateX(-50%); background:${type==="success"?"#10b981":"#ef4444"}; color:white; padding:12px 24px; border-radius:50px; z-index:10000; font-weight:bold;`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
};

// --- 8. INICIALIZACIÓN ---
window.onload = () => {
    if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.expand();
    }
    syncInitialData();
    startMiningEngine();
};
