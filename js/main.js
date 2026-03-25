import { renderHistory } from './history.js';
import { state } from './state.js';
import { getReturnRate, calculateReturns } from './calculator.js';
import { showPayment, closePayment, verifyPayment } from './payment.js';

// --- REGISTRO DE FUNCIONES GLOBALES ---
// Esto permite que el HTML encuentre las funciones desde onclick
window.switchTab = switchTab;
window.calculateReturns = calculateReturns;
window.showPayment = showPayment;
window.closePayment = closePayment;
window.verifyPayment = verifyPayment;

window.copyAddress = function() {
    const address = document.getElementById('wallet-address-display')?.innerText;
    if(address && address !== "Generating...") {
        navigator.clipboard.writeText(address);
        alert("Address copied!");
    }
};

/**
 * Actualiza la interfaz con los datos del estado
 */
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
    
    // Solo calcular retornos si el input existe en el DOM
    if (document.getElementById('buy-qty')) {
        calculateReturns();
    }
}

/**
 * Maneja el cambio de pestañas
 */
export function switchTab(id) {
    console.log("Navegando a:", id);
    
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

    // 3. Cargas lógicas según pestaña
    if (id === 'history') renderHistory();
    if (id === 'buy') calculateReturns();
    
    // 4. Actualizar estado visual de la Nav Bar
    document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
    const activeNav = document.querySelector(`.nav-item[onclick*="'${id}'"]`);
    if(activeNav) activeNav.classList.add('active');

    // Feedback vibración para Telegram
    if(window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.impactOccurred('medium');
    }
}

/**
 * Inicialización al cargar la página
 */
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
    
    // Timer del Settlement (Cuenta regresiva diaria)
    setInterval(() => {
        const now = new Date();
        const hrs = (23 - now.getHours()).toString().padStart(2, '0');
        const min = (59 - now.getMinutes()).toString().padStart(2, '0');
        const sec = (59 - now.getSeconds()).toString().padStart(2, '0');
        const timerEl = document.getElementById('timer');
        if(timerEl) timerEl.innerText = `${hrs}:${min}:${sec}`;
    }, 1000);
};
