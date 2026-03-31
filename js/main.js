// IMPORTANTE: Asegúrate de que state.js esté en la misma carpeta 'js'
import { state, saveInvestment, processDailyEarnings } from './state.js';

// --- CONFIGURACIÓN ---
const BJS_CONFIG = {
    botId: "8101312620",
    secretKey: "1$MillonDannyMeli*@#€", 
    token: "X6MBnt6bQxIc66AoNZ3xLXHGmKXs7Zq5kx75GWK8" 
};

// --- CAPTURAR DATOS INMEDIATAMENTE ---
const urlParams = new URLSearchParams(window.location.search);
const userId = urlParams.get('user_id');
const urlBalance = urlParams.get('balance');
const urlInvested = urlParams.get('invested');

// --- FORZAR SINCRONIZACIÓN ---
function syncInitialData() {
    console.log("Sincronizando... Balance recibido:", urlBalance);

    if (urlBalance !== null) {
        state.totalEarnedUSD = parseFloat(urlBalance);
    }
    if (urlInvested !== null) {
        state.totalInvestedUSDT = parseFloat(urlInvested);
    }
    
    updateDashboard();
    startMiningEngine();
}

// --- ACTUALIZAR PANTALLA ---
export function updateDashboard() {
    const mainBalEl = document.getElementById('main-balance');
    if (mainBalEl) {
        mainBalEl.innerText = (state.totalEarnedUSD || 0).toFixed(2);
    }

    const invested = state.totalInvestedUSDT || 0;
    const currentGHS = invested * 1000;
    
    // Actualizar otros textos si existen
    const elements = {
        'total-profit': `+$${(state.totalProfit || 0).toFixed(2)}`,
        'mining-speed': `${currentGHS.toLocaleString()} GH/s activos`
    };

    for (const [id, val] of Object.entries(elements)) {
        const el = document.getElementById(id);
        if (el) el.innerText = val;
    }
}

// --- RECLAMAR SALDO ---
async function claimMining() {
    if (!state.accumulatedMining || state.accumulatedMining <= 0) return;
    
    const amount = state.accumulatedMining;
    const apiURL = `https://api.bots.business/v1/bots/${BJS_CONFIG.botId}/commands/api_save`;
    const finalURL = `${apiURL}?user_id=${userId}&amount=${amount}&key=${BJS_CONFIG.secretKey}`;

    try {
        const response = await fetch(finalURL, { headers: { "api_key": BJS_CONFIG.token } });
        const result = await response.json();
        if (result.status === "success") {
            state.totalEarnedUSD += amount;
            state.accumulatedMining = 0;
            updateDashboard();
        }
    } catch (e) { console.error(e); }
}
window.claimMining = claimMining;

function initUser() {
    // Verificar si estamos dentro de Telegram
    if (window.Telegram && window.Telegram.WebApp) {
        const tg = window.Telegram.WebApp;
        tg.expand(); // Expande la app para que ocupe toda la pantalla

        const user = tg.initDataUnsafe?.user;

        if (user) {
            // Unir primer nombre y apellido
            const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim();
            document.getElementById('user-full-name').innerText = fullName || 'Usuario Desconocido';
            
            // Cargar ID
            document.getElementById('user-id').innerText = `ID: ${user.id}`;

            // Cargar Foto de Perfil
            const userPic = document.getElementById('user-pic');
            if (user.photo_url) {
                userPic.src = user.photo_url;
            } else {
                // Avatar por defecto con sus iniciales si tiene la foto de Telegram oculta
                userPic.src = "https://ui-avatars.com/api/?name=" + encodeURIComponent(fullName) + "&background=0088cc&color=fff&bold=true";
            }
        }
    } else {
        console.warn("La app no se está ejecutando dentro de Telegram.");
    }
}

// Hacer global para que arranque al abrir la página
window.initUser = initUser;

// Si no tienes el window.onload en tu index.html, descomenta la línea de abajo:
// window.onload = initUser;
// --- MOTOR ---
function startMiningEngine() {
    setInterval(() => {
        const invested = state.totalInvestedUSDT || 0;
        if (invested > 0) {
            state.accumulatedMining = (state.accumulatedMining || 0) + (invested * 1000 * 0.0000001);
            const display = document.getElementById('mining-balance');
            if (display) display.innerText = state.accumulatedMining.toFixed(4);
        }
    }, 1000);
}

// EJECUCIÓN DIRECTA (Sin esperar al load para evitar fallos en móviles)
syncInitialData();

