// 1. IMPORTACIÓN DEL ESTADO
import { state, saveInvestment, clearTempWallet } from './state.js';

// 2. FUNCIONES DE UI (Toast global)
window.showToast = function(message) {
    const oldToast = document.querySelector('.toast-notification');
    if (oldToast) oldToast.remove();
    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.innerText = message;
    document.body.appendChild(toast);
    setTimeout(() => { if (toast) toast.remove(); }, 3000);
};

// 3. DASHBOARD Y CÁLCULOS
export function updateDashboard() {
    // Calculamos valores basados en la inversión total guardada en state (localStorage)
    const currentAE = state.totalInvestedUSDT * 1000;
    const currentRate = calculateRate(state.totalInvestedUSDT); 
    const dailyEarn = state.totalInvestedUSDT * (currentRate / 100);

    const elements = {
        'main-bal': state.totalEarnedUSD.toFixed(4),
        'main-power': currentAE.toLocaleString(),
        'stat-daily': dailyEarn.toFixed(4),
        'stat-rate': currentRate.toFixed(1)
    };

    for (const [id, val] of Object.entries(elements)) {
        const el = document.getElementById(id);
        if (el) el.innerText = val;
    }
}

// Lógica de porcentajes según inversión
function calculateRate(qty) {
    if (qty >= 3000) return 7.0;
    if (qty >= 300) return 6.5;
    if (qty >= 20) return 6.0;
    return 5.5;
}

// 4. CALCULADORA DE RETORNOS (Vista Energy)
window.calculateReturns = function() {
    const qty = parseFloat(document.getElementById('buy-qty').value) || 0;
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

// 5. NAVEGACIÓN ENTRE TABS
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

    // Feedback vibración Telegram
    if(window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
    }
};

// 6. INICIO DE LA APP
window.onload = () => {
    const tg = window.Telegram?.WebApp;
    if(tg) {
        tg.ready();
        tg.expand();
        const user = tg.initDataUnsafe?.user;
        if (user) {
            if(document.getElementById('user-name')) document.getElementById('user-name').innerText = user.first_name;
            if(document.getElementById('user-id')) document.getElementById('user-id').innerText = user.id;
            if(document.getElementById('me-id')) document.getElementById('me-id').innerText = user.id;
        }
    }
    
    // Cargar datos del balance al iniciar
    updateDashboard();

    // Timer de liquidación global (Top Home)
    setInterval(() => {
        const now = new Date();
        const hrs = (23 - now.getHours()).toString().padStart(2, '0');
        const min = (59 - now.getMinutes()).toString().padStart(2, '0');
        const sec = (59 - now.getSeconds()).toString().padStart(2, '0');
        const timerEl = document.getElementById('timer');
        if(timerEl) timerEl.innerText = `${hrs}:${min}:${sec}`;
    }, 1000);
};            statusText.innerText = "Not Received ⌛";
            statusText.style.color = "#ef4444"; 
        }
    } catch (e) {
        if (statusText) {
            statusText.innerText = "Error ❌";
            statusText.style.color = "#ef4444";
        }
    } finally {
        btn.disabled = false;
        if (icon && icon.className === "fas fa-spinner fa-spin") {
            icon.className = "fas fa-arrow-right";
        }
    }
};

// 5. DASHBOARD Y CÁLCULOS
export function updateDashboard() {
    // Calculamos valores basados en la inversión total guardada en state
    const currentAE = state.totalInvestedUSDT * 1000;
    const currentRate = calculateRate(state.totalInvestedUSDT); 
    const dailyEarn = state.totalInvestedUSDT * (currentRate / 100);

    const elements = {
        'main-bal': state.totalEarnedUSD.toFixed(4),
        'main-power': currentAE.toLocaleString(),
        'stat-daily': dailyEarn.toFixed(4),
        'stat-rate': currentRate.toFixed(1)
    };

    for (const [id, val] of Object.entries(elements)) {
        const el = document.getElementById(id);
        if (el) el.innerText = val;
    }
}

function calculateRate(qty) {
    if (qty >= 3000) return 7.0;
    if (qty >= 300) return 6.5;
    if (qty >= 20) return 6.0;
    return 5.5;
}

// 6. FUNCIONES AUXILIARES
function startPaymentTimer(minutes) {
    if (paymentTimerInterval) clearInterval(paymentTimerInterval);
    let seconds = minutes * 60;
    const timerDisplay = document.getElementById('payment-countdown');

    paymentTimerInterval = setInterval(() => {
        let mins = Math.floor(seconds / 60);
        let secs = seconds % 60;
        const timeString = `00:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        if (timerDisplay) timerDisplay.innerText = timeString;
        if (seconds <= 0) {
            clearInterval(paymentTimerInterval);
            if (timerDisplay) timerDisplay.innerText = "00:00:00";
        }
        seconds--;
    }, 1000);
}

window.closePayment = function() {
    document.getElementById('payModal').style.display = 'none';
    if (paymentTimerInterval) clearInterval(paymentTimerInterval);
};

window.copyAddress = function() {
    const address = document.getElementById('wallet-address-display')?.innerText;
    if(address && address !== "Generating...") {
        navigator.clipboard.writeText(address).then(() => {
            window.showToast("Address copied!");
        });
    }
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
};

window.onload = () => {
    const tg = window.Telegram?.WebApp;
    if(tg) {
        tg.ready();
        tg.expand();
        const user = tg.initDataUnsafe?.user;
        if (user) {
            if(document.getElementById('user-name')) document.getElementById('user-name').innerText = user.first_name;
            if(document.getElementById('user-id')) document.getElementById('user-id').innerText = user.id;
            if(document.getElementById('me-id')) document.getElementById('me-id').innerText = user.id;
        }
    }
    
    updateDashboard(); // Carga los datos iniciales al abrir la app

    setInterval(() => {
        const now = new Date();
        const hrs = (23 - now.getHours()).toString().padStart(2, '0');
        const min = (59 - now.getMinutes()).toString().padStart(2, '0');
        const sec = (59 - now.getSeconds()).toString().padStart(2, '0');
        const timerEl = document.getElementById('timer');
        if(timerEl) timerEl.innerText = `${hrs}:${min}:${sec}`;
    }, 1000);
};
