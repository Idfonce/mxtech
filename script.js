// ===========================================
// DATA STORAGE - Where we keep all information
// ===========================================

// Storage key for localStorage
const STORAGE_KEY = 'savings_goals_data';

// Load goals from localStorage when app starts
let goals = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];

// These variables remember information about USSD payments
let currentUssdGoalId = null;
let ussdAmount = 0;
let selectedProvider = '';

// ===========================================
// GETTING PAGE ELEMENTS - Finding parts of our webpage
// ===========================================

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
const totalGoalsEl = document.getElementById('total-goals');
const totalSavedEl = document.getElementById('total-saved');
const totalTargetEl = document.getElementById('total-target');
const avgProgressEl = document.getElementById('avg-progress');

// ===========================================
// LOCAL STORAGE FUNCTIONS
// ===========================================

// Save goals to localStorage
function saveToLocalStorage() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(goals));
        console.log('Data saved to localStorage. Total goals:', goals.length);
    } catch (error) {
        console.error('Error saving to localStorage:', error);
        alert('Could not save data. Your storage might be full.');
    }
}

// Load goals from localStorage
function loadFromLocalStorage() {
    try {
        const savedData = localStorage.getItem(STORAGE_KEY);
        if (savedData) {
            goals = JSON.parse(savedData);
            // Ensure all transactions arrays exist
            goals.forEach(goal => {
                if (!goal.transactions) {
                    goal.transactions = [];
                }
            });
        }
    } catch (error) {
        console.error('Error loading from localStorage:', error);
        goals = [];
    }
}

