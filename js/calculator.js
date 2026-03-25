import { state } from './state.js';

export function getReturnRate(amount) {
    if(amount >= 3000) return 7.0;
    if(amount >= 300) return 6.5;
    if(amount >= 20) return 6.0;
    return 5.5;
}

export function calculateReturns() {
    const inputEl = document.getElementById('buy-qty');
    if (!inputEl) return; // Si no existe el input, no hace nada y no rompe la app

    const newAmount = parseFloat(inputEl.value) || 0;
    
    const currentAE = (state.totalInvestedUSDT || 0) * 1000;
    const newAE = newAmount * 1000;
    const totalAE = currentAE + newAE;
    
    const totalUSD = totalAE / 1000;
    const dynamicRate = getReturnRate(totalUSD);

    const daily = totalUSD * (dynamicRate / 100);
    const days20 = daily * 20;
    const profit = days20 - totalUSD;

    // Actualización segura de textos
    const setText = (id, text) => {
        const el = document.getElementById(id);
        if (el) el.innerText = text;
    };

    setText('ae-calc-total', totalAE.toLocaleString());
    setText('usd-calc-total', totalUSD.toFixed(2));
    setText('est-daily', "$" + daily.toFixed(4));
    setText('est-20', "$" + days20.toFixed(3));
    setText('est-profit', "$" + (profit > 0 ? profit.toFixed(3) : "0.000"));
                     }
