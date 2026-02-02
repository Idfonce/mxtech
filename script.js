// COMPLETELY EMPTY - Fresh start!
let goals = [];

// DOM Elements
const pages = document.querySelectorAll('.page');
const navBtns = document.querySelectorAll('.nav-btn');
const goalsContainer = document.getElementById('goals-container');
const emptyGoals = document.getElementById('empty-goals');
const transactionsList = document.getElementById('transactions-list');
const emptyTransactions = document.getElementById('empty-transactions');
const dashboardEmpty = document.getElementById('dashboard-empty');
const dashboardGoals = document.getElementById('dashboard-goals');
const recentGoals = document.getElementById('recent-goals');
const filterGoalSelect = document.getElementById('filter-goal');

// Dashboard stats elements
const totalGoalsEl = document.getElementById('total-goals');
const totalSavedEl = document.getElementById('total-saved');
const totalTargetEl = document.getElementById('total-target');
const avgProgressEl = document.getElementById('avg-progress');

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
    // Set up navigation
    setupNavigation();
    
    // Load initial data - Everything starts empty!
    updateDashboard();
    renderGoals();
    updateTransactionsList();
    populateGoalFilter();
    
    // Create goal button event listener
    document.getElementById('create-goal-btn').addEventListener('click', createNewGoal);
});

// Set up navigation between pages
function setupNavigation() {
    navBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const pageId = this.getAttribute('data-page');
            navigateToPage(pageId);
        });
    });
    
    // Also handle buttons with data-page attribute
    document.addEventListener('click', function(e) {
        if (e.target.closest('button[data-page]')) {
            const btn = e.target.closest('button[data-page]');
            const pageId = btn.getAttribute('data-page');
            navigateToPage(pageId);
        }
    });
}

// Navigate to a specific page
function navigateToPage(pageId) {
    // Hide all pages
    pages.forEach(page => {
        page.classList.remove('active');
    });
    
    // Show selected page
    document.getElementById(`${pageId}-page`).classList.add('active');
    
    // Update active navigation button
    navBtns.forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-page') === pageId) {
            btn.classList.add('active');
        }
    });
    
    // Update content if needed
    if (pageId === 'dashboard') {
        updateDashboard();
    } else if (pageId === 'my-goals') {
        renderGoals();
    } else if (pageId === 'transactions') {
        updateTransactionsList();
    }
}

// Update dashboard statistics
function updateDashboard() {
    if (goals.length === 0) {
        dashboardEmpty.style.display = 'block';
        recentGoals.style.display = 'none';
        return;
    }
    
    dashboardEmpty.style.display = 'none';
    recentGoals.style.display = 'block';
    
    // Calculate stats
    const totalGoals = goals.length;
    const totalSaved = goals.reduce((sum, goal) => sum + goal.currentAmount, 0);
    const totalTarget = goals.reduce((sum, goal) => sum + goal.targetAmount, 0);
    const avgProgress = goals.length > 0 
        ? Math.round(goals.reduce((sum, goal) => sum + (goal.currentAmount / goal.targetAmount * 100), 0) / goals.length) 
        : 0;
    
    // Update stats display
    totalGoalsEl.textContent = totalGoals;
    totalSavedEl.textContent = formatCurrency(totalSaved);
    totalTargetEl.textContent = formatCurrency(totalTarget);
    avgProgressEl.textContent = `${avgProgress}%`;
    
    // Show recent goals (up to 4)
    dashboardGoals.innerHTML = '';
    const recentGoalsToShow = goals.slice(0, 4);
    
    recentGoalsToShow.forEach(goal => {
        const progressPercentage = Math.min(Math.round((goal.currentAmount / goal.targetAmount) * 100), 100);
        
        const goalCard = document.createElement('div');
        goalCard.className = 'goal-card';
        goalCard.innerHTML = `
            <div class="goal-title">${goal.name}</div>
            <div class="goal-description">${goal.description.substring(0, 60)}${goal.description.length > 60 ? '...' : ''}</div>
            <div class="goal-amount">${formatCurrency(goal.currentAmount)} / ${formatCurrency(goal.targetAmount)}</div>
            <div class="progress-container">
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${progressPercentage}%"></div>
                </div>
                <div class="progress-text">
                    <span>${progressPercentage}%</span>
                </div>
            </div>
            <button onclick="viewGoalDetails(${goal.id})" style="margin-top: 15px; width: 100%; background-color: #FFA500;">
                <i class="fas fa-eye"></i> View Details
            </button>
        `;
        
        dashboardGoals.appendChild(goalCard);
    });
}

