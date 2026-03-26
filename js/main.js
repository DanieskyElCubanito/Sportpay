import { state, saveInvestment, clearTempWallet } from './state.js';

// --- 1. UI GLOBAL ---
window.showToast = function(message) {
    const oldToast = document.querySelector('.toast-notification');
    if (oldToast) oldToast.remove();
    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.innerText = message;
    document.body.appendChild(toast);
    setTimeout(() => { if (toast) toast.remove(); }, 3000);
};

// --- 2. DASHBOARD ---
function calculateRate(qty) {
    if (qty >= 3000) return 7.0;
    if (qty >= 300) return 6.5;
    if (qty >= 20) return 6.0;
    return 5.5;
}

export function updateDashboard() {
    const currentAE = (state.totalInvestedUSDT || 0) * 1000;
    const currentRate = calculateRate(state.totalInvestedUSDT || 0);
    const dailyEarn = (state.totalInvestedUSDT || 0) * (currentRate / 100);

    const elements = {
        'main-bal': (state.totalEarnedUSD || 0).toFixed(4),
        'main-power': currentAE.toLocaleString(),
        'stat-daily': dailyEarn.toFixed(4),
        'stat-rate': currentRate.toFixed(1)
    };

    for (const [id, val] of Object.entries(elements)) {
        const el = document.getElementById(id);
        if (el) el.innerText = val;
    }
}

// --- 3. FUNCIONES ENLAZADAS AL HTML (window.) ---
window.calculateReturns = function() {
    const qtyInput = document.getElementById('buy-qty');
    const qty = parseFloat(qtyInput ? qtyInput.value : 0) || 0;
    const rate = calculateRate(qty);
    const daily = qty * (rate / 100);
    const total20 = daily * 20;

    const aeTotal = document.getElementById('ae-calc-total');
    const usdTotal = document.getElementById('usd-calc-total');
    const estDaily = document.getElementById('est-daily');
    const est20 = document.getElementById('est-20');
    const estProfit = document.getElementById('est-profit');

    if (aeTotal) aeTotal.innerText = (qty * 1000).toLocaleString();
    if (usdTotal) usdTotal.innerText = qty.toFixed(2);
    if (estDaily) estDaily.innerText = `$${daily.toFixed(4)}`;
    if (est20) est20.innerText = `$${total20.toFixed(2)}`;
    if (estProfit) estProfit.innerText = `$${(total20 - qty).toFixed(2)}`;
};

window.switchTab = function(id) {
    const views = document.querySelectorAll('.view');
    views.forEach(v => {
        v.classList.remove('active');
        v.style.display = 'none';
    });
    const targetView = document.getElementById('view-' + id);
    if (targetView) {
        targetView.classList.add('active');
        targetView.style.display = 'block';
    }

    document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
    const activeNav = document.querySelector(`.nav-item[onclick*="'${id}'"]`);
    if(activeNav) activeNav.classList.add('active');

    if(window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
    }
};

// --- 4. INICIO DE LA APP ---
window.onload = () => {
    const tg = window.Telegram?.WebApp;
    if(tg) {
        tg.ready();
        tg.expand();
        const user = tg.initDataUnsafe?.user;
        if (user) {
            const elName = document.getElementById('user-name');
            const elId = document.getElementById('user-id');
            const elMeId = document.getElementById('me-id');
            if(elName) elName.innerText = user.first_name || "User";
            if(elId) elId.innerText = user.id;
            if(elMeId) elMeId.innerText = user.id;
        }
    }

    updateDashboard();

    setInterval(() => {
        const now = new Date();
        const hrs = (23 - now.getHours()).toString().padStart(2, '0');
        const min = (59 - now.getMinutes()).toString().padStart(2, '0');
        const sec = (59 - now.getSeconds()).toString().padStart(2, '0');
        const timerEl = document.getElementById('timer');
        if(timerEl) timerEl.innerText = `${hrs}:${min}:${sec}`;
    }, 1000);
};
