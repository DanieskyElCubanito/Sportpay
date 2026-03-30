(function() {
    const params = new URLSearchParams(window.location.search);
    let state = {
        userId: params.get('user_id') || "000000",
        balance: parseFloat(params.get('balance')) || 0.00,
        invested: parseFloat(params.get('invested')) || 0.00,
        miningAcc: 0.0000
    };

    // --- 1. ACTUALIZAR INTERFAZ (LO QUE SE HABÍA BORRADO) ---
    window.updateUI = function() {
        const elBalance = document.getElementById('main-balance');
        const elInvested = document.getElementById('main-invested');
        const elUser = document.getElementById('user-id-display');

        if (elBalance) elBalance.innerText = state.balance.toFixed(2);
        if (elInvested) elInvested.innerText = state.invested.toFixed(2);
        if (elUser) elUser.innerText = state.userId;
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

    // --- 3. MODAL PROFESIONAL DE REINVERSIÓN ---
    window.openReinvestModal = function() {
        if (state.balance <= 0) {
            window.showToast("❌ No tienes saldo para reinvertir", "error");
            return;
        }

        const amount = state.balance;
        const bonus = amount * 0.05;

        const oldModal = document.getElementById('custom-reinvest-modal');
        if (oldModal) oldModal.remove();

        const modalHtml = `
            <div id="custom-reinvest-modal" style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.85); display:flex; align-items:center; justify-content:center; z-index:99999; backdrop-filter:blur(4px);">
                <div style="background:#151e2b; width:85%; max-width:340px; border-radius:24px; padding:25px; text-align:center; border:1px solid #334155; animation: slideUp 0.3s ease-out; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);">
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
                        <button onclick="document.getElementById('custom-reinvest-modal').remove()" style="flex:1; padding:14px; border-radius:14px; border:none; background:#334155; color:white; font-weight:600; cursor:pointer;">Cancelar</button>
                        <button onclick="executeReinvestDirectly()" style="flex:1; padding:14px; border-radius:14px; border:none; background:linear-gradient(135deg, #10b981, #059669); color:white; font-weight:700; cursor:pointer;">Confirmar</button>
                    </div>
                </div>
            </div>`;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    };

    // --- 4. EJECUCIÓN ---
    window.executeReinvestDirectly = function() {
        const modal = document.getElementById('custom-reinvest-modal');
        if (modal) modal.remove();

        const amount = state.balance;
        const bonus = amount * 0.05;
        const totalToInvest = amount + bonus;

        state.invested += totalToInvest;
        state.balance = 0;
        
        window.updateUI();
        window.showToast(`✅ Reinversión completada: +$${totalToInvest.toFixed(2)}`);
        saveDataToBotReinvest(state.userId, state.balance, state.invested, amount);
    };

    // --- 5. COMUNICACIÓN CON BJS ---
    async function saveDataToBotReinvest(uid, bal, inv, amountReinvested) {
        const botId = "8101312620";
        const key = "1$MillonDannyMeli*@#€";
        const token = "X6MBnt6bQxIc66AoNZ3xLXHGmKXs7Zq5kx75GWK8";
        const url = `https://api.bots.business/v1/bots/${botId}/commands/api_save?user_id=${uid}&balance=${bal}&invested=${inv}&action=reinvest&amount=${amountReinvested}&key=${key}&api_key=${token}`;
        
        try {
            const response = await fetch(url);
            const text = await response.text();
            try {
                const data = JSON.parse(text);
                if (data.status === "success") console.log("✅ Sincronizado");
                else window.showToast("⚠️ " + (data.error || "Error en el Bot"), "error");
            } catch (e) {
                window.showToast("⚠️ Error técnico del servidor", "error");
            }
        } catch (e) {
            window.showToast("📡 Error de red", "error");
        }
    }

    // --- 6. MINERÍA Y CARGA ---
    function startMining() {
        setInterval(() => {
            if (state.invested > 0) {
                state.miningAcc += (state.invested * 1000) * 0.0000001;
                const el = document.getElementById('mining-balance');
                if (el) el.innerText = state.miningAcc.toFixed(4);
            }
        }, 1000);
    }

    window.addEventListener('DOMContentLoaded', () => {
        window.updateUI();
        startMining();
    });
})();
