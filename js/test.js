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

    // --- 2. MODAL DE CONFIRMACIÓN PROFESIONAL ---
    window.openReinvestModal = function() {
        if (state.balance <= 0) {
            window.showToast("❌ No tienes saldo para reinvertir", "error");
            return;
        }

        const modal = document.createElement('div');
        modal.id = "custom-modal";
        modal.style.cssText = "position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.8); display:flex; align-items:center; justify-content:center; z-index:11000; backdrop-filter:blur(5px);";
        
        modal.innerHTML = `
            <div style="background:#1e293b; width:85%; border-radius:24px; padding:25px; text-align:center; border:1px solid #334155; animation: zoomIn 0.3s ease-out;">
                <div style="font-size:40px; margin-bottom:15px;">🔄</div>
                <h2 style="color:white; margin-bottom:10px; font-size:20px;">Confirmar Reinversión</h2>
                <p style="color:#94a3b8; font-size:14px; margin-bottom:20px;">¿Deseas reinvertir su saldo de <b>$${state.balance.toFixed(2)}</b>?<br><span style="color:#10b981;">+ 5% de bono extra</span></p>
                <div style="display:flex; gap:10px;">
                    <button onclick="document.getElementById('custom-modal').remove()" style="flex:1; padding:12px; border-radius:12px; border:none; background:#334155; color:white; font-weight:600;">Cancelar</button>
                    <button id="btn-confirm-reinvest" style="flex:1; padding:12px; border-radius:12px; border:none; background:linear-gradient(135deg, #3b82f6, #1d4ed8); color:white; font-weight:700;">Reinvertir</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        document.getElementById('btn-confirm-reinvest').onclick = function() {
            modal.remove();
            executeReinvest();
        };
    };

    // --- 3. LÓGICA DE EJECUCIÓN Y GUARDADO ---
    async function executeReinvest() {
        const amount = state.balance;
        const bonus = amount * 0.05;
        const totalPlusBonus = amount + bonus;

        // Actualización Local
        state.invested += totalPlusBonus;
        state.balance = 0;
        updateUI();

        window.showToast(`✅ Reinversión de $${amount.toFixed(2)} exitosa`);

        // GUARDADO REAL EN EL BOT (Persistencia)
        const botId = "8101312620";
        const key = "1$MillonDannyMeli*@#€";
        const token = "X6MBnt6bQxIc66AoNZ3xLXHGmKXs7Zq5kx75GWK8";
        
        // Enviamos los nuevos valores al bot para que NO se borren al cerrar
        const url = `https://api.bots.business/v1/bots/${botId}/commands/api_save?user_id=${state.userId}&balance=0&invested=${state.invested}&key=${key}&action=reinvest&amount=${amount}`;

        try {
            const resp = await fetch(url, { headers: { "api_key": token } });
            const res = await resp.json();
            if(res.status === "success") console.log("Guardado en BJS");
        } catch (e) {
            console.error("Error al guardar en el bot");
        }
    }

    function updateUI() {
        const b = document.getElementById('main-balance');
        if (b) b.innerText = state.balance.toFixed(2);
        // Aquí podrías actualizar también el texto de GH/s si tienes el ID
    }

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
        updateUI();
        startMining();
    });
})();
