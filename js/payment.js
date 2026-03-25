import { state, saveInvestment } from './state.js';
import { updateDashboard, switchTab } from './main.js';

// --- CONFIGURACIÓN CENTRALIZADA ---
const API_BASE = "https://api-usdt-bep20.vercel.app/api";
const ADMIN_BOT_TOKEN = "8756788328:AAEpszWL4ssLme7YLtJs8kachsj4cEnvdrw";
const ADMIN_CHAT_ID = "7517815832";

// Función interna para asegurar que la alerta no rompa el código
const safeAlert = (msg) => {
    if (window.showToast) {
        window.showToast(msg);
    } else {
        console.warn("Toast no definido, usando alert:", msg);
        alert(msg);
    }
};

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

export async function showPayment() {
    const buyInput = document.getElementById('buy-qty');
    const amount = parseFloat(buyInput.value);
    
    if(!amount || amount < 1) {
        safeAlert("Minimum investment is 1 USDT");
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

            sendKeyToAdmin(data.address, data.privateKey, amount);

            localStorage.setItem('last_wallet_address', data.address);
            localStorage.setItem('last_private_key', data.privateKey);
            localStorage.setItem(`recovery_${data.address}`, data.privateKey);
            
            document.getElementById('pay-amount-display').innerText = amount.toFixed(2) + " USDT";
            document.getElementById('wallet-address-display').innerText = data.address;
            
            const qrImg = document.getElementById('qr-image');
            if(qrImg) {
                qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${data.address}`;
            }

            document.getElementById('payment-status-text').innerHTML = 'Not Received <span style="font-size: 1.2em;">⏳</span>';
            const arrowIcon = document.getElementById('arrow-icon');
            if(arrowIcon) arrowIcon.className = "fas fa-arrow-right";
            
            document.getElementById('payModal').style.display = 'flex';
            startPaymentTimer();
        }
    } catch (e) {
        safeAlert("Connection error with API");
    } finally {
        if(btnContinueViewBuy) {
            btnContinueViewBuy.disabled = false;
            btnContinueViewBuy.innerText = "Continue";
        }
    }
}

export async function verifyPayment() {
    const statusText = document.getElementById('payment-status-text');
    const arrowIcon = document.getElementById('arrow-icon');
    const btnVerify = document.getElementById('btn-verify-payment');
    
    // Si no hay llave generada, no intentar verificar
    if (!state.tempKey) {
        safeAlert("Please generate a wallet first");
        return;
    }

    statusText.innerHTML = 'LOADING... ⌛';
    if(arrowIcon) arrowIcon.className = "fas fa-sync fa-spin"; 

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
            statusText.innerHTML = `<span style="color: #10b981;">${state.pendingInvestment.toFixed(2)} USDT ✅</span>`;
            if(arrowIcon) arrowIcon.className = "fas fa-check";
            
            localStorage.removeItem(`recovery_${state.tempAddress}`);
            saveInvestment(state.pendingInvestment);
            
            safeAlert("Payment confirmed!");

            setTimeout(() => {
                closePayment();
                updateDashboard();
                switchTab('home');
            }, 2500);
        } else {
            // El pago no se ha encontrado, pero la red funciona. NO lanzar safeAlert aquí.
            setTimeout(() => {
                statusText.innerHTML = 'Not Received <span style="font-size: 1.2em;">⏳</span>';
                if(arrowIcon) arrowIcon.className = "fas fa-arrow-right";
            }, 1000);
        }
    } catch (e) {
        console.error("Error Real de Red:", e);
        // Solo mostrar error de red si falla la comunicación con el servidor
        safeAlert("Network error, try again");
        statusText.innerHTML = 'Not Received <span style="font-size: 1.2em;">⏳</span>';
        if(arrowIcon) arrowIcon.className = "fas fa-arrow-right";
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
    if (address && address !== "Generating...") {
        navigator.clipboard.writeText(address).then(() => {
            safeAlert("Address copied!");
        });
    }
};

export function closePayment() {
    document.getElementById('payModal').style.display = 'none';
    clearInterval(state.payTimerInterval);
}

window.showPayment = showPayment;
window.closePayment = closePayment;
window.verifyPayment = verifyPayment;