// Render all goals on the My Goals page
function renderGoals() {
    goalsContainer.innerHTML = '';
    
    if (goals.length === 0) {
        emptyGoals.style.display = 'block';
        return;
    }
    
    emptyGoals.style.display = 'none';
    
    goals.forEach(goal => {
        const progressPercentage = Math.min(Math.round((goal.currentAmount / goal.targetAmount) * 100), 100);
        
        const goalCard = document.createElement('div');
        goalCard.className = 'goal-card';
        goalCard.innerHTML = `
            <div class="goal-title">${goal.name}</div>
            <div class="goal-description">${goal.description}</div>
            <div class="goal-amount">Saved: ${formatCurrency(goal.currentAmount)} / ${formatCurrency(goal.targetAmount)}</div>
            <div class="progress-container">
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${progressPercentage}%"></div>
                </div>
                <div class="progress-text">
                    <span>${progressPercentage}% complete</span>
                    <span>${formatCurrency(goal.targetAmount - goal.currentAmount)} to go</span>
                </div>
            </div>
            <div style="margin-top: 10px; font-size: 0.9rem; color: #28a745;">
                <i class="fas fa-clock"></i> No deadline - Save at your own pace!
            </div>
            <div class="goal-actions">
                <button onclick="viewGoalDetails(${goal.id})" style="flex: 2; background-color: #FFA500;">
                    <i class="fas fa-eye"></i> View Details
                </button>
                <button onclick="addToGoal(${goal.id})" class="success" style="flex: 1;">
                    <i class="fas fa-plus"></i> Add
                </button>
            </div>
        `;
        
        goalsContainer.appendChild(goalCard);
    });
}

// Create a new goal
function createNewGoal() {
    const nameInput = document.getElementById('goal-name');
    const descInput = document.getElementById('goal-description');
    const targetInput = document.getElementById('goal-target');
    const categoryInput = document.getElementById('goal-category');
    
    if (!nameInput.value.trim() || !targetInput.value || targetInput.value <= 0) {
        alert('Please enter a valid goal name and target amount');
        return;
    }
    
    const newGoal = {
        id: goals.length > 0 ? Math.max(...goals.map(g => g.id)) + 1 : 1,
        name: nameInput.value.trim(),
        description: descInput.value.trim() || 'No description',
        category: categoryInput.value || 'other',
        targetAmount: parseInt(targetInput.value),
        currentAmount: 0,
        createdAt: new Date().toISOString().split('T')[0],
        transactions: []
    };
    
    goals.push(newGoal);
    
    // Clear form
    nameInput.value = '';
    descInput.value = '';
    targetInput.value = '';
    categoryInput.value = '';
    
    // Update UI
    updateDashboard();
    renderGoals();
    populateGoalFilter();
    
    // Navigate to the new goal
    navigateToPage('my-goals');
    
    // Show success message
    alert(`🎉 Successfully created "${newGoal.name}" goal!\n\nYou're now tracking: ${formatCurrency(newGoal.targetAmount)}\nStart adding savings whenever you're ready!`);
}

