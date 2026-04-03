# Design Document: Expense & Budget Visualizer

## Overview

A single-page, client-side expense tracker built with plain HTML, CSS, and Vanilla JavaScript. No build step, no framework, no backend. Chart.js is loaded via CDN. All state lives in an in-memory array that is mirrored to `localStorage` on every mutation. Every user action (add/delete) triggers a single `render()` pass that updates the DOM, balance, and chart atomically.

---

## Architecture

The app follows a simple unidirectional data flow:

```
User Action
    │
    ▼
State Mutation (addTransaction / deleteTransaction)
    │
    ▼
Persist to localStorage
    │
    ▼
render() ──► updateBalance()
         ──► renderList()
         ──► updateChart()
```

There is no virtual DOM or reactive framework. State is a plain JS array held in memory. The render functions are pure in the sense that they always derive their output from the current state array — they never read from the DOM to compute values.

---

## File Structure

```
index.html          ← single HTML entry point, loads CSS + JS + Chart.js CDN
css/
  styles.css        ← all visual styling
js/
  app.js            ← all application logic
```

---

## Components and Interfaces

### HTML Layout Structure

```
<body>
  <header>
    <h1>Expense & Budget Visualizer</h1>
    <div id="balance-display">Total Spent: $0.00</div>
  </header>

  <main>
    <!-- Left column -->
    <section id="form-section">
      <form id="transaction-form">
        <input  id="item-name"   type="text"   placeholder="Item name" />
        <span   id="error-name"  class="error"></span>
        <input  id="item-amount" type="number" placeholder="Amount" min="0.01" step="0.01" />
        <span   id="error-amount" class="error"></span>
        <select id="item-category">
          <option value="">Select category</option>
          <option value="Food">Food</option>
          <option value="Transport">Transport</option>
          <option value="Fun">Fun</option>
        </select>
        <span   id="error-category" class="error"></span>
        <button type="submit">Add Transaction</button>
      </form>
    </section>

    <!-- Right column -->
    <section id="chart-section">
      <div id="chart-container">
        <canvas id="spending-chart"></canvas>
        <p id="chart-empty-state" hidden>No transactions yet. Add one to see your spending chart.</p>
      </div>
    </section>

    <!-- Full-width bottom -->
    <section id="list-section">
      <h2>Transactions</h2>
      <ul id="transaction-list"></ul>
    </section>
  </main>
</body>
```

Each transaction list item is rendered as:
```html
<li data-id="{id}">
  <span class="tx-name">{name}</span>
  <span class="tx-category">{category}</span>
  <span class="tx-amount">${amount}</span>
  <button class="btn-delete" aria-label="Delete {name}">Delete</button>
</li>
```

### JavaScript Module Design (`js/app.js`)

The file is structured as an IIFE (or top-level module pattern) with clearly separated concerns:

#### Data Model

```js
// A transaction object
{
  id: string,        // crypto.randomUUID() or Date.now().toString()
  name: string,      // item name, trimmed, non-empty
  amount: number,    // positive float, stored as number
  category: string   // "Food" | "Transport" | "Fun"
}

// In-memory state
let transactions = [];  // array of transaction objects
```

#### Storage Layer

```js
const STORAGE_KEY = 'expense_transactions';

function loadFromStorage() {
  // Returns parsed array or [] on any error (missing key, JSON parse failure)
}

function saveToStorage(transactions) {
  // JSON.stringify and localStorage.setItem
}
```

#### Validation

```js
function validate(name, amount, category) {
  // Returns { valid: boolean, errors: { name?, amount?, category? } }
  // name: must be non-empty after trim
  // amount: must be a finite number > 0
  // category: must be one of the allowed values
}
```

#### State Mutations

```js
function addTransaction(name, amount, category) {
  // Creates transaction object, pushes to transactions[], saves, renders
}

function deleteTransaction(id) {
  // Filters transactions[] by id, saves, renders
}
```

#### Rendering

```js
function render() {
  updateBalance();
  renderList();
  updateChart();
}

function updateBalance() {
  // Sums transactions[].amount, updates #balance-display text
}

function renderList() {
  // Clears #transaction-list, appends one <li> per transaction
}
```

#### Chart Integration

```js
let chartInstance = null;  // holds the Chart.js instance

function updateChart() {
  // If no transactions: hide canvas, show #chart-empty-state, destroy chartInstance
  // Otherwise: show canvas, hide empty state
  //   - Aggregate amounts by category
  //   - If chartInstance exists: update .data and call .update()
  //   - Else: create new Chart(ctx, config)
}
```

