// ===========================================
// DATA STORAGE - Where we keep all information
// ===========================================

// This is like a big list that stores ALL our savings goals
// Each goal has: name, target amount, current savings, etc.
let goals = [];

// These variables remember information about USSD payments
let currentUssdGoalId = null;  // Which goal we're paying for (like "New Phone")
let ussdAmount = 0;            // How much money to pay (like 50000 Tzs)
let selectedProvider = '';     // Which mobile network (Airtel, Vodacom, etc.)

// ===========================================
// GETTING PAGE ELEMENTS - Finding parts of our webpage
// ===========================================

// Find ALL pages on our website (Dashboard, Create Goal, etc.)
const pages = document.querySelectorAll('.page');

// Find ALL navigation buttons (Dashboard button, Create Goal button, etc.)
const navBtns = document.querySelectorAll('.nav-btn');

// Find the container where goals will be displayed
const goalsContainer = document.getElementById('goals-container');
const emptyGoals = document.getElementById('empty-goals'); // Shows when no goals exist

// Find transaction-related elements
const transactionsList = document.getElementById('transactions-list');
const emptyTransactions = document.getElementById('empty-transactions'); // Shows when no transactions

// Find dashboard elements
const dashboardEmpty = document.getElementById('dashboard-empty'); // Welcome message
const dashboardGoals = document.getElementById('dashboard-goals'); // Recent goals section
const recentGoals = document.getElementById('recent-goals'); // Container for recent goals
const filterGoalSelect = document.getElementById('filter-goal'); // Dropdown to filter transactions

// Find the 4 statistic boxes on Dashboard
const totalGoalsEl = document.getElementById('total-goals');      // "Total Goals" number
const totalSavedEl = document.getElementById('total-saved');      // "Total Saved" amount
const totalTargetEl = document.getElementById('total-target');    // "Total Target" amount
const avgProgressEl = document.getElementById('avg-progress');    // "Average Progress" percentage

// ===========================================
// STARTING THE APP - Runs when page first loads
// ===========================================

// This code runs automatically when the webpage finishes loading
document.addEventListener('DOMContentLoaded', function() {
    // STEP 1: Make navigation buttons work
    setupNavigation();
    
    // STEP 2: Load all data and show it on the page
    updateDashboard();      // Update the Dashboard page
    renderGoals();          // Show all goals on "My Goals" page
    updateTransactionsList(); // Show all transactions
    populateGoalFilter();   // Fill the transaction filter dropdown
    
    // STEP 3: Make the "Create Goal" button work
    document.getElementById('create-goal-btn').addEventListener('click', createNewGoal);
});

// ===========================================
// NAVIGATION FUNCTIONS - Switching between pages
// ===========================================

// This function makes all navigation buttons clickable
function setupNavigation() {
    // Add click event to each navigation button
    navBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            // Get which page to show from button's data-page attribute
            const pageId = this.getAttribute('data-page');
            // Go to that page
            navigateToPage(pageId);
        });
    });
    
    // Also handle ANY button with data-page attribute (not just nav buttons)
    document.addEventListener('click', function(e) {
        // Check if user clicked a button with data-page attribute
        if (e.target.closest('button[data-page]')) {
            const btn = e.target.closest('button[data-page]');
            const pageId = btn.getAttribute('data-page');
            navigateToPage(pageId);
        }
    });
}

// This function switches between different pages
function navigateToPage(pageId) {
    // STEP 1: Hide ALL pages first
    pages.forEach(page => {
        page.classList.remove('active');
    });
    
    // STEP 2: Show ONLY the selected page
    // pageId could be: 'dashboard', 'create-goal', 'my-goals', or 'transactions'
    document.getElementById(`${pageId}-page`).classList.add('active');
    
    // STEP 3: Update which navigation button looks "active" (colored differently)
    navBtns.forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-page') === pageId) {
            btn.classList.add('active');
        }
    });
    
    // STEP 4: Update content if needed
    if (pageId === 'dashboard') {
        updateDashboard(); // Refresh dashboard stats
    } else if (pageId === 'my-goals') {
        renderGoals(); // Refresh goals list
    } else if (pageId === 'transactions') {
        updateTransactionsList(); // Refresh transactions
    }
}

// ===========================================
// DASHBOARD FUNCTIONS - Main dashboard page
// ===========================================

