// Este código NO usa imports, es directo para evitar errores de ruta
(function() {
    console.log("🛠️ Iniciando Sistema de Emergencia...");
    
    const params = new URLSearchParams(window.location.search);
    const balance = params.get('balance') || "0.00";
    const user_id = params.get('user_id') || "Desconocido";

    alert("DEPURACIÓN:\nID: " + user_id + "\nSaldo: " + balance);

    // Intentamos pintar el saldo en el HTML
    window.addEventListener('DOMContentLoaded', () => {
        const el = document.getElementById('main-balance');
        if (el) {
            el.innerText = parseFloat(balance).toFixed(2);
            console.log("✅ Saldo pintado en pantalla");
        } else {
            console.error("❌ No encontré el ID 'main-balance'");
        }
    });
})();