#### Event Handling

```js
// Form submit
document.getElementById('transaction-form').addEventListener('submit', (e) => {
  e.preventDefault();
  // Read fields, validate, show/clear errors, call addTransaction if valid
});

// Delete buttons (event delegation on #transaction-list)
document.getElementById('transaction-list').addEventListener('click', (e) => {
  if (e.target.matches('.btn-delete')) {
    const id = e.target.closest('li').dataset.id;
    deleteTransaction(id);
  }
});

// Init on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
  transactions = loadFromStorage();
  render();
});
```

---

## Data Models

### Transaction

| Field      | Type   | Constraints                          |
|------------|--------|--------------------------------------|
| `id`       | string | unique, generated at creation time   |
| `name`     | string | non-empty after trim                 |
| `amount`   | number | finite, > 0                          |
| `category` | string | one of `"Food"`, `"Transport"`, `"Fun"` |

### Storage Format

Transactions are stored as a JSON array under the key `expense_transactions`:

```json
[
  { "id": "1700000000000", "name": "Lunch", "amount": 12.50, "category": "Food" }
]
```

---

## Chart.js Integration

Chart.js is loaded via CDN in `index.html`:

```html
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
<script src="js/app.js"></script>
```

Chart configuration:

```js
{
  type: 'pie',
  data: {
    labels: ['Food', 'Transport', 'Fun'],
    datasets: [{
      data: [foodTotal, transportTotal, funTotal],
      backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56']
    }]
  },
  options: {
    responsive: true,
    plugins: {
      legend: { position: 'bottom' }
    }
  }
}
```

On update, `chartInstance.data.datasets[0].data` is mutated in place and `chartInstance.update()` is called — avoiding a full chart teardown/recreate on every change. The chart is only destroyed when transitioning to the empty state (zero transactions).

---

## CSS Approach

### Layout

Two-column layout using CSS Grid for the form + chart side by side, with the transaction list spanning full width below:

```css
main {
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-areas:
    "form  chart"
    "list  list";
  gap: 1.5rem;
}

#form-section  { grid-area: form; }
#chart-section { grid-area: chart; }
#list-section  { grid-area: list; }
```

### Responsiveness

Single breakpoint at `600px` collapses to a single-column stacked layout:

```css
@media (max-width: 600px) {
  main {
    grid-template-columns: 1fr;
    grid-template-areas:
      "form"
      "chart"
      "list";
  }
}
```

### Transaction List Scrolling

```css
#transaction-list {
  max-height: 300px;
  overflow-y: auto;
}
```

### Inline Validation Errors

```css
.error {
  color: #c0392b;
  font-size: 0.8rem;
  display: block;
  min-height: 1em; /* prevents layout shift */
}
```

---

## Data Flow

### Add Transaction

```
form submit
  → validate(name, amount, category)
  → if invalid: show inline errors, stop
  → if valid:   clear errors
                push { id, name, amount, category } to transactions[]
                saveToStorage(transactions)
                render()
                  → updateBalance()   [reads transactions[]]
                  → renderList()      [reads transactions[]]
                  → updateChart()     [reads transactions[]]
                clear form fields
```

### Delete Transaction

```
click .btn-delete
  → read id from closest <li data-id>
  → transactions = transactions.filter(t => t.id !== id)
  → saveToStorage(transactions)
  → render()
      → updateBalance()
      → renderList()
      → updateChart()
```

### Page Load

```
DOMContentLoaded
  → transactions = loadFromStorage()   [returns [] on any error]
  → render()
```

---


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Invalid inputs are rejected and state is unchanged

*For any* form submission where at least one field is empty, or where the amount is non-positive (≤ 0), the transaction array should remain unchanged and the validation error elements should be non-empty.

**Validates: Requirements 1.3, 1.4**

---

### Property 2: Valid transaction addition is reflected in list and storage

*For any* valid (non-empty name, positive amount, valid category) transaction, after calling `addTransaction`, the transaction should appear in the in-memory array, the rendered list DOM, and in `localStorage` under the storage key.

**Validates: Requirements 1.2, 2.1**

---

### Property 3: Form fields are cleared after successful submission

*For any* valid transaction submission, after the add completes, all three form fields (name, amount, category) should be reset to their empty/default values.

**Validates: Requirements 1.5**

---

### Property 4: Balance always equals the sum of all transaction amounts

*For any* sequence of add and delete operations, the value displayed in `#balance-display` should always equal the arithmetic sum of the `amount` fields of all transactions currently in the array.

**Validates: Requirements 3.1, 3.2, 3.3**

