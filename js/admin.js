// Admin Panel JavaScript
class AdminPanel {
    constructor() {
        this.accounts = {};
        this.currentEditingAccount = null;
        this.init();
    }

    init() {
        this.loadAccounts();
        this.setupEventListeners();
        this.initializeDarkMode();
        this.updateStats();
        this.loadFraudLogs();
    }

    loadAccounts() {
        const storedAccounts = localStorage.getItem('bankAccounts');
        if (storedAccounts) {
            this.accounts = JSON.parse(storedAccounts);
        }
        this.displayAccounts();
    }

    setupEventListeners() {
        // Auto-refresh every 5 seconds
        setInterval(() => {
            this.loadAccounts();
            this.loadFraudLogs();
        }, 5000);
    }

    displayAccounts() {
        const tableBody = document.getElementById('accountsTableBody');
        if (!tableBody) return;

        const accountEntries = Object.entries(this.accounts);
        
        if (accountEntries.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 40px;">No accounts found</td></tr>';
            return;
        }

        tableBody.innerHTML = accountEntries.map(([username, account]) => `
            <tr>
                <td><strong>${username}</strong></td>
                <td>${account.companyName || 'TechSolutions Inc.'}</td>
                <td class="balance">${this.formatCurrency(account.businessCheckingBalance || 0)}</td>
                <td class="balance">${this.formatCurrency(account.businessSavingsBalance || 0)}</td>
                <td class="balance">${this.formatCurrency(account.creditUsed || 0)}</td>
                <td>${account.transactions ? account.transactions.length : 0}</td>
                <td class="actions">
                    <button class="action-btn edit" onclick="adminPanel.editAccount('${username}')" title="Edit Account">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn balance" onclick="adminPanel.editBalances('${username}')" title="Edit Balances">
                        <i class="fas fa-dollar-sign"></i>
                    </button>
                    <button class="action-btn delete" onclick="adminPanel.deleteAccount('${username}')" title="Delete Account">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }

    updateStats() {
        const accountEntries = Object.entries(this.accounts);
        const totalAccounts = accountEntries.length;
        
        let totalBalance = 0;
        let totalTransactions = 0;
        
        accountEntries.forEach(([username, account]) => {
            totalBalance += (account.businessCheckingBalance || 0) + (account.businessSavingsBalance || 0);
            totalTransactions += account.transactions ? account.transactions.length : 0;
        });

        document.getElementById('totalAccounts').textContent = totalAccounts;
        document.getElementById('totalBalance').textContent = this.formatCurrency(totalBalance);
        document.getElementById('totalTransactions').textContent = totalTransactions;
    }

    showAddAccountModal() {
        this.currentEditingAccount = null;
        document.getElementById('modalTitle').textContent = 'Add New Account';
        this.clearForm();
        document.getElementById('accountModal').classList.add('show');
    }

    editAccount(username) {
        this.currentEditingAccount = username;
        const account = this.accounts[username];
        
        document.getElementById('modalTitle').textContent = 'Edit Account';
        document.getElementById('editUsername').value = username;
        document.getElementById('editPassword').value = account.password || '';
        document.getElementById('editCompanyName').value = account.companyName || '';
        document.getElementById('editBusinessType').value = account.businessType || 'C-Corporation';
        document.getElementById('editCheckingBalance').value = account.businessCheckingBalance || 0;
        document.getElementById('editSavingsBalance').value = account.businessSavingsBalance || 0;
        document.getElementById('editCreditLimit').value = account.creditLimit || 0;
        document.getElementById('editCreditUsed').value = account.creditUsed || 0;
        document.getElementById('editAddress').value = account.address || '';
        document.getElementById('editPhone').value = account.phone || '';
        document.getElementById('editEIN').value = account.ein || '';
        
        document.getElementById('accountModal').classList.add('show');
    }

    editBalances(username) {
        this.currentEditingAccount = username;
        const account = this.accounts[username];
        
        document.getElementById('newCheckingBalance').value = account.businessCheckingBalance || 0;
        document.getElementById('newSavingsBalance').value = account.businessSavingsBalance || 0;
        document.getElementById('newCreditUsed').value = account.creditUsed || 0;
        
        document.getElementById('balanceModal').classList.add('show');
    }

    saveAccount() {
        this.showLoading();
        
        const username = document.getElementById('editUsername').value.trim();
        const password = document.getElementById('editPassword').value.trim();
        
        if (!username || !password) {
            this.hideLoading();
            this.showError('Username and password are required');
            return;
        }

        const accountData = {
            password: password,
            companyName: document.getElementById('editCompanyName').value.trim(),
            businessType: document.getElementById('editBusinessType').value,
            businessCheckingBalance: parseFloat(document.getElementById('editCheckingBalance').value) || 0,
            businessSavingsBalance: parseFloat(document.getElementById('editSavingsBalance').value) || 0,
            creditLimit: parseFloat(document.getElementById('editCreditLimit').value) || 0,
            creditUsed: parseFloat(document.getElementById('editCreditUsed').value) || 0,
            address: document.getElementById('editAddress').value.trim(),
            phone: document.getElementById('editPhone').value.trim(),
            ein: document.getElementById('editEIN').value.trim(),
            transactions: this.accounts[username]?.transactions || [],
            fraudLog: this.accounts[username]?.fraudLog || []
        };

        // If editing existing account and username changed, delete old entry
        if (this.currentEditingAccount && this.currentEditingAccount !== username) {
            delete this.accounts[this.currentEditingAccount];
        }

        this.accounts[username] = accountData;
        this.saveAccounts();
        
        setTimeout(() => {
            this.hideLoading();
            this.closeAccountModal();
            this.displayAccounts();
            this.updateStats();
            this.showSuccess(this.currentEditingAccount ? 'Account updated successfully' : 'Account created successfully');
        }, 1000);
    }

    saveBalances() {
        this.showLoading();
        
        if (!this.currentEditingAccount) return;
        
        const account = this.accounts[this.currentEditingAccount];
        account.businessCheckingBalance = parseFloat(document.getElementById('newCheckingBalance').value) || 0;
        account.businessSavingsBalance = parseFloat(document.getElementById('newSavingsBalance').value) || 0;
        account.creditUsed = parseFloat(document.getElementById('newCreditUsed').value) || 0;
        
        this.saveAccounts();
        
        setTimeout(() => {
            this.hideLoading();
            this.closeBalanceModal();
            this.displayAccounts();
            this.updateStats();
            this.showSuccess('Balances updated successfully');
        }, 1000);
    }

    deleteAccount(username) {
        if (confirm(`Are you sure you want to delete account "${username}"? This action cannot be undone.`)) {
            this.showLoading();
            
            delete this.accounts[username];
            this.saveAccounts();
            
            setTimeout(() => {
                this.hideLoading();
                this.displayAccounts();
                this.updateStats();
                this.showSuccess('Account deleted successfully');
            }, 1000);
        }
    }

    loadFraudLogs() {
        const container = document.getElementById('fraudLogsContainer');
        if (!container) return;

        let allLogs = [];
        Object.entries(this.accounts).forEach(([username, account]) => {
            if (account.fraudLog) {
                account.fraudLog.forEach(log => {
                    allLogs.push({ username, log });
                });
            }
        });

        // Sort by timestamp (newest first)
        allLogs.sort((a, b) => new Date(b.log.split(']')[0].substring(1)) - new Date(a.log.split(']')[0].substring(1)));
        
        // Show only last 50 logs
        allLogs = allLogs.slice(0, 50);

        if (allLogs.length === 0) {
            container.innerHTML = '<div class="no-logs">No fraud logs available</div>';
            return;
        }

        container.innerHTML = allLogs.map(({ username, log }) => {
            const timestamp = log.split(']')[0].substring(1);
            const message = log.split('] ')[1];
            return `
                <div class="log-entry">
                    <div class="log-header">
                        <span class="log-user">${username}</span>
                        <span class="log-time">${new Date(timestamp).toLocaleString()}</span>
                    </div>
                    <div class="log-message">${message}</div>
                </div>
            `;
        }).join('');
    }

    clearAllLogs() {
        if (confirm('Are you sure you want to clear all fraud logs?')) {
            Object.values(this.accounts).forEach(account => {
                account.fraudLog = [];
            });
            this.saveAccounts();
            this.loadFraudLogs();
            this.showSuccess('All fraud logs cleared');
        }
    }

    saveAccounts() {
        localStorage.setItem('bankAccounts', JSON.stringify(this.accounts));
    }

    clearForm() {
        document.getElementById('editUsername').value = '';
        document.getElementById('editPassword').value = '';
        document.getElementById('editCompanyName').value = '';
        document.getElementById('editBusinessType').value = 'C-Corporation';
        document.getElementById('editCheckingBalance').value = '';
        document.getElementById('editSavingsBalance').value = '';
        document.getElementById('editCreditLimit').value = '';
        document.getElementById('editCreditUsed').value = '';
        document.getElementById('editAddress').value = '';
        document.getElementById('editPhone').value = '';
        document.getElementById('editEIN').value = '';
    }

    closeAccountModal() {
        document.getElementById('accountModal').classList.remove('show');
    }

    closeBalanceModal() {
        document.getElementById('balanceModal').classList.remove('show');
    }

    showLoading() {
        document.getElementById('loadingOverlay').style.display = 'flex';
    }

    hideLoading() {
        document.getElementById('loadingOverlay').style.display = 'none';
    }

    initializeDarkMode() {
        const darkModeToggle = document.getElementById('darkModeToggle');
        
        const isDarkMode = localStorage.getItem('darkMode') === 'true';
        if (isDarkMode) {
            document.body.classList.add('dark-mode');
            darkModeToggle.innerHTML = '<i class="fas fa-sun"></i>';
        }

        darkModeToggle.addEventListener('click', () => {
            document.body.classList.toggle('dark-mode');
            const isDark = document.body.classList.contains('dark-mode');
            localStorage.setItem('darkMode', isDark);
            darkModeToggle.innerHTML = isDark ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
        });
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    }

    showError(message) {
        const notification = document.createElement('div');
        notification.className = 'error-notification';
        notification.innerHTML = `<i class="fas fa-exclamation-triangle"></i><span>${message}</span>`;
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 5000);
    }

    showSuccess(message) {
        const notification = document.createElement('div');
        notification.className = 'success-notification';
        notification.innerHTML = `<i class="fas fa-check-circle"></i><span>${message}</span>`;
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 5000);
    }
}

// Admin authentication
function checkAdminAuth() {
    const adminAuth = localStorage.getItem('adminAuth');
    if (!adminAuth || adminAuth !== 'authenticated') {
        window.location.href = 'admin-login.html';
    }
}

function adminLogout() {
    localStorage.removeItem('adminAuth');
    window.location.href = 'admin-login.html';
}

// Global functions
function showAddAccountModal() {
    adminPanel.showAddAccountModal();
}

function closeAccountModal() {
    adminPanel.closeAccountModal();
}

function closeBalanceModal() {
    adminPanel.closeBalanceModal();
}

function saveAccount() {
    adminPanel.saveAccount();
}

function saveBalances() {
    adminPanel.saveBalances();
}

function clearAllLogs() {
    adminPanel.clearAllLogs();
}

// Initialize admin panel
checkAdminAuth();
const adminPanel = new AdminPanel();
