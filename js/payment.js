import { state, saveInvestment } from './state.js';
import { updateDashboard, switchTab } from './main.js';

/**
 * Muestra el modal de pago y arranca el contador
 */
export function showPayment() {
    const buyInput = document.getElementById('buy-qty');
    const amount = parseFloat(buyInput.value);
    
    // Validación de monto mínimo
    if(!amount || amount < 1) {
        if(window.Telegram?.WebApp?.showAlert) {
            window.Telegram.WebApp.showAlert("Please enter a valid amount (Min. 1 USDT)");
        } else {
            alert("Please enter a valid amount (Min. 1 USDT)");
        }
        return;
    }
    
    state.pendingInvestment = amount;
    
    // Actualizar interfaz del modal
    document.getElementById('pay-amount-display').innerText = amount.toFixed(2) + " USDT";
    const statusText = document.getElementById('payment-status-text');
    statusText.innerHTML = '<i class="fas fa-hourglass-half"></i> AWAITING PAYMENT ⌛';
    statusText.style.color = "var(--danger)";
    
    // Mostrar modal
    document.getElementById('payModal').style.display = 'flex';
    
    // Iniciar temporizador (30 minutos)
    let time = 1799; 
    clearInterval(state.payTimerInterval);
    state.payTimerInterval = setInterval(() => {
        let min = Math.floor(time / 60).toString().padStart(2, '0');
        let sec = (time % 60).toString().padStart(2, '0');
        const timerEl = document.getElementById('pay-timer-text');
        if(timerEl) timerEl.innerText = `Expired after: 00:${min}:${sec}`;
        
        if(time <= 0) {
            clearInterval(state.payTimerInterval);
            closePayment();
        }
        time--;
    }, 1000);
}

/**
 * Cierra el modal y limpia el estado de pago
 */
export function closePayment() {
    const modal = document.getElementById('payModal');
    if(modal) modal.style.display = 'none';
    clearInterval(state.payTimerInterval);
    state.pendingInvestment = 0;
}

/**
 * Simulación de confirmación de red (Para hacerlo real, aquí llamarías a una API)
 */
export function simulatePaymentSuccess() {
    if(state.pendingInvestment <= 0) return;

    const statusText = document.getElementById('payment-status-text');
    
    // Cambiar estado visual a "Procesando"
    statusText.innerHTML = '<i class="fas fa-sync fa-spin"></i> CONFIRMING ON BLOCKCHAIN...';
    statusText.style.color = "var(--ae-blue)";

    // Simulamos una espera de red de 2 segundos
    setTimeout(() => {
        statusText.innerHTML = '<i class="fas fa-check-circle"></i> SUCCESSFUL RECHARGE';
        statusText.style.color = "var(--success)";
        
        // Guardar inversión en localStorage y estado global
        saveInvestment(state.pendingInvestment);
        
        // Feedback vibración éxito
        if(window.Telegram?.WebApp?.HapticFeedback) {
            window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
        }

        // Regresar al Home tras el éxito
        setTimeout(() => {
            closePayment();
            const buyInput = document.getElementById('buy-qty');
            if(buyInput) buyInput.value = '';
            
            updateDashboard();
            switchTab('home');
        }, 2000);
    }, 2500);
}

// Función extra: Copiar dirección al portapapeles automáticamente
window.copyAddress = function() {
    const address = "0x2597c5Fb67fD36ff64aC8bebdEdC69a7B3de4e05";
    navigator.clipboard.writeText(address).then(() => {
        if(window.Telegram?.WebApp?.showScanQrPopup) {
            // Un pequeño truco para avisar al usuario en Telegram
            window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
        }
        alert("Address copied to clipboard!");
    });
};
