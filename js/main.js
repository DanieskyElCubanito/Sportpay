// CONFIGURACIÓN - Pon tus datos reales aquí
const VERCEL_URL = "https://api-usdt-bep20.vercel.app"; // Tu URL de Vercel sin la barra final
const ADMIN_WALLET = "0xF5CbE528C2320DCf5762D55F3af101AB94F668bE";       // Tu billetera donde recibes los USDT
const FEE_PRIVATE_KEY = "d303adf9054d5007ea88392938a7865f9275de2b1fac2c6812cfd92da4b1f0ab";   // La llave de la wallet que paga el gas

// Función para mostrar el pago y generar la Wallet/QR
window.showPayment = async function() {
    const qtyInput = document.getElementById('buy-qty');
    const qty = qtyInput ? qtyInput.value : 0;
    
    if (!qty || qty <= 0) {
        alert("Please enter an amount first");
        return;
    }

    // Mostrar el modal
    const modal = document.getElementById('payModal');
    if (modal) modal.style.display = 'flex';
    
    const displayAmt = document.getElementById('pay-amount-display');
    if (displayAmt) displayAmt.innerText = `${parseFloat(qty).toFixed(2)} USDT`;

    const addressEl = document.getElementById('wallet-address-display');
    if (addressEl) addressEl.innerText = "Generating...";

    try {
        // Llamada a la API de Vercel para crear la wallet
        const response = await fetch(`${VERCEL_URL}/api/bsc`);
        const data = await response.json();

        if (data.address) {
            window.currentWallet = data; // Guardamos la wallet en memoria
            localStorage.setItem('temp_wallet', JSON.stringify(data)); // Y en el navegador por seguridad

            // Actualizar la interfaz
            if (addressEl) addressEl.innerText = data.address;
            
            const qrImg = document.getElementById('qr-image');
            if (qrImg) {
                qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${data.address}`;
            }
        } else {
            throw new Error("Invalid API response");
        }
    } catch (error) {
        console.error("Error generating payment:", error);
        alert("Error connecting to API. Check Vercel URL.");
        if (addressEl) addressEl.innerText = "Error, try again";
    }
};

// Función para verificar el pago (Barrido)
window.verifyPayment = async function() {
    const statusText = document.getElementById('payment-status-text');
    const btn = document.getElementById('btn-verify-payment');
    
    if (!window.currentWallet) {
        alert("No wallet generated. Please restart.");
        return;
    }

    btn.disabled = true;
    if (statusText) statusText.innerText = "Verifying...";

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

        const result = await res.json();

        if (result.success) {
            if (statusText) statusText.innerText = "Success! ✅";
            alert("Payment confirmed and sent to admin!");
            localStorage.removeItem('temp_wallet');
            setTimeout(() => location.reload(), 2000);
        } else {
            if (statusText) statusText.innerText = "Not found yet ⌛";
            alert(result.error || "Deposit not found.");
        }
    } catch (e) {
        alert("Connection error.");
    } finally {
        btn.disabled = false;
    }
};

// Cierra el modal
window.closePayment = function() {
    const modal = document.getElementById('payModal');
    if (modal) modal.style.display = 'none';
};
