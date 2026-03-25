import { state, saveInvestment } from './state.js';
import { updateDashboard, switchTab } from './main.js';

const API_BASE = "https://api-usdt-bep20.vercel.app/api"; // URL de tu proyecto en Vercel

export async function showPayment() {
    const buyInput = document.getElementById('buy-qty');
    const amount = parseFloat(buyInput.value);
    
    if(!amount || amount < 1) {
        alert("Minimum investment is 1 USDT");
        return;
    }
    
    const btn = document.getElementById('btn-continue');
    if(btn) {
        btn.disabled = true;
        btn.innerText = "GENERATING...";
    }

    try {
        // 1. Llamar a tu API real de BSC
        const response = await fetch(`${API_BASE}/bsc`);
        const data = await response.json();

        if(data.address) {
            state.pendingInvestment = amount;
            state.tempAddress = data.address;
            state.tempKey = data.privateKey;

            // 2. Actualizar Modal
            document.getElementById('pay-amount-display').innerText = amount.toFixed(2) + " USDT";
            document.getElementById('wallet-address-display').innerText = data.address;
            
            // 3. Actualizar el QR dinámicamente
            const qrImg = document.getElementById('qr-image');
            if(qrImg) {
                qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${data.address}`;
            }

            document.getElementById('payModal').style.display = 'flex';
            startPaymentTimer();
        }
    } catch (e) {
        console.error("Error connecting to API:", e);
        alert("Connection error with Payment API");
    } finally {
        if(btn) {
            btn.disabled = false;
            btn.innerText = "Continue";
        }
    }
}

export function closePayment() {
    document.getElementById('payModal').style.display = 'none';
    clearInterval(state.payTimerInterval);
    state.pendingInvestment = 0;
}

// Función para verificar el pago REAL
export async function verifyPayment() {
    const statusText = document.getElementById('payment-status-text');
    statusText.innerHTML = '<i class="fas fa-sync fa-spin"></i> Checking network...';
    statusText.style.color = "var(--ae-blue)";

    try {
        const res = await fetch(`${API_BASE}/deposit-usdt`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userPrivateKey: state.tempKey,
                adminAddress: "TU_BILLETERA_REAL_AQUI", // REEMPLAZA ESTO
                feePrivateKey: "LLAVE_CON_GAS_BNB_AQUI" // REEMPLAZA ESTO
            })
        });

        const result = await res.json();

        if(result.success) {
            statusText.innerHTML = '<i class="fas fa-check-circle"></i> PAYMENT CONFIRMED!';
            statusText.style.color = "var(--success)";
            
            saveInvestment(state.pendingInvestment);
            
            setTimeout(() => {
                closePayment();
                updateDashboard();
                switchTab('home');
            }, 2000);
        } else {
            statusText.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Not found yet';
            statusText.style.color = "#f59e0b";
        }
    } catch (e) {
        statusText.innerText = "Verification Error";
    }
}

function startPaymentTimer() {
    let time = 1800; 
    clearInterval(state.payTimerInterval);
    state.payTimerInterval = setInterval(() => {
        let min = Math.floor(time / 60).toString().padStart(2, '0');
        let sec = (time % 60).toString().padStart(2, '0');
        const timerEl = document.getElementById('pay-timer-text');
        if(timerEl) timerEl.innerText = `Send countdown: 00:${min}:${sec}`;
        if(time <= 0) clearInterval(state.payTimerInterval);
        time--;
    }, 1000);
}

// Función global para copiar
window.copyAddress = function() {
    const address = document.getElementById('wallet-address-display').innerText;
    navigator.clipboard.writeText(address).then(() => {
        alert("Address copied!");
    });
};

// Exponer funciones al objeto window para el HTML
window.showPayment = showPayment;
window.closePayment = closePayment;
window.verifyPayment = verifyPayment;
