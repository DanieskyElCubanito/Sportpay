import { state, saveInvestment, processDailyEarnings } from './state.js';

// --- CALCULADORA INDEPENDIENTE (Prioridad #1) ---
// La ponemos aquí arriba para que cargue primero que nada
window.calculateReturns = function() {
    const inputEl = document.getElementById('buy-amount');
    const outputEl = document.getElementById('ae-calc-total');
    const container = document.getElementById('input-box-container');

    if (!inputEl || !outputEl) return;

    const val = parseFloat(inputEl.value) || 0;
    const totalGHS = val * 1000;

    // Actualizar número en pantalla
    outputEl.innerText = totalGHS.toLocaleString('en-US');

    // Color del borde
    if(container) {
        container.style.borderColor = val > 0 ? "#3b82f6" : "#f1f5f9";
    }

    // Vibración Telegram
    if (window.Telegram?.WebApp?.HapticFeedback && val > 0) {
        window.Telegram.WebApp.HapticFeedback.selectionChanged();
    }
};

// --- UI Y DASHBOARD ---
window.showToast = function(msj) {
    const t = document.createElement('div');
    t.innerText = msj;
    t.style.cssText = "position:fixed; bottom:100px; left:50%; transform:translateX(-50%); background:#1e293b; color:white; padding:12px 25px; border-radius:30px; font-weight:700; z-index:10000; font-size:0.9em;";
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 3000);
};

export function updateDashboard() {
    if(!state) return;
    const ghs = (state.totalInvestedUSDT || 0) * 1000;
    const rate = state.totalInvestedUSDT >= 3000 ? 7.0 : (state.totalInvestedUSDT >= 300 ? 6.5 : (state.totalInvestedUSDT >= 20 ? 6.0 : 5.5));
    
    const fields = {
        'main-bal': state.totalEarnedUSD.toFixed(4),
        'main-power': ghs.toLocaleString(),
        'stat-daily': (state.totalInvestedUSDT * (rate/100)).toFixed(4),
        'stat-rate': rate.toFixed(1),
        'withdraw-bal': state.totalEarnedUSD.toFixed(4)
    };

    for (const [id, val] of Object.entries(fields)) {
        const el = document.getElementById(id);
        if (el) el.innerText = val;
    }
}// --- ACCIONES Y BOTONES ---
window.showPayment = function() {
    const amt = document.getElementById('buy-amount')?.value;
    if (!amt || amt < 1) return window.showToast("Minimum investment $1");
    window.showToast("Redirecting to payment...");
};

window.copyReferralLink = function() {
    const link = document.getElementById('referral-link');
    if (link) {
        navigator.clipboard.writeText(link.value);
        window.showToast("Link copied! 🚀");
    }
};

// --- INICIALIZACIÓN ---
window.onload = () => {
    // 1. Telegram Setup
    const tg = window.Telegram?.WebApp;
    if(tg) { tg.ready(); tg.expand(); }

    // 2. Forzar link de referido
    const uid = localStorage.getItem('user_id') || "000000";
    const refInput = document.getElementById('referral-link');
    if(refInput) refInput.value = `https://t.me/SportsPayBot?start=${uid}`;

    // 3. Procesar ganancias y dashboard
    try {
        processDailyEarnings();
        updateDashboard();
    } catch(e) { console.error("Error en state:", e); }

    // 4. EL FIX MAESTRO: Escuchar el input manualmente
    const inputMain = document.getElementById('buy-amount');
    if(inputMain) {
        inputMain.addEventListener('input', window.calculateReturns);
    }

    // 5. Timer
    setInterval(() => {
        const t = document.getElementById('timer');
        if(!t) return;
        const d = new Date();
        t.innerText = `${(23-d.getHours()).toString().padStart(2,'0')}:${(59-d.getMinutes()).toString().padStart(2,'0')}:${(59-d.getSeconds()).toString().padStart(2,'0')}`;
    }, 1000);
};

// Al final de js/state.js
window.state = state; 
window.saveInvestment = saveInvestment;
