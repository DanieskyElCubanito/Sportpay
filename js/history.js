import { state } from './state.js';

export function renderHistory() {
    const container = document.getElementById('history-list');
    if (!container) return;

    // Simulamos 5 registros de los últimos días
    const dailyReturn = (state.totalInvestedUSDT * 0.065).toFixed(4); // 6.5% promedio
    const logs = [
        { date: '2024-03-24 10:30', amount: dailyReturn },
        { date: '2024-03-23 10:30', amount: dailyReturn },
        { date: '2024-03-22 10:30', amount: dailyReturn },
        { date: '2024-03-21 10:30', amount: dailyReturn },
        { date: '2024-03-20 10:30', amount: dailyReturn }
    ];

    container.innerHTML = logs.map(log => `
        <div class="history-item">
            <div class="hist-left">
                <span class="hist-type">Income Settlement</span>
                <span class="hist-date">${log.date}</span>
            </div>
            <div class="hist-right">
                <div class="hist-amount">+ ${log.amount}</div>
                <div class="hist-status">Succeed</div>
            </div>
        </div>
    `).join('');
}
