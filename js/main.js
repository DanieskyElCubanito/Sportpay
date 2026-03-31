// --- 1. CONFIGURACIÓN GLOBAL ---
const API_URLS = {
    user: '/api/user',
    reinvest: '/api/reinvest'
};

// Estado único de la aplicación
window.state = {
    userId: null,
    totalEarnedUSD: 0,
    totalInvestedUSDT: 0,
    referralCount: 0,
    accumulatedMining: 0
};

// --- 2. CAPTURA DE ID MEJORADA (Evita los ceros) ---
function getTelegramUser() {
    // Intentamos obtener el ID de 3 fuentes diferentes para asegurar la carga
    const tgData = window.Telegram?.WebApp?.initDataUnsafe;
    const urlParams = new URLSearchParams(window.location.search);
    
    const id = tgData?.user?.id || urlParams.get('user_id');
    return id ? String(id) : null;
}

// --- 3. SINCRONIZACIÓN Y PANEL ---

async function syncInitialData() {
    state.userId = getTelegramUser();
    
    // Si después de intentar obtenerlo sigue siendo null, no intentamos el fetch
    if (!state.userId) {
        console.error("Error: No se pudo obtener el ID de Telegram.");
        const idEl = document.getElementById('user-id');
        if (idEl) idEl.innerText = "ID: No detectado (Abre desde TG)";
        return;
    }

    const startParam = window.Telegram?.WebApp?.initDataUnsafe?.start_param || '';

    try {
        // Llamada a tu propia API en Vercel
        const response = await fetch(`${API_URLS.user}?user_id=${state.userId}&invited_by=${startParam}`);
        const data = await response.json();

        // Adaptamos la lectura tanto si viene objeto directo o con status success
        if (data && (data.user_id || data.status === "success")) {
            state.totalEarnedUSD = parseFloat(data.balance || 0);
            state.totalInvestedUSDT = parseFloat(data.invested || 0);
            state.referralCount = data.referrals || 0;
            updateDashboard();
        }
    } catch (e) {
        console.error("Error sincronizando con la API de Vercel:", e);
        const urlParams = new URLSearchParams(window.location.search);
        state.totalEarnedUSD = parseFloat(urlParams.get('balance')) || 0;
        updateDashboard();
    }
}

function updateDashboard() {
    const mainBalEl = document.getElementById('main-balance');
    const speedEl = document.getElementById('mining-speed');
    const refEl = document.getElementById('ref-count');
    const idEl = document.getElementById('user-id');

    if (mainBalEl) mainBalEl.innerText = state.totalEarnedUSD.toFixed(2);
    if (refEl) refEl.innerText = state.referralCount;
    if (idEl) idEl.innerText = `ID: ${state.userId}`;
    
    if (speedEl) {
        // 1 USDT invertido = 1000 GH/s
        const currentGHS = (state.totalInvestedUSDT || 0) * 1000;
        speedEl.innerText = `${currentGHS.toLocaleString()} GH/s activos`;
    }
}

// --- 4. ACCIONES DE REINVERTIR Y RECLAMAR ---

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

window.executeReinvestDirectly = async function() {
    const modal = document.getElementById('custom-reinvest-modal');
    if (modal) modal.remove();

    try {
        const response = await fetch(API_URLS.reinvest, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_id: state.userId, // <--- Esto debe ser el ID real de Telegram
                amount: state.totalEarnedUSD
            })
        });

        const result = await response.json();

        if (result.status === "success") {
            // Actualizamos el estado local con lo que nos devuelve la base de datos
            state.totalEarnedUSD = parseFloat(result.balance);
            state.totalInvestedUSDT = parseFloat(result.invested);
            updateDashboard();
            window.showToast("✅ Reinversión guardada en la nube");
        } else {
            window.showToast(`❌ ${result.message}`, "error");
        }
    } catch (e) {
        window.showToast("⚠️ Error: No se pudo guardar la reinversión", "error");
    }
};
window.claimMining = function() {
    if (state.accumulatedMining <= 0) {
        window.showToast("❌ Nada para reclamar", "error");
        return;
    }
    state.totalEarnedUSD += state.accumulatedMining;
    state.accumulatedMining = 0;
    updateDashboard();
    window.showToast("✅ Saldo reclamado");
};

// --- 5. MOTOR DE MINERÍA Y PERFIL ---

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
    const user = window.Telegram?.WebApp?.initDataUnsafe?.user;
    if (user) {
        const nameEl = document.getElementById('user-full-name');
        const picEl = document.getElementById('user-pic');
        if (nameEl) nameEl.innerText = `${user.first_name || ''} ${user.last_name || ''}`.trim();
        if (picEl && user.photo_url) picEl.src = user.photo_url;
    }
}

// --- 6. UTILIDADES ---

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

// --- 7. LANZAMIENTO (Asegura la carga de Telegram) ---

window.onload = () => {
    if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.ready();
        window.Telegram.WebApp.expand();
    }
    
    // Pequeño retraso para que Telegram inyecte los datos del usuario
    setTimeout(() => {
        initUserProfile();
        syncInitialData();
        startMiningEngine();
    }, 150);
};