// This function updates the Dashboard with latest information
function updateDashboard() {
    // If NO goals exist, show welcome message
    if (goals.length === 0) {
        dashboardEmpty.style.display = 'block';
        recentGoals.style.display = 'none';
        return; // Stop here, nothing more to do
    }
    
    // If goals DO exist, hide welcome message
    dashboardEmpty.style.display = 'none';
    recentGoals.style.display = 'block';
    
    // STEP 1: Calculate statistics
    
    // Count total number of goals
    const totalGoals = goals.length;
    
    // Add up ALL money saved in ALL goals
    const totalSaved = goals.reduce((sum, goal) => sum + goal.currentAmount, 0);
    
    // Add up ALL target amounts
    const totalTarget = goals.reduce((sum, goal) => sum + goal.targetAmount, 0);
    
    // Calculate average progress percentage
    const avgProgress = goals.length > 0 
        ? Math.round(goals.reduce((sum, goal) => sum + (goal.currentAmount / goal.targetAmount * 100), 0) / goals.length) 
        : 0;
    
    // STEP 2: Update the 4 statistic boxes
    totalGoalsEl.textContent = totalGoals;
    totalSavedEl.textContent = formatCurrency(totalSaved); // Format as "Tzs. 50,000"
    totalTargetEl.textContent = formatCurrency(totalTarget);
    avgProgressEl.textContent = `${avgProgress}%`;
    
    // STEP 3: Show recent goals (up to 4 most recent)
    dashboardGoals.innerHTML = ''; // Clear old content
    const recentGoalsToShow = goals.slice(0, 4); // Get first 4 goals
    
    // Create a card for each recent goal
    recentGoalsToShow.forEach(goal => {
        // Calculate progress percentage (how much saved vs target)
        const progressPercentage = Math.min(Math.round((goal.currentAmount / goal.targetAmount) * 100), 100);
        
        // Create HTML for this goal card
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
        
        // Add this card to the dashboard
        dashboardGoals.appendChild(goalCard);
    });
}

// ===========================================
// GOALS MANAGEMENT - Creating and showing goals
// ===========================================

// This function shows ALL goals on the "My Goals" page
function renderGoals() {
    // Clear the goals container first
    goalsContainer.innerHTML = '';
    
    // If NO goals exist, show empty state message
    if (goals.length === 0) {
        emptyGoals.style.display = 'block';
        return; // Stop here
    }
    
    // Hide empty message since we have goals
    emptyGoals.style.display = 'none';
    
    // Create a card for EACH goal
    goals.forEach(goal => {
        // Calculate progress percentage
        const progressPercentage = Math.min(Math.round((goal.currentAmount / goal.targetAmount) * 100), 100);
        
        // Create HTML for this goal card
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
        
        // Add this card to the page
        goalsContainer.appendChild(goalCard);
    });
}

// This function creates a NEW savings goal
function createNewGoal() {
    // STEP 1: Get values from the form inputs
    const nameInput = document.getElementById('goal-name');
    const descInput = document.getElementById('goal-description');
    const targetInput = document.getElementById('goal-target');
    const categoryInput = document.getElementById('goal-category');
    
    // STEP 2: Validate inputs (check if they're correct)
    if (!nameInput.value.trim() || !targetInput.value || targetInput.value <= 0) {
        alert('Please enter a valid goal name and target amount');
        return; // Stop if invalid
    }
    
    // STEP 3: Create new goal object
    const newGoal = {
        id: goals.length > 0 ? Math.max(...goals.map(g => g.id)) + 1 : 1, // Generate unique ID
        name: nameInput.value.trim(),
        description: descInput.value.trim() || 'No description',
        category: categoryInput.value || 'other',
        targetAmount: parseInt(targetInput.value), // Convert to number
        currentAmount: 0, // Start with 0 saved
        createdAt: new Date().toISOString().split('T')[0], // Today's date
        transactions: [] // Empty transaction list
    };
    
    // STEP 4: Add new goal to our goals list
    goals.push(newGoal);
    
    // STEP 5: Clear the form for next goal
    nameInput.value = '';
    descInput.value = '';
    targetInput.value = '';
    categoryInput.value = '';
    
    // STEP 6: Update the UI
    updateDashboard();      // Refresh dashboard
    renderGoals();          // Refresh goals list
    populateGoalFilter();   // Update transaction filter
    
    // STEP 7: Show success message
    showSuccessModal(newGoal);
}

// This shows a popup when goal is successfully created
function showSuccessModal(goal) {
    const successMessage = document.getElementById('success-message');
    successMessage.innerHTML = `
        📌 Successfully created "<strong>${goal.name}</strong>" goal!<br>
        <div style="margin-top: 10px; font-size: 1.2rem; color: #28a745;">
            Target: ${formatCurrency(goal.targetAmount)}
        </div>
    `;
    
    // Show the success modal
    document.getElementById('success-modal').style.display = 'flex';
}

// This closes the success modal
function closeSuccessModal() {
    document.getElementById('success-modal').style.display = 'none';
    navigateToPage('my-goals'); // Go to My Goals page
}

