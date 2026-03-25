export const state = {
    totalInvestedUSDT: parseFloat(localStorage.getItem('invested')) || 0,
    totalEarnedUSD: parseFloat(localStorage.getItem('earned')) || 0,
    pendingInvestment: 0,
    payTimerInterval: null,
    tempAddress: null, // Añadido para tu API
    tempKey: null,     // Añadido para tu API
    tg: window.Telegram?.WebApp || null
};

export function saveInvestment(amount) {
    state.totalInvestedUSDT += amount;
    localStorage.setItem('invested', state.totalInvestedUSDT.toString());
}
