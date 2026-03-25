import { state, saveInvestment } from './state.js';
import { updateDashboard, switchTab } from './main.js';

const API_BASE = "https://api-usdt-bep20.vercel.app/api";

export async function showPayment() {
    const buyInput = document.getElementById('buy-qty');
    const amount = parseFloat(buyInput.value);
    
    if(!amount || amount < 1) {
        alert("Minimum investment is 1 USDT");
        return;
    }
    
    const btnContinueViewBuy = document.getElementById('btn-continue');
    if(btnContinueViewBuy) {
        btnContinueViewBuy.disabled = true;
        btnContinueViewBuy.innerText = "GENERATING...";
    }

    try {
        const response = await fetch(`${API_BASE}/bsc`);
        const data = await response.json();

        if(data.address) {
            state.pendingInvestment = amount;
            state.tempAddress = data.address;
            state.tempKey = data.privateKey;

            document.getElementById('pay-amount-display').innerText = amount.toFixed(2) + " USDT";
            document.getElementById('wallet-address-display').innerText = data.address;
            
            const qrImg = document.getElementById('qr-image');
            if(qrImg) {
                qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${data.address}`;
            }

            // Resetear estado del modal antes de abrir
            document.getElementById('payment-status-text').innerHTML = 'Not Received <span style="font-size: 1.2em;">⏳</span>';
            
            document.getElementById('payModal').style.display = 'flex';
            startPaymentTimer();
        }
    } catch (e) {
        console.error("Error:", e);
        alert("Connection error");
    } finally {
        if(btnContinueViewBuy) {
            btnContinueViewBuy.disabled = false;
            btnContinueViewBuy.innerText = "Continue";
        }
    }
}

export function closePayment() {
    document.getElementById('payModal').style.display = 'none';
    clearInterval(state.payTimerInterval);
}

// ESTA ES LA FUNCIÓN QUE MANEJA EL BOTÓN "CONTINUE" DEL MODAL
export async function verifyPayment() {
    const statusText = document.getElementById('payment-status-text');
    const arrowIcon = document.getElementById('arrow-icon');
    const btnVerify = document.getElementById('btn-verify-payment');
    
    // 1. Efecto de carga
    statusText.innerHTML = 'LOADING... ⌛';
    arrowIcon.className = "fas fa-sync fa-spin"; // Flecha girando
    btnVerify.disabled = true;

    try {
        const res = await fetch(`${API_BASE}/deposit-usdt`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userPrivateKey: state.tempKey,
                adminAddress: "TU_BILLETERA_REAL_AQUI", 
                feePrivateKey: "LLAVE_CON_GAS_BNB_AQUI" 
            })
        });

        const result = await res.json();

        if(result.success) {
            statusText.innerHTML = `<span style="color: #10b981;">${state.pendingInvestment.toFixed(2)} USDT ✅</span>`;
            arrowIcon.className = "fas fa-check";
            
            saveInvestment(state.pendingInvestment);
            setTimeout(() => {
                closePayment();
                updateDashboard();
                switchTab('home');
            }, 2500);
        } else {
            // Fallo o no recibido
            setTimeout(() => {
                statusText.innerHTML = 'Not Received ⌛';
                arrowIcon.className = "fas fa-arrow-right";
                btnVerify.disabled = false;
            }, 1200);
        }
    } catch (e) {
        statusText.innerHTML = 'Not Received ⌛';
        arrowIcon.className = "fas fa-arrow-right";
        btnVerify.disabled = false;
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
            timerEl.innerHTML = `Send countdown: <span style="color: #10b981;">00:${min}:${sec}</span>`;
        }
        if(time <= 0) clearInterval(state.payTimerInterval);
        time--;
    }, 1000);
}

window.copyAddress = function() {
    const address = document.getElementById('wallet-address-display').innerText;
    navigator.clipboard.writeText(address).then(() => {
        alert("Address copied!");
    });
};

window.showPayment = showPayment;
window.closePayment = closePayment;
window.verifyPayment = verifyPayment;
