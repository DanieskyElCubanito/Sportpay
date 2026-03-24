import { state, saveInvestment } from './state.js';
import { updateDashboard, switchTab } from './main.js';

export function showPayment() {
    const amount = parseFloat(document.getElementById('buy-qty').value);
    if(!amount || amount < 1) {
        if(state.tg && state.tg.showAlert) state.tg.showAlert("Minimum investment is 1 USDT");
        else alert("Minimum investment is 1 USDT");
        return;
    }
    
    state.pendingInvestment = amount;
    document.getElementById('pay-amount-display').innerText = amount + " USDT";
    
    document.getElementById('payment-status-text').innerHTML = '<i class="fas fa-hourglass-half"></i> NOT RECEIVED ⌛';
    document.getElementById('payment-status-text').style.color = "var(--danger)";
    document.getElementById('payModal').style.display = 'flex';
    
    let time = 1799; 
    clearInterval(state.payTimerInterval);
    state.payTimerInterval = setInterval(() => {
        let min = Math.floor(time / 60).toString().padStart(2, '0');
        let sec = (time % 60).toString().padStart(2, '0');
        document.getElementById('pay-timer-text').innerText = `Send countdown: 00:${min}:${sec}`;
        if(time <= 0) clearInterval(state.payTimerInterval);
        time--;
    }, 1000);
}

export function closePayment() {
    document.getElementById('payModal').style.display = 'none';
    clearInterval(state.payTimerInterval);
    state.pendingInvestment = 0;
}

export function simulatePaymentSuccess() {
    if(state.pendingInvestment <= 0) return;

    document.getElementById('payment-status-text').innerHTML = '<i class="fas fa-check-circle"></i> PAYMENT RECEIVED';
    document.getElementById('payment-status-text').style.color = "var(--success)";
    
    saveInvestment(state.pendingInvestment);
    
    if(state.tg && state.tg.HapticFeedback) state.tg.HapticFeedback.notificationOccurred('success');

    setTimeout(() => {
        closePayment();
        document.getElementById('buy-qty').value = '';
        updateDashboard();
        switchTab('home');
    }, 1500);
}
