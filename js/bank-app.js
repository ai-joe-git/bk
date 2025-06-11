// Bank Application JavaScript - Complete with Firebase Integration
class BankApp {
    constructor() {
        this.accounts = {};
        this.currentUser = null;
        this.authToken = null;
        this.pollingInterval = null;
        this.database = null;
        this.accountsRef = null;
        this.init();
    }

    async init() {
        // Wait for Firebase to be available
        await this.waitForFirebase();
        this.database = window.firebaseDatabase;
        this.accountsRef = window.firebaseRef(this.database, 'bankAccounts');
        
        await this.loadStoredData();
        this.setupEventListeners();
        this.setupRealTimeSync();
        setTimeout(() => {
            this.initializeDarkMode();
        }, 100);
    }

    async waitForFirebase() {
        while (!window.firebaseDatabase) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }

    // REAL-TIME DATA LOADING
    async loadStoredData() {
        try {
            const snapshot = await window.firebaseGet(this.accountsRef);
            if (snapshot.exists()) {
                this.accounts = snapshot.val();
                console.log('✅ Data loaded from Firebase');
            } else {
                // Initialize with default data
                this.accounts = this.getDefaultAccounts();
                await this.saveData();
                console.log('✅ Default data created in Firebase');
            }
        } catch (error) {
            console.error('❌ Error loading from Firebase:', error);
            // Fallback to localStorage
            const localData = localStorage.getItem('bankAccounts');
            if (localData) {
                this.accounts = JSON.parse(localData);
            } else {
                this.accounts = this.getDefaultAccounts();
            }
        }

        this.authToken = localStorage.getItem('bankAuthToken');
        this.currentUser = localStorage.getItem('currentBankUser');
    }

    // REAL-TIME DATA SAVING
    async saveData() {
        try {
            // Add timestamp for sync tracking
            this.accounts.lastUpdated = new Date().toISOString();
            
            // Save to Firebase (available to ALL users worldwide)
            await window.firebaseSet(this.accountsRef, this.accounts);
            console.log('✅ Data saved to Firebase - Available globally!');
            
            // Also save locally as backup
            localStorage.setItem('bankAccounts', JSON.stringify(this.accounts));
        } catch (error) {
            console.error('❌ Error saving to Firebase:', error);
            // Fallback to localStorage
            localStorage.setItem('bankAccounts', JSON.stringify(this.accounts));
        }
    }

    // REAL-TIME SYNCHRONIZATION
    setupRealTimeSync() {
        window.firebaseOnValue(this.accountsRef, (snapshot) => {
            if (snapshot.exists()) {
                const newData = snapshot.val();
                // Only update if data is newer
                if (newData.lastUpdated !== this.accounts.lastUpdated) {
                    this.accounts = newData;
                    this.updateUserInterface();
                    console.log('🔄 Data synced in real-time from Firebase!');
                }
            }
        });
    }

    getDefaultAccounts() {
        return {
            'Brown68': {
                password: 'brown6868',
                companyName: 'TechSolutions Inc.',
                businessType: 'C-Corporation',
                businessCheckingBalance: 125847.92,
                businessSavingsBalance: 289234.15,
                creditLimit: 250000.00,
                creditUsed: 35750.00,
                address: '456 Innovation Drive, Silicon Valley, CA 94025',
                phone: '+1 (555) 987-6543',
                ein: '12-3456789',
                transactions: [
                    {
                        id: 'TXN001',
                        date: '2025-01-15 14:30:22',
                        type: 'Incoming Transfer',
                        amount: 125000.00,
                        description: 'Client Payment - Microsoft Corp (Invoice #INV-2025-001)',
                        account: 'business-checking',
                        status: 'completed'
                    },
                    {
                        id: 'TXN002',
                        date: '2025-01-14 09:15:10',
                        type: 'Outgoing Transfer',
                        amount: -45000.00,
                        description: 'Payroll Processing - January 2025',
                        account: 'business-checking',
                        status: 'completed'
                    },
                    {
                        id: 'TXN003',
                        date: '2025-01-13 16:45:33',
                        type: 'Incoming Transfer',
                        amount: 75000.00,
                        description: 'Client Payment - Google LLC (Invoice #INV-2025-002)',
                        account: 'business-checking',
                        status: 'completed'
                    }
                ],
                fraudLog: []
            },
            lastUpdated: new Date().toISOString()
        };
    }

