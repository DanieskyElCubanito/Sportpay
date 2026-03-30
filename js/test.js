// js/test.js
(function() {
    const params = new URLSearchParams(window.location.search);
    let state = {
        userId: params.get('user_id') || "000000",
        balance: parseFloat(params.get('balance')) || 0.00,
        invested: parseFloat(params.get('invested')) || 0.00,
        miningAcc: 0.0000
    };

    // --- 1. ACTUALIZAR INTERFAZ ---
    window.updateUI = function() {
        const elBalance = document.getElementById('main-balance');
        const elInvested = document.getElementById('main-invested');
        const elUser = document.getElementById('user-id'); // Cambiado para coincidir con tu HTML

        if (elBalance) elBalance.innerText = state.balance.toFixed(2);
        if (elInvested) elInvested.innerText = state.invested.toFixed(2);
        if (elUser) elUser.innerText = `ID: ${state.userId}`;
    };

    // --- 2. TOAST PROFESIONAL ---
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

    // --- 3. MODAL DE REINVERSIÓN ---
    window.openReinvestModal = function() {
        // Obtenemos el balance real del elemento HTML por seguridad
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
                <div style="background:#151e2b; width:85%; max-width:340px; border-radius:24px; padding:25px; text-align:center; border:1px solid #334155; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);">
                    <div style="background:#1e293b; width:60px; height:60px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:28px; margin:0 auto 15px auto;">🔄</div>
                    <h2 style="color:white; margin:0 0 15px 0; font-size:22px; font-weight:700;">Reinversión</h2>
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
                        <button onclick="document.getElementById('custom-reinvest-modal').remove()" style="flex:1; padding:14px; border-radius:14px; border:none; background:#334155; color:white; font-weight:600; cursor:pointer;">Cerrar</button>
                        <button onclick="executeReinvestDirectly()" style="flex:1; padding:14px; border-radius:14px; border:none; background:linear-gradient(135deg, #0088cc, #00c6ff); color:white; font-weight:700; cursor:pointer;">Reinvertir</button>
                    </div>
                </div>
            </div>`;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    };

    // --- 4. EJECUCIÓN (CONECTADO A PAYMENT.JS) ---
    window.executeReinvestDirectly = async function() {
        const modal = document.getElementById('custom-reinvest-modal');
        const amount = parseFloat(document.getElementById('main-balance')?.innerText || 0);
        
        if (modal) modal.remove();

        try {
            // Usamos la función global de payment.js para notificar al bot
            await window.notificarAlBot("reinvest", amount);
            
            const bonus = amount * 0.05;
            const totalToInvest = amount + bonus;

            // Actualización visual inmediata
            state.invested += totalToInvest;
            state.balance = 0;
            
            window.updateUI();
            window.showToast(`✅ ¡Reinversión de $${totalToInvest.toFixed(2)} enviada!`);
            
            if(typeof switchTab === 'function') switchTab('dashboard');

        } catch (e) {
            window.showToast("⚠️ El bot no respondió, intenta de nuevo", "error");
        }
    };

    // --- 5. MINERÍA ---
    function startMining() {
        setInterval(() => {
            if (state.invested > 0) {
                // Ajuste de velocidad según inversión
                state.miningAcc += (state.invested * 0.0000001);
                const el = document.getElementById('mining-balance');
                if (el) el.innerText = state.miningAcc.toFixed(4);
            }
        }, 1000);
    }

    window.addEventListener('load', () => {
        window.updateUI();
        startMining();
    });
})();
