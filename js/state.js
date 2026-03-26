// --- ARCHIVO state.js (Versión Sincronizada con Bots Business) ---

// 1. Capturamos los parámetros de la URL enviados por el Bot
const urlParams = new URLSearchParams(window.location.search);

// 2. Extraemos datos del Bot (si existen en la URL)
const botId = urlParams.get('id');
const botEarned = urlParams.get('earn') ? parseFloat(urlParams.get('earn')) : null;
const botL1 = urlParams.get('l1') ? parseInt(urlParams.get('l1')) : null;
const botL2 = urlParams.get('l2') ? parseInt(urlParams.get('l2')) : null;

// 3. Inicializamos el estado con prioridad: URL (Bot) > LocalStorage (Teléfono) > 0
export const state = {
    // Si el Bot dice que tenemos X saldo, le creemos al Bot (es el servidor)
    totalEarnedUSD: botEarned !== null ? botEarned : (parseFloat(localStorage.getItem('earned')) || 0),
    
    // La inversión la seguimos manejando local por ahora hasta que integres API de pagos
    totalInvestedUSDT: parseFloat(localStorage.getItem('invested')) || 0,
    
    // Historial y Liquidación diaria (Local)
    history: JSON.parse(localStorage.getItem('deposit_history')) || [],
    lastSettlement: localStorage.getItem('last_settlement') || null, 
    tg: window.Telegram?.WebApp || null,

    // --- SISTEMA DE 5 NIVELES (Prioridad Datos del Bot) ---
    lvl1Count: botL1 !== null ? botL1 : (parseInt(localStorage.getItem('lvl1_c')) || 0),
    lvl2Count: botL2 !== null ? botL2 : (parseInt(localStorage.getItem('lvl2_c')) || 0),
    
    // Estos niveles se cargan del teléfono (o se pueden añadir a la URL del bot luego)
    lvl3Count: parseInt(localStorage.getItem('lvl3_c')) || 0,
    lvl4Count: parseInt(localStorage.getItem('lvl4_c')) || 0,
    lvl5Count: parseInt(localStorage.getItem('lvl5_c')) || 0,
    
    // Ganancias totales por referidos (Sincronizado con Bot)
    referralEarnings: botEarned !== null ? botEarned : (parseFloat(localStorage.getItem('ref_earnings')) || 0)
};

// 4. Guardar ID de usuario para el link de referidos
if (botId) localStorage.setItem('user_id', botId);

// --- FUNCIONES DE PERSISTENCIA ---

export function saveInvestment(amount) {
    state.totalInvestedUSDT += amount;
    localStorage.setItem('invested', state.totalInvestedUSDT.toString());

    const newTransaction = {
        type: 'Deposit',
        amount: amount,
        date: new Date().toLocaleString("es-CU"),
        id: 'dep-' + Date.now()
    };
    
    state.history.unshift(newTransaction);
    localStorage.setItem('deposit_history', JSON.stringify(state.history));
}

export function processDailyEarnings() {
    if (state.totalInvestedUSDT <= 0) return false;

    const now = new Date();
    const cubaTime = new Intl.DateTimeFormat("en-US", {
        timeZone: "America/Havana",
        year: 'numeric', month: 'numeric', day: 'numeric'
    }).format(now);

    if (state.lastSettlement !== cubaTime) {
        let rate = 5.5;
        if (state.totalInvestedUSDT >= 3000) rate = 7.0;
        else if (state.totalInvestedUSDT >= 300) rate = 6.5;
        else if (state.totalInvestedUSDT >= 20) rate = 6.0;

        const dailyProfit = state.totalInvestedUSDT * (rate / 100);

        state.totalEarnedUSD += dailyProfit;
        localStorage.setItem('earned', state.totalEarnedUSD.toString());

        const earningEntry = {
            type: 'Earning',
            amount: dailyProfit,
            date: new Date().toLocaleString("es-CU"),
            id: 'earn-' + Date.now()
        };
        state.history.unshift(earningEntry);
        localStorage.setItem('deposit_history', JSON.stringify(state.history));

        state.lastSettlement = cubaTime;
        localStorage.setItem('last_settlement', cubaTime);
        
        return true; 
    }
    return false;
}

export function addReferralCommission(amount, level) {
    state.referralEarnings += amount;
    state.totalEarnedUSD += amount; 
    
    localStorage.setItem('ref_earnings', state.referralEarnings.toString());
    localStorage.setItem('earned', state.totalEarnedUSD.toString());

    const refEntry = {
        type: 'Earning',
        amount: amount,
        date: new Date().toLocaleString("es-CU"),
        id: `ref-L${level}-${Date.now()}`
    };
    state.history.unshift(refEntry);
    localStorage.setItem('deposit_history', JSON.stringify(state.history));
}
