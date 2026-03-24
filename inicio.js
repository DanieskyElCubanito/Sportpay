// Datos del perfil desde Telegram
const user = tg.initDataUnsafe.user;
if(user) {
    document.getElementById('profile-name').innerText = user.first_name + " 🇨🇺";
    document.getElementById('u-id').innerText = user.id;
    if(user.photo_url) document.getElementById('user-photo').src = user.photo_url;
}

// Inyección de saldos (puedes recibir estos de la URL)
const params = new URLSearchParams(window.location.search);
document.querySelectorAll('.bal-val').forEach(el => el.innerText = (params.get('bal') || "0.00") + " USDT");
