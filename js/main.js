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

// --- 2. MOTOR DE MINERÍA EN TIEMPO REAL (NUEVO) ---
// Esta función hace que el saldo de "Minería en curso" suba segundo a segundo
function startMiningEngine() {
    setInterval(() => {
        // Obtenemos el poder actual (GHS) desde el estado
        const currentGHS = (state.totalInvestedUSDT || 0) * 1000;
        
        if (currentGHS > 0) {
            // Calculamos la ganancia por segundo (ajusta esta fórmula según tu ROI)
            const gainPerSecond = (currentGHS * 0.0000001); 
            
            // Sumamos al acumulado temporal en el estado
            state.accumulatedMining = (state.accumulatedMining || 0) + gainPerSecond;
            
            // Actualizamos solo el número de la minería en la pantalla
            const miningDisplay = document.getElementById('mining-balance');
            if (miningDisplay) {
                miningDisplay.innerText = state.accumulatedMining.toFixed(4);
            }
        }
    }, 1000);
}

// --- 3. FUNCIÓN PARA RECLAMAR (NUEVO) ---
window.claimMining = function() {
    const accumulated = state.accumulatedMining || 0;
    
    if (accumulated <= 0) {
        window.showToast("No hay saldo para reclamar ⛏️");
        return;
    }

    // 1. Sumar al balance principal y a la ganancia total
    state.totalEarnedUSD = (state.totalEarnedUSD || 0) + accumulated;
    state.totalProfit = (state.totalProfit || 0) + accumulated; // Para la card de Ganancia Total
    
    // 2. Resetear acumulado
    state.accumulatedMining = 0;
    
    // 3. Guardar en localStorage a través del state
    if (typeof state.save === 'function') state.save(); 
    
    // 4. Feedback visual
    window.showToast(`¡+$${accumulated.toFixed(4)} reclamados! 🚀`);
    if (window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
    }
    
    // 5. Actualizar toda la interfaz
    updateDashboard();
};

// --- 4. ACTUALIZACIÓN DEL DASHBOARD (DATOS REALES) ---
export function updateDashboard() {
    const currentGHS = (state.totalInvestedUSDT || 0) * 1000;
    const currentRate = calculateRate(state.totalInvestedUSDT || 0);
    const dailyEarn = (state.totalInvestedUSDT || 0) * (currentRate / 100);

    const elements = {
        'main-balance': (state.totalEarnedUSD || 0).toFixed(2), // Balance arriba
        'total-profit': `+$${(state.totalProfit || 0).toFixed(2)}`, // Card izquierda
        'main-power': currentGHS.toLocaleString(),
        'mining-speed': `${currentGHS.toLocaleString()} GH/s activos`, // Texto azul bajo minería
        'stat-daily': dailyEarn.toFixed(4),
        'stat-rate': currentRate.toFixed(1),
        'user-id': localStorage.getItem('user_id') || '000000'
    };

    for (const [id, val] of Object.entries(elements)) {
        const el = document.getElementById(id);
        if (el) {
            // Si es el total-profit, manejamos el color verde
            if (id === 'total-profit') el.innerText = val;
            else el.innerText = val;
        }
    }
}
window.updateDashboard = updateDashboard;

// --- (Resto de tus funciones: calculateRate, calculateReturns, renderHistory, etc. se mantienen igual) ---
function calculateRate(qty) {
    if (qty >= 3000) return 7.0;
    if (qty >= 300) return 6.5;
    if (qty >= 20) return 6.0;
    return 5.5;
}

window.calculateReturns = function() {
    const inputEl = document.getElementById('buy-amount');
    const outputEl = document.getElementById('ae-calc-total');
    const container = document.getElementById('input-box-container');
    if (!inputEl || !outputEl) return;
    const val = parseFloat(inputEl.value) || 0;
    const totalGHS = val * 1000;
    outputEl.innerText = totalGHS.toLocaleString('en-US');
    if(container) container.style.borderColor = val > 0 ? "#3b82f6" : "#f1f5f9";
};

// --- INICIALIZACIÓN ---
window.onload = () => {
    const tg = window.Telegram?.WebApp;
    if(tg) { tg.ready(); tg.expand(); }

    processDailyEarnings();
    updateDashboard();
    startLiveFeed();
    startMiningEngine(); // Inicia el contador de minería

    const buyInput = document.getElementById('buy-amount');
    if (buyInput) buyInput.addEventListener('input', window.calculateReturns);

    // Temporizador de Próximo Pago (Real)
    setInterval(() => {
        const timerEl = document.getElementById('payment-timer');
        if(!timerEl) return;
        const now = new Date();
        const h = (23-now.getHours()).toString().padStart(2,'0');
        const m = (59-now.getMinutes()).toString().padStart(2,'0');
        const s = (59-now.getSeconds()).toString().padStart(2,'0');
        timerEl.innerText = `${h}:${m}:${s}`;
    }, 1000);
};
