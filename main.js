const tg = window.Telegram.WebApp;
tg.expand();

function switchView(viewId, element) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById('view-' + viewId).classList.add('active');
    
    document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
    if(element) element.classList.add('active');
    
    tg.HapticFeedback.impactOccurred('light');
}

function sendAction(cmd) {
    tg.sendData(cmd);
}
