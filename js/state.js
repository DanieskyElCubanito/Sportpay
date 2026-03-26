// state.js
export const state = {
    totalInvestedUSDT: parseFloat(localStorage.getItem('invested')) || 0,
    totalEarnedUSD: parseFloat(localStorage.getItem('earned')) || 0,
    history: JSON.parse(localStorage.getItem('deposit_history')) || [],
    // Nueva clave para controlar cuándo fue el último pago de dividendos
    lastSettlement: localStorage.getItem('last_settlement') || null, 
    tg: window.Telegram?.WebApp || null
};

export function saveInvestment(amount) {
    state.totalInvestedUSDT += amount;
    localStorage.setItem('invested', state.totalInvestedUSDT.toString());

    const newTransaction = {
        type: 'Deposit',
        amount: amount,
        date: new Date().toLocaleString("es-CU"),
        id: Math.floor(Math.random() * 1000000)
    };
    
    state.history.unshift(newTransaction);
    localStorage.setItem('deposit_history', JSON.stringify(state.history));
}

// FUNCIÓN PARA PROCESAR GANANCIAS DIARIAS
export function processDailyEarnings() {
    if (state.totalInvestedUSDT <= 0) return;

    const now = new Date();
    // Convertimos a hora de Cuba (UTC-5 o UTC-4 según horario de verano)
    const cubaTime = new Intl.DateTimeFormat("en-US", {
        timeZone: "America/Havana",
        year: 'numeric', month: 'numeric', day: 'numeric'
    }).format(now);

    // Si la fecha actual de Cuba es distinta a la última guardada, es un nuevo día
    if (state.lastSettlement !== cubaTime) {
        
        // Calculamos el % según la inversión actual
        let rate = 5.5;
        if (state.totalInvestedUSDT >= 3000) rate = 7.0;
        else if (state.totalInvestedUSDT >= 300) rate = 6.5;
        else if (state.totalInvestedUSDT >= 20) rate = 6.0;

        const dailyProfit = state.totalInvestedUSDT * (rate / 100);

        // 1. Sumar al balance
        state.totalEarnedUSD += dailyProfit;
        localStorage.setItem('earned', state.totalEarnedUSD.toString());

        // 2. Guardar en historial como "Earnings"
        const earningEntry = {
            type: 'Earning',
            amount: dailyProfit,
            date: new Date().toLocaleString("es-CU"),
            id: 'earn-' + Date.now()
        };
        state.history.unshift(earningEntry);
        localStorage.setItem('deposit_history', JSON.stringify(state.history));

        // 3. Actualizar fecha de última liquidación
        state.lastSettlement = cubaTime;
        localStorage.setItem('last_settlement', cubaTime);
        
        return true; // Indica que hubo pago
    }
    return false;
}
