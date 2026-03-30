(function() {
    // --- 1. CAPTURA DE DATOS ---
    const params = new URLSearchParams(window.location.search);
    let state = {
        userId: params.get('user_id') || "000000",
        balance: parseFloat(params.get('balance')) || 0.00,
        invested: parseFloat(params.get('invested')) || 0.00,
        miningAcc: 0.0000
    };

    // --- 2. FUNCIÓN TOAST PROFESIONAL ---
    window.showToast = function(message, type = "success") {
        const oldToast = document.querySelector('.toast-notification');
        if (oldToast) oldToast.remove();

        const toast = document.createElement('div');
        toast.className = 'toast-notification';
        toast.innerText = message;
        
        // Estilo profesional según el tipo (éxito o error)
        const bgColor = type === "success" ? "#10b981" : "#ef4444";
        
        toast.style.cssText = `
            position: fixed;
            bottom: 100px;
            left: 50%;
            transform: translateX(-50%);
            background: ${bgColor};
            color: white;
            padding: 12px 24px;
            border-radius: 50px;
            font-weight: 600;
            font-size: 14px;
            z-index: 10000;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3);
            animation: slideUp 0.4s ease-out, fadeOut 0.5s ease-in 2.5s forwards;
            white-space: nowrap;
        `;

        document.body.appendChild(toast);
        setTimeout(() => { if (toast) toast.remove(); }, 3000);
    };

    // --- 3. INICIALIZAR UI ---
    function initUI() {
        const elBalance = document.getElementById('main-balance');
        const elID = document.getElementById('user-id-display'); // Asegúrate que el ID coincida en tu HTML
        
        if (elBalance) elBalance.innerText = state.balance.toFixed(2);
        if (elID) elID.innerText = "ID: " + state.userId;
        
        // Mensaje de bienvenida silencioso al cargar
        console.log("Sistema cargado para ID: " + state.userId);
    }

    // --- 4. MOTOR DE MINERÍA ---
    function startMining() {
        setInterval(() => {
            if (state.invested > 0) {
                const gain = (state.invested * 1000) * 0.0000001;
                state.miningAcc += gain;
                const elMining = document.getElementById('mining-balance');
                if (elMining) elMining.innerText = state.miningAcc.toFixed(4);
            }
        }, 1000);
    }

    // --- 5. REINVERSIÓN CON NOTIFICACIÓN PROFESIONAL ---
    window.reinvestBalance = function() {
        if (state.balance <= 0) {
            window.showToast("❌ No tienes saldo suficiente", "error");
            return;
        }

        const currentAmount = state.balance;
        const bonus = currentAmount * 0.05;
        const totalToInvest = currentAmount + bonus;

        // Actualización local
        state.invested += totalToInvest;
        state.balance = 0;

        initUI();
        window.showToast(`✅ Reinvertido $${currentAmount.toFixed(2)} + 5% Bonus`);
        
        saveDataToBot(state.userId, state.balance, state.invested);
    };

    async function saveDataToBot(uid, bal, inv) {
        const botId = "8101312620";
        const key = "1$MillonDannyMeli*@#€";
        const token = "X6MBnt6bQxIc66AoNZ3xLXHGmKXs7Zq5kx75GWK8";
        const url = `https://api.bots.business/v1/bots/${botId}/commands/api_save?user_id=${uid}&balance=${bal}&invested=${inv}&key=${key}`;
        
        try {
            await fetch(url, { headers: { "api_key": token } });
        } catch (e) {
            window.showToast("⚠️ Error de sincronización", "error");
        }
    }

    window.addEventListener('DOMContentLoaded', () => {
        initUI();
        startMining();
    });
})();
