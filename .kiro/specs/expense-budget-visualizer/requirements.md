# Requirements Document

## Introduction

The Expense & Budget Visualizer is a client-side web application that allows users to track personal expenses and visualize spending by category. Users can add transactions via a form, view and delete them in a list, see a running total balance, and explore a pie chart of spending distribution. All data is persisted in the browser's Local Storage. The app is built with plain HTML, CSS, and Vanilla JavaScript — no frameworks, no backend, no build step required.

## Glossary

- **App**: The Expense & Budget Visualizer web application
- **Transaction**: A single spending record with a name, amount, and category
- **Category**: A fixed label used to group transactions — one of: Food, Transport, or Fun
- **Storage**: The browser's Local Storage API used to persist all data client-side
- **Transaction_List**: The scrollable UI component that displays all saved transactions
- **Balance**: The sum of all transaction amounts currently stored in the App
- **Chart**: The pie chart visualizing spending distribution by category

---

## Requirements

### Requirement 1: Transaction Input Form

**User Story:** As a user, I want to add a transaction using a form, so that I can record my spending quickly.

#### Acceptance Criteria

1. THE App SHALL provide a form with three fields: Item Name (text), Amount (number), and Category (select with options: Food, Transport, Fun).
2. WHEN the user submits the form with all fields filled and a positive amount, THE App SHALL add the transaction to the Transaction_List and persist it to Storage.
3. IF the user submits the form with any field empty, THEN THE App SHALL display a validation error and prevent the transaction from being saved.
4. IF the user submits the form with a non-positive amount, THEN THE App SHALL display a validation error and prevent the transaction from being saved.
5. WHEN a transaction is successfully added, THE App SHALL clear all form fields.

---

### Requirement 2: Transaction List

**User Story:** As a user, I want to see all my transactions in a list, so that I can review my spending history.

#### Acceptance Criteria

1. THE Transaction_List SHALL display all saved transactions, showing the item name, amount, and category for each entry.
2. THE Transaction_List SHALL be scrollable when the number of transactions exceeds the visible area.
3. WHEN the user deletes a transaction, THE App SHALL remove it from Storage and from the Transaction_List.
4. WHEN the App is loaded, THE App SHALL restore all transactions from Storage and display them in the Transaction_List.

---

### Requirement 3: Total Balance

**User Story:** As a user, I want to see my total spending at a glance, so that I always know how much I've spent.

#### Acceptance Criteria

1. THE App SHALL display the total Balance at the top of the page.
2. WHEN a transaction is added, THE App SHALL update the Balance immediately without a page reload.
3. WHEN a transaction is deleted, THE App SHALL update the Balance immediately without a page reload.

---

### Requirement 4: Spending Chart

**User Story:** As a user, I want to see a pie chart of my spending by category, so that I can understand where my money is going.

#### Acceptance Criteria

1. THE App SHALL display a pie chart showing the proportion of total spending for each Category.
2. WHEN a transaction is added, THE App SHALL update the Chart immediately to reflect the new spending distribution.
3. WHEN a transaction is deleted, THE App SHALL update the Chart immediately to reflect the updated spending distribution.
4. WHERE a charting library is available (e.g., Chart.js), THE App SHALL use it to render the Chart.
5. WHEN there are no transactions, THE App SHALL display an empty-state message in place of the Chart.

---

### Requirement 5: Data Persistence

**User Story:** As a user, I want my transactions to be saved automatically, so that I don't lose my records when I close or refresh the browser.

#### Acceptance Criteria

1. THE App SHALL save all transactions to Storage immediately after each add or delete operation.
2. WHEN the App is loaded, THE App SHALL read all transactions from Storage and restore the previous state.
3. IF Storage is unavailable or returns a parse error, THEN THE App SHALL initialize with an empty Transaction_List.
4. FOR ALL valid transaction lists, serializing then deserializing the data from Storage SHALL produce an equivalent list (round-trip property).

---

### Requirement 6: Technology Constraints

**User Story:** As a developer, I want the app to use only specified technologies, so that it remains simple and dependency-free.

#### Acceptance Criteria

1. THE App SHALL be implemented using only HTML, CSS, and Vanilla JavaScript with no backend.
2. THE App SHALL use a single CSS file located at css/styles.css for all visual styling.
3. THE App SHALL use a single JavaScript file located at js/app.js for all application logic.
4. THE App SHALL use the browser's Local Storage API as the sole persistence mechanism.
