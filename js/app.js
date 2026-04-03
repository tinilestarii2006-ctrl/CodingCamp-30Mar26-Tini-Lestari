// =============================================================================
// Expense & Budget Visualizer — app.js
// =============================================================================

// ---------------------------------------------------------------------------
// Constants & State
// ---------------------------------------------------------------------------

const STORAGE_KEY = 'expense_transactions';
const VALID_CATEGORIES = ['Food', 'Transport', 'Fun'];
const LIMIT_KEY = 'expense_limit';

/** @type {Array<{id: string, name: string, amount: number, category: string}>} */
let transactions = [];

/** @type {number} 0 means no limit set */
let spendingLimit = 0;

/** @type {import('chart.js').Chart|null} */
let chartInstance = null;

// ---------------------------------------------------------------------------
// Task 4: Storage Layer
// ---------------------------------------------------------------------------

/**
 * Reads and parses the transaction array from localStorage.
 * Returns [] on any error: missing key, invalid JSON, or non-array value.
 *
 * @returns {Array}
 */
function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Serialises the given data array and writes it to localStorage.
 * Silently fails (e.g. private-browsing quota exceeded).
 *
 * @param {Array} data
 */
function saveToStorage(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Silently ignore storage errors
  }
}

// ---------------------------------------------------------------------------
// Task 5: Validation
// ---------------------------------------------------------------------------

/**
 * Validates the three form fields before a transaction is created.
 *
 * @param {string} name
 * @param {*}      amount   - raw value from the form input (may be string or number)
 * @param {string} category
 * @returns {{ valid: boolean, errors: { name?: string, amount?: string, category?: string } }}
 */
function validate(name, amount, category) {
  const errors = {};

  // name: must be non-empty after trim
  if (!name || name.trim() === '') {
    errors.name = 'Item name is required.';
  }

  // amount: must be a finite number greater than 0
  const numericAmount = Number(amount);
  if (!isFinite(numericAmount) || numericAmount <= 0) {
    errors.amount = 'Amount must be a positive number.';
  }

  // category: must be one of the allowed values
  if (!VALID_CATEGORIES.includes(category)) {
    errors.category = 'Please select a valid category.';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

// ---------------------------------------------------------------------------
// Task 6: State Mutations
// ---------------------------------------------------------------------------

/**
 * Creates a new transaction, persists it, and re-renders the UI.
 *
 * @param {string} name
 * @param {number} amount
 * @param {string} category
 */
function addTransaction(name, amount, category) {
  const id = (typeof crypto !== 'undefined' && crypto.randomUUID)
    ? crypto.randomUUID()
    : Date.now().toString() + Math.random().toString(36).slice(2);
  transactions.push({ id, name: name.trim(), amount: Number(amount), category, date: new Date().toISOString() });
  saveToStorage(transactions);
  render();
}

/**
 * Removes the transaction with the given id, persists the change, and re-renders.
 *
 * @param {string} id
 */
function deleteTransaction(id) {
  transactions = transactions.filter(t => t.id !== id);
  saveToStorage(transactions);
  render();
}

// ---------------------------------------------------------------------------
// Task 7: Rendering
// ---------------------------------------------------------------------------

/**
 * Sums all transaction amounts and updates the #balance-display element.
 */
function updateBalance() {
  const total = transactions.reduce((sum, t) => sum + t.amount, 0);
  document.getElementById('balance-display').textContent = 'Total Spent: $' + total.toFixed(2);
}

/**
 * Clears and re-renders the #transaction-list from the current transactions array.
 */
function renderList() {
  const list = document.getElementById('transaction-list');
  list.innerHTML = '';
  getSortedTransactions().forEach(function(t) {
    const li = document.createElement('li');
    li.dataset.id = t.id;
    li.innerHTML =
      '<span class="tx-name">' + t.name + '</span>' +
      '<span class="tx-category">' + t.category + '</span>' +
      '<span class="tx-amount">$' + t.amount.toFixed(2) + '</span>' +
      '<button class="btn-delete" aria-label="Delete ' + t.name + '">Delete</button>';
    list.appendChild(li);
  });
}

/**
 * Orchestrates a full UI refresh: balance -> list -> chart.
 */
function render() {
  updateBalance();
  renderList();
  updateChart();
  applyLimitHighlight();
}

// ---------------------------------------------------------------------------
// Task 8: Chart.js Integration
// ---------------------------------------------------------------------------

/**
 * Syncs the Chart.js pie chart with the current transactions array.
 * Shows an empty-state message when there are no transactions.
 */
function updateChart() {
  const canvas = document.getElementById('spending-chart');
  const emptyState = document.getElementById('chart-empty-state');

  if (transactions.length === 0) {
    canvas.style.display = 'none';
    emptyState.style.display = '';
    if (chartInstance) {
      chartInstance.destroy();
      chartInstance = null;
    }
    return;
  }

  canvas.style.display = '';
  emptyState.style.display = 'none';

  const totals = { Food: 0, Transport: 0, Fun: 0 };
  transactions.forEach(function(t) {
    if (totals[t.category] !== undefined) {
      totals[t.category] += t.amount;
    }
  });

  if (typeof Chart === 'undefined') {
    emptyState.textContent = 'Chart unavailable: Chart.js failed to load.';
    emptyState.style.display = '';
    return;
  }

  const data = [totals.Food, totals.Transport, totals.Fun];

  if (chartInstance) {
    chartInstance.data.datasets[0].data = data;
    chartInstance.update();
  } else {
    const ctx = canvas.getContext('2d');
    chartInstance = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: ['Food', 'Transport', 'Fun'],
        datasets: [{
          data: data,
          backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56']
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'bottom' }
        }
      }
    });
  }
}

