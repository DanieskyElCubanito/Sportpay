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
    
    // Estilos dinámicos para el toast por si no los tienes en el CSS
    toast.style.position = 'fixed';
    toast.style.bottom = '80px';
    toast.style.left = '50%';
    toast.style.transform = 'translateX(-50%)';
    toast.style.background = '#1e293b';
    toast.style.color = 'white';
    toast.style.padding = '12px 24px';
    toast.style.borderRadius = '30px';
    toast.style.fontWeight = '700';
    toast.style.zIndex = '9999';
    toast.style.boxShadow = '0 4px 15px rgba(0,0,0,0.2)';
    
    document.body.appendChild(toast);
    setTimeout(() => { if (toast) toast.remove(); }, 3000);
};

// --- 2. LÓGICA DE NEGOCIO (TIERS - NIVELES DE MINERÍA) ---
function calculateRate(qty) {
    if (qty >= 3000) return 7.0; // Giga Farm
    if (qty >= 300) return 6.5;  // Hash Master
    if (qty >= 20) return 6.0;   // Node Runner
    return 5.5;                  // Micro Miner
}

// --- 3. ACTUALIZACIÓN DEL DASHBOARD ---
export function updateDashboard() {
    // 1 USDT = 1000 GH/s de poder
    const currentGHS = (state.totalInvestedUSDT || 0) * 1000;
    const currentRate = calculateRate(state.totalInvestedUSDT || 0);
    const dailyEarn = (state.totalInvestedUSDT || 0) * (currentRate / 100);

    const elements = {
        'main-bal': (state.totalEarnedUSD || 0).toFixed(4),
        'main-power': currentGHS.toLocaleString(),
        'stat-daily': dailyEarn.toFixed(4),
        'stat-rate': currentRate.toFixed(1),
        'withdraw-bal': (state.totalEarnedUSD || 0).toFixed(4), // Actualizado al ID del nuevo HTML
        'me-id': localStorage.getItem('user_id') || '000000',
        'user-id': localStorage.getItem('user_id') || '000000'
    };

    for (const [id, val] of Object.entries(elements)) {
        const el = document.getElementById(id);
        if (el) el.innerText = val;
    }
    
    updateReferralUI();
}
window.updateDashboard = updateDashboard;

// --- 4. CALCULADORA DE RENDIMIENTOS ---
window.calculateReturns = function() {
    // Corregido el ID para que coincida con el nuevo HTML
    const qtyInput = document.getElementById('buy-amount');
    const qty = parseFloat(qtyInput ? qtyInput.value : 0) || 0;
    
    // Cálculo de GH/s (1 USDT = 1000 GH/s)
    const ghsPower = qty * 1000;

    const aeTotal = document.getElementById('ae-calc-total');

    // Solo insertamos el número porque el HTML ya dice " GH/s" al lado
    if (aeTotal) aeTotal.innerText = ghsPower.toLocaleString();
};

// --- 5. SISTEMA DE HISTORIAL ---
window.renderHistory = function() {
    const historyContainer = document.getElementById('history-list');
    if (!historyContainer) return;

    if (!state.history || state.history.length === 0) {
        historyContainer.innerHTML = `
            <div style="text-align: center; color: #94a3b8; padding: 60px 20px;">
                <i class="fas fa-history" style="font-size: 3.5em; margin-bottom: 15px; opacity: 0.2;"></i>
                <div style="font-weight: 600; font-size: 0.9em;">No transactions recorded yet.</div>
            </div>`;
        return;
    }

    historyContainer.innerHTML = state.history.map(tx => `
        <div class="history-item" style="background: white; padding: 15px; border-radius: 12px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; border-left: 4px solid ${tx.type === 'Earning' ? '#10b981' : (tx.type === 'Withdraw' ? '#ef4444' : '#3b82f6')}; box-shadow: 0 2px 5px rgba(0,0,0,0.05);">
            <div>
                <div style="font-weight: 700; color: #1e293b;">${tx.type === 'Earning' ? 'Mining Yield' : (tx.type === 'Withdraw' ? 'Withdrawal' : 'Hash Purchase')}</div>
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

// --- 6. FUNCIONES DE BOTONES FALTANTES ---
window.showPayment = function() {
    const amount = document.getElementById('buy-amount')?.value;
    if (!amount || amount < 1) {
        window.showToast("Minimum investment is $1");
        return;
    }
    window.showToast("Generating secure deposit address...");
    // Aquí puedes enlazar tu lógica para mostrar la wallet o abrir el bot
};

window.processWithdraw = function() {
    const address = document.getElementById('withdraw-address')?.value;
    const amount = parseFloat(document.getElementById('withdraw-amount')?.value);
    const balance = state.totalEarnedUSD || 0;
    
    if (!address || address.length < 10) {
        window.showToast("Please enter a valid wallet address");
        return;
    }
    if (!amount || amount < 10) {
        window.showToast("Minimum withdrawal is $10.00");
        return;
    }
    if (amount > balance) {
        window.showToast("Insufficient available balance");
        return;
    }
    
    window.showToast("Withdrawal request submitted! ⏳");
    // Aquí enlazas con tu base de datos para descontar el saldo
};

// --- 7. LÓGICA DE LIVE FEED ---
function startLiveFeed() {
    const feedText = document.getElementById('live-feed-text');
    if (!feedText) return;

    const actions = [
        { text: "purchased hash", icon: "⚡", color: "#3b82f6", min: 10, max: 1000 },
        { text: "withdrew", icon: "💸", color: "#10b981", min: 10, max: 200 },
        { text: "upgraded node", icon: "🔌", color: "#f59e0b", min: 50, max: 500 }
    ];

    const runFeed = () => {
        const userId = `${Math.floor(Math.random() * 800 + 100)}***`;
        const action = actions[Math.floor(Math.random() * actions.length)];
        const amount = (Math.random() * (action.max - action.min) + action.min).toFixed(2);
        
        feedText.style.opacity = 0;
        setTimeout(() => {
            feedText.innerHTML = `${action.icon} User <b>${userId}</b> ${action.text} <b style="color: ${action.color}">$${amount}</b>`;
            feedText.style.opacity = 1;
            setTimeout(runFeed, 4000); // Lo bajé a 4s para que se vea más activo
        }, 500);
    };
    runFeed();
}

// --- 8. SISTEMA DE REFERIDOS ---
window.copyReferralLink = function() {
    const linkInput = document.getElementById('referral-link');
    if (!linkInput) return;
    navigator.clipboard.writeText(linkInput.value).then(() => {
        window.showToast("Link copied to clipboard! 🚀");
    });
};

function updateReferralUI() {
    const userId = localStorage.getItem('user_id') || "000000";
    const linkInput = document.getElementById('referral-link');
    if (linkInput) linkInput.value = `https://t.me/SportsPayBot?start=${userId}`;

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

    // Temporizador de pago (Settlement)
    setInterval(() => {
        const timerEl = document.getElementById('timer');
        if(!timerEl) return;
        
        // El reloj sigue corriendo aunque no tenga inversión para incitar a comprar
        const now = new Date();
        const cubaNow = new Date(now.toLocaleString("en-US", {timeZone: "America/Havana"}));
        timerEl.innerText = `${(23-cubaNow.getHours()).toString().padStart(2,'0')}:${(59-cubaNow.getMinutes()).toString().padStart(2,'0')}:${(59-cubaNow.getSeconds()).toString().padStart(2,'0')}`;
    }, 1000);
};

window.refreshData = function() {
    window.showToast("Syncing with blockchain...");
    setTimeout(() => { location.reload(); }, 800);
};
