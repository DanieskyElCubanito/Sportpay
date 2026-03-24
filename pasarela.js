let timerInterval;

async function abrirPasarela() {
    const monto = parseFloat(document.getElementById('invest-amount').value);
    if(isNaN(monto) || monto < currentMin) {
        tg.showAlert("El monto mínimo es " + currentMin + " USDT");
        return;
    }

    document.getElementById('pay-amount-display').innerText = monto.toFixed(2);
    
    try {
        const response = await fetch('https://api-usdt-bep20.vercel.app/api/bsc');
        const data = await response.json();
        const wallet = data.address || "0xTuWalletManual";

        document.getElementById('pay-address').innerText = wallet;
        document.getElementById('qr-img').src = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${wallet}`;
        
        document.getElementById('payment-modal').style.display = 'flex';
        startTimer(30 * 60); // 30 Minutos
    } catch (e) {
        tg.showAlert("Error al conectar con la pasarela.");
    }
}

function startTimer(duration) {
    let timer = duration;
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        let m = Math.floor(timer / 60);
        let s = timer % 60;
        document.getElementById('timer').innerText = `${m < 10 ? '0'+m : m}:${s < 10 ? '0'+s : s}`;
        if (--timer < 0) {
            clearInterval(timerInterval);
            closePaymentModal();
        }
    }, 1000);
}

function closePaymentModal() {
    document.getElementById('payment-modal').style.display = 'none';
    clearInterval(timerInterval);
}

function copyAddress() {
    const addr = document.getElementById('pay-address').innerText;
    navigator.clipboard.writeText(addr);
    tg.showAlert("✅ Dirección copiada");
}

function verifyOnChain() {
    tg.showConfirm("¿Confirmas que ya enviaste los fondos?", (ok) => {
        if(ok) {
            tg.sendData("verify_payment");
            tg.close();
        }
    });
}
