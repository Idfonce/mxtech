// DOM Elements
const modal = document.getElementById('savings-modal');
const addSavingsBtn = document.getElementById('add-savings');
const closeBtn = document.querySelector('.close-btn');
const confirmSavingsBtn = document.getElementById('confirm-savings');
const savingsAmountInput = document.getElementById('savings-amount');
const savedAmountEl = document.getElementById('saved-amount');
const balanceAmountEl = document.getElementById('balance-amount');
const progressFillEl = document.getElementById('progress-fill');
const daysEl = document.getElementById('days');
const hoursEl = document.getElementById('hours');
const minutesEl = document.getElementById('minutes');
const downloadPlanBtn = document.getElementById('download-plan');

// Initial values
const goalAmount = 800;
let savedAmount = 520;
let balanceAmount = goalAmount - savedAmount;
let progressPercentage = (savedAmount / goalAmount) * 100;

// Update display
function updateDisplay() {
    savedAmountEl.textContent = `$${savedAmount.toFixed(2)}`;
    balanceAmountEl.textContent = `$${balanceAmount.toFixed(2)}`;
    progressFillEl.style.width = `${progressPercentage}%`;
    
    // Update countdown based on balance
    const daysRemaining = Math.ceil(balanceAmount / 5); // Based on daily target of $5
    daysEl.textContent = daysRemaining;
    hoursEl.textContent = Math.floor(Math.random() * 24);
    minutesEl.textContent = Math.floor(Math.random() * 60);
    
    // Update progress text
    document.querySelector('.progress-text span').textContent = 
        `${Math.round(progressPercentage)}% Complete`;
}

// Add savings
confirmSavingsBtn.addEventListener('click', function() {
    const amount = parseFloat(savingsAmountInput.value) || 0;
    
    if (amount > 0 && amount <= balanceAmount) {
        savedAmount += amount;
        balanceAmount = goalAmount - savedAmount;
        progressPercentage = (savedAmount / goalAmount) * 100;
        
        updateDisplay();
        showNotification(`Successfully added $${amount.toFixed(2)} to savings!`);
        modal.style.display = 'none';
        
        // Reset input
        savingsAmountInput.value = '';
    } else if (amount > balanceAmount) {
        alert('Amount exceeds remaining balance!');
    } else {
        alert('Please enter a valid amount');
    }
});

// Modal controls
addSavingsBtn.addEventListener('click', function() {
    modal.style.display = 'flex';
});

closeBtn.addEventListener('click', function() {
    modal.style.display = 'none';
});

window.addEventListener('click', function(event) {
    if (event.target === modal) {
        modal.style.display = 'none';
    }
});

// Download plan
downloadPlanBtn.addEventListener('click', function() {
    showNotification('Savings plan downloaded successfully!');
    
    // Create a simple text file for download
    const planText = `SAVINGS PLAN REPORT
    ====================
    Goal: New Laptop
    Target Amount: $${goalAmount}
    Amount Saved: $${savedAmount.toFixed(2)}
    Remaining: $${balanceAmount.toFixed(2)}
    Progress: ${Math.round(progressPercentage)}%
    
    Daily Target: $5.00
    Weekly Target: $35.00
    Monthly Target: $150.00
    
    Last Updated: ${new Date().toLocaleDateString()}
    
    Keep up the great work!`;
    
    const blob = new Blob([planText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'savings-plan.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
});

// Notification function
function showNotification(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #4CAF50;
        color: white;
        padding: 15px 20px;
        border-radius: 10px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 1001;
        animation: slideIn 0.3s ease;
    `;
    
    notification.innerHTML = `
        <i class="fas fa-check-circle"></i> ${message}
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Add CSS for animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);

// Update countdown timer every minute
function updateCountdown() {
    let minutes = parseInt(minutesEl.textContent);
    let hours = parseInt(hoursEl.textContent);
    let days = parseInt(daysEl.textContent);
    
    minutes--;
    
    if (minutes < 0) {
        minutes = 59;
        hours--;
        
        if (hours < 0) {
            hours = 23;
            days--;
            
            if (days < 0) {
                days = 0;
                hours = 0;
                minutes = 0;
            }
        }
    }
    
    daysEl.textContent = days.toString().padStart(2, '0');
    hoursEl.textContent = hours.toString().padStart(2, '0');
    minutesEl.textContent = minutes.toString().padStart(2, '0');
}

// Initialize
updateDisplay();

// Update countdown every minute
setInterval(updateCountdown, 60000);

// Set current date for modal
document.getElementById('savings-date').valueAsDate = new Date();
