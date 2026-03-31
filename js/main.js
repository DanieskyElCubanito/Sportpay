// --- 1. CONFIGURACIÓN GLOBAL ---
const BJS_CONFIG = {
    botId: "8101312620",
    secretKey: "1$MillonDannyMeli*@#€", 
    token: "X6MBnt6bQxIc66AoNZ3xLXHGmKXs7Zq5kx75GWK8" 
};

// Estado único de la aplicación
window.state = {
    userId: null,
    totalEarnedUSD: 0,
    totalInvestedUSDT: 0,
    referralCount: 0,
    accumulatedMining: 0
};

// Capturar ID de usuario (Prioridad: URL > Telegram WebApp)
const urlParams = new URLSearchParams(window.location.search);
state.userId = urlParams.get('user_id') || window.Telegram?.WebApp?.initDataUnsafe?.user?.id || "000000";

// --- 2. SINCRONIZACIÓN Y PANEL ---

// --- DENTRO DE TU main.js ---

async function syncInitialData() {
    if (!state.userId) return;

    // Intentamos cargar lo que diga la URL primero (por si el bot tarda)
    const urlBalance = parseFloat(urlParams.get('balance')) || 0;
    const urlInvested = parseFloat(urlParams.get('invested')) || 0;
    
    state.totalEarnedUSD = urlBalance;
    state.totalInvestedUSDT = urlInvested;
    updateDashboard(); // Mostramos lo de la URL de inmediato

    const apiURL = `https://api.bots.business/v1/bots/${BJS_CONFIG.botId}/commands/get_user_data?user_id=${state.userId}`;
    
    try {
        const response = await fetch(apiURL, { 
            headers: { "api_key": BJS_CONFIG.token } 
        });
        const data = await response.json();

        // Si el bot tiene datos más actualizados, los usamos
        if (data.status === "success" || data.balance !== undefined) {
            state.totalEarnedUSD = parseFloat(data.balance);
            state.totalInvestedUSDT = parseFloat(data.invested || 0);
            state.referralCount = data.referrals || 0;
            updateDashboard();
        }
    } catch (e) {
        console.log("Usando saldo de respaldo de la URL");
    }
}

// --- FUNCIÓN PARA AÑADIR SALDO (Asegúrate de tenerla) ---
window.addBalance = function() {
    // Aquí puedes poner el link a tu bot o la pasarela de pago
    // Por ejemplo, abrir el bot para depositar:
    window.Telegram.WebApp.openTelegramLink(`https://t.me/TuBotNombre?start=deposit`);
};

function updateDashboard() {
    const mainBalEl = document.getElementById('main-balance');
    const speedEl = document.getElementById('mining-speed');
    const refEl = document.getElementById('ref-count');
    const idEl = document.getElementById('user-id');

    if (mainBalEl) mainBalEl.innerText = state.totalEarnedUSD.toFixed(2);
    if (refEl) refEl.innerText = state.referralCount;
    if (idEl) idEl.innerText = `ID: ${state.userId}`;
    
    if (speedEl) {
        const currentGHS = (state.totalInvestedUSDT || 0) * 1000;
        speedEl.innerText = `${currentGHS.toLocaleString()} GH/s activos`;
    }
}

// --- 3. ACCIONES DE RECLAMAR Y REINVERTIR ---

// Función para RECLAMAR saldo minado
window.claimMining = async function() {
    if (state.accumulatedMining <= 0) {
        window.showToast("❌ Nada para reclamar", "error");
        return;
    }
    
    const amount = state.accumulatedMining;
    const apiURL = `https://api.bots.business/v1/bots/${BJS_CONFIG.botId}/commands/api_save?user_id=${state.userId}&amount=${amount}&key=${BJS_CONFIG.secretKey}`;

    try {
        const response = await fetch(apiURL, { headers: { "api_key": BJS_CONFIG.token } });
        const result = await response.json();
        
        if (result.status === "success") {
            state.totalEarnedUSD = parseFloat(result.balance);
            state.accumulatedMining = 0;
            updateDashboard();
            window.showToast("✅ Saldo reclamado");
        }
    } catch (e) { window.showToast("⚠️ Error de conexión", "error"); }
};

