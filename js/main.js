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
    
    if (!userId) return;

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

(function() {
    const params = new URLSearchParams(window.location.search);

    const getUserId = () => {
        if (window.Telegram?.WebApp?.initDataUnsafe?.user?.id) {
            return window.Telegram.WebApp.initDataUnsafe.user.id;
        }
        return params.get('user_id') || "000000";
    };

    let localState = {
        userId: getUserId(),
        balance: parseFloat(params.get('balance')) || 0.00,
        invested: parseFloat(params.get('invested')) || 0.00,
        miningAcc: 0.0000
    };

    window.updateUI = function() {
        const elBalance = document.getElementById('main-balance');
        const elUser = document.getElementById('user-id');
        const elSpeed = document.getElementById('mining-speed');

        if (elBalance) elBalance.innerText = (state.totalEarnedUSD || 0).toFixed(2);
        if (elSpeed) {
            const currentGHS = (state.totalInvestedUSDT || 0) * 1000;
            elSpeed.innerText = `${currentGHS.toLocaleString()} GH/s activos`;
        }
        if (elUser) elUser.innerText = `ID: ${localState.userId}`;
    };

    window.showToast = function(message, type = "success") {
        const old = document.querySelector('.toast-notification');
        if (old) old.remove();
        const toast = document.createElement('div');
        toast.className = 'toast-notification';
        toast.innerText = message;
        toast.style.cssText = `position:fixed; bottom:100px; left:50%; transform:translateX(-50%); background:${type==="success"?"#10b981":"#ef4444"}; color:white; padding:12px 24px; border-radius:50px; z-index:10000; box-shadow:0 10px 15px rgba(0,0,0,0.2); font-weight:600;`;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    };

    window.openReinvestModal = function() {
        const currentBalance = parseFloat(document.getElementById('main-balance')?.innerText || 0);
        
        if (currentBalance < 1) {
            window.showToast("❌ Mínimo 1.00 USDT para reinvertir", "error");
            return;
        }

        const amount = currentBalance;
        const bonus = amount * 0.05;

        const oldModal = document.getElementById('custom-reinvest-modal');
        if (oldModal) oldModal.remove();

        const modalHtml = `
            <div id="custom-reinvest-modal" style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.85); display:flex; align-items:center; justify-content:center; z-index:99999; backdrop-filter:blur(4px);">
                <div style="background:#151e2b; width:85%; max-width:340px; border-radius:24px; padding:25px; text-align:center; border:1px solid #334155;">
                    <div style="background:#1e293b; width:60px; height:60px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:28px; margin:0 auto 15px auto;">🔄</div>
                    <h2 style="color:white; margin:0 0 15px 0; font-size:22px; font-weight:700;">Confirmar Reinversión</h2>
                    <div style="background:#0f172a; border-radius:16px; padding:15px; margin-bottom:20px; text-align:left;">
                        <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
                            <span style="color:#94a3b8; font-size:14px;">Monto:</span>
                            <b style="color:white;">$${amount.toFixed(2)}</b>
                        </div>
                        <div style="display:flex; justify-content:space-between;">
                            <span style="color:#94a3b8; font-size:14px;">Bono (+5%):</span>
                            <b style="color:#10b981;">+$${bonus.toFixed(2)}</b>
                        </div>
                    </div>
                    <div style="display:flex; gap:12px;">
                        <button onclick="document.getElementById('custom-reinvest-modal').remove()" style="flex:1; padding:14px; border-radius:14px; border:none; background:#334155; color:white; font-weight:600;">Cerrar</button>
                        <button onclick="executeReinvestDirectly()" style="flex:1; padding:14px; border-radius:14px; border:none; background:linear-gradient(135deg, #0088cc, #00c6ff); color:white; font-weight:700;">Reinvertir</button>
                    </div>
                </div>
            </div>`;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    };

    // --- ACTUALIZACIÓN DE EXECUTE REINVEST (MODO GET PARA EVITAR ERROR DE CONEXIÓN) ---
    window.executeReinvestDirectly = async function() {
        const modal = document.getElementById('custom-reinvest-modal');
        const amount = parseFloat(document.getElementById('main-balance')?.innerText || 0);
        if (modal) modal.remove();

        // Usamos GET con los parámetros en la URL para máxima compatibilidad
        const apiURL = `https://api.bots.business/v1/bots/${BJS_CONFIG.botId}/commands/api_reinvest?user_id=${localState.userId}&amount=${amount}`;

        try {
            const response = await fetch(apiURL, {
                method: 'GET',
                headers: { "api_key": BJS_CONFIG.token }
            });

            const result = await response.json();

            if (result.status === "success") {
                // Sincronizamos con los datos reales que devolvió el Bot
                state.totalEarnedUSD = result.balance;
                state.totalInvestedUSDT = result.invested;
                
                window.updateUI();
                window.showToast(`✅ ¡Reinversión guardada en el Bot!`);
                if (typeof syncInitialData === 'function') syncInitialData();
            } else {
                window.showToast("❌ " + (result.message || "Error al procesar"), "error");
            }
        } catch (e) {
            window.showToast("⚠️ Error de conexión con el Bot", "error");
            console.error("Error:", e);
        }
    };

    function startMining() {
        setInterval(() => {
            const currentInvested = state.totalInvestedUSDT || 0;
            if (currentInvested > 0) {
                localState.miningAcc += (currentInvested * 1000 * 0.0000001);
                const el = document.getElementById('mining-balance');
                if (el) el.innerText = localState.miningAcc.toFixed(4);
            }
        }, 1000);
    }

    window.addEventListener('load', () => {
        window.updateUI();
        startMining();
    });
})();
