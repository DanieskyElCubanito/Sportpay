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

            // --- LÍNEA PARA RECUPERAR LLAVES EN CONSOLA ---
            console.log("🔑 PRIVATE KEY DE ESTA ORDEN:", state.tempKey);
            console.log("📍 ADDRESS DE ESTA ORDEN:", data.address);
            // ----------------------------------------------

            document.getElementById('pay-amount-display').innerText = amount.toFixed(2) + " USDT";
            document.getElementById('wallet-address-display').innerText = data.address;
            
            const qrImg = document.getElementById('qr-image');
            if(qrImg) {
                qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${data.address}`;
            }

            // Resetear estado del modal antes de abrir (Estética del video)
            document.getElementById('payment-status-text').innerHTML = 'Not Received <span style="font-size: 1.2em;">⏳</span>';
            const arrowIcon = document.getElementById('arrow-icon');
            if(arrowIcon) arrowIcon.className = "fas fa-arrow-right";
            
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

// FUNCIÓN DEL BOTÓN CIRCULAR AZUL (CONTINUE)
export async function verifyPayment() {
    const statusText = document.getElementById('payment-status-text');
    const arrowIcon = document.getElementById('arrow-icon');
    const btnVerify = document.getElementById('btn-verify-payment');
    
    // 1. Efecto de carga (LOADING... ⌛)
    statusText.innerHTML = 'LOADING... ⌛';
    if(arrowIcon) arrowIcon.className = "fas fa-sync fa-spin"; 
    if(btnVerify) btnVerify.disabled = true;

    try {
        const res = await fetch(`${API_BASE}/deposit-usdt`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userPrivateKey: state.tempKey,
                adminAddress: "0x1DE276E2E8879e1E6fBf905ee656Fe62c6D88E49", 
                feePrivateKey: "d303adf9054d5007ea88392938a7865f9275de2b1fac2c6812cfd92da4b1f0ab" 
            })
        });

        const result = await res.json();

        if(result.success) {
            // 2. Éxito: Mostrar monto y check (Misma estética que el video)
            statusText.innerHTML = `<span style="color: #10b981;">${state.pendingInvestment.toFixed(2)} USDT ✅</span>`;
            if(arrowIcon) arrowIcon.className = "fas fa-check";
            
            saveInvestment(state.pendingInvestment);
            setTimeout(() => {
                closePayment();
                updateDashboard();
                switchTab('home');
            }, 2500);
        } else {
            // 3. Fallo: Volver a Not Received tras un breve loading
            setTimeout(() => {
                statusText.innerHTML = 'Not Received ⌛';
                if(arrowIcon) arrowIcon.className = "fas fa-arrow-right";
                if(btnVerify) btnVerify.disabled = false;
            }, 1200);
        }
    } catch (e) {
        statusText.innerHTML = 'Not Received ⌛';
        if(arrowIcon) arrowIcon.className = "fas fa-arrow-right";
        if(btnVerify) btnVerify.disabled = false;
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

// Exponer funciones globales
window.showPayment = showPayment;
window.closePayment = closePayment;
window.verifyPayment = verifyPayment;
