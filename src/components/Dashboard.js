import { state } from '../state/appState.js';

export function updateDashboard() {
    // Selectores del DOM
    const hashEl = document.getElementById('main-balance-hash');
    const usdtEl = document.getElementById('main-balance-usdt');
    const speedEl = document.getElementById('mining-speed');
    const refEl = document.getElementById('ref-count');
    const idEl = document.getElementById('user-id');
    const nameEl = document.getElementById('user-full-name');
    const refInput = document.getElementById('ref-link');

    // Elementos de la red multinivel
    const levels = [
        document.getElementById('ref-L1'),
        document.getElementById('ref-L2'),
        document.getElementById('ref-L3'),
        document.getElementById('ref-L4'),
        document.getElementById('ref-L5')
    ];

    // 1. Balance de HASH (Con separadores de miles para verse masivo)
    if (hashEl) {
        const hashRate = parseFloat(state.hashRate) || 0;
        const totalEarned = parseFloat(state.totalEarnedUSD) || 0;
        const totalHash = Math.floor(totalEarned * hashRate);
        hashEl.innerText = totalHash.toLocaleString();
    }

    // 2. Equivalencia en USDT (4 decimales para mayor precisión científica)
    if (usdtEl) {
        const totalEarned = parseFloat(state.totalEarnedUSD) || 0;
        usdtEl.innerText = totalEarned.toFixed(4);
    }

    // 3. Contador Total de Nodos en la Red
    if (refEl) {
        refEl.innerText = (state.referralCount || 0).toLocaleString();
    }

    // 4. Renderizado de la Red Estructurada Multinivel
    const refData = [
        state.refsL1 || 0, 
        state.refsL2 || 0, 
        state.refsL3 || 0, 
        state.refsL4 || 0, 
        state.refsL5 || 0
    ];
    levels.forEach((el, index) => {
        if (el) el.innerText = refData[index].toLocaleString();
    });

    // 5. Credenciales de Seguridad del Operador (ID)
    if (idEl) {
        idEl.innerText = state.userId ? `ID: ${state.userId}` : 'ID: SYNC_PENDING...';
    }

    // 6. Nombre del Operador en Mayúsculas / Fallback del Futuro
    if (nameEl) {
        const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user;
        if (tgUser?.first_name) {
            nameEl.innerText = `${tgUser.first_name} ${tgUser.last_name || ''}`.trim().toUpperCase();
        } else if (state.userId) {
            // Nombre clave si no se abre directo en Telegram
            nameEl.innerText = `OPERADOR_ALFA_${state.userId.toString().slice(-4)}`;
        } else {
            nameEl.innerText = 'CONECTANDO NODO...';
        }
    }

    // 7. Enlace de Red Cuántica
    if (refInput) {
        refInput.value = state.userId 
            ? `https://t.me/DannyDevRobot/app?startapp=${state.userId}`
            : 'GENERANDO ENLACE ENCRIPTADO...';
    }

    // 8. Velocidad del Procesador (¡Corregido para NO borrar el icono de Microchip!)
    if (speedEl) {
        const invested = parseFloat(state.totalInvestedUSDT) || 0;
        const currentGHS = Math.floor(invested * 1000);
        speedEl.innerHTML = `<i class="fa-solid fa-microchip"></i> ${currentGHS.toLocaleString()} GH/s asignados al Núcleo`;
    }
}