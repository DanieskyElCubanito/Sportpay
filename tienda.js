let currentRate = 0.05;
let currentMin = 1;

function selectTier(id, min, rate) {
    document.querySelectorAll('.tier-card').forEach(c => c.classList.remove('active'));
    document.getElementById('tier-' + id).classList.add('active');
    currentMin = min;
    currentRate = rate;
    
    let input = document.getElementById('invest-amount');
    if(parseFloat(input.value) < min) input.value = min;
    calculateReturns();
}

function calculateReturns() {
    let input = document.getElementById('invest-amount');
    let val = parseFloat(input.value) || 0;
    
    document.getElementById('ret-daily').innerText = "$" + (val * currentRate).toFixed(2);
    document.getElementById('power-amount').innerText = (val * 100) + " GH/s";
}