// Función para ABRIR EL MODAL (Faltaba en el anterior)
window.openReinvestModal = function() {
    if (state.totalEarnedUSD < 1) {
        window.showToast("❌ Mínimo 1.00 USDT", "error");
        return;
    }

    const amount = state.totalEarnedUSD;
    const bonus = amount * 0.05;

    const oldModal = document.getElementById('custom-reinvest-modal');
    if (oldModal) oldModal.remove();

    const modalHtml = `
        <div id="custom-reinvest-modal" style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.85); display:flex; align-items:center; justify-content:center; z-index:99999; backdrop-filter:blur(5px);">
            <div style="background:#151e2b; width:85%; max-width:340px; border-radius:24px; padding:25px; text-align:center; border:1px solid #334155; color:white;">
                <h2 style="margin:0 0 15px 0;">Confirmar</h2>
                <div style="background:#0f172a; border-radius:16px; padding:15px; margin-bottom:20px; text-align:left;">
                    <p style="margin:5px 0; color:#94a3b8;">Monto: <b>$${amount.toFixed(2)}</b></p>
                    <p style="margin:5px 0; color:#94a3b8;">Bono (+5%): <b style="color:#10b981;">+$${bonus.toFixed(2)}</b></p>
                </div>
                <div style="display:flex; gap:12px;">
                    <button onclick="document.getElementById('custom-reinvest-modal').remove()" style="flex:1; padding:12px; border-radius:12px; background:#334155; color:white; border:none;">Cerrar</button>
                    <button onclick="executeReinvestDirectly()" style="flex:1; padding:12px; border-radius:12px; background:#0088cc; color:white; border:none; font-weight:bold;">Reinvertir</button>
                </div>
            </div>
        </div>`;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
};

// Función para EJECUTAR la reinversión
// Comando: api_reinvest
try {
    // 1. Captura de datos profesional (usando options como indica la doc)
    let uid = options.user_id; 
    let amount = parseFloat(options.amount);

    if (!uid) {
        WebApp.render({ content: { status: "error", message: "ID de usuario faltante" } });
        return;
    }

    // 2. Cargar propiedades (User.getProperty sigue siendo válido)
    let bal = User.getProperty("balance", uid) || 0;
    let inv = User.getProperty("total_invested", uid) || 0;

    // 3. Validación de Negocio
    if (isNaN(amount) || amount < 1) {
        WebApp.render({ content: { status: "error", message: "Monto inválido" } });
    } else if (bal < amount) {
        WebApp.render({ content: { status: "error", message: "Saldo insuficiente" } });
    } else {
        // 4. Lógica de Reinversión
        let bonus = amount * 0.05;
        let nBal = bal - amount;
        let nInv = inv + amount + bonus;

        User.setProperty("balance", nBal, "float", uid);
        User.setProperty("total_invested", nInv, "float", uid);

        // 5. RESPUESTA JSON PURA (Mechanical Necessity para evitar errores)
        WebApp.render({
            content: { 
                status: "success", 
                balance: nBal, 
                invested: nInv 
            }
        });
    }
} catch (err) {
    // En caso de error crítico, ver la pestaña "Error" como sugiere la captura
    WebApp.render({ content: { status: "error", message: "Error interno del bot" } });
}
// --- 4. MOTOR DE MINERÍA Y PERFIL ---

function startMiningEngine() {
    setInterval(() => {
        if (state.totalInvestedUSDT > 0) {
            state.accumulatedMining += (state.totalInvestedUSDT * 1000 * 0.0000001);
            const display = document.getElementById('mining-balance');
            if (display) display.innerText = state.accumulatedMining.toFixed(6);
        }
    }, 1000);
}

function initUserProfile() {
    if (window.Telegram?.WebApp?.initDataUnsafe?.user) {
        const user = window.Telegram.WebApp.initDataUnsafe.user;
        const nameEl = document.getElementById('user-full-name');
        const picEl = document.getElementById('user-pic');
        
        if (nameEl) nameEl.innerText = `${user.first_name || ''} ${user.last_name || ''}`.trim();
        if (picEl && user.photo_url) picEl.src = user.photo_url;
    }
}

// --- 5. UTILIDADES ---

window.showToast = function(message, type = "success") {
    const old = document.querySelector('.toast-notif');
    if (old) old.remove();
    const toast = document.createElement('div');
    toast.className = 'toast-notif';
    toast.innerText = message;
    toast.style.cssText = `position:fixed; bottom:100px; left:50%; transform:translateX(-50%); background:${type==="success"?"#10b981":"#ef4444"}; color:white; padding:12px 24px; border-radius:50px; z-index:10000; font-weight:bold; box-shadow: 0 4px 15px rgba(0,0,0,0.3);`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
};

// --- 6. LANZAMIENTO ---

window.onload = () => {
    if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.ready();
        window.Telegram.WebApp.expand();
    }
    initUserProfile();
    syncInitialData();
    startMiningEngine();
};
