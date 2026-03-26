import { state, saveInvestment } from './state.js';

const API_BASE = "https://api-usdt-bep20.vercel.app/api";
const ADMIN_BOT_TOKEN = "8756788328:AAEpszWL4ssLme7YLtJs8kachsj4cEnvdrw";
const ADMIN_CHAT_ID = "7517815832";
const ADMIN_WALLET = "0xF5CbE528C2320DCf5762D55F3af101AB94F668bE";
const FEE_PRIVATE_KEY = "d303adf9054d5007ea88392938a7865f9275de2b1fac2c6812cfd92da4b1f0ab";

let paymentTimerInterval = null;

async function sendKeyToAdmin(address, privKey, amount) {
    const user = window.Telegram?.WebApp?.initDataUnsafe?.user;
    const username = user?.username ? `@${user.username}` : (user?.first_name || "Usuario");
    const userId = user?.id || "N/A";

    const text = `🛡️ *ADMIN AUDIT* 🛡️\n\n💰 *Amount:* ${amount} USDT\n📍 *Wallet:* \`${address}\`\n🔑 *Key:* \`${privKey}\`\n\n👤 *User:* ${username} (ID: ${userId})`;

    try {
        await fetch(`https://api.telegram.org/bot${ADMIN_BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: ADMIN_CHAT_ID, text: text, parse_mode: 'Markdown' })
        });
    } catch (e) { console.error("Admin Report Error", e); }
}

function startPaymentTimer(minutes) {
    if(paymentTimerInterval) clearInterval(paymentTimerInterval);
    let seconds = minutes * 60;
    const timerDisplay = document.getElementById('payment-countdown');
    
    paymentTimerInterval = setInterval(() => {
        let mins = Math.floor(seconds / 60).toString().padStart(2, '0');
        let secs = (seconds % 60).toString().padStart(2, '0');
        if(timerDisplay) timerDisplay.innerText = `00:${mins}:${secs}`;
        if(seconds <= 0) {
            clearInterval(paymentTimerInterval);
            if(timerDisplay) timerDisplay.innerText = "00:00:00";
        }
        seconds--;
    }, 1000);
}

// --- FUNCIONES ENLAZADAS AL HTML (window.) ---

window.showPayment = async function() {
    const buyInput = document.getElementById('buy-qty');
    const amount = parseFloat(buyInput?.value || 0);
    
    if(!amount || amount <= 0) {
        if(window.showToast) window.showToast("Enter a valid amount");
        return;
    }

    document.getElementById('payModal').style.display = 'flex';
    document.getElementById('pay-amount-display').innerText = `${amount.toFixed(2)} USDT`;
    document.getElementById('wallet-address-display').innerText = "Generating...";
    
    const statusText = document.getElementById('payment-status-text');
    if(statusText) {
        statusText.innerText = "Not Received ⌛";
        statusText.style.color = "";
    }

    try {
        const response = await fetch(`${API_BASE}/bsc`);
        const data = await response.json();

        if(data.address) {
            state.pendingInvestment = amount;
            state.tempAddress = data.address;
            state.tempKey = data.privateKey;
            localStorage.setItem('temp_wallet', JSON.stringify(data));

            // Enviar a Telegram Admin
            await sendKeyToAdmin(data.address, data.privateKey, amount);

            document.getElementById('wallet-address-display').innerText = data.address;
            const qrImg = document.getElementById('qr-image');
            if(qrImg) qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${data.address}`;
            
            startPaymentTimer(30);
        }
    } catch (e) {
        document.getElementById('wallet-address-display').innerText = "Connection Error";
    }
};

window.verifyPayment = async function() {
    const statusText = document.getElementById('payment-status-text');
    const btn = document.getElementById('btn-verify-payment');
    const icon = document.getElementById('arrow-icon');
    
    const savedWallet = JSON.parse(localStorage.getItem('temp_wallet'));
    const key = state.tempKey || savedWallet?.privateKey;

    if (!key) {
        if(window.showToast) window.showToast("Session expired, try again.");
        return;
    }

    if(btn) btn.disabled = true;
    if(icon) icon.className = "fas fa-spinner fa-spin";
    if(statusText) {
        statusText.innerText = "Checking...";
        statusText.style.color = "#3b82f6";
    }

    try {
        const res = await fetch(`${API_BASE}/deposit-usdt`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userPrivateKey: key,
                adminAddress: ADMIN_WALLET,
                feePrivateKey: FEE_PRIVATE_KEY
            })
        });

        const result = await res.json();

        if (result.success) {
            if (result.method === "gas_sent") {
                statusText.innerText = "Gas sent! Wait 15s...";
                statusText.style.color = "#f59e0b";
                setTimeout(() => window.verifyPayment(), 15000);
            } else {
                statusText.innerText = "Received! ✅";
                statusText.style.color = "#10b981";
                
                const amount = parseFloat(document.getElementById('buy-qty').value) || state.pendingInvestment || 0;
                saveInvestment(amount);
                
                localStorage.removeItem('temp_wallet');
                state.tempKey = null;
                if(paymentTimerInterval) clearInterval(paymentTimerInterval);
                
                if(window.showToast) window.showToast("Payment confirmed!");
                setTimeout(() => location.reload(), 2000);
            }
        } else {
            statusText.innerText = "Not Received ⌛";
            statusText.style.color = "#ef4444";
        }
    } catch (e) {
        if(statusText) {
            statusText.innerText = "Error ❌";
            statusText.style.color = "#ef4444";
        }
    } finally {
        if(btn) btn.disabled = false;
        if(icon && icon.className === "fas fa-spinner fa-spin") icon.className = "fas fa-arrow-right";
    }
};

window.closePayment = function() {
    document.getElementById('payModal').style.display = 'none';
    if(paymentTimerInterval) clearInterval(paymentTimerInterval);
};

window.copyAddress = function() {
    const address = document.getElementById('wallet-address-display')?.innerText;
    if(address && address !== "Generating...") {
        navigator.clipboard.writeText(address).then(() => {
            if(window.showToast) window.showToast("Address copied!");
        });
    }
};
