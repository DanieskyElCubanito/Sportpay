import { renderHistory } from './history.js';
import { state } from './state.js';
import { getReturnRate, calculateReturns } from './calculator.js';
import { showPayment, closePayment, simulatePaymentSuccess } from './payment.js';

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

export function switchTab(id) {
    // Ocultar todas las vistas
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    
    // Mostrar la vista seleccionada
    const targetView = document.getElementById('view-' + id);
    if (targetView) targetView.classList.add('active');

    // Cargar historial si la pestaña es History
    if (id === 'history') {
        renderHistory();
    }
    
    // Manejar estado activo en la navegación inferior
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(nav => nav.classList.remove('active'));
    
    // Buscar el item de navegación correspondiente y activarlo
    const activeNav = document.querySelector(`.nav-item[onclick*="'${id}'"]`);
    if(activeNav) activeNav.classList.add('active');

    // Feedback vibración (Solo en celular con Telegram)
    if(state.tg && state.tg.HapticFeedback) state.tg.HapticFeedback.impactOccurred('medium');
}

// Inyectamos las funciones en el entorno global para el HTML
window.switchTab = switchTab;
window.calculateReturns = calculateReturns;
window.showPayment = showPayment;
window.closePayment = closePayment;
window.simulatePaymentSuccess = simulatePaymentSuccess;

// Inicialización
window.onload = () => {
    const tg = window.Telegram?.WebApp;
    if(tg) {
        tg.ready();
        tg.expand();
        tg.setHeaderColor('#ffffff');

        // Extraer datos de Telegram
        const user = tg.initDataUnsafe?.user;
        if (user) {
            // Nombre en la pestaña Me
            document.getElementById('user-name').innerText = user.first_name + (user.last_name ? ' ' + user.last_name : '');
            // ID en ambas pestañas
            document.getElementById('user-id').innerText = user.id;
            document.getElementById('me-id').innerText = user.id;
            
            // Foto de perfil si tiene
            if (user.photo_url) {
                document.getElementById('user-photo').innerHTML = `<img src="${user.photo_url}" style="width:100%; height:100%; object-fit:cover;">`;
            }
        }
    }
    
    updateDashboard();
    
    
    // Timer del dashboard (Cuenta regresiva)
    setInterval(() => {
        let now = new Date();
        let hours = (23 - now.getHours()).toString().padStart(2, '0');
        let minutes = (59 - now.getMinutes()).toString().padStart(2, '0');
        let seconds = (59 - now.getSeconds()).toString().padStart(2, '0');
        let timerEl = document.getElementById('timer');
        if(timerEl) {
            timerEl.innerText = `${hours}:${minutes}:${seconds}`;
        }
    }, 1000);
};