---

### Property 5: Deleting a transaction removes it from the list and storage

*For any* transaction that exists in the array, after calling `deleteTransaction(id)`, that transaction's id should not appear in the in-memory array, the rendered list DOM, or in the deserialized `localStorage` value.

**Validates: Requirements 2.3**

---

### Property 6: Chart data always reflects current category totals

*For any* state of the transaction array, the data values passed to the Chart.js instance should equal the sum of `amount` for each category (`Food`, `Transport`, `Fun`) computed from the current array. When the array is empty, the chart canvas should be hidden and the empty-state element should be visible.

**Validates: Requirements 4.1, 4.2, 4.3, 4.5**

---

### Property 7: Storage round-trip preserves transaction data

*For any* array of valid transaction objects, serializing it with `JSON.stringify` and then deserializing with `JSON.parse` should produce an array that is deeply equal to the original (same ids, names, amounts, categories, same order).

**Validates: Requirements 5.1, 5.2, 5.4, 2.4**

---

## Error Handling

| Scenario | Behavior |
|---|---|
| `localStorage` unavailable (e.g., private browsing quota exceeded) | `saveToStorage` wraps `setItem` in try/catch; silently fails — in-memory state remains correct |
| `localStorage` contains invalid JSON | `loadFromStorage` catches `JSON.parse` error and returns `[]` |
| `localStorage` contains valid JSON but not an array | `loadFromStorage` checks `Array.isArray`; returns `[]` if false |
| Form submitted with empty name | Inline error shown under name field; submission blocked |
| Form submitted with amount ≤ 0 or non-numeric | Inline error shown under amount field; submission blocked |
| Form submitted with no category selected | Inline error shown under category field; submission blocked |
| Chart.js CDN fails to load | `updateChart` guards with `typeof Chart !== 'undefined'`; chart section shows a fallback message |
| Delete clicked on already-removed item | `filter` is idempotent; no error; render is called with unchanged array |

---

## Testing Strategy

### Dual Testing Approach

Both unit tests and property-based tests are required. They are complementary:

- **Unit tests** cover specific examples, integration points, and edge cases
- **Property tests** verify universal invariants across randomly generated inputs

### Property-Based Testing

**Library**: [fast-check](https://github.com/dubzzz/fast-check) (JavaScript, no build step required via CDN or npm)

Each property test must run a minimum of **100 iterations**.

Each test must include a comment tag in the format:
`// Feature: expense-budget-visualizer, Property {N}: {property_text}`

| Property | Test Description | fast-check Arbitraries |
|---|---|---|
| P1: Invalid inputs rejected | Generate strings with empty name / amounts ≤ 0; assert array length unchanged | `fc.string()`, `fc.float({ max: 0 })` |
| P2: Valid addition reflected everywhere | Generate valid (name, amount, category) triples; assert array, DOM, storage all contain the new item | `fc.string({ minLength: 1 })`, `fc.float({ min: 0.01 })`, `fc.constantFrom('Food','Transport','Fun')` |
| P3: Form cleared after add | Generate valid transactions; assert all field values are empty/default after add | same as P2 |
| P4: Balance equals sum | Generate sequences of adds/deletes; assert displayed balance equals `transactions.reduce((s,t) => s + t.amount, 0)` | `fc.array(validTransactionArb)` |
| P5: Delete removes from all locations | Generate a list with at least one item; pick a random id; delete it; assert it's gone from array, DOM, storage | `fc.array(validTransactionArb, { minLength: 1 })` |
| P6: Chart data matches category sums | Generate transaction arrays; assert chart dataset values equal per-category sums | `fc.array(validTransactionArb)` |
| P7: Storage round-trip | Generate valid transaction arrays; assert `JSON.parse(JSON.stringify(arr))` deep-equals original | `fc.array(validTransactionArb)` |

### Unit Tests

Unit tests should cover:

- **Specific examples**: adding a single "Lunch / $12.50 / Food" transaction and verifying the list renders it correctly
- **Edge cases**:
  - Empty storage key → `loadFromStorage` returns `[]`
  - Corrupt JSON in storage → `loadFromStorage` returns `[]`
  - Amount of `0` is rejected
  - Amount of `-5` is rejected
  - Whitespace-only name is rejected
  - No category selected is rejected
  - Empty transaction list → chart empty state is visible, canvas is hidden
- **Integration**: add then delete the same transaction → array is empty, balance is `$0.00`, empty state is shown

### Test File Location

```
js/
  app.js
  app.test.js    ← unit + property tests (Jest or Vitest compatible)
```
