import { state, saveInvestment, processDailyEarnings } from './state.js';

// --- CONFIGURACIÓN DE SEGURIDAD (EDITA ESTO) ---
const BJS_CONFIG = {
    botId: "TU_BOT_ID_AQUÍ", // ID numérico de tu bot en BJS
    secretKey: "Tu_Clave_Ultra_Secreta_123", 
    token: "TU_API_KEY_DE_BJS" 
};

// --- EXTRAER ID DE USUARIO ---
const urlParams = new URLSearchParams(window.location.search);
const userId = urlParams.get('user_id');

// --- PUENTE GLOBAL ---
window.saveInvestment = saveInvestment;

// --- 1. UI GLOBAL (TOAST) ---
window.showToast = function(message) {
    const oldToast = document.querySelector('.toast-notification');
    if (oldToast) oldToast.remove();
    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.innerText = message;
    toast.style.cssText = "position:fixed; bottom:80px; left:50%; transform:translateX(-50%); background:#1e293b; color:white; padding:12px 24px; border-radius:30px; font-weight:700; z-index:9999; box-shadow:0 4px 15px rgba(0,0,0,0.2);";
    document.body.appendChild(toast);
    setTimeout(() => { if (toast) toast.remove(); }, 3000);
};

// --- 2. FUNCIÓN DE RECLAMO SEGURA (CORREGIDA) ---
async function claimMining() {
    if (!state.accumulatedMining || state.accumulatedMining <= 0) {
        window.showToast("No hay saldo para reclamar");
        return;
    }

    if (!userId) {
        window.showToast("Error: Usuario no identificado");
        return;
    }

    const amountToClaim = state.accumulatedMining;
    window.showToast("Procesando reclamo...");

    const apiURL = `https://api.bots.business/v1/bots/${BJS_CONFIG.botId}/commands/api_save`;
    const finalURL = `${apiURL}?user_id=${userId}&amount=${amountToClaim}&key=${BJS_CONFIG.secretKey}`;

    try {
        const response = await fetch(finalURL, {
            headers: { "api_key": BJS_CONFIG.token }
        });
        
        const result = await response.json();

        if (result.status === "success") {
            state.totalEarnedUSD += amountToClaim;
            state.accumulatedMining = 0;
            updateDashboard();
            window.showToast("✅ Saldo guardado en la nube");
        } else {
            window.showToast("❌ Error: " + (result.error || "Fallo de seguridad"));
        }
    } catch (error) {
        console.error("Error de red:", error);
        window.showToast("⚠️ Error de conexión");
    }
}
window.claimMining = claimMining;

// --- 3. MOTOR DE MINERÍA ---
function startMiningEngine() {
    setInterval(() => {
        const currentGHS = (state.totalInvestedUSDT || 0) * 1000;
        if (currentGHS > 0) {
            const gainPerSecond = (currentGHS * 0.0000001); 
            state.accumulatedMining = (state.accumulatedMining || 0) + gainPerSecond;
            
            const miningDisplay = document.getElementById('mining-balance');
            if (miningDisplay) {
                miningDisplay.innerText = state.accumulatedMining.toFixed(4);
            }
        }
    }, 1000);
}

// --- 4. ACTUALIZAR INTERFAZ ---
export function updateDashboard() {
    const invested = state.totalInvestedUSDT || 0;
    const currentGHS = invested * 1000;
    
    let planName = "Gratis";
    let rateText = "0.0%";

    if (invested >= 3000) { planName = "GIGA"; rateText = "7.5%"; }
    else if (invested >= 300) { planName = "MASTER"; rateText = "6.5%"; }
    else if (invested >= 20) { planName = "NODE"; rateText = "5.5%"; }
    else if (invested >= 1) { planName = "MICRO"; rateText = "4.5%"; }

    const elements = {
        'main-balance': (state.totalEarnedUSD || 0).toFixed(2),
        'total-profit': `+$${(state.totalProfit || 0).toFixed(2)}`,
        'user-plan-name': planName,
        'stat-rate-display': rateText,
        'mining-speed': `${currentGHS.toLocaleString()} GH/s activos`
    };

    for (const [id, val] of Object.entries(elements)) {
        const el = document.getElementById(id);
        if (el) el.innerText = val;
    }
}

// --- 5. CARGA INICIAL ---
function syncInitialData() {
    const params = new URLSearchParams(window.location.search);
    if (params.has('balance')) state.totalEarnedUSD = parseFloat(params.get('balance')) || 0;
    if (params.has('invested')) state.totalInvestedUSDT = parseFloat(params.get('invested')) || 0;
    
    updateDashboard();
    startMiningEngine(); // Iniciamos el motor aquí
}

window.addEventListener('load', syncInitialData);
