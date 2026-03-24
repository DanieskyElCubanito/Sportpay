// Objeto global de estado
export const state = {
    tg: window.Telegram?.WebApp,
    totalInvestedUSDT: parseFloat(localStorage.getItem('invested')) || 6.53,
    totalEarnedUSD: parseFloat(localStorage.getItem('earned')) || 0.3592,
    pendingInvestment: 0,
    payTimerInterval: null
};

// Función para guardar inversiones exitosas
export function saveInvestment(amount) {
    state.totalInvestedUSDT += amount;
    localStorage.setItem('invested', state.totalInvestedUSDT.toFixed(2));
}
