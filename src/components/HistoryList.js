import { state } from '../state/appState.js';

export function renderHistory() {
    const container = document.getElementById('history-list');
    if (!container) return;

    // 6.5% base simulada sobre la inversión actual
    const dailyReturn = state.totalInvestedUSDT > 0 
        ? (state.totalInvestedUSDT * (6.5 / 100)).toFixed(4) 
        : "0.0000";

    const logs = [
        { date: '2026-03-24 10:30', amount: dailyReturn },
        { date: '2026-03-23 10:30', amount: dailyReturn },
        { date: '2026-03-22 10:30', amount: dailyReturn }
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
