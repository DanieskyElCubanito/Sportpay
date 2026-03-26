import { state, saveInvestment, processDailyEarnings } from './state.js';

// --- PUENTE GLOBAL ----
// Esto permite que las funciones de state.js sean visibles para el HTML
window.saveInvestment = saveInvestment;

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

// --- 7. LÓGICA DE LIVE FEED ---
function startLiveFeed() {
    const feedText = document.getElementById('live-feed-text');
    if (!feedText) return;

    const actions = [
        { text: "invested", icon: "💰", color: "#3b82f6", min: 10, max: 1000 },
        { text: "withdrew", icon: "🚀", color: "#10b981", min: 5, max: 200 },
        { text: "reinvested", icon: "♻️", color: "#f59e0b", min: 1, max: 50 },
        { text: "received bonus", icon: "🎁", color: "#ef4444", min: 10, max: 10 }
    ];

    function generateDynamicTx() {
        const userId = `${Math.floor(Math.random() * 800 + 100)}***`;
        const action = actions[Math.floor(Math.random() * actions.length)];
        const amount = (Math.random() * (action.max - action.min) + action.min).toFixed(2);
        return `${action.icon} <span style="color: #64748b">User</span> <b>${userId}</b> ${action.text} <b style="color: ${action.color}">$${amount}</b>`;
    }

    const runFeed = () => {
        feedText.style.opacity = 0;
        setTimeout(() => {
            feedText.innerHTML = generateDynamicTx();
            feedText.style.opacity = 1;
            setTimeout(runFeed, 5000);
        }, 500);
    };
    runFeed();
}

// --- 8. SISTEMA DE REFERIDOS ---
window.copyReferralLink = function() {
    const linkInput = document.getElementById('referral-link');
    if (!linkInput) return;
    linkInput.select();
    try {
        navigator.clipboard.writeText(linkInput.value);
        window.showToast("Link copied! Share to grow your team 🚀");
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

    const levels = ['lvl1-count', 'lvl2-count', 'lvl3-count', 'lvl4-count', 'lvl5-count'];
    let totalMembers = 0;
    levels.forEach((id, index) => {
        const count = state[`lvl${index+1}Count`] || 0;
        const el = document.getElementById(id);
        if (el) el.innerText = count;
        totalMembers += count;
    });

    if (document.getElementById('total-team-size')) document.getElementById('total-team-size').innerText = totalMembers;
    if (document.getElementById('total-ref-earnings')) document.getElementById('total-ref-earnings').innerText = (state.referralEarnings || 0).toFixed(2);
}

// --- 9. INICIALIZACIÓN ---
window.onload = () => {
    const urlParams = new URLSearchParams(window.location.search);

    if (urlParams.has('id')) {
        const botId = urlParams.get('id');
        const botEarn = parseFloat(urlParams.get('earn') || 0);
        if (botEarn > state.totalEarnedUSD) state.totalEarnedUSD = botEarn;
        state.lvl1Count = parseInt(urlParams.get('l1') || 0);
        state.lvl2Count = parseInt(urlParams.get('l2') || 0);
        localStorage.setItem('user_id', botId);
        localStorage.setItem('earned', state.totalEarnedUSD.toString());
    }
    
    const tg = window.Telegram?.WebApp;
    if(tg) {
        tg.ready();
        tg.expand();
        if (tg.initDataUnsafe?.user) {
            const user = tg.initDataUnsafe.user;
            if(document.getElementById('user-name')) document.getElementById('user-name').innerText = user.first_name;
            localStorage.setItem('user_id', user.id);
        }
    }

    processDailyEarnings();
    updateDashboard();
    startLiveFeed();
    updateReferralUI();

    setInterval(() => {
        const timerEl = document.getElementById('timer');
        if(!timerEl || !state.totalInvestedUSDT || state.totalInvestedUSDT <= 0) return;
        const now = new Date();
        const cubaNow = new Date(now.toLocaleString("en-US", {timeZone: "America/Havana"}));
        timerEl.innerText = `${(23-cubaNow.getHours()).toString().padStart(2,'0')}:${(59-cubaNow.getMinutes()).toString().padStart(2,'0')}:${(59-cubaNow.getSeconds()).toString().padStart(2,'0')}`;
    }, 1000);
};

// --- 10. FUNCIONES DE ACCIÓN ---

window.refreshData = function() {
    const icon = document.querySelector('.fa-sync-alt');
    if(icon) icon.classList.add('fa-spin');
    window.showToast("Syncing data...");
    setTimeout(() => { location.reload(); }, 800);
};

window.showPayment = function() {
    const qtyInput = document.getElementById('buy-qty');
    const qty = parseFloat(qtyInput?.value || 0);

    if (qty < 1) {
        window.showToast("Minimum investment is 1 USDT");
        return;
    }

    const btn = document.getElementById('btn-continue');
    if(btn) { btn.disabled = true; btn.innerText = "Processing..."; }

    setTimeout(() => {
        window.saveInvestment(qty); 
        window.showToast(`Investment of ${qty} USDT Successful! 🚀`);
        updateDashboard();
        if(btn) { btn.disabled = false; btn.innerText = "Activate AI Energy"; }
        if(qtyInput) qtyInput.value = "";
        switchTab('home');
    }, 1500);
};

window.requestWithdraw = function() {
    const amount = parseFloat(document.getElementById('withdraw-amount')?.value || 0);
    const address = document.getElementById('withdraw-address')?.value.trim();

    if (amount < 5) { window.showToast("Min withdraw 5 USDT"); return; }
    if (amount > state.totalEarnedUSD) { window.showToast("Insufficient balance"); return; }
    if (!address || address.length < 30) { window.showToast("Invalid address"); return; }

    state.totalEarnedUSD -= amount;
    localStorage.setItem('earned', state.totalEarnedUSD.toString());

    state.history.unshift({
        type: 'Withdraw',
        amount: amount,
        date: new Date().toLocaleString("es-CU"),
        id: 'out-' + Date.now()
    });
    localStorage.setItem('deposit_history', JSON.stringify(state.history));

    window.showToast("Withdrawal Requested! 🚀");
    updateDashboard();
    switchTab('home');
};
