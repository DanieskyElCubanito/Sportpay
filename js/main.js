import { renderHistory } from './history.js';
import { state } from './state.js';
import { getReturnRate, calculateReturns } from './calculator.js';
import { showPayment, closePayment, simulatePaymentSuccess } from './payment.js';

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
}

/**
 * Maneja el cambio de pestañas, asegurando que solo una vista sea visible
 */
export function switchTab(id) {
    // 1. Ocultar todas las vistas y limpiar estado activo
    document.querySelectorAll('.view').forEach(v => {
        v.classList.remove('active');
        v.style.display = 'none'; // Asegura que no ocupen espacio
    });
    
    // 2. Mostrar la vista seleccionada
    const targetView = document.getElementById('view-' + id);
    if (targetView) {
        targetView.classList.add('active');
        targetView.style.display = 'block';
    }

    // 3. Carga de datos dinámica según la pestaña
    if (id === 'history') {
        renderHistory();
    }
    
    // 4. Actualizar estado visual en la barra de navegación inferior
    document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
    const activeNav = document.querySelector(`.nav-item[onclick*="'${id}'"]`);
    if(activeNav) activeNav.classList.add('active');

    // 5. Vibración para Telegram
    if(window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.impactOccurred('medium');
    }
}

// Registro de funciones globales para acceso desde el HTML
window.switchTab = switchTab;
window.calculateReturns = calculateReturns;
window.showPayment = showPayment;
window.closePayment = closePayment;
window.simulatePaymentSuccess = simulatePaymentSuccess;

/**
 * Inicialización al cargar la aplicación
 */
window.onload = () => {
    const tg = window.Telegram?.WebApp;
    
    if(tg) {
        tg.ready();
        tg.expand();
        tg.setHeaderColor('#ffffff');

        const user = tg.initDataUnsafe?.user;
        if (user) {
            // Nombre en el Perfil
            const nameEl = document.getElementById('user-name');
            if(nameEl) nameEl.innerText = `${user.first_name} ${user.last_name || ''}`.trim();

            // Sincronización de IDs (Home y Me)
            const idHomeEl = document.getElementById('user-id');
            const idMeEl = document.getElementById('me-id');
            if(idHomeEl) idHomeEl.innerText = user.id;
            if(idMeEl) idMeEl.innerText = user.id;
            
            // Carga de Avatar real de Telegram
            const photoEl = document.getElementById('user-photo');
            if (user.photo_url && photoEl) {
                photoEl.innerHTML = `<img src="${user.photo_url}" style="width:100%; height:100%; object-fit:cover;">`;
            }
        }
    } else {
        // ID por defecto para pruebas en navegador
        const idHomeEl = document.getElementById('user-id');
        if(idHomeEl) idHomeEl.innerText = "7517815832";
    }
    
    // Ejecutar dashboard inicial (ahora saldrá en 0 si state.js está limpio)
    updateDashboard();
    
    // Timer de Liquidación (Settlement)
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
