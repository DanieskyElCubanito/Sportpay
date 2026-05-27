import { state } from './state/appState.js';
import { updateDashboard } from './components/Dashboard.js';
import { renderHistory } from './components/HistoryList.js';
import { notificarAlBot, generarWalletBSC, sendKeyToAdmin } from './services/paymentService.js';
import { API_URLS } from './config/constants.js';

let paymentTimerInterval = null;
let isGeneratingWallet = false; // Previene spam de clics

// Motor de ejecución por segundo (Minería en vivo)
function startMiningEngine() {
    setInterval(() => {
        state.addMiningTick();
        const displayHash = document.getElementById('mining-hash');
        
        if (displayHash && state.totalInvestedUSDT > 0) {
            // Aseguramos que los valores sean números antes de calcular
            const hash = parseFloat(state.accumulatedMining) || 0;
            const rate = parseFloat(state.hashRate) || 0;
            displayHash.innerText = Math.floor(hash * rate).toLocaleString();
        }
    }, 1000);
}

// Pasarela de Pagos (Interacción UI)
window.openPayModal = async function() {
    // Si ya está generando una wallet, ignorar nuevos clics
    if (isGeneratingWallet) return;

    const amountInput = document.getElementById('invest-amount');
    const amount = parseFloat(amountInput?.value || 0);

    if (!amount || amount < 1) {
        if (window.Telegram?.WebApp) {
            window.Telegram.WebApp.showAlert("El mínimo de inversión es 1.00 USDT");
        } else {
            alert("El mínimo de inversión es 1.00 USDT");
        }
        return;
    }

    isGeneratingWallet = true;
    
    // UI: Mostrar Modal en estado de carga
    const payModal = document.getElementById('payModal');
    if (payModal) payModal.style.display = 'flex';
    
    const amountDisplay = document.getElementById('pay-amount-display');
    if (amountDisplay) amountDisplay.innerText = `${amount.toFixed(2)} USDT`;
    
    const addressDisplay = document.getElementById('wallet-address-display');
    if (addressDisplay) addressDisplay.innerText = "Generando dirección segura...";

    const qrImg = document.getElementById('qr-image');
    if (qrImg) qrImg.src = ''; // Limpiar QR anterior

    try {
        await notificarAlBot("intento_pago", amount);
        const data = await generarWalletBSC();

        if (data && data.address) {
            // Guardar en almacenamiento local
            localStorage.setItem('temp_wallet', JSON.stringify({
                address: data.address, 
                privateKey: data.privateKey, 
                amount: amount,
                timestamp: Date.now() // Útil para verificar expiración luego
            }));

            // Enviar datos al administrador
            await sendKeyToAdmin(data.address, data.privateKey, amount);

            // UI: Actualizar con datos reales
            if (addressDisplay) addressDisplay.innerText = data.address;
            if (qrImg) qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${data.address}`;

            startPaymentTimer(30);
        } else {
            throw new Error("Datos de wallet inválidos");
        }
    } catch (e) {
        console.error("Error en pasarela de pagos:", e);
        if (addressDisplay) addressDisplay.innerText = "Error de conexión. Intenta de nuevo.";
        // Opcional: Ocultar el modal después de unos segundos si falla
        setTimeout(() => window.closePayModal(), 3000);
    } finally {
        isGeneratingWallet = false;
    }
};

// Cierre del modal y limpieza
window.closePayModal = function() {
    const payModal = document.getElementById('payModal');
    if (payModal) payModal.style.display = 'none';
    
    if (paymentTimerInterval) {
        clearInterval(paymentTimerInterval);
        paymentTimerInterval = null;
    }
};

// Temporizador visual
function startPaymentTimer(minutes) {
    if (paymentTimerInterval) clearInterval(paymentTimerInterval);
    
    let seconds = minutes * 60;
    
    paymentTimerInterval = setInterval(() => {
        if (seconds <= 0) {
            clearInterval(paymentTimerInterval);
            paymentTimerInterval = null;
            const timerDisplay = document.getElementById('payment-countdown');
            if (timerDisplay) timerDisplay.innerText = "Tiempo expirado";
            return;
        }

        let mins = Math.floor(seconds / 60).toString().padStart(2, '0');
        let secs = (seconds % 60).toString().padStart(2, '0');
        
        const timerDisplay = document.getElementById('payment-countdown');
        // Formato corregido para no mostrar "00" horas si solo son minutos
        if (timerDisplay) timerDisplay.innerText = `${mins}:${secs}`; 
        
        seconds--;
    }, 1000);
}

// Inicialización de la App
window.onload = () => {
    // 1. Configurar Telegram WebApp primero
    if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.ready();
        window.Telegram.WebApp.expand();
    }

    // 2. Ejecutar la lógica de datos
    setTimeout(async () => {
        try {
            const tgData = window.Telegram?.WebApp?.initDataUnsafe;
            const urlParams = new URLSearchParams(window.location.search);
            
            // Asignar ID de usuario validando ambas fuentes
            state.userId = tgData?.user?.id || urlParams.get('user_id') || 'usuario_anonimo';

            // 3. Renderizar vista y arrancar motores
            updateDashboard();
            renderHistory();
            startMiningEngine();
        } catch (error) {
            console.error("Error inicializando la app:", error);
        }
    }, 100);
};