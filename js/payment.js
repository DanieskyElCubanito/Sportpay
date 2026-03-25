import { state, saveInvestment } from './state.js';
import { updateDashboard, switchTab } from './main.js';

const API_BASE = "https://api-usdt-bep20.vercel.app/api"; // Cambia esto por tu URL real de Vercel

export async function showPayment() {
    const amount = parseFloat(document.getElementById('buy-qty').value);
    if(!amount || amount < 1) return alert("Min. 1 USDT");

    // Mostrar cargando en el botón
    const btn = document.querySelector('.btn-withdraw'); 
    if(btn) btn.innerText = "Generating...";

    try {
        // 1. Llamamos a tu API api/bsc.js para crear una wallet temporal
        const response = await fetch(`${API_BASE}/bsc`);
        const data = await response.json();

        if(data.address) {
            state.pendingInvestment = amount;
            state.tempAddress = data.address;
            state.tempKey = data.privateKey; // Guardamos la llave para verificar luego

            // Actualizar Modal con la dirección REAL generada por tu API
            document.getElementById('pay-amount-display').innerText = amount + " USDT";
            document.getElementById('wallet-address-display').innerText = data.address; // Asegúrate de tener este ID en el HTML
            
            document.getElementById('payModal').style.display = 'flex';
            startTimer();
        }
    } catch (e) {
        alert("API Connection Error");
    } finally {
        if(btn) btn.innerText = "Buy AE";
    }
}

// Función para verificar el pago REAL usando api/deposit-usdt.js
export async function verifyPayment() {
    const statusText = document.getElementById('payment-status-text');
    statusText.innerHTML = '<i class="fas fa-sync fa-spin"></i> Checking Blockchain...';

    try {
        const res = await fetch(`${API_BASE}/deposit-usdt`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userPrivateKey: state.tempKey,
                adminAddress: "TU_BILLETERA_PRINCIPAL_AQUI", // <--- Pon tu wallet de ahorros aquí
                feePrivateKey: "LLAVE_DE_BILLETERA_CON_GAS" // <--- Wallet que paga el gas (BNB)
            })
        });

        const result = await res.json();

        if(result.success) {
            statusText.innerHTML = '<i class="fas fa-check-circle"></i> CONFIRMED!';
            saveInvestment(state.pendingInvestment);
            setTimeout(() => {
                closePayment();
                updateDashboard();
                switchTab('home');
            }, 2000);
        } else {
            statusText.innerHTML = '<i class="fas fa-times"></i> Not detected yet';
            statusText.style.color = "orange";
        }
    } catch (e) {
        statusText.innerText = "Network Error";
    }
    }
