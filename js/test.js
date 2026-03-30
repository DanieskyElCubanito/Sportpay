(function() {
    const params = new URLSearchParams(window.location.search);
    let state = {
        userId: params.get('user_id') || "000000",
        balance: parseFloat(params.get('balance')) || 0.00,
        invested: parseFloat(params.get('invested')) || 0.00,
        miningAcc: 0.0000
    };

    // --- 1. TOAST PROFESIONAL ---
    window.showToast = function(message, type = "success") {
        const old = document.querySelector('.toast-notification');
        if (old) old.remove();
        const toast = document.createElement('div');
        toast.className = 'toast-notification';
        toast.innerText = message;
        toast.style.cssText = `position:fixed; bottom:100px; left:50%; transform:translateX(-50%); background:${type==="success"?"#10b981":"#ef4444"}; color:white; padding:12px 24px; border-radius:50px; z-index:10000; box-shadow:0 10px 15px rgba(0,0,0,0.2); animation: slideUp 0.4s ease-out;`;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    };

// --- MODAL PROFESIONAL DE REINVERSIÓN ---
window.openReinvestModal = function() {
    if (state.balance <= 0) {
        window.showToast("❌ No tienes saldo para reinvertir", "error");
        return;
    }

    // Calculamos los datos para mostrarlos en el modal
    const amount = state.balance;
    const bonus = amount * 0.05;

    // Si ya hay un modal abierto, lo cerramos por seguridad
    const oldModal = document.getElementById('custom-reinvest-modal');
    if (oldModal) oldModal.remove();

    // Creamos el diseño del modal profesional (Dark Theme)
    const modalHtml = `
        <div id="custom-reinvest-modal" style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.85); display:flex; align-items:center; justify-content:center; z-index:99999; backdrop-filter:blur(4px);">
            <div style="background:#151e2b; width:85%; max-width:340px; border-radius:24px; padding:25px; text-align:center; border:1px solid #334155; animation: slideUp 0.3s ease-out; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);">
                
                <div style="background:#1e293b; width:60px; height:60px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:28px; margin:0 auto 15px auto;">
                    🔄
                </div>
                
                <h2 style="color:white; margin:0 0 15px 0; font-size:22px; font-weight:700;">Reinversión</h2>
                
                <div style="background:#0f172a; border-radius:16px; padding:15px; margin-bottom:20px; text-align:left;">
                    <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
                        <span style="color:#94a3b8; font-size:14px;">Monto a reinvertir:</span>
                        <b style="color:white;">$${amount.toFixed(2)}</b>
                    </div>
                    <div style="display:flex; justify-content:space-between;">
                        <span style="color:#94a3b8; font-size:14px;">Bono extra (+5%):</span>
                        <b style="color:#10b981;">+$${bonus.toFixed(2)}</b>
                    </div>
                </div>

                <div style="display:flex; gap:12px;">
                    <button onclick="document.getElementById('custom-reinvest-modal').remove()" style="flex:1; padding:14px; border-radius:14px; border:none; background:#334155; color:white; font-weight:600; font-size:15px; cursor:pointer;">Cancelar</button>
                    <button onclick="executeReinvestDirectly()" style="flex:1; padding:14px; border-radius:14px; border:none; background:linear-gradient(135deg, #10b981, #059669); color:white; font-weight:700; font-size:15px; cursor:pointer;">Confirmar</button>
                </div>
            </div>
        </div>
    `;
    
    // Inyectamos el modal en la pantalla
    document.body.insertAdjacentHTML('beforeend', modalHtml);
};

// --- EJECUCIÓN DIRECTA (SIN PANTALLA DE CÓDIGO QR) ---
window.executeReinvestDirectly = function() {
    // 1. Cerramos el modal
    document.getElementById('custom-reinvest-modal').remove();

    // 2. Cálculos matemáticos
    const amount = state.balance;
    const bonus = amount * 0.05;
    const totalToInvest = amount + bonus;

    // 3. Actualizamos la aplicación al instante
    state.invested += totalToInvest;
    state.balance = 0;
    
    // Actualizamos los números en pantalla (Asegúrate de que esta función exista en tu código)
    const elBalance = document.getElementById('main-balance');
    if (elBalance) elBalance.innerText = state.balance.toFixed(2);
    
    // 4. Mostramos el mensaje de éxito bonito
    window.showToast(`✅ Reinversión completada: +$${totalToInvest.toFixed(2)} activos`);

    // 5. Guardamos en el Bot (Llamada en segundo plano)
    saveDataToBotReinvest(state.userId, state.balance, state.invested, amount);
};

// Función para enviar los datos a BJS sin interrumpir al usuario
async function saveDataToBotReinvest(uid, bal, inv, amountReinvested) {
    const botId = "8101312620";
    const key = "1$MillonDannyMeli*@#€";
    const token = "X6MBnt6bQxIc66AoNZ3xLXHGmKXs7Zq5kx75GWK8";
    
    // Pasamos el token directamente en la URL para mayor compatibilidad
    const url = `https://api.bots.business/v1/bots/${botId}/commands/api_save?user_id=${uid}&balance=${bal}&invested=${inv}&action=reinvest&amount=${amountReinvested}&key=${key}&api_key=${token}`;
    
    try {
        const response = await fetch(url);
        const text = await response.text(); // Primero leemos como texto puro
        
        try {
            const data = JSON.parse(text); // Intentamos convertir a JSON
            if (data.status === "success") {
                console.log("✅ Guardado correctamente");
            } else {
                window.showToast("⚠️ " + (data.error || "Error en el Bot"), "error");
            }
        } catch (jsonError) {
            // Si no es JSON, el bot mandó un error de sistema (HTML)
            console.error("Respuesta no válida del servidor:", text);
            window.showToast("⚠️ Error técnico del servidor", "error");
        }
        
    } catch (e) {
        window.showToast("📡 Error de red (Sin conexión)", "error");
    }
}
    function startMining() {
        setInterval(() => {
            if (state.invested > 0) {
                state.miningAcc += (state.invested * 1000) * 0.0000001;
                const el = document.getElementById('mining-balance');
                if (el) el.innerText = state.miningAcc.toFixed(4);
            }
        }, 1000); // <-- ¡Aquí estaba el número partido!
    }

    window.addEventListener('DOMContentLoaded', () => {
        updateUI();
        startMining();
    });
})();
