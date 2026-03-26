// state.js

export const state = {
    // Inversión real acumulada
    totalInvestedUSDT: parseFloat(localStorage.getItem('invested')) || 0,
    totalEarnedUSD: parseFloat(localStorage.getItem('earned')) || 0,
    
    // Datos de la billetera temporal actual (para que no se pierdan al recargar)
    currentWallet: JSON.parse(localStorage.getItem('temp_wallet')) || null,
    
    // Control del cronómetro del pago
    paymentTimerInterval: null,
    
    // Telegram WebApp
    tg: window.Telegram?.WebApp || null
};

/**
 * Guarda la inversión exitosa en el almacenamiento local
 * @param {number} amount - Cantidad de USDT a sumar
 */
export function saveInvestment(amount) {
    state.totalInvestedUSDT += amount;
    localStorage.setItem('invested', state.totalInvestedUSDT.toString());
    
    // Opcional: Si quieres que el balance empiece a generar desde ya
    // localStorage.setItem('last_update', Date.now().toString());
}

/**
 * Limpia la billetera temporal después de un pago exitoso
 */
export function clearTempWallet() {
    state.currentWallet = null;
    localStorage.removeItem('temp_wallet');
}
