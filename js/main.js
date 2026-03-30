function syncInitialData() {
    const params = new URLSearchParams(window.location.search);
    
    // ESTA LÍNEA DE PRUEBA:
    alert("Datos recibidos: Balance=" + params.get('balance') + " ID=" + params.get('user_id'));

    if (params.has('balance')) {
        state.totalEarnedUSD = parseFloat(params.get('balance'));
    }
    // ... resto del código
}
import { state, saveInvestment, processDailyEarnings } from './state.js';

// --- CONFIGURACIÓN DE SEGURIDAD ---
const BJS_CONFIG = {
    botId: "8101312620",
    secretKey: "1$MillonDannyMeli*@#€", 
    token: "X6MBnt6bQxIc66AoNZ3xLXHGmKXs7Zq5kx75GWK8" 
};

const urlParams = new URLSearchParams(window.location.search);
const userId = urlParams.get('user_id');

window.saveInvestment = saveInvestment;

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

// --- ACTUALIZAR INTERFAZ (Movida arriba para que sea accesible) ---
export function updateDashboard() {
    const invested = state.totalInvestedUSDT || 0;
    const balance = state.totalEarnedUSD || 0;
    const currentGHS = invested * 1000;
    
    let planName = "Gratis";
    let rateText = "0.0%";

    if (invested >= 3000) { planName = "GIGA"; rateText = "7.5%"; }
    else if (invested >= 300) { planName = "MASTER"; rateText = "6.5%"; }
    else if (invested >= 20) { planName = "NODE"; rateText = "5.5%"; }
    else if (invested >= 1) { planName = "MICRO"; rateText = "4.5%"; }

    // Forzamos la actualización en el DOM
    const mainBalEl = document.getElementById('main-balance');
    if (mainBalEl) mainBalEl.innerText = balance.toFixed(2);

    const elements = {
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

async function claimMining() {
    if (!state.accumulatedMining || state.accumulatedMining <= 0) {
        window.showToast("No hay saldo para reclamar");
        return;
    }

    if (!userId) {
        window.showToast("Error: Abre la app desde el Bot");
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
            // Actualizamos el objeto state
            state.totalEarnedUSD = (state.totalEarnedUSD || 0) + amountToClaim;
            state.accumulatedMining = 0;
            updateDashboard();
            window.showToast("✅ Saldo guardado en la nube");
        } else {
            window.showToast("❌ " + (result.error || "Error"));
        }
    } catch (error) {
        window.showToast("⚠️ Error de conexión");
    }
}
window.claimMining = claimMining;

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

function syncInitialData() {
    const params = new URLSearchParams(window.location.search);
    
    // IMPORTANTE: Sobrescribimos los valores de 'state' con lo que viene de la URL
    if (params.has('balance')) {
        state.totalEarnedUSD = parseFloat(params.get('balance'));
    }
    if (params.has('invested')) {
        state.totalInvestedUSDT = parseFloat(params.get('invested'));
    }
    
    updateDashboard();
    startMiningEngine();
}

window.addEventListener('load', syncInitialData);
