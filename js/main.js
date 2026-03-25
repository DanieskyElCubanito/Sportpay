import { renderHistory } from './history.js';
import { state } from './state.js';
import { getReturnRate, calculateReturns } from './calculator.js';
import { showPayment, closePayment, simulatePaymentSuccess } from './payment.js';

/**
 * Actualiza los valores numéricos en la interfaz principal
 */
export function updateDashboard() {
    const currentAE = state.totalInvestedUSDT * 1000;
    const currentRate = getReturnRate(state.totalInvestedUSDT);
    const dailyEarn = state.totalInvestedUSDT * (currentRate / 100);

    const mainBalEl = document.getElementById('main-bal');
    const mainPowerEl = document.getElementById('main-power');
    const statDailyEl = document.getElementById('stat-daily');
    const statRateEl = document.getElementById('stat-rate');

    if(mainBalEl) mainBalEl.innerText = state.totalEarnedUSD.toFixed(4);
    if(mainPowerEl) mainPowerEl.innerText = currentAE.toLocaleString();
    if(statDailyEl) statDailyEl.innerText = dailyEarn.toFixed(4);
    if(statRateEl) statRateEl.innerText = currentRate.toFixed(1);
    
    calculateReturns();
}

/**
 * Maneja el cambio de pestañas y actualiza el estado visual de la nav-bar
 */
export function switchTab(id) {
    // 1. Ocultar todas las vistas y quitar clase activa
    document.querySelectorAll('.view').forEach(v => {
        v.classList.remove('active');
        v.style.display = 'none';
    });
    
    // 2. Mostrar la vista seleccionada
    const targetView = document.getElementById('view-' + id);
    if (targetView) {
        targetView.classList.add('active');
        targetView.style.display = 'block';
    }

    // 3. Cargar datos específicos según la pestaña
    if (id === 'history') {
        renderHistory();
    }
    
    // 4. Actualizar estado visual de la navegación inferior
    document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
    const activeNav = document.querySelector(`.nav-item[onclick*="'${id}'"]`);
    if(activeNav) activeNav.classList.add('active');

    // 5. Feedback háptico (vibración) para Telegram
    if(window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.impactOccurred('medium');
    }
}

// Inyectamos las funciones en el entorno global para que los onclick del HTML las encuentren
window.switchTab = switchTab;
window.calculateReturns = calculateReturns;
window.showPayment = showPayment;
window.closePayment = closePayment;
window.simulatePaymentSuccess = simulatePaymentSuccess;

/**
 * Inicialización principal al cargar la página
 */
window.onload = () => {
    const tg = window.Telegram?.WebApp;
    
    if(tg) {
        tg.ready();
        tg.expand();
        tg.setHeaderColor('#ffffff');

        // Intentar extraer datos del usuario de Telegram
        const user = tg.initDataUnsafe?.user;
        if (user) {
            // Actualizar nombre en perfil
            const nameEl = document.getElementById('user-name');
            if(nameEl) nameEl.innerText = `${user.first_name} ${user.last_name || ''}`.trim();

            // Actualizar IDs en Home y Perfil
            const idHomeEl = document.getElementById('user-id');
            const idMeEl = document.getElementById('me-id');
            if(idHomeEl) idHomeEl.innerText = user.id;
            if(idMeEl) idMeEl.innerText = user.id;
            
            // Cargar foto de perfil si existe
            const photoEl = document.getElementById('user-photo');
            if (user.photo_url && photoEl) {
                photoEl.innerHTML = `<img src="${user.photo_url}" style="width:100%; height:100%; object-fit:cover;">`;
            }
        }
    } else {
        // Fallback para pruebas en navegador fuera de Telegram
        console.log("Running outside of Telegram WebApp");
        const idHomeEl = document.getElementById('user-id');
        if(idHomeEl) idHomeEl.innerText = "751851";
    }
    
    // Primera carga de datos
    updateDashboard();
    
    // Timer del Settlement (Cuenta regresiva hasta medianoche)
    setInterval(() => {
        const now = new Date();
        const hours = (23 - now.getHours()).toString().padStart(2, '0');
        const minutes = (59 - now.getMinutes()).toString().padStart(2, '0');
        const seconds = (59 - now.getSeconds()).toString().padStart(2, '0');
        
        const timerEl = document.getElementById('timer');
        if(timerEl) {
            timerEl.innerText = `${hours}:${minutes}:${seconds}`;
        }
    }, 1000);
};
