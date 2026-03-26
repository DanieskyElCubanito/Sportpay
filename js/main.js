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
        'stat-rate': currentRate.toFixed(1)
    };

    for (const [id, val] of Object.entries(elements)) {
        const el = document.getElementById(id);
        if (el) {
            // Animación simple de actualización
            el.innerText = val;
        }
    }
}

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
        <div style="background: white; padding: 15px; border-radius: 12px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; border-left: 4px solid ${tx.type === 'Earning' ? '#10b981' : '#3b82f6'}; box-shadow: 0 2px 5px rgba(0,0,0,0.05);">
            <div>
                <div style="font-weight: 700; color: #1e293b;">${tx.type === 'Earning' ? 'Daily Return' : 'Deposit AE'}</div>
                <div style="font-size: 0.75em; color: #94a3b8;">${tx.date}</div>
            </div>
            <div style="text-align: right;">
                <div style="font-weight: 800; color: ${tx.type === 'Earning' ? '#10b981' : '#1e293b'};">
                    + ${tx.amount.toFixed(tx.type === 'Earning' ? 4 : 2)}
                </div>
                <div style="font-size: 0.7em; color: #64748b;">Completed</div>
            </div>
        </div>
    `).join('');
};

// --- 6. NAVEGACIÓN ENTRE PESTAÑAS ---
window.switchTab = function(id) {
    // Si entramos a historial, renderizamos primero
    if(id === 'history') window.renderHistory();

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

    // Actualizar estados de la barra de navegación
    document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
    const activeNav = document.querySelector(`.nav-item[onclick*="'${id}'"]`);
    if(activeNav) activeNav.classList.add('active');

    // Feedback táctil si es Telegram
    if(window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
    }
};

// --- 7. INICIALIZACIÓN Y CRONÓMETRO ---
window.onload = () => {
    const tg = window.Telegram?.WebApp;
    
    // Configuración inicial de Telegram
    if(tg) {
        tg.ready();
        tg.expand();
        const user = tg.initDataUnsafe?.user;
        if (user) {
            const nameEl = document.getElementById('user-name');
            const idEl = document.getElementById('user-id');
            const meIdEl = document.getElementById('me-id');
            
            if(nameEl) nameEl.innerText = user.first_name || "User";
            if(idEl) idEl.innerText = user.id;
            if(meIdEl) meIdEl.innerText = user.id;
        }
    }

    // Procesar Ganancias Diarias (Cuba)
    const wasPaid = processDailyEarnings();
    if(wasPaid) {
        window.showToast("Daily earnings credited! 💰");
    }

    // Cargar datos iniciales en pantalla
    updateDashboard();

    // CRONÓMETRO HACIA LA MEDIANOCHE DE CUBA
    setInterval(() => {
        const timerEl = document.getElementById('timer');
        if(!timerEl) return;

        // Solo cuenta si hay inversión activa
        if (!state.totalInvestedUSDT || state.totalInvestedUSDT <= 0) {
            timerEl.innerText = "00:00:00";
            return;
        }

        const now = new Date();
        // Obtener hora actual en Cuba
        const cubaNow = new Date(now.toLocaleString("en-US", {timeZone: "America/Havana"}));
        
        const hrs = (23 - cubaNow.getHours()).toString().padStart(2, '0');
        const min = (59 - cubaNow.getMinutes()).toString().padStart(2, '0');
        const sec = (59 - cubaNow.getSeconds()).toString().padStart(2, '0');
        
        timerEl.innerText = `${hrs}:${min}:${sec}`;
    }, 1000);
};

// Exponer funciones adicionales globalmente
window.updateDashboard = updateDashboard;
