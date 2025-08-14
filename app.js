// =========================
// CONFIG
// =========================
const API_URL = "https://script.google.com/macros/s/AKfycbyNz1sW1M3Kg1-7MqQpOr-JG9szG3XtDPceKcI-KXp4yKWkg8gxRjDimVkUqsl3st3m1g/exec"; // <-- Your Google Apps Script Web App URL

let transactions = [];
let currentUser = null;

// =========================
// INITIAL LOAD
// =========================
window.addEventListener("DOMContentLoaded", async () => {
    await fetchUser();
    if (!currentUser) {
        alert("You must be logged in with a Google account to use this app.");
        return;
    }
    await loadTransactions();
});

// =========================
// FETCH CURRENT USER
// =========================
async function fetchUser() {
    try {
        const response = await fetch(`${API_URL}?action=getUser`);
        const data = await response.json();
        if (data.success) {
            currentUser = data.userEmail;
        } else {
            console.error("User fetch error:", data.error);
        }
    } catch (err) {
        console.error("Error fetching user:", err);
    }
}

// =========================
// FETCH TRANSACTIONS
// =========================
async function loadTransactions() {
    try {
        const response = await fetch(`${API_URL}?action=getTransactions`);
        const data = await response.json();
        if (data.success) {
            // Filter transactions by current user
            transactions = data.transactions.filter(tx => tx.user === currentUser);
            renderTransactions();
            renderChart();
            updateSummary();
        } else {
            console.error("Error loading transactions:", data.error);
        }
    } catch (err) {
        console.error("Error fetching transactions:", err);
    }
}

// =========================
// RENDER TRANSACTIONS
// =========================
function renderTransactions() {
    const list = document.getElementById("transactions-list");
    list.innerHTML = "";
    transactions.forEach(tx => {
        const li = document.createElement("li");
        li.textContent = `${tx.date} | ${tx.category} | ${tx.amount} | ${tx.paymentMethod} | ${tx.notes}`;
        list.appendChild(li);
    });
}

// =========================
// RENDER CHART
// =========================
function renderChart() {
    const ctx = document.getElementById("category-chart").getContext("2d");

    const categories = {};
    transactions.forEach(tx => {
        if (tx.type === "expense") {
            categories[tx.category] = (categories[tx.category] || 0) + parseFloat(tx.amount);
        }
    });

    const chartData = {
        labels: Object.keys(categories),
        datasets: [{
            label: "Expenses by Category",
            data: Object.values(categories),
            backgroundColor: "rgba(75, 192, 192, 0.6)"
        }]
    };

    new Chart(ctx, {
        type: "bar",
        data: chartData,
        options: { responsive: true }
    });
}

// =========================
// UPDATE SUMMARY
// =========================
function updateSummary() {
    const totalIn = transactions
        .filter(tx => tx.type === "income")
        .reduce((sum, tx) => sum + parseFloat(tx.amount), 0);

    const totalOut = transactions
        .filter(tx => tx.type === "expense")
        .reduce((sum, tx) => sum + parseFloat(tx.amount), 0);

    document.getElementById("total-in").textContent = totalIn.toFixed(2);
    document.getElementById("total-out").textContent = totalOut.toFixed(2);
    document.getElementById("balance").textContent = (totalIn - totalOut).toFixed(2);
}

// =========================
// ADD TRANSACTION
// =========================
async function addTransaction(transaction) {
    try {
        // Attach current user email
        transaction.user = currentUser;

        const response = await fetch(`${API_URL}?action=addTransaction`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(transaction)
        });

        const data = await response.json();
        if (data.success) {
            transactions.push(transaction);
            renderTransactions();
            renderChart();
            updateSummary();
        } else {
            alert("Error: " + data.error);
        }
    } catch (err) {
        console.error("Error adding transaction:", err);
    }
}
