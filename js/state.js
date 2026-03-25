// Objeto global de estado con persistencia de datos
export const state = {
    // Intenta leer los datos guardados; si no existen, empieza en 0
    totalInvestedUSDT: parseFloat(localStorage.getItem('invested')) || 0,
    totalEarnedUSD: parseFloat(localStorage.getItem('earned')) || 0,
    
    // Almacenamiento temporal para pagos en proceso
    pendingInvestment: 0,
    payTimerInterval: null,

    // Objeto de Telegram
    tg: window.Telegram?.WebApp || null
};

/**
 * Guarda una inversión exitosa y la hace permanente en el navegador
 * @param {number} amount - Cantidad de USDT a sumar
 */
export function saveInvestment(amount) {
    state.totalInvestedUSDT += amount;
    // Guardamos en la memoria del teléfono/navegador
    localStorage.setItem('invested', state.totalInvestedUSDT.toFixed(2));
    
    // Opcional: Si quieres que empiece a ganar algo de saldo inmediatamente al invertir
    // localStorage.setItem('earned', state.totalEarnedUSD.toFixed(4));
}
