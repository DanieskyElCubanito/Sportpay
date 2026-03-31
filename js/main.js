// --- CONFIGURACIÓN ---
const BJS_CONFIG = {
    botId: "8101312620",
    secretKey: "1$MillonDannyMeli*@#€", 
    token: "X6MBnt6bQxIc66AoNZ3xLXHGmKXs7Zq5kx75GWK8" 
};

// --- CAPTURAR DATOS INMEDIATAMENTE ---
const urlParams = new URLSearchParams(window.location.search);
const userId = urlParams.get('user_id') || (window.Telegram?.WebApp?.initDataUnsafe?.user?.id);
const urlBalance = urlParams.get('balance');

// --- FORZAR SINCRONIZACIÓN (BJS API) ---
async function syncInitialData() {
    if (typeof window.state === 'undefined') window.state = { accumulatedMining: 0 };
    
    // Si no hay userId, no podemos pedir datos
    if (!userId) return;

    // Llamamos al comando del bot que usa WebApp.render
    const apiURL = `https://api.bots.business/v1/bots/${BJS_CONFIG.botId}/commands/get_user_data?user_id=${userId}`;
    
    try {
        const response = await fetch(apiURL, { headers: { "api_key": BJS_CONFIG.token } });
        const data = await response.json();

        if (data.status === "success" || data.balance !== undefined) {
            state.totalEarnedUSD = parseFloat(data.balance || 0);
            state.totalInvestedUSDT = parseFloat(data.invested || 0);
            state.referralCount = data.referrals || 0;
        } else if (urlBalance !== null) {
            state.totalEarnedUSD = parseFloat(urlBalance);
        }
    } catch (e) {
        console.error("Error sincronizando con BJS, usando URL params");
        if (urlBalance !== null) state.totalEarnedUSD = parseFloat(urlBalance);
    }
    
    updateDashboard();
    startMiningEngine();
}

// --- ACTUALIZAR PANTALLA ---
function updateDashboard() {
    const mainBalEl = document.getElementById('main-balance');
    if (mainBalEl) {
        mainBalEl.innerText = (state.totalEarnedUSD || 0).toFixed(2);
    }

    const invested = state.totalInvestedUSDT || 0;
    const currentGHS = invested * 1000;
    
    const elements = {
        'ref-count': state.referralCount || 0,
        'mining-speed': `${currentGHS.toLocaleString()} GH/s activos`
    };

    for (const [id, val] of Object.entries(elements)) {
        const el = document.getElementById(id);
        if (el) el.innerText = val;
    }
}
window.updateDashboard = updateDashboard;

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
    const nameEl = document.getElementById('user-full-name');
    const idEl = document.getElementById('user-id');
    const picEl = document.getElementById('user-pic');

    if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initDataUnsafe.user) {
        
        const tg = window.Telegram.WebApp;
        tg.expand(); 

        const user = tg.initDataUnsafe.user;
        const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim();

        nameEl.innerText = fullName || 'Usuario Telegram';
        idEl.innerText = `ID: ${user.id}`;

        if (user.photo_url) {
            picEl.src = user.photo_url;
        } else {
            picEl.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=0088cc&color=fff&bold=true`;
        }

    } else {
        nameEl.innerText = 'Modo Navegador';
        idEl.innerText = 'ID: Prueba Web';
        picEl.src = 'https://ui-avatars.com/api/?name=Web+Test&background=f59e0b&color=fff';
    }
}
window.initUser = initUser;

window.onload = () => {
    initUser();
};

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

syncInitialData();
