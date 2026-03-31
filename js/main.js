// --- 1. CONFIGURACIÓN GLOBAL ---
const BJS_CONFIG = {
    botId: "8101312620",
    secretKey: "1$MillonDannyMeli*@#€", // Para api_save
    token: "X6MBnt6bQxIc66AoNZ3xLXHGmKXs7Zq5kx75GWK8" 
};

// Estado único de la aplicación
window.state = {
    userId: null,
    totalEarnedUSD: 0,
    totalInvestedUSDT: 0,
    referralCount: 0,
    accumulatedMining: 0
};

// Capturar ID de usuario (URL o Telegram)
const urlParams = new URLSearchParams(window.location.search);
state.userId = urlParams.get('user_id') || window.Telegram?.WebApp?.initDataUnsafe?.user?.id;

// --- 2. SINCRONIZACIÓN Y DATOS ---

async function syncInitialData() {
    if (!state.userId) return;

    const apiURL = `https://api.bots.business/v1/bots/${BJS_CONFIG.botId}/commands/get_user_data?user_id=${state.userId}`;
    
    try {
        const response = await fetch(apiURL, { headers: { "api_key": BJS_CONFIG.token } });
        const data = await response.json();

        if (data.status === "success" || data.balance !== undefined) {
            state.totalEarnedUSD = parseFloat(data.balance || 0);
            state.totalInvestedUSDT = parseFloat(data.invested || 0);
            state.referralCount = data.referrals || 0;
            updateDashboard();
        }
    } catch (e) {
        console.error("Error sincronizando:", e);
    }
}

function updateDashboard() {
    const mainBalEl = document.getElementById('main-balance');
    const speedEl = document.getElementById('mining-speed');
    const refEl = document.getElementById('ref-count');
    const idEl = document.getElementById('user-id');

    if (mainBalEl) mainBalEl.innerText = state.totalEarnedUSD.toFixed(2);
    if (refEl) refEl.innerText = state.referralCount || 0;
    if (idEl) idEl.innerText = `ID: ${state.userId || 'Prueba'}`;
    
    if (speedEl) {
        const currentGHS = (state.totalInvestedUSDT || 0) * 1000;
        speedEl.innerText = `${currentGHS.toLocaleString()} GH/s activos`;
    }
}

// --- 3. FUNCIONES DE BOTONES (REINVERTIR Y RECLAMAR) ---

// RECLAMAR LO MINADO (api_save)
window.claimMining = async function() {
    if (state.accumulatedMining <= 0) {
        window.showToast("❌ No hay nada acumulado para reclamar", "error");
        return;
    }
    
    const amount = state.accumulatedMining;
    // URL usando la secretKey para seguridad
    const apiURL = `https://api.bots.business/v1/bots/${BJS_CONFIG.botId}/commands/api_save?user_id=${state.userId}&amount=${amount}&key=${BJS_CONFIG.secretKey}`;

    try {
        const response = await fetch(apiURL, { headers: { "api_key": BJS_CONFIG.token } });
        const result = await response.json();
        
        if (result.status === "success") {
            state.totalEarnedUSD = parseFloat(result.balance);
            state.accumulatedMining = 0;
            updateDashboard();
            window.showToast("✅ Saldo reclamado con éxito");
        } else {
            window.showToast("❌ " + (result.message || "Error al reclamar"), "error");
        }
    } catch (e) {
        window.showToast("⚠️ Error de conexión", "error");
    }
};

// REINVERTIR (api_reinvest)
window.executeReinvestDirectly = async function() {
    const modal = document.getElementById('custom-reinvest-modal');
    if (modal) modal.remove();

    const amount = state.totalEarnedUSD;
    if (amount < 1) return window.showToast("Mínimo 1 USDT", "error");

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
            window.showToast("✅ Reinversión exitosa (+5% Bono)");
        } else {
            window.showToast("❌ " + (result.message || "Error"), "error");
        }
    } catch (e) {
        window.showToast("⚠️ Error de conexión", "error");
    }
};

// --- 4. MOTOR Y PERFIL ---

function startMiningEngine() {
    setInterval(() => {
        if (state.totalInvestedUSDT > 0) {
            // Ganancia por segundo basada en inversión
            state.accumulatedMining += (state.totalInvestedUSDT * 1000 * 0.0000001);
            const display = document.getElementById('mining-balance');
            if (display) display.innerText = state.accumulatedMining.toFixed(6);
        }
    }, 1000);
}

function initUserProfile() {
    const nameEl = document.getElementById('user-full-name');
    const picEl = document.getElementById('user-pic');

    if (window.Telegram?.WebApp?.initDataUnsafe?.user) {
        const user = window.Telegram.WebApp.initDataUnsafe.user;
        const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim();
        if (nameEl) nameEl.innerText = fullName || 'Usuario';
        if (picEl && user.photo_url) picEl.src = user.photo_url;
    }
}

window.showToast = function(message, type = "success") {
    const old = document.querySelector('.toast-notif');
    if (old) old.remove();
    const toast = document.createElement('div');
    toast.className = 'toast-notif';
    toast.innerText = message;
    toast.style.cssText = `position:fixed; bottom:100px; left:50%; transform:translateX(-50%); background:${type==="success"?"#10b981":"#ef4444"}; color:white; padding:12px 24px; border-radius:50px; z-index:10000; font-weight:bold; box-shadow: 0 4px 15px rgba(0,0,0,0.3);`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
};

// --- 5. LANZAMIENTO ---

window.onload = () => {
    if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.ready();
        window.Telegram.WebApp.expand();
    }
    initUserProfile();
    syncInitialData();
    startMiningEngine();
};
