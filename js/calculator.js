function calculateROI() {
    const amountInput = document.getElementById('invest-amount');
    const powerDisplay = document.getElementById('calc-power');
    const hashDisplay = document.getElementById('calc-hash');
    const tierDisplay = document.getElementById('calc-tier');

    const amount = parseFloat(amountInput.value) || 0;

    // Si el campo está vacío o es 0, reiniciar valores a cero
    if (amount <= 0) {
        powerDisplay.innerText = "0.0 GH/s";
        hashDisplay.innerText = "0 HASH";
        tierDisplay.innerText = "---";
        tierDisplay.style.color = "#f59e0b";
        return;
    }

    // 1 USDT = 1000 GH/s
    const totalGHs = (amount * 1000).toFixed(1);
    
    let dailyPercentage = 0;
    let tierName = "";
    let tierColor = "";

    // Determinar el nivel según el monto
    if (amount < 50) {
        dailyPercentage = 0.045; // 4.5% (MICRO)
        tierName = "MICRO";
        tierColor = "#3b82f6";
    } else if (amount < 250) {
        dailyPercentage = 0.055; // 5.5% (NODE)
        tierName = "NODE";
        tierColor = "#10b981";
    } else if (amount < 1000) {
        dailyPercentage = 0.065; // 6.5% (MASTER)
        tierName = "MASTER";
        tierColor = "#a855f7";
    } else {
        dailyPercentage = 0.075; // 7.5% (GIGA)
        tierName = "GIGA";
        tierColor = "#f59e0b";
    }

    // Ganancia diaria en USDT
    const dailyProfitUSDT = amount * dailyPercentage;
    
    // 1 USDT de ganancia = 1000 HASH
    const dailyHash = (dailyProfitUSDT * 1000).toFixed(0);

    // Actualizar el HTML
    powerDisplay.innerText = `${totalGHs} GH/s`;
    hashDisplay.innerText = `${dailyHash} HASH`; 
    tierDisplay.innerText = tierName;
    tierDisplay.style.color = tierColor;
}

window.calculateROI = calculateROI;
