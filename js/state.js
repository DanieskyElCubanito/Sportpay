// js/state.js
export const userState = {
    // Cambiamos 0.23 y 1.45 por 0.00
    balance: parseFloat(localStorage.getItem('balance')) || 0.00,
    totalProfit: parseFloat(localStorage.getItem('totalProfit')) || 0.00,
    miningPower: parseFloat(localStorage.getItem('miningPower')) || 0.0,
    accumulatedMining: parseFloat(localStorage.getItem('accumulatedMining')) || 0.0000,
    
    save() {
        localStorage.setItem('balance', this.balance.toFixed(2));
        localStorage.setItem('totalProfit', this.totalProfit.toFixed(2));
        localStorage.setItem('miningPower', this.miningPower.toFixed(1));
        localStorage.setItem('accumulatedMining', this.accumulatedMining.toFixed(4));
    },

    addMiningGain() {
        if (this.miningPower > 0) {
            // Solo aumenta el acumulado, NO el balance principal
            const gainPerSecond = (this.miningPower * 0.00001); 
            this.accumulatedMining += gainPerSecond;
        }
    },

    claim() {
        if (this.accumulatedMining > 0) {
            // Aquí es el ÚNICO momento donde el balance de arriba sube
            this.balance = parseFloat((this.balance + this.accumulatedMining).toFixed(2));
            this.totalProfit = parseFloat((this.totalProfit + this.accumulatedMining).toFixed(2));
            this.accumulatedMining = 0;
            this.save();
            return true;
        }
        return false;
    }
};