// ---------------------------------------------------------------------------
// Sort Feature
// ---------------------------------------------------------------------------

/** @type {string} */
let currentSort = 'none';

/**
 * Returns a sorted copy of transactions[] based on currentSort.
 * 'none' returns original order.
 *
 * @returns {Array}
 */
function getSortedTransactions() {
  const copy = transactions.slice();
  if (currentSort === 'amount-asc') {
    copy.sort((a, b) => a.amount - b.amount);
  } else if (currentSort === 'amount-desc') {
    copy.sort((a, b) => b.amount - a.amount);
  } else if (currentSort === 'category-az') {
    copy.sort((a, b) => a.category.localeCompare(b.category));
  }
  return copy;
}

// ---------------------------------------------------------------------------
// Spending Limit
// ---------------------------------------------------------------------------

/**
 * Reads the saved spending limit from localStorage.
 * @returns {number} parsed limit, or 0 on error / missing key
 */
function loadLimit() {
  try {
    const raw = localStorage.getItem(LIMIT_KEY);
    if (raw === null) return 0;
    const val = parseFloat(raw);
    return isFinite(val) && val > 0 ? val : 0;
  } catch {
    return 0;
  }
}

/**
 * Persists the spending limit to localStorage.
 * @param {number} value
 */
function saveLimit(value) {
  try {
    localStorage.setItem(LIMIT_KEY, String(value));
  } catch {
    // Silently ignore storage errors
  }
}

/**
 * Applies or removes the over-limit CSS classes on the balance display
 * and individual transaction list items.
 */
function applyLimitHighlight() {
  const total = transactions.reduce(function(sum, t) { return sum + t.amount; }, 0);
  const balanceEl = document.getElementById('balance-display');

  if (spendingLimit > 0 && total >= spendingLimit) {
    balanceEl.classList.add('over-limit');
  } else {
    balanceEl.classList.remove('over-limit');
  }

  // Highlight individual <li> items based on cumulative running total
  var running = 0;
  transactions.forEach(function(t) {
    running += t.amount;
    var li = document.querySelector('#transaction-list li[data-id="' + t.id + '"]');
    if (!li) return;
    if (spendingLimit > 0 && running >= spendingLimit) {
      li.classList.add('tx-over-limit');
    } else {
      li.classList.remove('tx-over-limit');
    }
  });
}

// ---------------------------------------------------------------------------
// Task 9: Event Handling & Initialisation
// ---------------------------------------------------------------------------

document.addEventListener('DOMContentLoaded', function() {
  // 9.1 Form submit handler
  var form = document.getElementById('transaction-form');
  form.addEventListener('submit', function(e) {
    e.preventDefault();
    var name = document.getElementById('item-name').value;
    var amount = document.getElementById('item-amount').value;
    var category = document.getElementById('item-category').value;

    var result = validate(name, amount, category);

    // Show/clear inline errors
    document.getElementById('error-name').textContent = result.errors.name || '';
    document.getElementById('error-amount').textContent = result.errors.amount || '';
    document.getElementById('error-category').textContent = result.errors.category || '';

    if (!result.valid) return;

    addTransaction(name, amount, category);

    // Clear form fields
    document.getElementById('item-name').value = '';
    document.getElementById('item-amount').value = '';
    document.getElementById('item-category').value = '';
  });

  // 9.2 Delete event delegation
  document.getElementById('transaction-list').addEventListener('click', function(e) {
    if (e.target.matches('.btn-delete')) {
      var id = e.target.closest('li').dataset.id;
      deleteTransaction(id);
    }
  });

  // Sort control
  document.getElementById('sort-select').addEventListener('change', function(e) {
    currentSort = e.target.value;
    renderList();
  });

  // 9.3 Init: load from storage and render
  transactions = loadFromStorage();
  spendingLimit = loadLimit();
  var limitInput = document.getElementById('spending-limit');
  limitInput.value = spendingLimit > 0 ? spendingLimit : '';

  document.getElementById('set-limit-btn').addEventListener('click', function() {
    var statusEl = document.getElementById('limit-status');
    var val = parseFloat(limitInput.value);
    if (!isFinite(val) || val <= 0) {
      statusEl.textContent = 'Please enter a valid limit greater than 0.';
      statusEl.classList.add('error');
      return;
    }
    spendingLimit = val;
    saveLimit(val);
    applyLimitHighlight();
    statusEl.classList.remove('error');
    statusEl.textContent = 'Limit set to $' + val.toFixed(2);
    setTimeout(function() { statusEl.textContent = ''; }, 2000);
  });

  render();
});
