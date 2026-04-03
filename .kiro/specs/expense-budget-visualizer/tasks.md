# Implementation Plan: Expense & Budget Visualizer

## Overview

Implement a client-side expense tracker using plain HTML, CSS, and Vanilla JavaScript. Chart.js is loaded via CDN. All state lives in an in-memory array mirrored to `localStorage`. Every mutation triggers a single `render()` pass that updates the DOM, balance, and chart atomically.

## Tasks

- [x] 1. Project scaffolding
  - Create `index.html` with the full HTML skeleton: `<header>`, `<main>`, form section, chart section, and list section
  - Create `css/styles.css` as an empty file
  - Create `js/app.js` as an empty file
  - Wire `index.html` to load Chart.js CDN, then `css/styles.css`, then `js/app.js`
  - _Requirements: 6.1, 6.2, 6.3_

- [x] 2. HTML layout
  - [x] 2.1 Implement the full HTML structure inside `index.html`
    - Add `<header>` with `<h1>` and `<div id="balance-display">`
    - Add `<section id="form-section">` with `#transaction-form`, three fields (`#item-name`, `#item-amount`, `#item-category`), inline error `<span>` elements, and submit button
    - Add `<section id="chart-section">` with `<canvas id="spending-chart">` and `<p id="chart-empty-state" hidden>`
    - Add `<section id="list-section">` with `<h2>` and `<ul id="transaction-list">`
    - _Requirements: 1.1, 2.1, 3.1, 4.1, 4.5_

- [x] 3. CSS styling
  - [x] 3.1 Implement layout and base styles in `css/styles.css`
    - Style container layout and header with balnce display
    - Style transaction form with inputs, select, and button
    - Style transaction List with delete buttons
    - Style chart section with canvas container
    - CSS Grid on `<main>` with `grid-template-areas: "form chart" / "list list"` and `1fr 1fr` columns
    - Assign `grid-area` to `#form-section`, `#chart-section`, `#list-section`
    - Add `max-height: 300px; overflow-y: auto` on `#transaction-list`
    - Add `.error` class: `color: #c0392b; font-size: 0.8rem; display: block; min-height: 1em`
    - Add `@media (max-width: 600px)` breakpoint collapsing to single-column stacked layout
    - Include responsive design for mobile devices
    - _Requirements: 2.2, 6.2_

- [x] 4. Storage layer
  - [x] 4.1 Implement `loadFromStorage` and `saveToStorage` in `js/app.js`
    - Define `STORAGE_KEY = 'expense_transactions'` and `let transactions = []`
    - `loadFromStorage`: reads from `localStorage`, parses JSON, checks `Array.isArray`; returns `[]`
    - `saveToStorage(transactions)`: wraps `localStorage.setItem` in try/catch;
    - _Requirements: 5.1, 5.2, 5.3_

  - [ ]* 4.2 Write property test for storage round-trip
    - **Property 7: Storage round-trip preserves transaction data**
    - **Validates: Requirements 5.1, 5.2, 5.4, 2.4**

  - [ ]* 4.3 Write unit tests for storage edge cases
    - Missing key → `loadFromStorage` returns `[]`
    - Corrupt JSON → `loadFromStorage` returns `[]`
    - Valid JSON but not an array → `loadFromStorage` returns `[]`
    - _Requirements: 5.3_

- [x] 5. Validation
  - [x] 5.1 Implement `validate(name, amount, category)` in `js/app.js`
    - Returns `{ valid: boolean, errors: { name?, amount?, category? } }`
    - `name`: non-empty after trim
    - `amount`: finite number > 0
    - `category`: one of `"Food"`, `"Transport"`, `"Fun"`
    - _Requirements: 1.3, 1.4_

  - [ ]* 5.2 Write property test for invalid input rejection
    - **Property 1: Invalid inputs are rejected and state is unchanged**
    - **Validates: Requirements 1.3, 1.4**

  - [ ]* 5.3 Write unit tests for validation edge cases
    - Amount `0` is rejected; amount `-5` is rejected; whitespace-only name is rejected; no category is rejected
    - _Requirements: 1.3, 1.4_