// Export data as JSON file
function exportData() {
    const data = {
        goals: goals,
        exportDate: new Date().toISOString(),
        totalGoals: goals.length,
        totalSaved: goals.reduce((sum, goal) => sum + goal.currentAmount, 0),
        totalTarget: goals.reduce((sum, goal) => sum + goal.targetAmount, 0)
    };
    
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `savings-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    alert('Data exported successfully!');
}

// Import data from JSON file
function importData() {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.json';
    
    fileInput.onchange = function(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const importedData = JSON.parse(e.target.result);
                
                if (!importedData.goals || !Array.isArray(importedData.goals)) {
                    alert('Invalid data format.');
                    return;
                }
                
                if (confirm(`Import ${importedData.goals.length} goals? Current data will be replaced.`)) {
                    goals = importedData.goals;
                    saveToLocalStorage();
                    updateDashboard();
                    renderGoals();
                    updateTransactionsList();
                    populateGoalFilter();
                    alert(`Successfully imported ${importedData.goals.length} goals!`);
                }
            } catch (error) {
                alert('Error importing data.');
            }
        };
        reader.readAsText(file);
    };
    fileInput.click();
}

// Clear all data
function clearAllData() {
    if (confirm('⚠️ This will delete ALL your data. Are you sure?')) {
        goals = [];
        localStorage.removeItem(STORAGE_KEY);
        updateDashboard();
        renderGoals();
        updateTransactionsList();
        populateGoalFilter();
        alert('All data has been cleared.');
    }
}

// Add data management buttons to the UI
function addDataManagementButtons() {
    const transactionsPage = document.getElementById('transactions-page');
    if (transactionsPage) {
        const dataManagementHTML = `
            <div style="margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px;">
                <h3 style="color: #3498db; margin-bottom: 15px;">
                    <i class="fas fa-database"></i> Data Management
                </h3>
                <div style="display: grid; gap: 10px; margin-bottom: 20px;">
                    <button onclick="exportData()" style="background-color: #28a745; color: white;">
                        <i class="fas fa-download"></i> Export All Data
                    </button>
                    <button onclick="importData()" style="background-color: #17a2b8; color: white;">
                        <i class="fas fa-upload"></i> Import Data
                    </button>
                    <button onclick="clearAllData()" style="background-color: #dc3545; color: white;">
                        <i class="fas fa-trash"></i> Clear All Data
                    </button>
                </div>
                <div style="font-size: 0.9rem; color: #666; text-align: center;">
                    <i class="fas fa-info-circle"></i> Data is saved automatically
                </div>
            </div>
        `;
        
        const container = transactionsPage.querySelector('.card');
        if (container) {
            container.innerHTML += dataManagementHTML;
        }
    }
}

// ===========================================
// STARTING THE APP - Runs when page first loads
// ===========================================

document.addEventListener('DOMContentLoaded', function() {
    // Load data from localStorage
    loadFromLocalStorage();
    
    // Setup navigation
    setupNavigation();
    
    // Load all data and show it on the page
    updateDashboard();
    renderGoals();
    updateTransactionsList();
    populateGoalFilter();
    
    // Make the "Create Goal" button work
    document.getElementById('create-goal-btn').addEventListener('click', createNewGoal);
    
    // Add data management buttons
    addDataManagementButtons();
});

// ===========================================
// NAVIGATION FUNCTIONS - Switching between pages
// ===========================================

function setupNavigation() {
    navBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const pageId = this.getAttribute('data-page');
            navigateToPage(pageId);
        });
    });
    
    document.addEventListener('click', function(e) {
        if (e.target.closest('button[data-page]')) {
            const btn = e.target.closest('button[data-page]');
            const pageId = btn.getAttribute('data-page');
            navigateToPage(pageId);
        }
    });
}

function navigateToPage(pageId) {
    pages.forEach(page => {
        page.classList.remove('active');
    });
    
    document.getElementById(`${pageId}-page`).classList.add('active');
    
    navBtns.forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-page') === pageId) {
            btn.classList.add('active');
        }
    });
    
    if (pageId === 'dashboard') {
        updateDashboard();
    } else if (pageId === 'my-goals') {
        renderGoals();
    } else if (pageId === 'transactions') {
        updateTransactionsList();
    }
}

// ===========================================
// DASHBOARD FUNCTIONS - Main dashboard page
// ===========================================

function updateDashboard() {
    if (goals.length === 0) {
        dashboardEmpty.style.display = 'block';
        recentGoals.style.display = 'none';
        return;
    }
    
    dashboardEmpty.style.display = 'none';
    recentGoals.style.display = 'block';
    
    const totalGoals = goals.length;
    const totalSaved = goals.reduce((sum, goal) => sum + goal.currentAmount, 0);
    const totalTarget = goals.reduce((sum, goal) => sum + goal.targetAmount, 0);
    const avgProgress = goals.length > 0 
        ? Math.round(goals.reduce((sum, goal) => sum + (goal.currentAmount / goal.targetAmount * 100), 0) / goals.length) 
        : 0;
    
    totalGoalsEl.textContent = totalGoals;
    totalSavedEl.textContent = formatCurrency(totalSaved);
    totalTargetEl.textContent = formatCurrency(totalTarget);
    avgProgressEl.textContent = `${avgProgress}%`;
    
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
            <button onclick="viewGoalDetails(${goal.id})" style="margin-top: 15px; width: 100%;">
                <i class="fas fa-eye"></i> View Details
            </button>
        `;
        
        dashboardGoals.appendChild(goalCard);
    });
}

