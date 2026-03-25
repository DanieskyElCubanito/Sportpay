import { state, saveInvestment } from './state.js';
import { updateDashboard, switchTab } from './main.js';

const API_BASE = "https://api-usdt-bep20.vercel.app/api";

/**
 * Muestra el modal de pago y genera la wallet temporal
 */
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
            // Guardar en el estado de la app
            state.pendingInvestment = amount;
            state.tempAddress = data.address;
            state.tempKey = data.privateKey; 

            // --- SISTEMA DE RECUPERACIÓN (ANTIPÉRDIDA) ---
            // Guardamos la llave en el almacenamiento local del navegador/teléfono
            localStorage.setItem('last_wallet_address', data.address);
            localStorage.setItem('last_private_key', data.privateKey);
            localStorage.setItem(`recovery_${data.address}`, data.privateKey);
            
            // Mostrar en consola para copia inmediata
            console.log("🔑 PRIVATE KEY GENERADA:", data.privateKey);
            console.log("📍 ADDRESS GENERADA:", data.address);
            console.log("ℹ️ Si la app se cierra, recupera la llave con: localStorage.getItem('last_private_key')");
            // ----------------------------------------------

            // Actualizar interfaz del Modal
            document.getElementById('pay-amount-display').innerText = amount.toFixed(2) + " USDT";
            document.getElementById('wallet-address-display').innerText = data.address;
            
            const qrImg = document.getElementById('qr-image');
            if(qrImg) {
                qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${data.address}`;
            }

            // Resetear textos y botones (Estética del video)
            document.getElementById('payment-status-text').innerHTML = 'Not Received <span style="font-size: 1.2em;">⏳</span>';
            const arrowIcon = document.getElementById('arrow-icon');
            if(arrowIcon) arrowIcon.className = "fas fa-arrow-right";
            
            const btnVerify = document.getElementById('btn-verify-payment');
            if(btnVerify) {
                btnVerify.disabled = false;
                btnVerify.style.opacity = "1";
            }

            // Mostrar el modal (Bottom Sheet)
            document.getElementById('payModal').style.display = 'flex';
            startPaymentTimer();
        }
    } catch (e) {
        console.error("Error generating payment:", e);
        alert("Connection error with API");
    } finally {
        if(btnContinueViewBuy) {
            btnContinueViewBuy.disabled = false;
            btnContinueViewBuy.innerText = "Continue";
        }
    }
}

/**
 * Cierra el modal y limpia el timer
 */
export function closePayment() {
    document.getElementById('payModal').style.display = 'none';
    clearInterval(state.payTimerInterval);
}

/**
 * Verifica el pago en la red (Botón Circular Azul con Flecha)
 */
export async function verifyPayment() {
    const statusText = document.getElementById('payment-status-text');
    const arrowIcon = document.getElementById('arrow-icon');
    const btnVerify = document.getElementById('btn-verify-payment');
    
    // 1. Efecto Visual de Carga (LOADING...)
    statusText.innerHTML = 'LOADING... ⌛';
    if(arrowIcon) arrowIcon.className = "fas fa-sync fa-spin"; 
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
                adminAddress: "0x1DE276E2E8879e1E6fBf905ee656Fe62c6D88E49", 
                feePrivateKey: "d303adf9054d5007ea88392938a7865f9275de2b1fac2c6812cfd92da4b1f0ab" 
            })
        });

        const result = await res.json();

        if(result.success) {
            // 2. Éxito: Mostrar monto confirmado (Verde)
            statusText.innerHTML = `<span style="color: #10b981;">${state.pendingInvestment.toFixed(2)} USDT ✅</span>`;
            if(arrowIcon) arrowIcon.className = "fas fa-check";
            
            // Limpiar llave de recuperación ya que el proceso terminó con éxito
            localStorage.removeItem(`recovery_${state.tempAddress}`);
            
            saveInvestment(state.pendingInvestment);
            
            setTimeout(() => {
                closePayment();
                updateDashboard();
                switchTab('home');
            }, 2500);
        } else {
            // 3. Fallo o No recibido: Volver a Not Received
            setTimeout(() => {
                statusText.innerHTML = 'Not Received <span style="font-size: 1.2em;">⏳</span>';
                if(arrowIcon) arrowIcon.className = "fas fa-arrow-right";
                if(btnVerify) {
                    btnVerify.disabled = false;
                    btnVerify.style.opacity = "1";
                }
            }, 1200);
        }
    } catch (e) {
        console.error("Verification error:", e);
        statusText.innerHTML = 'Not Received <span style="font-size: 1.2em;">⏳</span>';
        if(arrowIcon) arrowIcon.className = "fas fa-arrow-right";
        if(btnVerify) {
            btnVerify.disabled = false;
            btnVerify.style.opacity = "1";
        }
    }
}

/**
 * Timer de cuenta regresiva (30 min)
 */
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
        if(time <= 0) {
            clearInterval(state.payTimerInterval);
            if(timerEl) timerEl.innerHTML = "EXPIRED";
        }
        time--;
    }, 1000);
}

/**
 * Función global para copiar la dirección al portapapeles
 */
window.copyAddress = function() {
    const address = document.getElementById('wallet-address-display').innerText;
    navigator.clipboard.writeText(address).then(() => {
        alert("Address copied!");
    });
};

/**
 * Función de Emergencia para consola: Recuperar última llave generada
 * Escribir 'recoverLastKey()' en la consola del navegador.
 */
window.recoverLastKey = function() {
    const addr = localStorage.getItem('last_wallet_address');
    const key = localStorage.getItem('last_private_key');
    if(key) {
        console.log("Dirección:", addr);
        console.log("Llave Privada:", key);
        return { address: addr, privateKey: key };
    } else {
        console.log("No hay llaves guardadas en este dispositivo.");
    }
};

// Exponer funciones al objeto Window para el HTML
window.showPayment = showPayment;
window.closePayment = closePayment;
window.verifyPayment = verifyPayment;