    setupEventListeners() {
        // Login form
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        // Transfer form
        const transferForm = document.getElementById('transferForm');
        if (transferForm) {
            transferForm.addEventListener('submit', (e) => this.handleTransfer(e));
            this.setupTransferFormListeners();
        }

        // Transfer type selection
        this.setupTransferTypeCards();
        this.setupDashboardButtons();
        this.setupNavigationButtons();
    }

    // FIXED: Dark mode implementation
    initializeDarkMode() {
        // Remove existing toggle if any
        const existingToggle = document.querySelector('.dark-mode-toggle');
        if (existingToggle) {
            existingToggle.remove();
        }

        // Create dark mode toggle
        const darkModeToggle = document.createElement('button');
        darkModeToggle.className = 'dark-mode-toggle';
        darkModeToggle.innerHTML = '<i class="fas fa-moon"></i>';
        darkModeToggle.title = 'Toggle Dark Mode';
        darkModeToggle.setAttribute('aria-label', 'Toggle Dark Mode');
        
        // Add styles directly to ensure visibility
        darkModeToggle.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 20px;
            width: 50px;
            height: 50px;
            border-radius: 50%;
            background: #1e40af;
            color: white;
            border: none;
            cursor: pointer;
            font-size: 20px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            transition: all 0.3s;
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
        `;

        document.body.appendChild(darkModeToggle);

        // Load saved preference
        const isDarkMode = localStorage.getItem('darkMode') === 'true';
        if (isDarkMode) {
            document.body.classList.add('dark-mode');
            darkModeToggle.innerHTML = '<i class="fas fa-sun"></i>';
        }

        // Toggle functionality
        darkModeToggle.addEventListener('click', () => {
            document.body.classList.toggle('dark-mode');
            const isDark = document.body.classList.contains('dark-mode');
            localStorage.setItem('darkMode', isDark);
            darkModeToggle.innerHTML = isDark ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
        });

        // Hover effect
        darkModeToggle.addEventListener('mouseenter', () => {
            darkModeToggle.style.transform = 'scale(1.1)';
        });
        darkModeToggle.addEventListener('mouseleave', () => {
            darkModeToggle.style.transform = 'scale(1)';
        });
    }

    setupDashboardButtons() {
        document.addEventListener('click', (e) => {
            if (e.target.closest('.action-btn')) {
                const btn = e.target.closest('.action-btn');
                const btnText = btn.textContent.trim().toLowerCase();
                
                if (btnText.includes('transfer')) {
                    window.location.href = 'transfer.html';
                } else if (btnText.includes('statement')) {
                    window.location.href = 'statements.html';
                } else if (btnText.includes('details')) {
                    window.location.href = 'transactions.html';
                }
            }

            if (e.target.closest('.quick-action-card')) {
                const card = e.target.closest('.quick-action-card');
                const href = card.getAttribute('href');
                if (href && href !== '#') {
                    window.location.href = href;
                }
            }
        });
    }

    setupNavigationButtons() {
        document.addEventListener('click', (e) => {
            if (e.target.closest('.nav-item')) {
                const navItem = e.target.closest('.nav-item');
                const href = navItem.getAttribute('href');
                if (href && href !== '#') {
                    window.location.href = href;
                }
            }
        });
    }

    setupTransferTypeCards() {
        const transferTypeCards = document.querySelectorAll('.transfer-type-card');
        transferTypeCards.forEach(card => {
            card.addEventListener('click', () => this.selectTransferType(card));
        });

        if (transferTypeCards.length > 0) {
            this.selectTransferType(transferTypeCards[0]);
        }
    }

    selectTransferType(selectedCard) {
        document.querySelectorAll('.transfer-type-card').forEach(card => {
            card.classList.remove('active');
        });
        
        selectedCard.classList.add('active');
        
        const type = selectedCard.dataset.type;
        this.updateTransferForm(type);
        this.logFraudEvent(`User selected transfer type: ${type}`);
    }

    updateTransferForm(type) {
        const recipientSection = document.querySelector('.form-section:nth-child(2)');
        
        if (type === 'internal') {
            this.showInternalTransferForm();
        } else {
            this.showExternalTransferForm(type);
        }
        
        // Update form based on current balances
        this.updateAccountSelector();
    }

    showInternalTransferForm() {
        const recipientSection = document.querySelector('.form-section:nth-child(2)');
        if (recipientSection) {
            const account = this.accounts[this.currentUser];
            recipientSection.innerHTML = `
                <h3>To Account</h3>
                <div class="account-selector">
                    <select id="toAccount" required>
                        <option value="">Select Destination Account</option>
                        <option value="business-savings">Business Savings (****5678) - ${this.formatCurrency(account.businessSavingsBalance)}</option>
                        <option value="business-checking">Business Checking (****1234) - ${this.formatCurrency(account.businessCheckingBalance)}</option>
                    </select>
                </div>
            `;
        }
    }

    showExternalTransferForm(type) {
        const recipientSection = document.querySelector('.form-section:nth-child(2)');
        if (recipientSection) {
            const title = type === 'international' ? 'To Account (International)' : 'To Account (Domestic)';
            recipientSection.innerHTML = `
                <h3>${title}</h3>
                <div class="form-grid">
                    <div class="input-group">
                        <label for="recipientName">Recipient Name</label>
                        <input type="text" id="recipientName" required placeholder="Full name of recipient">
                    </div>
                    <div class="input-group">
                        <label for="bankName">Bank Name</label>
                        <input type="text" id="bankName" required placeholder="Recipient's bank name">
                    </div>
                    <div class="input-group">
                        <label for="accountNumber">Account Number</label>
                        <input type="text" id="accountNumber" required placeholder="Recipient's account number">
                    </div>
                    <div class="input-group">
                        <label for="routingNumber">Routing Number</label>
                        <input type="text" id="routingNumber" required placeholder="Bank routing number">
                    </div>
                    ${type === 'international' ? `
                    <div class="input-group">
                        <label for="swiftCode">SWIFT Code</label>
                        <input type="text" id="swiftCode" placeholder="Bank SWIFT/BIC code" required>
                    </div>` : ''}
                </div>
            `;
        }
    }

    async handleLogin(e) {
        e.preventDefault();
        
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value.trim();

        if (!username || !password) {
            this.showError('Please enter username and password');
            return;
        }

        const loginBtn = document.querySelector('.login-btn');
        const originalText = loginBtn.innerHTML;
        loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing In...';
        loginBtn.disabled = true;

        try {
            const success = await this.authenticate(username, password);
            if (success) {
                this.currentUser = username;
                localStorage.setItem('currentBankUser', username);
                this.logFraudEvent(`User ${username} logged in successfully`);
                window.location.href = 'dashboard.html';
            } else {
                this.showError('Invalid username or password');
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showError('Login failed. Please try again.');
        } finally {
            loginBtn.innerHTML = originalText;
            loginBtn.disabled = false;
        }
    }

    async authenticate(username, password) {
        const account = this.accounts[username];
        return account && account.password === password;
    }

    // FIXED: Transfer handling with proper transaction recording
    async handleTransfer(e) {
        e.preventDefault();
        
        const transferData = this.collectTransferData();
        if (!this.validateTransferData(transferData)) {
            return;
        }

        const submitBtn = document.querySelector('.transfer-submit-btn');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
        submitBtn.disabled = true;

        try {
            await this.processTransfer(transferData);
        } catch (error) {
            console.error('Transfer error:', error);
            this.showError('Transfer failed. Please try again.');
        } finally {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }

    collectTransferData() {
        const activeType = document.querySelector('.transfer-type-card.active').dataset.type;
        
        const data = {
            type: activeType,
            fromAccount: document.getElementById('fromAccount').value,
            amount: parseFloat(document.getElementById('transferAmount').value),
            date: document.getElementById('transferDate').value,
            memo: document.getElementById('transferMemo').value,
            securityCode: document.getElementById('securityCode').value
        };

        if (activeType === 'internal') {
            data.toAccount = document.getElementById('toAccount').value;
        } else {
            data.recipientName = document.getElementById('recipientName').value;
            data.bankName = document.getElementById('bankName').value;
            data.accountNumber = document.getElementById('accountNumber').value;
            data.routingNumber = document.getElementById('routingNumber').value;
            
            if (activeType === 'international') {
                data.swiftCode = document.getElementById('swiftCode')?.value;
            }
        }

        return data;
    }

    validateTransferData(data) {
        if (!data.fromAccount) {
            this.showError('Please select a source account');
            return false;
        }

        if (!data.amount || data.amount <= 0) {
            this.showError('Please enter a valid amount');
            return false;
        }

        if (!data.securityCode || !/^\d{4}$/.test(data.securityCode)) {
            this.showError('Please enter a valid 4-digit security code');
            return false;
        }

        if (data.type === 'internal') {
            if (!data.toAccount) {
                this.showError('Please select a destination account');
                return false;
            }
            if (data.fromAccount === data.toAccount) {
                this.showError('Source and destination accounts cannot be the same');
                return false;
            }
        } else {
            if (!data.recipientName || !data.bankName || !data.accountNumber || !data.routingNumber) {
                this.showError('Please fill in all recipient details');
                return false;
            }
        }

        return true;
    }

    // FIXED: Process transfer with proper balance updates and transaction recording
    async processTransfer(transferData) {
        const account = this.accounts[this.currentUser];
        const fee = this.calculateTransferFee(transferData.amount, transferData.type);
        const totalDebit = transferData.amount + fee;

        // Get source balance
        const sourceBalance = transferData.fromAccount === 'business-checking' ? 
            account.businessCheckingBalance : account.businessSavingsBalance;

        if (sourceBalance < totalDebit) {
            this.showError('Insufficient funds for this transfer');
            return;
        }

        const transactionId = this.generateTransactionId();
        const currentDate = new Date().toISOString().replace('T', ' ').substr(0, 19);

        // FIXED: Update balances properly
        if (transferData.fromAccount === 'business-checking') {
            account.businessCheckingBalance -= totalDebit;
        } else {
            account.businessSavingsBalance -= totalDebit;
        }

        // For internal transfers, update destination account
        if (transferData.type === 'internal') {
            if (transferData.toAccount === 'business-checking') {
                account.businessCheckingBalance += transferData.amount;
            } else {
                account.businessSavingsBalance += transferData.amount;
            }

            // Add incoming transaction for internal transfer
            const incomingTransaction = {
                id: this.generateTransactionId(),
                date: currentDate,
                type: 'Incoming Transfer',
                amount: transferData.amount,
                description: `Internal transfer from ${transferData.fromAccount}`,
                account: transferData.toAccount,
                status: 'completed'
            };
            account.transactions.push(incomingTransaction);
        }

        // FIXED: Add outgoing transaction
        const outgoingTransaction = {
            id: transactionId,
            date: currentDate,
            type: transferData.type === 'internal' ? 'Internal Transfer' : 'Outgoing Transfer',
            amount: -transferData.amount,
            description: this.getTransferDescription(transferData),
            account: transferData.fromAccount,
            status: 'completed',
            fee: fee
        };

        account.transactions.push(outgoingTransaction);

        // FIXED: Save data immediately to Firebase
        await this.saveData();

        // Log fraud event
        this.logFraudEvent(`TRANSFER EXECUTED - $${transferData.amount} - ${this.getTransferDescription(transferData)}`);

        // Show confirmation and update UI
        this.showTransferConfirmation(transferData, outgoingTransaction);
        this.updateBalanceDisplays();
        
        // Show success message
        this.showSuccess('Transfer completed successfully!');
    }

    getTransferDescription(transferData) {
        if (transferData.type === 'internal') {
            return `Internal transfer to ${transferData.toAccount.replace('business-', '').replace('-', ' ')}`;
        } else {
            return `Transfer to ${transferData.recipientName} at ${transferData.bankName}`;
        }
    }

    calculateTransferFee(amount, type) {
        switch (type) {
            case 'internal':
                return 0;
            case 'domestic':
                return amount < 1000 ? 0 : 15.00;
            case 'international':
                return 25.00;
            default:
                return 0;
        }
    }

    setupTransferFormListeners() {
        const amountInput = document.getElementById('transferAmount');
        if (amountInput) {
            amountInput.addEventListener('input', () => this.updateTransferSummary());
        }
    }

    updateTransferSummary() {
        const amount = parseFloat(document.getElementById('transferAmount').value) || 0;
        const activeType = document.querySelector('.transfer-type-card.active')?.dataset.type || 'domestic';
        const fee = this.calculateTransferFee(amount, activeType);
        const total = amount + fee;

        const summaryAmount = document.getElementById('summaryAmount');
        const summaryFee = document.getElementById('summaryFee');
        const summaryTotal = document.getElementById('summaryTotal');

        if (summaryAmount) summaryAmount.textContent = this.formatCurrency(amount);
        if (summaryFee) summaryFee.textContent = this.formatCurrency(fee);
        if (summaryTotal) summaryTotal.textContent = this.formatCurrency(total);
    }

    showTransferConfirmation(transferData, transaction) {
        const modal = document.getElementById('transferModal');
        if (modal) {
            const refEl = document.getElementById('confirmationRef');
            const amountEl = document.getElementById('confirmationAmount');
            const recipientEl = document.getElementById('confirmationRecipient');
            const deliveryEl = document.getElementById('confirmationDelivery');

            if (refEl) refEl.textContent = transaction.id;
            if (amountEl) amountEl.textContent = this.formatCurrency(transferData.amount);
            if (recipientEl) {
                recipientEl.textContent = transferData.type === 'internal' ? 
                    transferData.toAccount.replace('business-', '').replace('-', ' ') : 
                    transferData.recipientName;
            }
            if (deliveryEl) deliveryEl.textContent = transferData.type === 'internal' ? 'Immediate' : 'Next business day';

            modal.classList.add('show');
        }
    }

    generateTransactionId() {
        return 'TXN' + Date.now().toString(36).toUpperCase() + 
               Math.random().toString(36).substr(2, 3).toUpperCase();
    }

    // FIXED: Load user data with proper balance updates
    async loadUserData() {
        const storedUser = localStorage.getItem('currentBankUser');
        if (storedUser && this.accounts[storedUser]) {
            this.currentUser = storedUser;
            this.updateUserInterface();
        } else {
            window.location.href = 'index.html';
        }
    }

    updateUserInterface() {
        const userElements = document.querySelectorAll('#currentUser');
        userElements.forEach(el => {
            if (el) el.textContent = this.currentUser;
        });

        this.updateBalanceDisplays();
        this.loadRecentTransactions();
        this.loadAllTransactionsForHistory();
    }

    // FIXED: Update balance displays with proper formatting
    updateBalanceDisplays() {
        const account = this.accounts[this.currentUser];
        if (!account) return;

        // Update dashboard balances
        const checkingEl = document.getElementById('businessCheckingBalance');
        const savingsEl = document.getElementById('businessSavingsBalance');

        if (checkingEl) {
            checkingEl.textContent = this.formatCurrency(account.businessCheckingBalance);
        }
        if (savingsEl) {
            savingsEl.textContent = this.formatCurrency(account.businessSavingsBalance);
        }

        // Update account selector
        this.updateAccountSelector();
    }

    // FIXED: Update account selector with current balances
    updateAccountSelector() {
        const fromAccount = document.getElementById('fromAccount');
        const toAccount = document.getElementById('toAccount');
        
        if (fromAccount && this.currentUser) {
            const account = this.accounts[this.currentUser];
            fromAccount.innerHTML = `
                <option value="">Select Business Account</option>
                <option value="business-checking" selected>Business Checking (****1234) - ${this.formatCurrency(account.businessCheckingBalance)}</option>
                <option value="business-savings">Business Savings (****5678) - ${this.formatCurrency(account.businessSavingsBalance)}</option>
            `;
        }

        if (toAccount && this.currentUser) {
            const account = this.accounts[this.currentUser];
            toAccount.innerHTML = `
                <option value="">Select Destination Account</option>
                <option value="business-savings">Business Savings (****5678) - ${this.formatCurrency(account.businessSavingsBalance)}</option>
                <option value="business-checking">Business Checking (****1234) - ${this.formatCurrency(account.businessCheckingBalance)}</option>
            `;
        }
    }

    // FIXED: Load recent transactions for dashboard
    loadRecentTransactions() {
        const container = document.getElementById('recentTransactionsList');
        if (!container || !this.currentUser) return;

        const account = this.accounts[this.currentUser];
        const recentTxns = account.transactions.slice(-5).reverse();

        if (recentTxns.length === 0) {
            container.innerHTML = '<div class="no-transactions"><p>No recent transactions</p></div>';
            return;
        }

        container.innerHTML = recentTxns.map(txn => `
            <div class="transaction-item">
                <div class="transaction-icon ${this.getTransactionIconClass(txn.type)}">
                    <i class="${this.getTransactionIcon(txn.type)}"></i>
                </div>
                <div class="transaction-details">
                    <div class="transaction-title">${txn.description}</div>
                    <div class="transaction-subtitle">${txn.type} • ${txn.account}</div>
                </div>
                <div class="transaction-amount ${txn.amount >= 0 ? 'incoming' : 'outgoing'}">
                    <div class="amount">${this.formatCurrency(Math.abs(txn.amount))}</div>
                    <div class="transaction-date">${this.formatDate(txn.date)}</div>
                </div>
            </div>
        `).join('');
    }

    // FIXED: Load all transactions for transaction history page
    loadAllTransactionsForHistory() {
        const tableBody = document.getElementById('transactionsTableBody');
        if (!tableBody || !this.currentUser) return;

        const account = this.accounts[this.currentUser];
        const allTxns = account.transactions.slice().reverse(); // Show newest first

        if (allTxns.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 40px;">No transactions found</td></tr>';
            return;
        }

        tableBody.innerHTML = allTxns.map(txn => `
            <tr>
                <td>${this.formatDate(txn.date)}</td>
                <td>${txn.description}</td>
                <td><span class="type-badge ${txn.amount >= 0 ? 'incoming' : 'outgoing'}">${txn.type}</span></td>
                <td>${txn.account.replace('business-', '').replace('-', ' ')}</td>
                <td class="amount ${txn.amount >= 0 ? 'positive' : 'negative'}">${txn.amount >= 0 ? '+' : ''}${this.formatCurrency(Math.abs(txn.amount))}</td>
                <td><span class="status-badge completed">${txn.status}</span></td>
            </tr>
        `).join('');
    }

    getTransactionIcon(type) {
        switch (type) {
            case 'Incoming Transfer':
                return 'fas fa-arrow-down';
            case 'Outgoing Transfer':
                return 'fas fa-arrow-up';
            case 'Internal Transfer':
                return 'fas fa-exchange-alt';
            default:
                return 'fas fa-credit-card';
        }
    }

    getTransactionIconClass(type) {
        switch (type) {
            case 'Incoming Transfer':
                return 'incoming';
            case 'Outgoing Transfer':
                return 'outgoing';
            case 'Internal Transfer':
                return 'internal';
            default:
                return 'internal';
        }
    }

    logout() {
        if (this.currentUser) {
            this.logFraudEvent(`User ${this.currentUser} logged out`);
        }
        
        localStorage.removeItem('currentBankUser');
        localStorage.removeItem('bankAuthToken');
        this.currentUser = null;
        this.authToken = null;
        
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
        }
        
        window.location.href = 'index.html';
    }

    async logFraudEvent(event) {
        if (!this.currentUser) return;
        
        const timestamp = new Date().toISOString();
        const logEntry = `[${timestamp}] ${event}`;
        
        this.accounts[this.currentUser].fraudLog.push(logEntry);
        await this.saveData();
        
        console.log(`🚨 FRAUD LOG: ${logEntry}`);
    }

    formatCurrency(amount) {
        if (isNaN(amount) || amount === null || amount === undefined) {
            return '$0.00';
        }
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    }

    formatDate(dateString) {
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (error) {
            return 'Invalid Date';
        }
    }

    showError(message) {
        const notification = document.createElement('div');
        notification.className = 'error-notification';
        notification.innerHTML = `
            <i class="fas fa-exclamation-triangle"></i>
            <span>${message}</span>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 5000);
    }

    showSuccess(message) {
        const notification = document.createElement('div');
        notification.className = 'success-notification';
        notification.innerHTML = `
            <i class="fas fa-check-circle"></i>
            <span>${message}</span>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 5000);
    }
}

// Initialize the bank app
const bankApp = new BankApp();

// Global functions for HTML
function loadUserData() {
    bankApp.loadUserData();
}

function logout() {
    bankApp.logout();
}

function closeModal() {
    const modal = document.getElementById('transferModal');
    if (modal) {
        modal.classList.remove('show');
    }
}

function initializeTransferForm() {
    bankApp.updateTransferSummary();
}

function startFraudMonitoring() {
    if (bankApp.currentUser) {
        bankApp.logFraudEvent('Fraud monitoring started');
    }
}

// FIXED: Transaction history functions
function loadAllTransactions() {
    bankApp.loadAllTransactionsForHistory();
}

function applyFilters() {
    console.log('Applying transaction filters...');
    bankApp.loadAllTransactionsForHistory();
}

// Statement page functions
function showMonthlyStatements() {
    document.getElementById('monthlyStatementsSection').style.display = 'block';
    document.getElementById('customRangeSection').style.display = 'none';
    document.getElementById('annualSummarySection').style.display = 'none';
}

function showCustomRange() {
    document.getElementById('monthlyStatementsSection').style.display = 'none';
    document.getElementById('customRangeSection').style.display = 'block';
    document.getElementById('annualSummarySection').style.display = 'none';
}

function showAnnualSummary() {
    document.getElementById('monthlyStatementsSection').style.display = 'none';
    document.getElementById('customRangeSection').style.display = 'none';
    document.getElementById('annualSummarySection').style.display = 'block';
}

function viewStatement(period) {
    console.log('Viewing statement for:', period);
}

function downloadStatement(period) {
    console.log('Downloading statement for:', period);
}

function generateCustomStatement() {
    console.log('Generating custom statement');
}

function downloadTaxDoc(docType) {
    console.log('Downloading tax document:', docType);
}

function closeStatementViewer() {
    const modal = document.getElementById('statementModal');
    if (modal) {
        modal.classList.remove('show');
    }
}
