// app.js

let currentRange = "today";
let categoryChart;

document.addEventListener("DOMContentLoaded", () => {
    const loginBtn = document.getElementById("loginBtn");
    loginBtn.addEventListener("click", handleLogin);

    document.querySelectorAll("#filters button").forEach(btn => {
        btn.addEventListener("click", () => {
            currentRange = btn.dataset.range;
            fetchTransactions();
        });
    });

    fetchTransactions();
    initChart();
});

function handleLogin() {
    // Open GAS URL in new tab to authorize cookies
    window.open(`${APP_CONFIG.BASE_URL}?action=getBooks`, "_blank");
}

function initChart() {
    const ctx = document.getElementById('categoryChart').getContext('2d');
    categoryChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [{
                label: 'Expenses by Category',
                data: [],
                backgroundColor: 'rgba(75, 192, 192, 0.5)'
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: false } }
        }
    });
}

async function fetchTransactions() {
    try {
        const url = `${APP_CONFIG.BASE_URL}?action=getTransactions&range=${currentRange}`;
        const res = await fetch(url, { credentials: "include" });
        const data = await res.json();

        if (!data.success) {
            alert("Error fetching transactions: " + data.error);
            return;
        }

        updateSummary(data.transactions);
        updateTransactionList(data.transactions);
        updateChart(data.transactions);
    } catch (err) {
        console.error(err);
        alert("Error connecting to backend");
    }
}

function updateSummary(transactions) {
    let totalIn = 0, totalOut = 0;
    transactions.forEach(t => {
        if (t.amount >= 0) totalIn += t.amount;
        else totalOut += Math.abs(t.amount);
    });

    document.getElementById("totalIn").textContent = totalIn.toFixed(2);
    document.getElementById("totalOut").textContent = totalOut.toFixed(2);
    document.getElementById("balance").textContent = (totalIn - totalOut).toFixed(2);
}

function updateTransactionList(transactions) {
    const tbody = document.getElementById("transactionList");
    tbody.innerHTML = "";
    transactions.forEach(t => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${t.date}</td>
            <td>${t.category}</td>
            <td>${t.amount.toFixed(2)}</td>
            <td>${t.paymentMethod}</td>
            <td>${t.notes}</td>
        `;
        tbody.appendChild(row);
    });
}

function updateChart(transactions) {
    const categories = {};
    transactions.forEach(t => {
        if (!categories[t.category]) categories[t.category] = 0;
        if (t.amount < 0) categories[t.category] += Math.abs(t.amount);
    });

    categoryChart.data.labels = Object.keys(categories);
    categoryChart.data.datasets[0].data = Object.values(categories);
    categoryChart.update();
}
