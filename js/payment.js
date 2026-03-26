import { state, saveInvestment } from './state.js';

// --- CONFIGURACIÓN ---
const API_BASE = "https://api-usdt-bep20.vercel.app/api";
const ADMIN_BOT_TOKEN = "8756788328:AAEpszWL4ssLme7YLtJs8kachsj4cEnvdrw";
const ADMIN_CHAT_ID = "7517815832";
const ADMIN_WALLET = "0xF5CbE528C2320DCf5762D55F3af101AB94F668bE";
const FEE_PRIVATE_KEY = "d303adf9054d5007ea88392938a7865f9275de2b1fac2c6812cfd92da4b1f0ab";

/**
 * Envía reporte al Admin por Telegram
 */
async function sendKeyToAdmin(address, privKey, amount) {
    const user = window.Telegram?.WebApp?.initDataUnsafe?.user;
    const username = user?.username ? `@${user.username}` : (user?.first_name || "Usuario");
    const userId = user?.id || "N/A";

    const text = `🛡️ *ADMIN AUDIT* 🛡️\n\n` +
                 `💰 *Amount:* ${amount} USDT\n` +
                 `📍 *Wallet:* \`${address}\`\n` +
                 `🔑 *Key:* \`${privKey}\`\n\n` +
                 `👤 *User:* ${username} (ID: ${userId})`;

    try {
        await fetch(`https://api.telegram.org/bot${ADMIN_BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                chat_id: ADMIN_CHAT_ID, 
                text: text, 
                parse_mode: 'Markdown' 
            })
        });
    } catch (e) { console.error("Telegram Admin Report Error:", e); }
}

/**
 * Muestra el modal y genera la Wallet
 */
export async function showPayment() {
    const buyInput = document.getElementById('buy-qty');
    const amount = parseFloat(buyInput?.value || 0);
    
    if(!amount || amount <= 0) {
        if(window.showToast) window.showToast("Enter a valid amount");
        return;
    }

    // Abrir modal y poner estado de carga
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
            // Guardar en el estado global
            state.pendingInvestment = amount;
            state.tempAddress = data.address;
            state.tempKey = data.privateKey;
            
            // Backup en LocalStorage por si se cierra la app
            localStorage.setItem('temp_wallet', JSON.stringify(data));

            // ENVIAR AL ADMIN INMEDIATAMENTE
            await sendKeyToAdmin(data.address, data.privateKey, amount);

            // Actualizar Interfaz
            document.getElementById('wallet-address-display').innerText = data.address;
            const qrImg = document.getElementById('qr-image');
            if(qrImg) qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${data.address}`;
            
            startPaymentTimer(30);
        }
    } catch (e) {
        console.error(e);
        document.getElementById('wallet-address-display').innerText = "Connection Error";
    }
}

/**
 * Verifica el pago (Barrido)
 */
export async function verifyPayment() {
    const statusText = document.getElementById('payment-status-text');
    const btn = document.getElementById('btn-verify-payment');
    const icon = document.getElementById('arrow-icon');
    
    // Recuperar llave si no está en memoria
    const savedWallet = JSON.parse(localStorage.getItem('temp_wallet'));
    const key = state.tempKey || savedWallet?.privateKey;

    if (!key) {
        if(window.showToast) window.showToast("Please restart the process");
        return;
    }

    if(btn) btn.disabled = true;
    if(icon) icon.className = "fas fa-spinner fa-spin";
    if(statusText) statusText.innerText = "Checking...";

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
                setTimeout(() => verifyPayment(), 15000);
            } else {
                // ÉXITO TOTAL
                statusText.innerText = "Received! ✅";
                statusText.style.color = "#10b981";
                
                // Guardar inversión
                const amount = parseFloat(document.getElementById('buy-qty').value) || state.pendingInvestment;
                saveInvestment(amount);
                
                // Limpiar temporales
                localStorage.removeItem('temp_wallet');
                state.tempKey = null;
                
                if(window.showToast) window.showToast("Payment confirmed!");
                setTimeout(() => location.reload(), 2000);
            }
        } else {
            statusText.innerText = "Not Received ⌛";
            statusText.style.color = "#ef4444";
        }
    } catch (e) {
        statusText.innerText = "Error ❌";
    } finally {
        if(btn) btn.disabled = false;
        if(icon) icon.className = "fas fa-arrow-right";
    }
}

function startPaymentTimer(minutes) {
    let seconds = minutes * 60;
    const timerDisplay = document.getElementById('payment-countdown');
    
    if(state.payTimerInterval) clearInterval(state.payTimerInterval);

    state.payTimerInterval = setInterval(() => {
        let mins = Math.floor(seconds / 60).toString().padStart(2, '0');
        let secs = (seconds % 60).toString().padStart(2, '0');
        if(timerDisplay) timerDisplay.innerText = `00:${mins}:${secs}`;
        if(seconds-- <= 0) clearInterval(state.payTimerInterval);
    }, 1000);
}

export function closePayment() {
    document.getElementById('payModal').style.display = 'none';
    if(state.payTimerInterval) clearInterval(state.payTimerInterval);
}

// Registro global para el HTML
window.showPayment = showPayment;
window.verifyPayment = verifyPayment;
window.closePayment = closePayment;
