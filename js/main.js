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

// --- 2. LÓGICA DE NEGOCIO ---
function calculateRate(qty) {
    if (qty >= 3000) return 7.0;
    if (qty >= 300) return 6.5;
    if (qty >= 20) return 6.0;
    return 5.5;
}

// --- 3. ACTUALIZACIÓN DEL DASHBOARD ---
export function updateDashboard() {
    const currentGHS = (state.totalInvestedUSDT || 0) * 1000;
    const currentRate = calculateRate(state.totalInvestedUSDT || 0);
    const dailyEarn = (state.totalInvestedUSDT || 0) * (currentRate / 100);

    const elements = {
        'main-bal': (state.totalEarnedUSD || 0).toFixed(4),
        'main-power': currentGHS.toLocaleString(),
        'stat-daily': dailyEarn.toFixed(4),
        'stat-rate': currentRate.toFixed(1),
        'withdraw-bal': (state.totalEarnedUSD || 0).toFixed(4),
        'user-id': localStorage.getItem('user_id') || '000000'
    };

    for (const [id, val] of Object.entries(elements)) {
        const el = document.getElementById(id);
        if (el) el.innerText = val;
    }
    updateReferralUI();
}
window.updateDashboard = updateDashboard;

// --- 4. CALCULADORA DE RENDIMIENTOS (CORREGIDA) ---
window.calculateReturns = function() {
    const inputEl = document.getElementById('buy-amount');
    const outputEl = document.getElementById('ae-calc-total');
    const container = document.getElementById('input-box-container');

    if (!inputEl || !outputEl) return;

    const val = parseFloat(inputEl.value) || 0;
    const totalGHS = val * 1000;

    // Actualizamos el texto
    outputEl.innerText = totalGHS.toLocaleString('en-US');

    // Feedback visual
    if(container) {
        container.style.borderColor = val > 0 ? "#3b82f6" : "#f1f5f9";
    }
    
    if (window.Telegram?.WebApp?.HapticFeedback && val > 0) {
        window.Telegram.WebApp.HapticFeedback.selectionChanged();
    }
};// --- 5. SISTEMA DE HISTORIAL ---
window.renderHistory = function() {
    const historyContainer = document.getElementById('history-list');
    if (!historyContainer) return;
    if (!state.history || state.history.length === 0) {
        historyContainer.innerHTML = `<div style="text-align:center; padding:60px 20px; opacity:0.3;"><i class="fas fa-history" style="font-size:3em;"></i><br>No history</div>`;
        return;
    }
    historyContainer.innerHTML = state.history.map(tx => `
        <div style="background:white; padding:15px; border-radius:12px; display:flex; justify-content:space-between; margin-bottom:10px; border-left:4px solid ${tx.type === 'Withdraw' ? '#ef4444' : '#10b981'};">
            <div><b>${tx.type}</b><br><small>${tx.date}</small></div>
            <div style="text-align:right;"><b>${tx.amount.toFixed(2)}</b><br><small>Completed</small></div>
        </div>
    `).join('');
};

// --- 6. ACCIONES ---
window.showPayment = function() {
    const amount = document.getElementById('buy-amount')?.value;
    if (!amount || amount < 1) return window.showToast("Minimum $1");
    window.showToast("Processing payment gateway...");
};

window.processWithdraw = function() {
    const amount = parseFloat(document.getElementById('withdraw-amount')?.value);
    if (!amount || amount < 10) return window.showToast("Min withdrawal $10");
    window.showToast("Request submitted successfully!");
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

// --- 8. REFERIDOS ---
window.copyReferralLink = function() {
    const link = document.getElementById('referral-link');
    if (link) {
        navigator.clipboard.writeText(link.value);
        window.showToast("Copied to clipboard!");
    }
};

function updateReferralUI() {
    const userId = localStorage.getItem('user_id') || "000000";
    const linkInput = document.getElementById('referral-link');
    if (linkInput) linkInput.value = `https://t.me/SportsPayBot?start=${userId}`;
}

// --- 9. INICIALIZACIÓN Y FIX DE INPUTS ---
window.onload = () => {
    const tg = window.Telegram?.WebApp;
    if(tg) { tg.ready(); tg.expand(); }

    processDailyEarnings();
    updateDashboard();
    startLiveFeed();

    // ESTO ES LO MÁS IMPORTANTE PARA QUE FUNCIONEN LOS GH/S:
    const buyInput = document.getElementById('buy-amount');
    if (buyInput) {
        // Forzamos el escucha por si el oninput del HTML falla
        buyInput.addEventListener('input', window.calculateReturns);
    }

    setInterval(() => {
        const timerEl = document.getElementById('timer');
        if(!timerEl) return;
        const now = new Date();
        timerEl.innerText = `${(23-now.getHours()).toString().padStart(2,'0')}:${(59-now.getMinutes()).toString().padStart(2,'0')}:${(59-now.getSeconds()).toString().padStart(2,'0')}`;
    }, 1000);
};