// View goal details in modal
function viewGoalDetails(goalId) {
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;
    
    // Show the goal details modal
    document.getElementById('goal-details-modal').style.display = 'block';
    
    // Hide other pages
    pages.forEach(page => {
        if (page.id !== 'goal-details-modal') {
            page.classList.remove('active');
        }
    });
    
    // Generate transactions list
    let transactionsHTML = '';
    if (goal.transactions.length > 0) {
        goal.transactions.forEach(transaction => {
            transactionsHTML += `
                <div class="transaction-item">
                    <div>
                        <div>${transaction.date}</div>
                        <div class="transaction-note">${transaction.note}</div>
                    </div>
                    <div class="transaction-amount">+ ${formatCurrency(transaction.amount)}</div>
                </div>
            `;
        });
    } else {
        transactionsHTML = '<div class="empty-state" style="padding: 30px 0;"><p>No transactions yet. Add your first savings deposit!</p></div>';
    }
    
    // Add category icon
    const categoryIcons = {
        electronics: 'fas fa-laptop',
        travel: 'fas fa-plane',
        education: 'fas fa-graduation-cap',
        home: 'fas fa-home',
        vehicle: 'fas fa-car',
        emergency: 'fas fa-shield-alt',
        other: 'fas fa-star'
    };
    
    const categoryIcon = categoryIcons[goal.category] || 'fas fa-star';
    
    document.getElementById('selected-goal-title').innerHTML = `
        <i class="${categoryIcon}"></i> ${goal.name}
    `;
    
    const progressPercentage = Math.min(Math.round((goal.currentAmount / goal.targetAmount) * 100), 100);
    
    document.getElementById('selected-goal-content').innerHTML = `
        <div class="goal-description" style="margin-bottom: 20px;">${goal.description}</div>
        
        <div style="display: flex; gap: 20px; flex-wrap: wrap; margin-bottom: 25px;">
            <div style="border: 2px solid #FFD700; padding: 15px; border-radius: 10px; background-color: #fffef5;">
                <div style="font-weight: 600; color: #FF8C00;">Target Amount</div>
                <div class="goal-amount" style="font-size: 1.3rem;">${formatCurrency(goal.targetAmount)}</div>
            </div>
            <div style="border: 2px solid #FFD700; padding: 15px; border-radius: 10px; background-color: #fffef5;">
                <div style="font-weight: 600; color: #FF8C00;">Currently Saved</div>
                <div class="goal-amount" style="font-size: 1.3rem;">${formatCurrency(goal.currentAmount)}</div>
            </div>
        </div>
        
        <div style="margin-top: 10px; padding: 15px; background-color: #fffef5; border-radius: 10px; border: 2px solid #FFD700; margin-bottom: 25px;">
            <div style="color: #28a745; font-weight: 600; text-align: center;">
                <i class="fas fa-clock"></i> No deadline - Save at your own pace!
            </div>
        </div>
        
        <div class="progress-container" style="margin-bottom: 30px;">
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${progressPercentage}%"></div>
            </div>
            <div class="progress-text">
                <span>${progressPercentage}% complete</span>
                <span>${formatCurrency(goal.currentAmount)} saved of ${formatCurrency(goal.targetAmount)}</span>
            </div>
        </div>
        
        <div style="margin-top: 30px;">
            <h3 style="font-size: 1.2rem; margin-bottom: 15px; color: #FF8C00;">Add Savings</h3>
            <div style="display: flex; gap: 10px; align-items: center;">
                <input type="number" id="transaction-amount-${goal.id}" placeholder="Amount to add" style="flex: 1;">
                <input type="text" id="transaction-note-${goal.id}" placeholder="Note (optional)" style="flex: 1;">
                <button onclick="addTransaction(${goal.id})" class="success" style="background-color: #28a745;">
                    <i class="fas fa-plus"></i> Add
                </button>
            </div>
        </div>
        
        <div style="margin-top: 40px;">
            <h3 style="font-size: 1.2rem; margin-bottom: 15px; color: #FF8C00;">Transaction History</h3>
            <div class="transaction-list">
                ${transactionsHTML}
            </div>
        </div>
    `;
}

// Close goal details modal
function closeGoalDetails() {
    document.getElementById('goal-details-modal').style.display = 'none';
    navigateToPage('my-goals');
}

// Quick add to goal from My Goals page
function addToGoal(goalId) {
    const amount = prompt(`How much would you like to add to "${goals.find(g => g.id === goalId)?.name}"? (Tzs.)`);
    
    if (!amount || isNaN(amount) || amount <= 0) {
        alert('Please enter a valid amount');
        return;
    }
    
    addTransaction(goalId, parseInt(amount), "Manual addition");
}