- [x] 6. State mutations
  - [x] 6.1 Implement `addTransaction(name, amount, category)` in `js/app.js`
    - Generate `id` via `crypto.randomUUID()` or `Date.now().toString()`
    - Push new transaction object to `transactions[]`, call `saveToStorage`, call `render()`
    - _Requirements: 1.2, 5.1_

  - [x] 6.2 Implement `deleteTransaction(id)` in `js/app.js`
    - Filter `transactions[]` by id, call `saveToStorage`, call `render()`
    - _Requirements: 2.3, 5.1_

  - [ ]* 6.3 Write property test for valid transaction addition
    - **Property 2: Valid transaction addition is reflected in list and storage**
    - **Validates: Requirements 1.2, 2.1**

  - [ ]* 6.4 Write property test for delete removes from all locations
    - **Property 5: Deleting a transaction removes it from the list and storage**
    - **Validates: Requirements 2.3**

- [x] 7. Rendering
  - [x] 7.1 Implement `updateBalance()` in `js/app.js`
    - Sum `transactions[].amount` and update `#balance-display` text to `Total Spent: $X.XX`
    - _Requirements: 3.1, 3.2, 3.3_

  - [x] 7.2 Implement `renderList()` in `js/app.js`
    - Clear `#transaction-list`, then append one `<li data-id="{id}">` per transaction with name, category, amount spans and a `.btn-delete` button
    - _Requirements: 2.1, 2.3_

  - [x] 7.3 Implement `render()` in `js/app.js`
    - Call `updateBalance()`, `renderList()`, `updateChart()` in sequence
    - _Requirements: 3.2, 3.3, 4.2, 4.3_

  - [ ]* 7.4 Write property test for balance equals sum
    - **Property 4: Balance always equals the sum of all transaction amounts**
    - **Validates: Requirements 3.1, 3.2, 3.3**

- [x] 8. Chart.js integration
  - [x] 8.1 Implement `updateChart()` in `js/app.js`
    - Declare `let chartInstance = null` at module scope
    - If `transactions` is empty: hide `<canvas>`, show `#chart-empty-state`, destroy `chartInstance` if it exists, set to `null`
    - Otherwise: show `<canvas>`, hide `#chart-empty-state`; aggregate amounts by category (`Food`, `Transport`, `Fun`)
    - If `chartInstance` exists: mutate `chartInstance.data.datasets[0].data` in place and call `chartInstance.update()`
    - Else: create `new Chart(ctx, config)` with `type: 'pie'`, labels, `backgroundColor: ['#FF6384','#36A2EB','#FFCE56']`, `responsive: true`, legend at bottom
    - Guard with `typeof Chart !== 'undefined'`; show fallback message if CDN failed
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 6.1_

  - [ ]* 8.2 Write property test for chart data matches category sums
    - **Property 6: Chart data always reflects current category totals**
    - **Validates: Requirements 4.1, 4.2, 4.3, 4.5**

- [x] 9. Event handling and initialization
  - [x] 9.1 Implement form submit handler in `js/app.js`
    - `e.preventDefault()`, read field values, call `validate()`, display or clear inline errors
    - If valid: call `addTransaction()`, reset all form fields
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

  - [x] 9.2 Implement delete event delegation on `#transaction-list`
    - Listen for `click` on `#transaction-list`; if `e.target.matches('.btn-delete')`, read `id` from `e.target.closest('li').dataset.id` and call `deleteTransaction(id)`
    - _Requirements: 2.3_

  - [x] 9.3 Implement `DOMContentLoaded` init
    - Load `transactions = loadFromStorage()` then call `render()`
    - _Requirements: 2.4, 5.2_

  - [ ]* 9.4 Write property test for form cleared after successful add
    - **Property 3: Form fields are cleared after successful submission**
    - **Validates: Requirements 1.5**

  - [ ]* 9.5 Write integration unit tests
    - Add then delete the same transaction → array empty, balance `$0.00`, empty state visible
    - Add a "Lunch / $12.50 / Food" transaction → list renders it with correct name, amount, category
    - _Requirements: 1.2, 2.1, 2.3, 3.1, 4.5_

- [x] 10. Final checkpoint
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for traceability
- Property tests use [fast-check](https://github.com/dubzzz/fast-check) with a minimum of 100 iterations each
- Test file lives at `js/app.test.js` (Jest or Vitest compatible)
- Chart is updated in-place on mutations; only destroyed when transitioning to empty state
