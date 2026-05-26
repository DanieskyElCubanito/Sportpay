export function calculateROI() {
    const amountInput = document.getElementById('invest-amount');
    const powerDisplay = document.getElementById('calc-power');
    const hashDisplay = document.getElementById('calc-hash');
    const tierDisplay = document.getElementById('calc-tier');

    if (!amountInput) return;
    const amount = parseFloat(amountInput.value) || 0;

    if (amount <= 0) {
        powerDisplay.innerText = "0.0 GH/s";
        hashDisplay.innerText = "0 HASH";
        tierDisplay.innerText = "---";
        tierDisplay.style.color = "#f59e0b";
        return;
    }

    const totalGHs = (amount * 1000).toFixed(1);
    let dailyPercentage = 0;
    let tierName = "";
    let tierColor = "";

    if (amount < 45) {
        dailyPercentage = 0.045; // 4.5% MICRO
        tierName = "MICRO"; tierColor = "#3b82f6";
    } else if (amount < 250) {
        dailyPercentage = 0.055; // 5.5% NODE
        tierName = "NODE"; tierColor = "#10b981";
    } else if (amount < 1000) {
        dailyPercentage = 0.065; // 6.5% MASTER
        tierName = "MASTER"; tierColor = "#a855f7";
    } else {
        dailyPercentage = 0.075; // 7.5% GIGA
        tierName = "GIGA"; tierColor = "#f59e0b";
    }

    const dailyProfitUSDT = amount * dailyPercentage;
    const dailyHash = (dailyProfitUSDT * 1000).toFixed(0);

    powerDisplay.innerText = `${totalGHs} GH/s`;
    hashDisplay.innerText = `${dailyHash} HASH`; 
    tierDisplay.innerText = tierName;
    tierDisplay.style.color = tierColor;
}

// Lo exponemos al objeto window para mantener compatibilidad con tus inputs HTML (oninput)
window.calculateROI = calculateROI;
