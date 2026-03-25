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

            // Mostrar el modal con flex para que se vea el diseño "bottom-sheet"
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

// Función para verificar el pago REAL con estética del video
export async function verifyPayment() {
    const statusText = document.getElementById('payment-status-text');
    const btnVerify = document.getElementById('btn-verify-payment');
    
    // Estética del video: LOADING...
    statusText.innerHTML = 'LOADING... <span style="font-size: 1.2em;">⏳</span>';
    if(btnVerify) {
        btnVerify.disabled = true;
        btnVerify.style.opacity = "0.7";
    }

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
            statusText.innerHTML = '<span style="color: #10b981;">PAYMENT CONFIRMED! ✅</span>';
            
            saveInvestment(state.pendingInvestment);
            
            setTimeout(() => {
                closePayment();
                updateDashboard();
                switchTab('home');
            }, 2000);
        } else {
            // Estética del video: NOT RECEIVED
            statusText.innerHTML = 'NOT RECEIVED <span style="font-size: 1.2em;">⏳</span>';
            if(btnVerify) {
                btnVerify.disabled = false;
                btnVerify.style.opacity = "1";
            }
        }
    } catch (e) {
        console.error("Error verifying:", e);
        statusText.innerText = "ERROR";
        if(btnVerify) {
            btnVerify.disabled = false;
            btnVerify.style.opacity = "1";
        }
    }
}

function startPaymentTimer() {
    let time = 1800; 
    clearInterval(state.payTimerInterval);
    state.payTimerInterval = setInterval(() => {
        let min = Math.floor(time / 60).toString().padStart(2, '0');
        let sec = (time % 60).toString().padStart(2, '0');
        const timerEl = document.getElementById('pay-timer-text');
        if(timerEl) {
            // Formato con el span verde del video
            timerEl.innerHTML = `Send countdown: <span style="color: #10b981;">00:${min}:${sec}</span>`;
        }
        if(time <= 0) {
            clearInterval(state.payTimerInterval);
            if(timerEl) timerEl.innerHTML = "EXPIRED";
        }
        time--;
    }, 1000);
}

window.copyAddress = function() {
    const address = document.getElementById('wallet-address-display').innerText;
    navigator.clipboard.writeText(address).then(() => {
        // Podrías cambiar este alert por un toast más elegante luego
        alert("Address copied!");
    });
};

// Exponer funciones globales
window.showPayment = showPayment;
window.closePayment = closePayment;
window.verifyPayment = verifyPayment;
