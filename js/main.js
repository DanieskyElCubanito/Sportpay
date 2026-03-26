import { state, saveInvestment, processDailyEarnings } from './state.js';

// --- 1. UI GLOBAL (TOAST) ---
window.showToast = function(message) {
    const oldToast = document.querySelector('.toast-notification');
    if (oldToast) oldToast.remove();
    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.innerText = message;
    document.body.appendChild(toast);
    setTimeout(() => { if (toast) toast.remove(); }, 3000);
};

// --- 2. LÓGICA DE NEGOCIO (TIERS) ---
function calculateRate(qty) {
    if (qty >= 3000) return 7.0;
    if (qty >= 300) return 6.5;
    if (qty >= 20) return 6.0;
    return 5.5;
}

// --- 3. ACTUALIZACIÓN DEL DASHBOARD ---
export function updateDashboard() {
    const currentAE = (state.totalInvestedUSDT || 0) * 1000;
    const currentRate = calculateRate(state.totalInvestedUSDT || 0);
    const dailyEarn = (state.totalInvestedUSDT || 0) * (currentRate / 100);

    const elements = {
        'main-bal': (state.totalEarnedUSD || 0).toFixed(4),
        'main-power': currentAE.toLocaleString(),
        'stat-daily': dailyEarn.toFixed(4),
        'stat-rate': currentRate.toFixed(1),
        'withdraw-available': (state.totalEarnedUSD || 0).toFixed(4)
    };

    for (const [id, val] of Object.entries(elements)) {
        const el = document.getElementById(id);
        if (el) {
            el.innerText = val;
        }
    }
    
    updateReferralUI();
}
window.updateDashboard = updateDashboard;

// --- 4. CALCULADORA DETALLADA ---
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

// --- 5. SISTEMA DE HISTORIAL ---
window.renderHistory = function() {
    const historyContainer = document.getElementById('history-list');
    if (!historyContainer) return;

    if (!state.history || state.history.length === 0) {
        historyContainer.innerHTML = `
            <div style="text-align: center; color: #94a3b8; margin-top: 40px;">
                <i class="fas fa-history" style="font-size: 2em; opacity: 0.5;"></i>
                <p>No transactions yet</p>
            </div>`;
        return;
    }

    historyContainer.innerHTML = state.history.map(tx => `
        <div style="background: white; padding: 15px; border-radius: 12px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; border-left: 4px solid ${tx.type === 'Earning' ? '#10b981' : (tx.type === 'Withdraw' ? '#ef4444' : '#3b82f6')}; box-shadow: 0 2px 5px rgba(0,0,0,0.05);">
            <div>
                <div style="font-weight: 700; color: #1e293b;">${tx.type === 'Earning' ? 'Daily Return' : (tx.type === 'Withdraw' ? 'Withdrawal' : 'Deposit AE')}</div>
                <div style="font-size: 0.75em; color: #94a3b8;">${tx.date}</div>
            </div>
            <div style="text-align: right;">
                <div style="font-weight: 800; color: ${tx.type === 'Earning' ? '#10b981' : (tx.type === 'Withdraw' ? '#ef4444' : '#1e293b')};">
                    ${tx.type === 'Withdraw' ? '-' : '+'} ${tx.amount.toFixed(tx.type === 'Earning' ? 4 : 2)}
                </div>
                <div style="font-size: 0.7em; color: #64748b;">Completed</div>
            </div>
        </div>
    `).join('');
};

