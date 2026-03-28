// js/state.js

// Estructura de datos con persistencia en localStorage
export const userState = {
    balance: parseFloat(localStorage.getItem('balance')) || 0.23,
    totalProfit: parseFloat(localStorage.getItem('totalProfit')) || 1.45,
    miningPower: parseFloat(localStorage.getItem('miningPower')) || 0.0,
    // El acumulado de minería que aún no se ha reclamado
    accumulatedMining: parseFloat(localStorage.getItem('accumulatedMining')) || 0.0000,
    lastUpdate: parseInt(localStorage.getItem('lastUpdate')) || Date.now(),

    // Guarda todos los valores actuales en la memoria del teléfono/PC
    save() {
        localStorage.setItem('balance', this.balance.toFixed(2));
        localStorage.setItem('totalProfit', this.totalProfit.toFixed(2));
        localStorage.setItem('miningPower', this.miningPower.toFixed(1));
        localStorage.setItem('accumulatedMining', this.accumulatedMining.toFixed(4));
        localStorage.setItem('lastUpdate', Date.now());
    },

    // Función para añadir ganancias al acumulado (se llama cada segundo)
    addMiningGain() {
        if (this.miningPower > 0) {
            // Ejemplo: Ganancia basada en el poder (ajusta la división según tu economía)
            const gainPerSecond = (this.miningPower * 0.00001); 
            this.accumulatedMining += gainPerSecond;
            this.save();
        }
    },

    // Mueve lo acumulado al balance principal
    claim() {
        if (this.accumulatedMining > 0) {
            this.balance += this.accumulatedMining;
            this.totalProfit += this.accumulatedMining;
            this.accumulatedMining = 0;
            this.save();
            return true;
        }
        return false;
    }
};

// Exponer al objeto window para que otros scripts lo vean si es necesario
window.userState = userState;