// ===========================================
// GOALS MANAGEMENT - Creating and showing goals
// ===========================================

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
            <div style="display: flex; gap: 5px; margin-top: 15px;">
                <button onclick="addToGoal(${goal.id})" class="success" style="flex: 1;">
                    <i class="fas fa-plus"></i> Quick Add
                </button>
                <button onclick="openUssdPayment(${goal.id})" style="flex: 1; background-color: #3498db;">
                    <i class="fas fa-mobile-alt"></i> USSD Pay
                </button>
            </div>
        `;
        
        goalsContainer.appendChild(goalCard);
    });
}

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
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        transactions: []
    };
    
    goals.push(newGoal);
    
    // Save to localStorage
    saveToLocalStorage();
    
    nameInput.value = '';
    descInput.value = '';
    targetInput.value = '';
    categoryInput.value = '';
    
    updateDashboard();
    renderGoals();
    populateGoalFilter();
    
    showSuccessModal(newGoal);
}

function showSuccessModal(goal) {
    const successMessage = document.getElementById('success-message');
    successMessage.innerHTML = `
        📌 Successfully created "<strong>${goal.name}</strong>" goal!<br>
        <div style="margin-top: 10px; font-size: 1.2rem; color: #28a745;">
            Target: ${formatCurrency(goal.targetAmount)}
        </div>
    `;
    
    document.getElementById('success-modal').style.display = 'flex';
}

function closeSuccessModal() {
    document.getElementById('success-modal').style.display = 'none';
    navigateToPage('my-goals');
}

// ===========================================
// GOAL DETAILS - Viewing and managing a single goal
// ===========================================

function viewGoalDetails(goalId) {
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;
    
    document.getElementById('goal-details-modal').style.display = 'block';
    
    pages.forEach(page => {
        if (page.id !== 'goal-details-modal') {
            page.classList.remove('active');
        }
    });
    
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
            <div style="border: 2px solid #3498db; padding: 15px; border-radius: 10px; background-color: #f8fbff; flex: 1;">
                <div style="font-weight: 600; color: #3498db;">Target Amount</div>
                <div class="goal-amount" style="font-size: 1.3rem;">${formatCurrency(goal.targetAmount)}</div>
            </div>
            <div style="border: 2px solid #3498db; padding: 15px; border-radius: 10px; background-color: #f8fbff; flex: 1;">
                <div style="font-weight: 600; color: #3498db;">Currently Saved</div>
                <div class="goal-amount" style="font-size: 1.3rem;">${formatCurrency(goal.currentAmount)}</div>
            </div>
        </div>
        
        <div style="margin-top: 10px; padding: 15px; background-color: #f8fbff; border-radius: 10px; border: 2px solid #3498db; margin-bottom: 25px;">
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
            <h3 style="font-size: 1.2rem; margin-bottom: 15px; color: #3498db;">Add Savings</h3>
            <div style="display: flex; gap: 10px; align-items: center;">
                <input type="number" id="transaction-amount-${goal.id}" placeholder="Amount to add" style="flex: 1;">
                <input type="text" id="transaction-note-${goal.id}" placeholder="Note (optional)" style="flex: 1;">
                <button onclick="addTransaction(${goal.id})" class="success">
                    <i class="fas fa-plus"></i> Quick Add
                </button>
            </div>
        </div>
        
        <div style="margin-top: 20px;">
            <button onclick="openUssdPayment(${goal.id})" style="width: 100%; background-color: #3498db; padding: 15px;">
                <i class="fas fa-mobile-alt"></i> Pay via USSD (Airtel, Vodacom, Halotel, Tigo)
            </button>
        </div>
        
        <div style="margin-top: 40px;">
            <h3 style="font-size: 1.2rem; margin-bottom: 15px; color: #3498db;">Transaction History</h3>
            <div class="transaction-list">
                ${transactionsHTML}
            </div>
        </div>
        
        <div style="margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px;">
            <button onclick="deleteGoal(${goal.id})" style="background-color: #dc3545; color: white; width: 100%; padding: 12px;">
                <i class="fas fa-trash-alt"></i> Delete This Goal
            </button>
            <div style="font-size: 0.8rem; color: #666; text-align: center; margin-top: 10px;">
                Last updated: ${new Date(goal.updatedAt).toLocaleDateString()}
            </div>
        </div>
    `;
}

function closeGoalDetails() {
    document.getElementById('goal-details-modal').style.display = 'none';
    navigateToPage('my-goals');
}

// ===========================================
// QUICK ADD FUNCTION - Add money to a goal
// ===========================================

function addToGoal(goalId) {
    const goal = goals.find(g => g.id === goalId);
    const amount = prompt(`How much would you like to add to "${goal?.name}"? (Tzs.)`);
    
    if (!amount || isNaN(amount) || amount <= 0) {
        alert('Please enter a valid amount');
        return;
    }
    
    addTransaction(goalId, parseInt(amount), "Manual addition");
}

// ===========================================
// TRANSACTION MANAGEMENT - Adding and showing transactions
// ===========================================

function addTransaction(goalId, amount, note) {
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;
    
    if (!amount) {
        const amountInput = document.getElementById(`transaction-amount-${goalId}`);
        const noteInput = document.getElementById(`transaction-note-${goalId}`);
        
        amount = parseInt(amountInput.value);
        note = noteInput.value.trim() || "Savings deposit";
        
        if (!amount || amount <= 0) {
            alert('Please enter a valid amount');
            return;
        }
        
        amountInput.value = '';
        noteInput.value = '';
    }
    
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
        note: note,
        timestamp: now.toISOString()
    };
    
    goal.transactions.unshift(newTransaction);
    goal.currentAmount += amount;
    goal.updatedAt = now.toISOString();
    
    // Save to localStorage
    saveToLocalStorage();
    
    updateDashboard();
    renderGoals();
    updateTransactionsList();
    
    if (document.getElementById('goal-details-modal').style.display === 'block') {
        viewGoalDetails(goalId);
    }
    
    alert(`✅ Successfully added ${formatCurrency(amount)} to your "${goal.name}" goal!\n\nTotal saved: ${formatCurrency(goal.currentAmount)}\nRemaining: ${formatCurrency(goal.targetAmount - goal.currentAmount)}`);
}