// --- 6. NAVEGACIÓN ENTRE PESTAÑAS ---
window.switchTab = function(id) {
    if(id === 'history') window.renderHistory();
    if(id === 'referrals' || id === 'me') updateReferralUI();

    if(id === 'withdraw') {
        const lockNotice = document.getElementById('withdraw-lock-notice');
        const withdrawBtn = document.getElementById('btn-confirm-withdraw');
        const availableEl = document.getElementById('withdraw-available');
        
        if(availableEl) availableEl.innerText = (state.totalEarnedUSD || 0).toFixed(4);

        const isLocked = (!state.totalInvestedUSDT || state.totalInvestedUSDT < 1);
        if (lockNotice && withdrawBtn) {
            lockNotice.style.display = isLocked ? 'block' : 'none';
            withdrawBtn.style.background = isLocked ? '#94a3b8' : '#3b82f6';
            withdrawBtn.style.opacity = isLocked ? '0.6' : '1';
        }
    }

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

// --- 7. LÓGICA DE LIVE FEED PROCEDURAL ---
function startLiveFeed() {
    const feedText = document.getElementById('live-feed-text');
    if (!feedText) return;

    const actions = [
        { text: "invested", icon: "💰", color: "#3b82f6", min: 10, max: 1000 },
        { text: "withdrew", icon: "🚀", color: "#10b981", min: 5, max: 200 },
        { text: "reinvested", icon: "♻️", color: "#f59e0b", min: 1, max: 50 },
        { text: "received bonus", icon: "🎁", color: "#ef4444", min: 10, max: 10 }
    ];

    const timeLabels = ["Just now", "1m ago", "2m ago", "3m ago"];

    function generateDynamicTx() {
        const isWallet = Math.random() > 0.5;
        const userId = isWallet 
            ? `0x${Math.floor(Math.random() * 16777215).toString(16)}...${Math.floor(Math.random() * 99).toString().padStart(2, '0')}`
            : `${Math.floor(Math.random() * 800 + 100)}***`;

        const action = actions[Math.floor(Math.random() * actions.length)];
        const amount = (Math.random() * (action.max - action.min) + action.min).toFixed(2);
        const time = timeLabels[Math.floor(Math.random() * timeLabels.length)];

        return `${action.icon} <span style="color: #64748b">User</span> <b>${userId}</b> ${action.text} <b style="color: ${action.color}">$${amount}</b>`;
    }

    const runFeed = () => {
        feedText.style.opacity = 0;
        setTimeout(() => {
            feedText.innerHTML = generateDynamicTx();
            feedText.style.opacity = 1;
            setTimeout(runFeed, Math.floor(Math.random() * 4000) + 5000);
        }, 500);
    };
    runFeed();
}

// --- 8. SISTEMA DE REFERIDOS ---
window.copyReferralLink = function() {
    const linkInput = document.getElementById('referral-link');
    if (!linkInput) return;
    linkInput.select();
    linkInput.setSelectionRange(0, 99999); 
    try {
        navigator.clipboard.writeText(linkInput.value);
        window.showToast("Link copied! Share to grow your team 🚀");
        if(window.Telegram?.WebApp?.HapticFeedback) {
            window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
        }
    } catch (err) {
        window.showToast("Error copying link");
    }
};

function updateReferralUI() {
    const tg = window.Telegram?.WebApp;
    const userId = tg?.initDataUnsafe?.user?.id || localStorage.getItem('user_id') || "000000";
    
    const linkInput = document.getElementById('referral-link');
    if (linkInput) {
        linkInput.value = `https://t.me/SportsPayBot?start=${userId}`;
    }

    const levelElements = {
        'lvl1-count': state.lvl1Count,
        'lvl2-count': state.lvl2Count,
        'lvl3-count': state.lvl3Count,
        'lvl4-count': state.lvl4Count,
        'lvl5-count': state.lvl5Count
    };

    let totalMembers = 0;
    for (const [id, count] of Object.entries(levelElements)) {
        const el = document.getElementById(id);
        if (el) el.innerText = count || 0;
        totalMembers += (count || 0);
    }

    const totalTeamSizeEl = document.getElementById('total-team-size');
    const totalRefEarningsEl = document.getElementById('total-ref-earnings');
    
    if (totalTeamSizeEl) totalTeamSizeEl.innerText = totalMembers;
    if (totalRefEarningsEl) totalRefEarningsEl.innerText = (state.referralEarnings || 0).toFixed(2);
}

// --- 9. INICIALIZACIÓN ---
window.onload = () => {
    const tg = window.Telegram?.WebApp;
    const urlParams = new URLSearchParams(window.location.search);

    if (urlParams.has('id')) {
        const botId = urlParams.get('id');
        const botEarn = parseFloat(urlParams.get('earn') || 0);
        const l1 = parseInt(urlParams.get('l1') || 0);
        const l2 = parseInt(urlParams.get('l2') || 0);

        if (botEarn > state.totalEarnedUSD) state.totalEarnedUSD = botEarn;
        state.lvl1Count = l1;
        state.lvl2Count = l2;
        
        localStorage.setItem('user_id', botId);
        localStorage.setItem('earned', state.totalEarnedUSD.toString());
        localStorage.setItem('lvl1_c', l1.toString());
        localStorage.setItem('lvl2_c', l2.toString());
    }
    
    if(tg) {
        tg.ready();
        tg.expand();
        const user = tg.initDataUnsafe?.user;
        if (user) {
            const nameEl = document.getElementById('user-name');
            const idEl = document.getElementById('user-id');
            if(nameEl) nameEl.innerText = user.first_name || "User";
            if(idEl) idEl.innerText = user.id;
            localStorage.setItem('user_id', user.id);
        }
    }

    const wasPaid = processDailyEarnings();
    if(wasPaid) window.showToast("Daily earnings credited! 💰");

    updateDashboard();
    startLiveFeed();
    updateReferralUI();

    setInterval(() => {
        const timerEl = document.getElementById('timer');
        if(!timerEl || !state.totalInvestedUSDT || state.totalInvestedUSDT <= 0) return;
        const now = new Date();
        const cubaNow = new Date(now.toLocaleString("en-US", {timeZone: "America/Havana"}));
        const hrs = (23 - cubaNow.getHours()).toString().padStart(2, '0');
        const min = (59 - cubaNow.getMinutes()).toString().padStart(2, '0');
        const sec = (59 - cubaNow.getSeconds()).toString().padStart(2, '0');
        timerEl.innerText = `${hrs}:${min}:${sec}`;
    }, 1000);
};

// --- 10. FUNCIONES DE ACCIÓN (REFRESCAR, INVERTIR, RETIRAR) ---

window.refreshData = function() {
    const refreshBtn = document.querySelector('.fa-sync-alt') || document.querySelector('.fa-redo'); 
    if(refreshBtn) refreshBtn.classList.add('fa-spin');
    window.showToast("Updating data from network...");
    setTimeout(() => { location.reload(); }, 800);
};

window.showPayment = function() {
    const qtyInput = document.getElementById('buy-qty');
    const qty = parseFloat(qtyInput ? qtyInput.value : 0);

    if (!qty || qty < 1) {
        window.showToast("Minimum investment is 1 USDT");
        return;
    }

    const btn = document.getElementById('btn-continue');
    if(btn) {
        btn.disabled = true;
        btn.innerText = "Processing...";
    }

    setTimeout(() => {
        saveInvestment(qty);
        window.showToast(`Successfully invested ${qty} USDT! 🚀`);
        updateDashboard();
        if(btn) {
            btn.disabled = false;
            btn.innerText = "Activate AI Energy";
        }
        if(qtyInput) qtyInput.value = "";
        switchTab('home');
        if(window.Telegram?.WebApp?.HapticFeedback) {
            window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
        }
    }, 1500);
};

window.requestWithdraw = function() {
    const amountInput = document.getElementById('withdraw-amount');
    const addressInput = document.getElementById('withdraw-address');
    
    const amount = parseFloat(amountInput?.value || 0);
    const address = addressInput?.value.trim();

    if (amount < 5) {
        window.showToast("Minimum withdrawal is 5 USDT");
        return;
    }

    if (amount > state.totalEarnedUSD) {
        window.showToast("Insufficient balance");
        return;
    }

    if (!address || address.length < 30) {
        window.showToast("Enter a valid address");
        return;
    }

    const btn = document.getElementById('btn-confirm-withdraw');
    btn.disabled = true;
    btn.innerText = "Sending Request...";

    setTimeout(() => {
        state.totalEarnedUSD -= amount;
        localStorage.setItem('earned', state.totalEarnedUSD.toString());

        const tx = {
            type: 'Withdraw',
            amount: amount,
            date: new Date().toLocaleString("es-CU"),
            id: 'out-' + Date.now()
        };
        state.history.unshift(tx);
        localStorage.setItem('deposit_history', JSON.stringify(state.history));

        window.showToast("Withdrawal requested! Check history 🚀");
        updateDashboard();
        
        if(amountInput) amountInput.value = "";
        btn.disabled = false;
        btn.innerText = "Confirm Withdraw";
        switchTab('home');
    }, 2000);
};
