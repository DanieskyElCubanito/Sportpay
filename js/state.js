// state.js

export const state = {
    totalInvestedUSDT: parseFloat(localStorage.getItem('invested')) || 0,
    totalEarnedUSD: parseFloat(localStorage.getItem('earned')) || 0,
    // Cargar historial o array vacío
    history: JSON.parse(localStorage.getItem('deposit_history')) || [],
    currentWallet: JSON.parse(localStorage.getItem('temp_wallet')) || null,
    tg: window.Telegram?.WebApp || null
};

export function saveInvestment(amount) {
    // 1. Actualizar total
    state.totalInvestedUSDT += amount;
    localStorage.setItem('invested', state.totalInvestedUSDT.toString());

    // 2. Registrar en el historial
    const newTransaction = {
        amount: amount,
        date: new Date().toLocaleString(),
        id: Math.floor(Math.random() * 1000000)
    };
    
    state.history.unshift(newTransaction); // Añadir al inicio
    localStorage.setItem('deposit_history', JSON.stringify(state.history));
}

export function clearTempWallet() {
    state.currentWallet = null;
    localStorage.removeItem('temp_wallet');
}
