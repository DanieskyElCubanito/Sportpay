import { state, saveInvestment, processDailyEarnings } from './state.js';

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

// --- 2. MOTOR DE MINERÍA EN TIEMPO REAL ---


// --- 2. MOTOR DE MINERÍA EN TIEMPO REAL (CORREGIDO) ---
function startMiningEngine() {
    setInterval(() => {
        const currentGHS = (state.totalInvestedUSDT || 0) * 1000;
        
        if (currentGHS > 0) {
            // Calculamos la ganancia por segundo
            const gainPerSecond = (currentGHS * 0.0000001); 
            
            // IMPORTANTE: Solo sumamos al acumulado temporal (Mining), NO al balance principal
            state.accumulatedMining = (state.accumulatedMining || 0) + gainPerSecond;
            
            // Actualizamos SOLO el número de la tarjeta de minería inferior
            const miningDisplay = document.getElementById('mining-balance');
            if (miningDisplay) {
                miningDisplay.innerText = state.accumulatedMining.toFixed(4);
            }
        }
    }, 1000);
}

export function updateDashboard() {
    // Usamos 'state' que es lo que tienes importado en GitHub
    const invested = state.totalInvestedUSDT || 0;
    const currentGHS = invested * 1000;
    
    let planName = "Gratis";
    let rateText = "0.0%";

    if (invested >= 3000) { planName = "GIGA"; rateText = "7.5%"; }
    else if (invested >= 300) { planName = "MASTER"; rateText = "6.5%"; }
    else if (invested >= 20) { planName = "NODE"; rateText = "5.5%"; }
    else if (invested >= 1) { planName = "MICRO"; rateText = "4.5%"; }

    const elements = {
        // CORRECCIÓN: Usar solo el valor guardado, sin sumarle el acumulado
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
function claimMining() {
    if (state.accumulatedMining > 0) {
        // 1. Sumamos al balance local de la pantalla
        state.totalEarnedUSD += state.accumulatedMining;
        state.accumulatedMining = 0;
        updateDashboard();

        // 2. Preparamos el paquete para el Bot
        const dataToBot = {
            type: "save_balance",
            balance: state.totalEarnedUSD,
            invested: state.totalInvestedUSDT
        };

        // 3. ENVIAR A BJS (Esto cierra la App y activa 'on_serialized_data')
        if (window.Telegram.WebApp) {
            window.Telegram.WebApp.sendData(JSON.stringify(dataToBot));
        }
    }
}
function syncInitialData() {
    const params = new URLSearchParams(window.location.search);
    
    // Si la URL trae balance, lo cargamos sobre el valor por defecto
    if (params.has('balance')) {
        state.totalEarnedUSD = parseFloat(params.get('balance')) || 0;
    }
    if (params.has('invested')) {
        state.totalInvestedUSDT = parseFloat(params.get('invested')) || 0;
    }
    
    // Refrescamos la interfaz
    updateDashboard();
}

// Ejecutar al cargar
window.addEventListener('load', syncInitialData);