// Add a transaction to a goal
function addTransaction(goalId, amount, note) {
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;
    
    // If amount is not provided, get it from the input
    if (!amount) {
        const amountInput = document.getElementById(`transaction-amount-${goalId}`);
        const noteInput = document.getElementById(`transaction-note-${goalId}`);
        
        amount = parseInt(amountInput.value);
        note = noteInput.value.trim() || "Savings deposit";
        
        if (!amount || amount <= 0) {
            alert('Please enter a valid amount');
            return;
        }
        
        // Clear inputs
        amountInput.value = '';
        noteInput.value = '';
    }
    
    // Add transaction
    const now = new Date();
    const transactionDate = now.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    }) + ' ' + now.toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit'
    });
    
    const newTransaction = {
        id: goal.transactions.length > 0 ? Math.max(...goal.transactions.map(t => t.id)) + 1 : 1,
        date: transactionDate,
        amount: amount,
        note: note
    };
    
    goal.transactions.unshift(newTransaction);
    
    // Update current amount
    goal.currentAmount += amount;
    
    // Update the UI
    updateDashboard();
    renderGoals();
    updateTransactionsList();
    
    // If we're in the goal details modal, update it
    if (document.getElementById('goal-details-modal').style.display === 'block') {
        viewGoalDetails(goalId);
    }
    
    // Show success message
    alert(`✅ Successfully added ${formatCurrency(amount)} to your "${goal.name}" goal!\n\nTotal saved: ${formatCurrency(goal.currentAmount)}\nRemaining: ${formatCurrency(goal.targetAmount - goal.currentAmount)}`);
}

// Update transactions list
function updateTransactionsList() {
    const selectedGoalId = filterGoalSelect.value;
    let allTransactions = [];
    
    // Get all transactions
    goals.forEach(goal => {
        if (selectedGoalId === 'all' || selectedGoalId === goal.id.toString()) {
            goal.transactions.forEach(transaction => {
                allTransactions.push({
                    ...transaction,
                    goalName: goal.name,
                    goalId: goal.id
                });
            });
        }
    });
    
    // Sort by date (newest first)
    allTransactions.sort((a, b) => {
        return b.id - a.id;
    });
    
    // Update UI
    if (allTransactions.length === 0) {
        emptyTransactions.style.display = 'block';
        transactionsList.style.display = 'none';
        return;
    }
    
    emptyTransactions.style.display = 'none';
    transactionsList.style.display = 'block';
    
    // Display transactions
    transactionsList.innerHTML = '';
    allTransactions.forEach(transaction => {
        const transactionItem = document.createElement('div');
        transactionItem.className = 'transaction-item';
        transactionItem.innerHTML = `
            <div>
                <div style="font-weight: 600; color: #FF8C00;">${transaction.goalName}</div>
                <div class="transaction-date">${transaction.date}</div>
                <div class="transaction-note">${transaction.note}</div>
            </div>
            <div>
                <div class="transaction-amount">+ ${formatCurrency(transaction.amount)}</div>
                <button onclick="viewGoalDetails(${transaction.goalId})" style="margin-top: 5px; padding: 5px 10px; font-size: 0.8rem; background-color: #FFA500;">
                    <i class="fas fa-eye"></i> View Goal
                </button>
            </div>
        `;
        transactionsList.appendChild(transactionItem);
    });
}

// Populate the goal filter dropdown
function populateGoalFilter() {
    filterGoalSelect.innerHTML = '<option value="all">All Goals</option>';
    
    goals.forEach(goal => {
        const option = document.createElement('option');
        option.value = goal.id;
        option.textContent = goal.name;
        filterGoalSelect.appendChild(option);
    });
    
    // Add event listener for filter change
    filterGoalSelect.addEventListener('change', updateTransactionsList);
}

// Helper functions
function formatCurrency(amount) {
    return `Tzs. ${amount.toLocaleString('en-US')}`;
}