function updateTransactionsList() {
    const selectedGoalId = filterGoalSelect.value;
    let allTransactions = [];
    
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
    
    allTransactions.sort((a, b) => {
        return b.id - a.id;
    });
    
    if (allTransactions.length === 0) {
        emptyTransactions.style.display = 'block';
        transactionsList.style.display = 'none';
        return;
    }
    
    emptyTransactions.style.display = 'none';
    transactionsList.style.display = 'block';
    
    transactionsList.innerHTML = '';
    allTransactions.forEach(transaction => {
        const transactionItem = document.createElement('div');
        transactionItem.className = 'transaction-item';
        transactionItem.innerHTML = `
            <div>
                <div style="font-weight: 600; color: #3498db;">${transaction.goalName}</div>
                <div class="transaction-date">${transaction.date}</div>
                <div class="transaction-note">${transaction.note}</div>
            </div>
            <div>
                <div class="transaction-amount">+ ${formatCurrency(transaction.amount)}</div>
                <button onclick="viewGoalDetails(${transaction.goalId})" style="margin-top: 5px; padding: 5px 10px; font-size: 0.8rem;">
                    <i class="fas fa-eye"></i> View Goal
                </button>
            </div>
        `;
        transactionsList.appendChild(transactionItem);
    });
}

function populateGoalFilter() {
    filterGoalSelect.innerHTML = '<option value="all">All Goals</option>';
    
    goals.forEach(goal => {
        const option = document.createElement('option');
        option.value = goal.id;
        option.textContent = goal.name;
        filterGoalSelect.appendChild(option);
    });
    
    filterGoalSelect.addEventListener('change', updateTransactionsList);
}

// ===========================================
// DELETE GOAL FUNCTION
// ===========================================

function deleteGoal(goalId) {
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;
    
    if (confirm(`Delete "${goal.name}"? This will also delete ${goal.transactions.length} transactions.`)) {
        const goalIndex = goals.findIndex(g => g.id === goalId);
        if (goalIndex > -1) {
            goals.splice(goalIndex, 1);
            saveToLocalStorage();
            updateDashboard();
            renderGoals();
            updateTransactionsList();
            populateGoalFilter();
            alert('Goal deleted successfully.');
            
            if (document.getElementById('goal-details-modal').style.display === 'block') {
                closeGoalDetails();
            }
        }
    }
}

// ===========================================
// USSD PAYMENT FUNCTIONS - Mobile payment simulation
// ===========================================

function openUssdPayment(goalId) {
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;
    
    currentUssdGoalId = goalId;
    ussdAmount = 0;
    selectedProvider = '';
    
    document.getElementById('ussd-modal').style.display = 'block';
    
    pages.forEach(page => {
        if (page.id !== 'ussd-modal') {
            page.classList.remove('active');
        }
    });
    
    showUssdStep1(goal);
}

function closeUssdModal() {
    document.getElementById('ussd-modal').style.display = 'none';
    navigateToPage('my-goals');
}

function showUssdStep1(goal) {
    document.getElementById('ussd-content').innerHTML = `
        <div style="text-align: center; margin-bottom: 20px;">
            <div style="font-size: 1.2rem; color: #3498db; margin-bottom: 10px;">
                <i class="fas fa-bullseye"></i> ${goal.name}
            </div>
            <div style="color: #666; margin-bottom: 5px;">Enter amount to save (Tzs.)</div>
            <div style="font-size: 0.9rem; color: #888;">Minimum: Tzs. 100</div>
        </div>
        
        <div class="form-group">
            <input type="number" id="ussd-amount" placeholder="Enter amount" min="100" style="text-align: center; font-size: 1.2rem; font-weight: bold;">
        </div>
        
        <div style="text-align: center; margin-top: 20px;">
            <button onclick="proceedToStep2()" style="width: 100%; padding: 15px;">
                <i class="fas fa-arrow-right"></i> Continue to Payment
            </button>
        </div>
    `;
}

