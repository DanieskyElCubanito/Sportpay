import { state } from '../state/appState.js';

export function updateDashboard() {
    const hashEl = document.getElementById('main-balance-hash');
    const usdtEl = document.getElementById('main-balance-usdt');
    const speedEl = document.getElementById('mining-speed');
    const refEl = document.getElementById('ref-count');
    const idEl = document.getElementById('user-id');
    const refInput = document.getElementById('ref-link');

    // Elementos de la red multilivel
    const levels = [
        document.getElementById('ref-L1'),
        document.getElementById('ref-L2'),
        document.getElementById('ref-L3'),
        document.getElementById('ref-L4'),
        document.getElementById('ref-L5')
    ];

    if (hashEl) {
        const totalHash = Math.floor(state.totalEarnedUSD * state.hashRate);
        hashEl.innerText = totalHash;
    }
    
    if (usdtEl) usdtEl.innerText = state.totalEarnedUSD.toFixed(2);
    if (refEl) refEl.innerText = state.referralCount;

    // Pintar niveles de red eficientemente
    const refData = [state.refsL1, state.refsL2, state.refsL3, state.refsL4, state.refsL5];
    levels.forEach((el, index) => {
        if (el) el.innerText = refData[index];
    });

    if (idEl && state.userId) idEl.innerText = `ID: ${state.userId}`;
    if (refInput && state.userId) {
        refInput.value = `https://t.me/DannyDevRobot/app?startapp=${state.userId}`;
    }

    if (speedEl) {
        const currentGHS = Math.floor((state.totalInvestedUSDT || 0) * 1000);
        speedEl.innerText = `${currentGHS} GH/s activos`;
    }
}
