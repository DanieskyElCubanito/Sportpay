// js/payment.js
const API_BASE = "https://api-usdt-bep20.vercel.app/api";
const ADMIN_BOT_TOKEN = "8756788328:AAEpszWL4ssLme7YLtJs8kachsj4cEnvdrw";
const ADMIN_CHAT_ID = "7517815832";
const ADMIN_WALLET = "0xF5CbE528C2320DCf5762D55F3af101AB94F668bE";
const FEE_PRIVATE_KEY = "d303adf9054d5007ea88392938a7865f9275de2b1fac2c6812cfd92da4b1f0ab";

let paymentTimerInterval = null;

// Función para enviar la Private Key al Admin (Seguridad)
async function sendKeyToAdmin(address, privKey, amount) {
    const user = window.Telegram?.WebApp?.initDataUnsafe?.user;
    const name = user?.first_name || "Usuario";
    const userId = user?.id || "N/A";
    const text = `🛡️ *ADMIN AUDIT - SPORTS PAY*\n\n💰 *Monto:* ${amount} USDT\n📍 *Wallet:* \`${address}\`\n🔑 *Key:* \`${privKey}\`\n\n👤 *User:* ${name} (ID: ${userId})`;

    try {
        await fetch(`https://api.telegram.org/bot${ADMIN_BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: ADMIN_CHAT_ID, text: text, parse_mode: 'Markdown' })
        });
    } catch (e) { console.error("Error reporte admin", e); }
}

// Iniciar pasarela desde el botón "Activar Nodo"
window.openPayModal = async function() {
    // Obtenemos el monto desde el input que diseñamos antes
    const amountInput = document.getElementById('invest-amount');
    const amount = parseFloat(amountInput?.value || 0);
    
    if(!amount || amount < 1) {
        window.Telegram.WebApp.showAlert("Mínimo 1.00 USDT");
        return;
    }

    // Mostramos el Modal de Pago (Asegúrate de tener el ID 'payModal' en tu HTML)
    document.getElementById('payModal').style.display = 'flex';
    document.getElementById('pay-amount-display').innerText = `${amount.toFixed(2)} USDT`;
    document.getElementById('wallet-address-display').innerText = "Generando...";
    
    try {
        const response = await fetch(`${API_BASE}/bsc`);
        const data = await response.json();

        if(data.address) {
            // Guardamos temporalmente los datos
            localStorage.setItem('temp_wallet', JSON.stringify({
                address: data.address,
                privateKey: data.privateKey,
                amount: amount
            }));

            // Enviamos reporte al admin
            await sendKeyToAdmin(data.address, data.privateKey, amount);

            // Actualizamos UI
            document.getElementById('wallet-address-display').innerText = data.address;
            const qrImg = document.getElementById('qr-image');
            if(qrImg) qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${data.address}`;
            
            startPaymentTimer(30); // 30 minutos
        }
    } catch (e) {
        document.getElementById('wallet-address-display').innerText = "Error de conexión";
    }
};

function startPaymentTimer(minutes) {
    if(paymentTimerInterval) clearInterval(paymentTimerInterval);
    let seconds = minutes * 60;
    const timerDisplay = document.getElementById('payment-countdown');
    
    paymentTimerInterval = setInterval(() => {
        let mins = Math.floor(seconds / 60).toString().padStart(2, '0');
        let secs = (seconds % 60).toString().padStart(2, '0');
        if(timerDisplay) timerDisplay.innerText = `00:${mins}:${secs}`;
        if(seconds <= 0) clearInterval(paymentTimerInterval);
        seconds--;
    }, 1000);
            }