function proceedToStep2() {
    const amountInput = document.getElementById('ussd-amount');
    const amount = parseInt(amountInput.value);
    
    if (!amount || amount < 100) {
        alert('Please enter a valid amount (minimum Tzs. 100)');
        return;
    }
    
    ussdAmount = amount;
    
    document.getElementById('ussd-content').innerHTML = `
        <div style="text-align: center; margin-bottom: 20px;">
            <div style="font-size: 1.2rem; color: #3498db; margin-bottom: 10px;">
                <i class="fas fa-mobile-alt"></i> Select Payment Method
            </div>
            <div style="font-size: 1.1rem; color: #28a745; font-weight: bold; margin-bottom: 10px;">
                Amount: ${formatCurrency(amount)}
            </div>
            <div style="color: #666; font-size: 0.9rem;">Select your mobile money provider</div>
        </div>
        
        <div style="display: grid; gap: 10px; margin-bottom: 20px;">
            <button onclick="selectProvider('airtel')" style="text-align: left; background-color: #e30613; color: white; border: 2px solid #e30613; justify-content: flex-start; padding: 15px;">
                <i class="fas fa-sim-card" style="font-size: 1.2rem; color: #ffffff"></i> Airtel Tanzania (Dial *150*60#)
            </button>
            
            <button onclick="selectProvider('vodacom')" style="text-align: left; background-color: #ffffff; color: #000000; border: 2px solid #1e4c79; justify-content: flex-start; padding: 15px;">
                <i class="fas fa-sim-card" style="font-size: 1.2rem; color: #ff7300;"></i> Vodacom Tanzania (Dial *150*00#)
            </button>
            
            <button onclick="selectProvider('halotel')" style="text-align: left; background-color: #c27031; color: white; border: 2px solid #000000; justify-content: flex-start; padding: 15px;">
                <i class="fas fa-sim-card" style="font-size: 1.2rem; color: #ffffff"></i> Halotel Tanzania (Dial *150*88#)
            </button>
            
            <button onclick="selectProvider('tigo')" style="text-align: left; background-color: #313bc2; color: white; border: 2px solid #158cff; justify-content: flex-start; padding: 15px;">
                <i class="fas fa-sim-card" style="font-size: 1.2rem; color: #ffffff"></i> Tigo Tanzania (Dial *150*01#)
            </button>
        </div>
        
        <div style="text-align: center;">
            <button onclick="showUssdStep1()" class="secondary" style="margin-right: 10px; padding: 10px 20px;">
                <i class="fas fa-arrow-left"></i> Back
            </button>
        </div>
    `;
}

function selectProvider(provider) {
    selectedProvider = provider;
    
    const providerNames = {
        'airtel': 'Airtel Tanzania',
        'vodacom': 'Vodacom Tanzania', 
        'halotel': 'Halotel Tanzania',
        'tigo': 'Tigo Tanzania'
    };
    
    const ussdCodes = {
        'airtel': '*150*60#',
        'vodacom': '*150*00#',
        'halotel': '*150*88#',
        'tigo': '*150*01#'
    };
    
    document.getElementById('ussd-content').innerHTML = `
        <div style="text-align: center; margin-bottom: 20px;">
            <div style="font-size: 1.2rem; color: #3498db; margin-bottom: 10px;">
                <i class="fas fa-check-circle"></i> Confirm Payment
            </div>
            <div style="margin-bottom: 5px; color: #666;">Provider: <strong>${providerNames[provider]}</strong></div>
            <div style="font-size: 1.3rem; color: #28a745; font-weight: bold; margin-bottom: 15px;">
                ${formatCurrency(ussdAmount)}
            </div>
        </div>
        
        <div class="ussd-instruction">
            <div style="font-weight: bold; margin-bottom: 10px; color: #3498db;">📱 Payment Instructions:</div>
            <ol>
                <li>Dial <strong>${ussdCodes[provider]}</strong> on your phone</li>
                <li>Select "Send Money" or "Payments"</li>
                <li>Enter recipient number (your business number)</li>
                <li>Enter amount: <strong>${ussdAmount.toLocaleString()} Tzs.</strong></li>
                <li>Enter your PIN to complete payment</li>
                <li>Return here to confirm payment</li>
            </ol>
        </div>
        
        <div class="form-group" style="margin-top: 20px;">
            <label for="payment-confirmation">Enter Payment Reference/Code (Optional):</label>
            <input type="text" id="payment-ref" placeholder="e.g., TX123456 or leave blank for simulation">
            <div style="font-size: 0.8rem; color: #888; margin-top: 5px;">
                Enter reference from SMS or leave blank for simulation
            </div>
        </div>
        
        <div style="display: flex; gap: 10px; margin-top: 20px;">
            <button onclick="proceedToStep2()" class="secondary" style="flex: 1; padding: 12px;">
                <i class="fas fa-arrow-left"></i> Change Provider
            </button>
            <button onclick="completeUssdPayment()" class="success" style="flex: 2; padding: 12px;">
                <i class="fas fa-check"></i> Confirm Payment Received
            </button>
        </div>
    `;
}

