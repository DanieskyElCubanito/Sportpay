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
function startMiningEngine() {
    setInterval(() => {
        const currentGHS = (state.totalInvestedUSDT || 0) * 1000;
        if (currentGHS > 0) {
            // Ganancia por segundo basada en el poder
            const gainPerSecond = (currentGHS * 0.0000001); 
            state.accumulatedMining = (state.accumulatedMining || 0) + gainPerSecond;
            
            const miningDisplay = document.getElementById('mining-balance');
            if (miningDisplay) {
                miningDisplay.innerText = state.accumulatedMining.toFixed(4);
            }
        }
    }, 1000);
}

// --- 3. FUNCIÓN PARA RECLAMAR ---
window.claimMining = function() {
    const accumulated = state.accumulatedMining || 0;
    if (accumulated <= 0) {
        window.showToast("No hay saldo para reclamar ⛏️");
        return;
    }

    state.totalEarnedUSD = (state.totalEarnedUSD || 0) + accumulated;
    state.accumulatedMining = 0;
    
    if (typeof state.save === 'function') state.save(); 
    
    window.showToast(`¡+$${accumulated.toFixed(4)} reclamados! 🚀`);
    if (window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
    }
    updateDashboard();
};

// --- 4. ACTUALIZACIÓN DEL DASHBOARD (NIVELES Y % REALES) ---
export function updateDashboard() {
    const invested = state.totalInvestedUSDT || 0;
    const currentGHS = invested * 1000;
    
    // Lógica de Niveles y Tasas
    let planName = "Gratis";
    let rateText = "0.0%";

    if (invested >= 3000) { planName = "GIGA"; rateText = "7.5%"; }
    else if (invested >= 300) { planName = "MASTER"; rateText = "6.5%"; }
    else if (invested >= 20) { planName = "NODE"; rateText = "5.5%"; }
    else if (invested >= 1) { planName = "MICRO"; rateText = "4.5%"; }

    const elements = {
        'main-balance': (state.totalEarnedUSD || 0).toFixed(2),
        'user-plan-name': planName,
        'stat-rate-display': rateText,
        'mining-speed': `${currentGHS.toLocaleString()} GH/s activos`,
        'user-id': localStorage.getItem('user_id') || '000000'
    };

    for (const [id, val] of Object.entries(elements)) {
        const el = document.getElementById(id);
        if (el) el.innerText = val;
    }
}
window.updateDashboard = updateDashboard;

// --- 5. CALCULADORA Y RENDIMIENTOS ---
function calculateRate(qty) {
    if (qty >= 3000) return 7.5;
    if (qty >= 300) return 6.5;
    if (qty >= 20) return 5.5;
    if (qty >= 1) return 4.5;
    return 0;
}

window.calculateReturns = function() {
    const inputEl = document.getElementById('buy-amount');
    const outputEl = document.getElementById('ae-calc-total');
    if (!inputEl || !outputEl) return;
    const val = parseFloat(inputEl.value) || 0;
    outputEl.innerText = (val * 1000).toLocaleString('en-US');
};

// --- 6. REINVERTIR ---
window.reinvestBalance = function() {
    const currentBalance = state.totalEarnedUSD || 0;
    if (currentBalance < 1) {
        window.Telegram.WebApp.showAlert("Mínimo 1.00 USDT para reinvertir");
        return;
    }
    window.Telegram.WebApp.showConfirm(`¿Reinvertir ${currentBalance.toFixed(2)} USDT con bono del 5%?`, (ok) => {
        if (ok) {
            // Aquí iría tu lógica para sumar al totalInvestedUSDT y resetear balance
            window.showToast("Función de reinversión activada 🔄");
        }
    });
};

// --- 7. LIVE FEED ---
function startLiveFeed() {
    const feedText = document.getElementById('live-feed-text');
    if (!feedText) return;
    const run = () => {
        const id = Math.floor(Math.random()*900+100);
        feedText.innerHTML = `⚡ User <b>${id}***</b> just purchased hash power!`;
        setTimeout(run, 5000);
    };
    run();
}

// --- 8. INICIALIZACIÓN ---
window.onload = () => {
    const tg = window.Telegram?.WebApp;
    if(tg) { tg.ready(); tg.expand(); }

    processDailyEarnings();
    updateDashboard();
    startLiveFeed();
    startMiningEngine();

    const buyInput = document.getElementById('buy-amount');
    if (buyInput) buyInput.addEventListener('input', window.calculateReturns);
};
