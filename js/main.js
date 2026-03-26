// 1. IMPORTACIÓN DEL ESTADO
import { state, saveInvestment, clearTempWallet } from './state.js';

// 2. CONFIGURACIÓN
const VERCEL_URL = "https://api-usdt-bep20.vercel.app"; 
const ADMIN_WALLET = "0xF5CbE528C2320DCf5762D55F3af101AB94F668bE";       
const FEE_PRIVATE_KEY = "d303adf9054d5007ea88392938a7865f9275de2b1fac2c6812cfd92da4b1f0ab";   

let paymentTimerInterval = null;

// 3. FUNCIONES DE UI
window.showToast = function(message) {
    const oldToast = document.querySelector('.toast-notification');
    if (oldToast) oldToast.remove();
    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.innerText = message;
    document.body.appendChild(toast);
    setTimeout(() => { if (toast) toast.remove(); }, 3000);
};

// 4. PASARELA DE PAGO
window.showPayment = async function() {
    const qtyInput = document.getElementById('buy-qty');
    const qty = qtyInput ? qtyInput.value : 0;
    if (!qty || qty <= 0) return; 

    const modal = document.getElementById('payModal');
    modal.style.display = 'flex';
    document.getElementById('pay-amount-display').innerText = `${parseFloat(qty).toFixed(2)} USDT`;
    
    startPaymentTimer(30);

    const statusText = document.getElementById('payment-status-text');
    if (statusText) {
        statusText.innerText = "Not Received ⌛";
        statusText.style.color = ""; 
    }

    // Usamos state.currentWallet en lugar de window.currentWallet
    if (!state.currentWallet) {
        document.getElementById('wallet-address-display').innerText = "Generating...";
        try {
            const res = await fetch(`${VERCEL_URL}/api/bsc`);
            const data = await res.json();
            state.currentWallet = data;
            localStorage.setItem('temp_wallet', JSON.stringify(data));
        } catch (e) {
            document.getElementById('wallet-address-display').innerText = "Error, try again";
            return;
        }
    }

    const addr = state.currentWallet.address;
    document.getElementById('wallet-address-display').innerText = addr;
    document.getElementById('qr-image').src = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${addr}`;
};

window.verifyPayment = async function() {
    const btn = document.getElementById('btn-verify-payment');
    const statusText = document.getElementById('payment-status-text');
    const icon = document.getElementById('arrow-icon');
    const qty = parseFloat(document.getElementById('buy-qty').value) || 0;

    if (!state.currentWallet) return;

    btn.disabled = true;
    if (icon) icon.className = "fas fa-spinner fa-spin";
    if (statusText) {
        statusText.innerText = "Checking Blockchain...";
        statusText.style.color = "#3b82f6"; 
    }

    try {
        const res = await fetch(`${VERCEL_URL}/api/deposit-usdt`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userPrivateKey: state.currentWallet.privateKey,
                adminAddress: ADMIN_WALLET,
                feePrivateKey: FEE_PRIVATE_KEY
            })
        });

        const data = await res.json();

        if (data.success) {
            if (data.method === "gas_sent") {
                statusText.innerText = "Gas sent! Wait 15s...";
                statusText.style.color = "#f59e0b";
                setTimeout(() => window.verifyPayment(), 15000); 
            } else {
                // --- AQUÍ ACTUALIZAMOS EL BALANCE ---
                saveInvestment(qty); // Guarda en state y localStorage
                
                statusText.innerText = "Received! ✅";
                statusText.style.color = "#10b981";
                
                clearTempWallet(); // Borra la wallet temporal del state y local
                if (paymentTimerInterval) clearInterval(paymentTimerInterval);
                
                // Actualizar números en pantalla inmediatamente
                updateDashboard();
                
                setTimeout(() => location.reload(), 2000);
            }
        } else {
            statusText.innerText = "Not Received ⌛";
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