function completeUssdPayment() {
    const goal = goals.find(g => g.id === currentUssdGoalId);
    if (!goal) {
        alert('Error: Goal not found');
        closeUssdModal();
        return;
    }
    
    const paymentRef = document.getElementById('payment-ref').value.trim();
    const providerNames = {
        'airtel': 'Airtel Money',
        'vodacom': 'M-Pesa',
        'halotel': 'Halopesa',
        'tigo': 'Tigo Pesa'
    };
    
    const now = new Date();
    const transactionDate = now.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    }) + ' ' + now.toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit'
    });
    
    const note = `USSD Payment via ${providerNames[selectedProvider] || 'Mobile Money'}${paymentRef ? ' (Ref: ' + paymentRef + ')' : ''}`;
    
    const newTransaction = {
        id: goal.transactions.length > 0 ? Math.max(...goal.transactions.map(t => t.id)) + 1 : 1,
        date: transactionDate,
        amount: ussdAmount,
        note: note,
        timestamp: now.toISOString()
    };
    
    goal.transactions.unshift(newTransaction);
    goal.currentAmount += ussdAmount;
    goal.updatedAt = now.toISOString();
    
    // Save to localStorage
    saveToLocalStorage();
    
    updateDashboard();
    renderGoals();
    updateTransactionsList();
    
    document.getElementById('ussd-content').innerHTML = `
        <div style="text-align: center; padding: 40px 20px; background-color: #d4edda; border-radius: 10px; border: 3px solid #c3e6cb;">
            <div style="font-size: 4rem; color: #28a745; margin-bottom: 20px; animation: successPulse 0.5s ease;">
                <i class="fas fa-check-circle"></i>
            </div>
            <h3 style="color: #155724; margin-bottom: 15px;">Payment Successful! 🎉</h3>
            <div style="font-size: 1.2rem; margin-bottom: 10px; color: #0c5460;">
                ${formatCurrency(ussdAmount)} received
            </div>
            <div style="color: #155724; margin-bottom: 20px; line-height: 1.5;">
                <div>Added to: <strong>${goal.name}</strong></div>
                <div>via ${providerNames[selectedProvider] || 'Mobile Payment'}</div>
            </div>
            <div style="background-color: #ffffff; padding: 15px; border-radius: 8px; border: 2px solid #28a745; margin-bottom: 25px;">
                <div style="font-weight: bold; color: #3498db; margin-bottom: 5px;">New Total:</div>
                <div style="font-size: 1.5rem; color: #28a745; font-weight: bold;">
                    ${formatCurrency(goal.currentAmount)} / ${formatCurrency(goal.targetAmount)}
                </div>
                <div style="margin-top: 10px; color: #666;">
                    Progress: ${Math.round((goal.currentAmount / goal.targetAmount) * 100)}%
                </div>
            </div>
            <button onclick="closeUssdModal()" class="success" style="width: 100%; padding: 15px; font-size: 1.1rem;">
                <i class="fas fa-check"></i> Continue to Goals
            </button>
        </div>
    `;
    
    setTimeout(() => {
        closeUssdModal();
    }, 10000);
}

// ===========================================
// HELPER FUNCTIONS - Small useful functions
// ===========================================

function formatCurrency(amount) {
    return `Tzs. ${amount.toLocaleString('en-US')}`;
}
