import { state } from './state.js';
import { getReturnRate, calculateReturns } from './calculator.js';
import { showPayment, closePayment, simulatePaymentSuccess } from './payment.js';

export function updateDashboard() {
    const currentAE = state.totalInvestedUSDT * 1000;
    const currentRate = getReturnRate(state.totalInvestedUSDT);
    const dailyEarn = state.totalInvestedUSDT * (currentRate / 100);

    document.getElementById('main-bal').innerText = state.totalEarnedUSD.toFixed(4);
    document.getElementById('main-power').innerText = currentAE.toLocaleString();
    document.getElementById('stat-daily').innerText = dailyEarn.toFixed(4);
    document.getElementById('stat-rate').innerText = currentRate.toFixed(1);
    
    calculateReturns();
}

export function switchTab(id) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById('view-' + id).classList.add('active');
    
    if(event && event.currentTarget) {
        document.querySelectorAll('.nav-item').forEach(v => v.classList.remove('active'));
        event.currentTarget.classList.add('active');
    }

    if(state.tg && state.tg.HapticFeedback) state.tg.HapticFeedback.impactOccurred('medium');
}

// Inyectamos las funciones en el entorno global para que los onclick de HTML funcionen
window.switchTab = switchTab;
window.calculateReturns = calculateReturns;
window.showPayment = showPayment;
window.closePayment = closePayment;
window.simulatePaymentSuccess = simulatePaymentSuccess;

// Inicialización
window.onload = () => {
    if(state.tg) {
        state.tg.ready();
        state.tg.expand(); // Abre la app a pantalla completa automáticamente

        // Detección de Modo Oscuro nativo de Telegram
        if (state.tg.colorScheme === 'dark') {
            document.body.classList.add('dark-mode');
        }
    }
    
    document.getElementById('user-id').innerText = state.tg?.initDataUnsafe?.user?.id || Math.floor(Math.random() * 900000) + 100000;
    updateDashboard();
    
    // Timer del dashboard
    setInterval(() => {
        let now = new Date();
        let hours = (23 - now.getHours()).toString().padStart(2, '0');
        let minutes = (59 - now.getMinutes()).toString().padStart(2, '0');
        let seconds = (59 - now.getSeconds()).toString().padStart(2, '0');
        let timerEl = document.getElementById('timer');
        if(timerEl) timerEl.innerText = `${hours}:${minutes}:${seconds}`;
    }, 1000);
};
