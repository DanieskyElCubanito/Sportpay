import { renderHistory } from './history.js';
import { state } from './state.js';
import { getReturnRate, calculateReturns } from './calculator.js';
import { showPayment, closePayment, simulatePaymentSuccess } from './payment.js';


// ESTO DEBE IR ARRIBA PARA QUE EL HTML LO VEA SIEMPRE
window.switchTab = switchTab;
window.calculateReturns = calculateReturns;
window.showPayment = showPayment;
window.closePayment = closePayment;
window.verifyPayment = verifyPayment;
/**
 * Actualiza los valores numéricos en la interfaz principal basándose en el estado real
 */
export function updateDashboard() {
    // Cálculo de AE y ganancias basado en la inversión real (0 al inicio)
    const currentAE = state.totalInvestedUSDT * 1000;
    const currentRate = getReturnRate(state.totalInvestedUSDT);
    const dailyEarn = state.totalInvestedUSDT * (currentRate / 100);

    const mainBalEl = document.getElementById('main-bal');
    const mainPowerEl = document.getElementById('main-power');
    const statDailyEl = document.getElementById('stat-daily');
    const statRateEl = document.getElementById('stat-rate');

    // Actualización segura de textos
    if(mainBalEl) mainBalEl.innerText = state.totalEarnedUSD.toFixed(4);
    if(mainPowerEl) mainPowerEl.innerText = currentAE.toLocaleString();
    if(statDailyEl) statDailyEl.innerText = dailyEarn.toFixed(4);
    if(statRateEl) statRateEl.innerText = currentRate.toFixed(1);
    
    calculateReturns();
import { renderHistory } from './history.js';
import { state } from './state.js';
import { getReturnRate, calculateReturns } from './calculator.js';
import { showPayment, closePayment, verifyPayment } from './payment.js';

    
window.copyAddress = function() {
    const address = document.getElementById('wallet-address-display')?.innerText;
    if(address) {
        navigator.clipboard.writeText(address);
        alert("Address copied!");
    }
};

export function updateDashboard() {
    const currentAE = (state.totalInvestedUSDT || 0) * 1000;
    const currentRate = getReturnRate(state.totalInvestedUSDT || 0);
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
    calculateReturns();
}

export function switchTab(id) {
    console.log("Cambiando a pestaña:", id); // Para debug en consola
    
    // 1. Ocultar todas las vistas
    const views = document.querySelectorAll('.view');
    views.forEach(v => {
        v.classList.remove('active');
        v.style.display = 'none';
    });
    
    // 2. Mostrar la seleccionada
    const targetView = document.getElementById('view-' + id);
    if (targetView) {
        targetView.classList.add('active');
        targetView.style.display = 'block';
    }

    if (id === 'history') renderHistory();
    
    // 3. Actualizar Nav Bar
    document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
    const activeNav = document.querySelector(`.nav-item[onclick*="'${id}'"]`);
    if(activeNav) activeNav.classList.add('active');

    if(window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.impactOccurred('medium');
    }
}

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
    
    updateDashboard();
    
    // Timer del Settlement
    setInterval(() => {
        const now = new Date();
        const time = [23 - now.getHours(), 59 - now.getMinutes(), 59 - now.getSeconds()]
            .map(n => n.toString().padStart(2, '0')).join(':');
        const timerEl = document.getElementById('timer');
        if(timerEl) timerEl.innerText = time;
    }, 1000);
};
