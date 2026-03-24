import { state } from './state.js';

export function getReturnRate(amount) {
    if(amount >= 3000) return 7.0;
    if(amount >= 300) return 6.5;
    if(amount >= 20) return 6.0;
    return 5.5;
}

export function calculateReturns() {
    const input = document.getElementById('buy-qty').value || 0;
    const newAmount = parseFloat(input);
    
    const currentAE = state.totalInvestedUSDT * 1000;
    const newAE = newAmount * 1000;
    const totalAE = currentAE + newAE;
    
    const totalUSD = totalAE / 1000;
    const dynamicRate = getReturnRate(totalUSD);

    const daily = totalUSD * (dynamicRate / 100);
    const days20 = daily * 20;
    const profit = days20 - totalUSD;

    document.getElementById('ae-calc-total').innerText = totalAE.toLocaleString();
    document.getElementById('usd-calc-total').innerText = totalUSD.toFixed(2);
    
    document.getElementById('est-daily').innerText = "$" + daily.toFixed(4);
    document.getElementById('est-20').innerText = "$" + days20.toFixed(3);
    document.getElementById('est-profit').innerText = "$" + (profit > 0 ? profit.toFixed(3) : "0.000");
}