// ===========================================
// GOAL DETAILS - Viewing and managing a single goal
// ===========================================

// This shows detailed view of a specific goal
function viewGoalDetails(goalId) {
    // Find the goal with matching ID
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return; // Stop if goal not found
    
    // STEP 1: Show the goal details modal (popup)
    document.getElementById('goal-details-modal').style.display = 'block';
    
    // STEP 2: Hide other pages
    pages.forEach(page => {
        if (page.id !== 'goal-details-modal') {
            page.classList.remove('active');
        }
    });
    
    // STEP 3: Generate transactions list for this goal
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
    
    // STEP 4: Set icon based on goal category
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
    
    // STEP 5: Update modal title with goal name and icon
    document.getElementById('selected-goal-title').innerHTML = `
        <i class="${categoryIcon}"></i> ${goal.name}
    `;
    
    // STEP 6: Calculate progress percentage
    const progressPercentage = Math.min(Math.round((goal.currentAmount / goal.targetAmount) * 100), 100);
    
    // STEP 7: Fill modal with goal information
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
    `;
}

// This closes the goal details modal
function closeGoalDetails() {
    document.getElementById('goal-details-modal').style.display = 'none';
    navigateToPage('my-goals'); // Go back to My Goals page
}

// ===========================================
// QUICK ADD FUNCTION - Add money to a goal
// ===========================================

// This opens a prompt to quickly add money to a goal
function addToGoal(goalId) {
    // Find the goal
    const goal = goals.find(g => g.id === goalId);
    
    // Ask user how much to add
    const amount = prompt(`How much would you like to add to "${goal?.name}"? (Tzs.)`);
    
    // Validate the amount
    if (!amount || isNaN(amount) || amount <= 0) {
        alert('Please enter a valid amount');
        return; // Stop if invalid
    }
    
    // Add the transaction
    addTransaction(goalId, parseInt(amount), "Manual addition");
}

// ===========================================
// TRANSACTION MANAGEMENT - Adding and showing transactions
// ===========================================

// This function adds a transaction (money) to a goal
function addTransaction(goalId, amount, note) {
    // Find the goal
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return; // Stop if goal not found
    
    // If amount is not provided (called from goal details modal)
    if (!amount) {
        // Get amount and note from input fields in modal
        const amountInput = document.getElementById(`transaction-amount-${goalId}`);
        const noteInput = document.getElementById(`transaction-note-${goalId}`);
        
        amount = parseInt(amountInput.value);
        note = noteInput.value.trim() || "Savings deposit";
        
        // Validate amount
        if (!amount || amount <= 0) {
            alert('Please enter a valid amount');
            return;
        }
        
        // Clear inputs after adding
        amountInput.value = '';
        noteInput.value = '';
    }
    
    // STEP 1: Create transaction date
    const now = new Date();
    const transactionDate = now.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    }) + ' ' + now.toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit'
    });
    
    // STEP 2: Create new transaction object
    const newTransaction = {
        id: goal.transactions.length > 0 ? Math.max(...goal.transactions.map(t => t.id)) + 1 : 1,
        date: transactionDate,
        amount: amount,
        note: note
    };
    
    // STEP 3: Add transaction to goal (at beginning of list)
    goal.transactions.unshift(newTransaction);
    
    // STEP 4: Update goal's current amount
    goal.currentAmount += amount;
    
    // STEP 5: Update the UI
    updateDashboard();      // Refresh dashboard stats
    renderGoals();          // Refresh goals list
    updateTransactionsList(); // Refresh transactions page
    
    // STEP 6: If viewing goal details, refresh that modal too
    if (document.getElementById('goal-details-modal').style.display === 'block') {
        viewGoalDetails(goalId);
    }
    
    // STEP 7: Show success message
    alert(`✅ Successfully added ${formatCurrency(amount)} to your "${goal.name}" goal!\n\nTotal saved: ${formatCurrency(goal.currentAmount)}\nRemaining: ${formatCurrency(goal.targetAmount - goal.currentAmount)}`);
}

// This function updates the transactions list on Transactions page
function updateTransactionsList() {
    // Get selected goal from filter dropdown
    const selectedGoalId = filterGoalSelect.value;
    let allTransactions = [];
    
    // STEP 1: Get all transactions
    goals.forEach(goal => {
        // If "All Goals" selected OR specific goal selected
        if (selectedGoalId === 'all' || selectedGoalId === goal.id.toString()) {
            goal.transactions.forEach(transaction => {
                // Add goal name to each transaction for display
                allTransactions.push({
                    ...transaction,
                    goalName: goal.name,
                    goalId: goal.id
                });
            });
        }
    });
    
    // STEP 2: Sort transactions by date (newest first)
    allTransactions.sort((a, b) => {
        return b.id - a.id; // Higher ID = newer transaction
    });
    
    // STEP 3: Update UI based on whether we have transactions
    if (allTransactions.length === 0) {
        emptyTransactions.style.display = 'block'; // Show "no transactions" message
        transactionsList.style.display = 'none';   // Hide transactions list
        return; // Stop here
    }
    
    emptyTransactions.style.display = 'none';   // Hide "no transactions" message
    transactionsList.style.display = 'block';   // Show transactions list
    
    // STEP 4: Display all transactions
    transactionsList.innerHTML = ''; // Clear old content
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

// This fills the transaction filter dropdown with goal names
function populateGoalFilter() {
    // Start with "All Goals" option
    filterGoalSelect.innerHTML = '<option value="all">All Goals</option>';
    
    // Add each goal as an option
    goals.forEach(goal => {
        const option = document.createElement('option');
        option.value = goal.id;
        option.textContent = goal.name;
        filterGoalSelect.appendChild(option);
    });
    
    // Make filter work when changed
    filterGoalSelect.addEventListener('change', updateTransactionsList);
}

// ===========================================
// USSD PAYMENT FUNCTIONS - Mobile payment simulation
// ===========================================

// This opens the USSD payment modal for a specific goal
function openUssdPayment(goalId) {
    // Find the goal
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;
    
    // Remember which goal we're paying for
    currentUssdGoalId = goalId;
    ussdAmount = 0;        // Reset amount
    selectedProvider = ''; // Reset provider
    
    // Show USSD modal
    document.getElementById('ussd-modal').style.display = 'block';
    
    // Hide other pages
    pages.forEach(page => {
        if (page.id !== 'ussd-modal') {
            page.classList.remove('active');
        }
    });
    
    // Show first step (enter amount)
    showUssdStep1(goal);
}

// This closes the USSD modal
function closeUssdModal() {
    document.getElementById('ussd-modal').style.display = 'none';
    navigateToPage('my-goals'); // Go back to My Goals
}

// STEP 1: Show amount input screen
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

// STEP 2: Show provider selection screen
function proceedToStep2() {
    // Get amount from input
    const amountInput = document.getElementById('ussd-amount');
    const amount = parseInt(amountInput.value);
    
    // Validate amount
    if (!amount || amount < 100) {
        alert('Please enter a valid amount (minimum Tzs. 100)');
        return;
    }
    
    // Remember the amount
    ussdAmount = amount;
    
    // Show provider selection
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

// STEP 3: Show confirmation screen after selecting provider
function selectProvider(provider) {
    // Remember selected provider
    selectedProvider = provider;
    
    // Provider information
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
    
    // Show confirmation screen
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

// FINAL STEP: Complete the payment
function completeUssdPayment() {
    // Find the goal we're paying for
    const goal = goals.find(g => g.id === currentUssdGoalId);
    if (!goal) {
        alert('Error: Goal not found');
        closeUssdModal();
        return;
    }
    
    // Get payment reference (optional)
    const paymentRef = document.getElementById('payment-ref').value.trim();
    
    // Provider display names
    const providerNames = {
        'airtel': 'Airtel Money',
        'vodacom': 'M-Pesa',
        'halotel': 'Halopesa',
        'tigo': 'Tigo Pesa'
    };
    
    // STEP 1: Create transaction date
    const now = new Date();
    const transactionDate = now.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    }) + ' ' + now.toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit'
    });
    
    // STEP 2: Create transaction note
    const note = `USSD Payment via ${providerNames[selectedProvider] || 'Mobile Money'}${paymentRef ? ' (Ref: ' + paymentRef + ')' : ''}`;
    
    // STEP 3: Create new transaction
    const newTransaction = {
        id: goal.transactions.length > 0 ? Math.max(...goal.transactions.map(t => t.id)) + 1 : 1,
        date: transactionDate,
        amount: ussdAmount,
        note: note
    };
    
    // STEP 4: Add transaction to goal
    goal.transactions.unshift(newTransaction);
    
    // STEP 5: Update goal's current amount
    goal.currentAmount += ussdAmount;
    
    // STEP 6: Update UI
    updateDashboard();
    renderGoals();
    updateTransactionsList();
    
    // STEP 7: Show success message with green background
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
    
    // Auto-close after 10 seconds
    setTimeout(() => {
        closeUssdModal();
    }, 10000);
}

// ===========================================
// HELPER FUNCTIONS - Small useful functions
// ===========================================

// This formats money as "Tzs. 50,000"
function formatCurrency(amount) {
    return `Tzs. ${amount.toLocaleString('en-US')}`;
            }
