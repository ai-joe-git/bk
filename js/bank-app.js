// Bank Application JavaScript - Complete Fixed Version with Enhanced Firebase Integration
class BankApp {
    constructor() {
        this.accounts = {};
        this.currentUser = null;
        this.authToken = null;
        this.pollingInterval = null;
        this.database = null;
        this.accountsRef = null;
        this.isDataLoaded = false; // ADD: Loading state tracking
        this.init();
    }

    async init() {
        console.log('🚀 BankApp initializing...');
        
        // Wait for Firebase to be available
        await this.waitForFirebase();
        this.database = window.firebaseDatabase;
        this.accountsRef = window.firebaseRef(this.database, 'bankAccounts');
        
        // Load data FIRST, then set up everything else
        await this.loadStoredData();
        
        // Set up real-time sync AFTER data is loaded
        this.setupRealTimeSync();
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Apply branding if available
        this.applyStoredBranding();
        
        // Initialize dark mode
        setTimeout(() => {
            this.initializeDarkMode();
        }, 100);
        
        console.log('✅ BankApp initialization complete');
    }

    async waitForFirebase() {
        while (!window.firebaseDatabase) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }

    // ANTI-FLASH PROTECTION: Loading management functions
    showPageLoading() {
        const overlay = document.getElementById('pageLoadingOverlay');
        if (overlay) {
            overlay.style.display = 'flex';
            overlay.classList.remove('fade-out');
        }
        
        // Hide main content
        const mainContent = document.querySelector('.bank-main');
        if (mainContent) {
            mainContent.classList.remove('loaded');
        }
        
        console.log('🔄 Page loading overlay shown');
    }

    hidePageLoading() {
        const overlay = document.getElementById('pageLoadingOverlay');
        if (overlay) {
            overlay.classList.add('fade-out');
            setTimeout(() => {
                overlay.style.display = 'none';
            }, 500);
        }
        
        // Show main content
        const mainContent = document.querySelector('.bank-main');
        if (mainContent) {
            mainContent.classList.add('loaded');
        }
        
        // Mark content as loaded
        document.body.classList.add('content-loaded');
        document.documentElement.classList.add('loaded');
        
        this.isDataLoaded = true;
        console.log('✅ Page loading overlay hidden - content revealed');
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

    // ENHANCED REAL-TIME SYNCHRONIZATION - COMPLETE FIX
    setupRealTimeSync() {
        console.log('🔄 Setting up real-time sync...');
        
        // Set up Firebase listener with enhanced error handling
        window.firebaseOnValue(this.accountsRef, (snapshot) => {
            console.log('📡 Firebase listener triggered');
            
            if (snapshot.exists()) {
                const newData = snapshot.val();
                console.log('📊 New data from Firebase:', newData);
                
                // Always update if data exists
                const oldTimestamp = this.accounts.lastUpdated;
                const newTimestamp = newData.lastUpdated;
                
                console.log('🕐 Old timestamp:', oldTimestamp);
                console.log('🕐 New timestamp:', newTimestamp);
                
                // Update accounts data
                this.accounts = newData;
                
                // Apply branding changes if they exist
                this.applyStoredBranding();
                
                // FORCE IMMEDIATE UI UPDATE
                this.immediateUIUpdate();
                
                // Force complete page refresh if major changes detected
                if (this.currentUser && this.accounts[this.currentUser]) {
                    this.updateUserInterface();
                    // Force reload all page elements
                    setTimeout(() => {
                        this.loadRecentTransactions();
                        this.updateBalanceDisplays();
                    }, 100);
                }
                
                console.log('✅ Data updated and UI refreshed');
            } else {
                console.log('❌ No data exists in Firebase');
            }
        }, (error) => {
            console.error('❌ Firebase sync error:', error);
        });
    }

    // ADDED: Apply stored branding settings
    applyStoredBranding() {
        if (this.accounts.brandingSettings) {
            const settings = this.accounts.brandingSettings;
            
            // Update all logo text elements
            document.querySelectorAll('.bank-logo span, .bank-logo h1').forEach(el => {
                if (el && (el.textContent.includes('SecureBank') || el.textContent.includes('Bank'))) {
                    el.textContent = settings.logoText;
                }
            });
            
            // Update all logo icons
            document.querySelectorAll('.bank-logo i').forEach(el => {
                if (el && (el.className.includes('university') || el.className.includes('landmark') || el.className.includes('building'))) {
                    el.className = settings.logoIcon;
                    el.style.color = settings.logoColor;
                }
            });
            
            // Update CSS variables
            document.documentElement.style.setProperty('--bank-primary', settings.primaryColor);
            document.documentElement.style.setProperty('--bank-warning', settings.logoColor);
            
            console.log('✅ Branding applied:', settings);
        }
    }

    // NEW: Immediate UI update function
    immediateUIUpdate() {
        console.log('⚡ Immediate UI update triggered');
        
        if (!this.currentUser || !this.accounts[this.currentUser]) {
            console.log('❌ No user or account data for UI update');
            return;
        }
        
        // Update user display
        const userElements = document.querySelectorAll('#currentUser');
        userElements.forEach(el => {
            if (el) el.textContent = this.currentUser;
        });

        // Update balances immediately
        this.updateBalanceDisplays();
        
        // Apply branding immediately
        this.applyStoredBranding();
        
        // Force update page-specific content
        const currentPage = window.location.pathname;
        console.log('📄 Current page:', currentPage);
        
        if (currentPage.includes('dashboard') || currentPage.endsWith('/') || currentPage.endsWith('dashboard.html')) {
            console.log('📊 Updating dashboard content...');
            setTimeout(() => {
                this.loadRecentTransactions();
            }, 50);
        }
        
        if (currentPage.includes('transactions') || currentPage.endsWith('transactions.html')) {
            console.log('📋 Updating transactions content...');
            setTimeout(() => {
                this.loadAllTransactionsForHistory();
            }, 50);
        }
        
        console.log('✅ UI updated with anti-flash protection');
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
                // ADDED: Account numbers and banking details
                checkingAccountNumber: '4521-1234-5678-9012',
                savingsAccountNumber: '4521-5678-9012-3456',
                iban: 'US12BANK4521123456789012',
                swift: 'SBPROUS33',
                // ADDED: Enhanced business information fields
                countryOfIncorporation: 'United States',
                industry: 'Software Development',
                website: 'www.techsolutions-inc.com',
                email: 'contact@techsolutions-inc.com',
                annualRevenue: 12500000,
                employeeCount: 85,
                yearsInBusiness: 12,
                creditRating: 'A+ (Excellent)',
                signatories: {
                    primary: {
                        name: 'Robert Brown',
                        title: 'CEO',
                        authority: 'Unlimited'
                    },
                    secondary: {
                        name: 'Sarah Johnson',
                        title: 'CFO',
                        authority: 'Up to $50,000'
                    },
                    backup: {
                        name: 'Michael Chen',
                        title: 'COO',
                        authority: 'Up to $25,000'
                    }
                },
                transactions: [
                    {
                        id: 'TXN001',
                        date: '2025-01-15 14:30:22',
                        type: 'Incoming Transfer',
                        amount: 125000.00,
                        description: 'Client Payment - Microsoft Corp (Invoice #INV-2025-001)',
                        account: 'business-checking',
                        status: 'completed',
                        delivery: 'Immediate'
                    },
                    {
                        id: 'TXN002',
                        date: '2025-01-14 09:15:10',
                        type: 'Outgoing Transfer',
                        amount: -45000.00,
                        description: 'Payroll Processing - January 2025',
                        account: 'business-checking',
                        status: 'completed',
                        delivery: 'Next business day'
                    },
                    {
                        id: 'TXN003',
                        date: '2025-01-13 16:45:33',
                        type: 'Incoming Transfer',
                        amount: 75000.00,
                        description: 'Client Payment - Google LLC (Invoice #INV-2025-002)',
                        account: 'business-checking',
                        status: 'completed',
                        delivery: 'Immediate'
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
            const savingsNumber = account.savingsAccountNumber || '****5678';
            const checkingNumber = account.checkingAccountNumber || '****1234';
            
            recipientSection.innerHTML = `
                <h3>To Account</h3>
                <div class="account-selector">
                    <select id="toAccount" required>
                        <option value="">Select Destination Account</option>
                        <option value="business-savings">Business Savings (${savingsNumber}) - ${this.formatCurrency(account.businessSavingsBalance)}</option>
                        <option value="business-checking">Business Checking (${checkingNumber}) - ${this.formatCurrency(account.businessCheckingBalance)}</option>
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

    // COMPLETELY FIXED: Process transfer with bulletproof array initialization and delivery status
    async processTransfer(transferData) {
        console.log('🔧 TRANSFER: Starting transfer process...');
        console.log('🔧 TRANSFER: Current user:', this.currentUser);
        
        const account = this.accounts[this.currentUser];
        if (!account) {
            throw new Error('Account not found');
        }
        
        console.log('🔧 TRANSFER: Account found, checking structure...');
        
        // CRITICAL FIX: Always ensure transactions array exists before ANY transfer operation
        if (!account.transactions || !Array.isArray(account.transactions)) {
            console.log('🔧 FIXING: Missing transactions array for', this.currentUser);
            account.transactions = [];
            
            // Save the fix immediately to Firebase
            await this.saveData();
            console.log('✅ FIXED: Added transactions array and saved to Firebase');
        } else {
            console.log('✅ TRANSFER: Transactions array exists with', account.transactions.length, 'transactions');
        }
        
        // CRITICAL FIX: Always ensure fraudLog array exists
        if (!account.fraudLog || !Array.isArray(account.fraudLog)) {
            console.log('🔧 FIXING: Missing fraudLog array for', this.currentUser);
            account.fraudLog = [];
            
            // Save the fix immediately
            await this.saveData();
            console.log('✅ FIXED: Added fraudLog array and saved to Firebase');
        } else {
            console.log('✅ TRANSFER: FraudLog array exists with', account.fraudLog.length, 'entries');
        }
        
        console.log('✅ TRANSFER: Account structure verified, proceeding with transfer');
        
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
                description: `Internal transfer from ${transferData.fromAccount.replace('business-', '').replace('-', ' ')}`,
                account: transferData.toAccount,
                status: 'completed',
                // FIXED: Add delivery status
                delivery: 'Immediate'
            };
            
            // Now we're guaranteed the array exists
            account.transactions.push(incomingTransaction);
            console.log('✅ TRANSFER: Added incoming transaction');
        }

        // FIXED: Add outgoing transaction WITH delivery status
        const outgoingTransaction = {
            id: transactionId,
            date: currentDate,
            type: transferData.type === 'internal' ? 'Internal Transfer' : 'Outgoing Transfer',
            amount: -transferData.amount,
            description: this.getTransferDescription(transferData),
            account: transferData.fromAccount,
            status: 'completed',
            fee: fee,
            // FIXED: Add delivery status to transaction
            delivery: transferData.type === 'internal' ? 'Immediate' : 'Next business day'
        };

        // Now we're guaranteed the array exists
        account.transactions.push(outgoingTransaction);
        console.log('✅ TRANSFER: Added outgoing transaction');

        // FIXED: Save data immediately to Firebase
        await this.saveData();
        console.log('✅ TRANSFER: All data saved to Firebase');

        // Log fraud event
        this.logFraudEvent(`TRANSFER EXECUTED - $${transferData.amount} - ${this.getTransferDescription(transferData)}`);

        // Show confirmation and update UI
        this.showTransferConfirmation(transferData, outgoingTransaction);
        this.updateBalanceDisplays();
        
        // Show success message
        this.showSuccess('Transfer completed successfully!');
        
        console.log('✅ TRANSFER: Transfer process completed successfully');
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

    // ENHANCED: Load user data with anti-flash protection
    async loadUserData() {
        console.log('📊 Loading user data with anti-flash protection...');
        
        // Show loading immediately
        this.showPageLoading();
        
        const storedUser = localStorage.getItem('currentBankUser');
        if (!storedUser) {
            console.log('❌ No stored user, redirecting to login');
            window.location.href = 'index.html';
            return;
        }
        
        this.currentUser = storedUser;
        console.log('👤 Current user set to:', this.currentUser);
        
        // Wait for accounts data to be available
        let attempts = 0;
        while ((!this.accounts || !this.accounts[this.currentUser]) && attempts < 50) {
            console.log(`⏳ Waiting for account data... attempt ${attempts + 1}`);
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        if (!this.accounts || !this.accounts[this.currentUser]) {
            console.log('❌ Account data not found after waiting');
            window.location.href = 'index.html';
            return;
        }
        
        console.log('✅ Account data loaded for user:', this.currentUser);
        
        // Force immediate UI update
        this.immediateUIUpdate();
        
        // Wait a moment to ensure all updates are complete
        setTimeout(() => {
            this.hidePageLoading();
        }, 800); // Small delay to ensure smooth transition
    }

    // ENHANCED: Update user interface with better error handling
    updateUserInterface() {
        console.log('🔄 Updating user interface...');
        
        const userElements = document.querySelectorAll('#currentUser');
        userElements.forEach(el => {
            if (el) el.textContent = this.currentUser;
        });

        this.updateBalanceDisplays();
        
        // Don't call transaction functions here to avoid conflicts
        // They will be called by immediateUIUpdate()
    }

    // COMPLETELY FIXED: updateBalanceDisplays with ALL missing elements properly handled
    updateBalanceDisplays() {
        const account = this.accounts[this.currentUser];
        if (!account) return;

        console.log('💰 FIXING: ALL dashboard elements including missing ones:', account);

        // 1. Update basic balances
        const checkingEl = document.getElementById('businessCheckingBalance');
        const savingsEl = document.getElementById('businessSavingsBalance');

        if (checkingEl) {
            checkingEl.textContent = this.formatCurrency(account.businessCheckingBalance);
        }
        if (savingsEl) {
            savingsEl.textContent = this.formatCurrency(account.businessSavingsBalance);
        }

        // 2. Update credit information
        const creditUsed = account.creditUsed || 0;
        const creditLimit = account.creditLimit || 0;
        const availableCredit = creditLimit - creditUsed;

        const creditUsedEl = document.getElementById('creditUsedDisplay');
        const creditLimitEl = document.getElementById('creditLimitDisplay');
        const availableCreditEl = document.getElementById('availableCredit');

        if (creditUsedEl) {
            creditUsedEl.textContent = `Used: ${this.formatCurrency(creditUsed)}`;
        }
        if (creditLimitEl) {
            creditLimitEl.textContent = `Limit: ${this.formatCurrency(creditLimit)}`;
        }
        if (availableCreditEl) {
            availableCreditEl.textContent = this.formatCurrency(availableCredit);
        }

        // 3. FIXED: Update ALL account numbers display
        const checkingNumberEl = document.getElementById('checkingAccountNumber');
        const savingsNumberEl = document.getElementById('savingsAccountNumber');
        const ibanEl = document.getElementById('accountIBAN');
        const swiftEl = document.getElementById('accountSWIFT');

        if (checkingNumberEl && account.checkingAccountNumber) {
            checkingNumberEl.textContent = account.checkingAccountNumber;
        }
        if (savingsNumberEl && account.savingsAccountNumber) {
            savingsNumberEl.textContent = account.savingsAccountNumber;
        }
        if (ibanEl && account.iban) {
            ibanEl.textContent = account.iban;
        }
        if (swiftEl && account.swift) {
            swiftEl.textContent = account.swift;
        }

        // 4. FIXED: Update ALL business information fields
        const companyElements = [
            document.getElementById('companyNameHeader'),
            document.getElementById('accountHolderName'),
            document.getElementById('legalName'),
            document.getElementById('transferCompanyName'),
            document.getElementById('transactionCompanyName'),
            document.getElementById('statementCompanyName')
        ];
        companyElements.forEach(el => {
            if (el && account.companyName) {
                el.textContent = account.companyName;
            }
        });

        const businessTypeElements = [
            document.getElementById('businessType'),
            document.getElementById('businessTypeDetail')
        ];
        businessTypeElements.forEach(el => {
            if (el && account.businessType) {
                el.textContent = account.businessType;
            }
        });

        const einElements = [
            document.getElementById('companyEIN'),
            document.getElementById('einDetail')
        ];
        einElements.forEach(el => {
            if (el && account.ein) {
                el.textContent = account.ein;
            }
        });

        // 5. FIXED: Update contact information
        const addressEl = document.getElementById('companyAddress');
        if (addressEl && account.address) {
            const cleanAddress = account.address.replace(/8888888/g, '').trim();
            addressEl.innerHTML = cleanAddress.replace(/\n/g, '<br>');
        }

        const phoneEl = document.getElementById('companyPhone');
        if (phoneEl && account.phone) {
            phoneEl.textContent = account.phone;
        }

        // CRITICAL FIX: Update email field that was showing "Loading..."
        const emailElements = [
            document.getElementById('companyEmail'),
            document.getElementById('contactEmail')
        ];
        emailElements.forEach(el => {
            if (el && account.email) {
                el.textContent = account.email;
                console.log('✅ FIXED email display:', account.email);
            }
        });

        const websiteEl = document.getElementById('companyWebsite');
        if (websiteEl && account.website) {
            websiteEl.textContent = account.website;
        }

        const industryEl = document.getElementById('companyIndustry');
        if (industryEl && account.industry) {
            industryEl.textContent = account.industry;
        }

        const countryEl = document.getElementById('countryOfIncorporation');
        if (countryEl && account.countryOfIncorporation) {
            countryEl.textContent = account.countryOfIncorporation;
        }

        // 6. FIXED: Update business metrics
        const revenueEl = document.getElementById('annualRevenue');
        if (revenueEl && account.annualRevenue) {
            revenueEl.textContent = this.formatCurrency(account.annualRevenue);
        }

        const employeesEl = document.getElementById('employeeCount');
        if (employeesEl && account.employeeCount) {
            employeesEl.textContent = account.employeeCount;
        }

        const yearsEl = document.getElementById('yearsInBusiness');
        if (yearsEl && account.yearsInBusiness) {
            yearsEl.textContent = account.yearsInBusiness;
        }

        // CRITICAL FIX: Update ALL credit rating fields that were showing "Loading..."
        const creditRatingElements = [
            document.getElementById('creditRating'),
            document.getElementById('businessCreditRating')
        ];
        creditRatingElements.forEach(el => {
            if (el && account.creditRating) {
                el.textContent = account.creditRating;
                console.log('✅ FIXED credit rating display:', account.creditRating);
            }
        });

        // 7. FIXED: Update signatories
        if (account.signatories) {
            const primaryEl = document.getElementById('primarySignatory');
            if (primaryEl && account.signatories.primary) {
                primaryEl.innerHTML = `<p><strong>Primary:</strong> ${account.signatories.primary.name} (${account.signatories.primary.title})</p><p>Authority: ${account.signatories.primary.authority}</p>`;
            }
            
            const secondaryEl = document.getElementById('secondarySignatory');
            if (secondaryEl && account.signatories.secondary) {
                secondaryEl.innerHTML = `<p><strong>Secondary:</strong> ${account.signatories.secondary.name} (${account.signatories.secondary.title})</p><p>Authority: ${account.signatories.secondary.authority}</p>`;
            }
            
            const backupEl = document.getElementById('backupSignatory');
            if (backupEl && account.signatories.backup) {
                backupEl.innerHTML = `<p><strong>Backup:</strong> ${account.signatories.backup.name} (${account.signatories.backup.title})</p><p>Authority: ${account.signatories.backup.authority}</p>`;
            }
        }

        // 8. CRITICAL FIX: Update savings IBAN that was showing "Loading..."
        const savingsIbanEl = document.getElementById('savingsIBAN');
        if (savingsIbanEl && account.iban) {
            savingsIbanEl.textContent = account.iban;
            console.log('✅ FIXED savings IBAN display:', account.iban);
        }

        // 9. Update DBA name
        const dbaEl = document.getElementById('dbaName');
        if (dbaEl && account.companyName) {
            const dbaName = account.companyName.replace(' Inc.', '').replace(' LLC', '').replace(' Corp', '');
            dbaEl.textContent = dbaName;
        }

        // Update account selector
        this.updateAccountSelector();

        console.log('✅ ALL displays updated successfully - NO MORE LOADING STATES');
    }

    // FIXED: Update account selector with FULL ACCOUNT NUMBERS instead of ****
    updateAccountSelector() {
        const fromAccount = document.getElementById('fromAccount');
        const toAccount = document.getElementById('toAccount');
        
        if (fromAccount && this.currentUser && this.accounts[this.currentUser]) {
            const account = this.accounts[this.currentUser];
            
            // FIXED: Show FULL account numbers instead of ****
            const checkingNumber = account.checkingAccountNumber || '4521-1234-5678-9012';
            const savingsNumber = account.savingsAccountNumber || '4521-5678-9012-3456';
            
            // Update account selector with current balances and FULL account numbers
            fromAccount.innerHTML = `
                <option value="">Select Business Account</option>
                <option value="business-checking" selected>Business Checking (${checkingNumber}) - ${this.formatCurrency(account.businessCheckingBalance)}</option>
                <option value="business-savings">Business Savings (${savingsNumber}) - ${this.formatCurrency(account.businessSavingsBalance)}</option>
            `;
            
            // Remove existing event listener to prevent duplicates
            if (this.handleAccountChange) {
                fromAccount.removeEventListener('change', this.handleAccountChange);
            }
            
            // Create bound event handler
            this.handleAccountChange = (e) => {
                this.updateTransferAccountInfo(e.target.value);
            };
            fromAccount.addEventListener('change', this.handleAccountChange);
            
            // Update account info immediately
            this.updateTransferAccountInfo('business-checking');
        }

        if (toAccount && this.currentUser && this.accounts[this.currentUser]) {
            const account = this.accounts[this.currentUser];
            const checkingNumber = account.checkingAccountNumber || '4521-1234-5678-9012';
            const savingsNumber = account.savingsAccountNumber || '4521-5678-9012-3456';
            
            toAccount.innerHTML = `
                <option value="">Select Destination Account</option>
                <option value="business-savings">Business Savings (${savingsNumber}) - ${this.formatCurrency(account.businessSavingsBalance)}</option>
                <option value="business-checking">Business Checking (${checkingNumber}) - ${this.formatCurrency(account.businessCheckingBalance)}</option>
            `;
        }
    }

    // FIXED: Update transfer account information with Firebase data and ACCOUNT NUMBERS
    updateTransferAccountInfo(selectedAccount) {
        console.log('🔄 Updating transfer account info for user:', this.currentUser);
        
        if (!this.currentUser || !this.accounts[this.currentUser]) {
            console.log('❌ No user or account data');
            return;
        }
        
        const account = this.accounts[this.currentUser];
        console.log('📊 Using account data:', account);
        
        // Update account holder information with Firebase data
        const accountHolderEl = document.getElementById('transferAccountHolder');
        const einEl = document.getElementById('transferEIN');
        const businessTypeEl = document.getElementById('transferBusinessType');
        const signatoryEl = document.getElementById('transferSignatory');
        
        // ADDED: Update account numbers in transfer info
        const accountNumberEl = document.getElementById('transferAccountNumber');
        const ibanEl = document.getElementById('transferIBAN');
        const swiftEl = document.getElementById('transferSWIFT');
        
        if (accountHolderEl) {
            accountHolderEl.textContent = account.companyName || 'Unknown Company';
            console.log('✅ Updated account holder to:', account.companyName);
        }
        
        if (einEl) {
            einEl.textContent = account.ein || 'Not provided';
            console.log('✅ Updated EIN to:', account.ein);
        }
        
        if (businessTypeEl) {
            businessTypeEl.textContent = account.businessType || 'Not specified';
            console.log('✅ Updated business type to:', account.businessType);
        }
        
        if (signatoryEl) {
            if (account.signatories && account.signatories.primary && account.signatories.primary.name) {
                signatoryEl.textContent = `${account.signatories.primary.name} (${account.signatories.primary.title})`;
            } else {
                signatoryEl.textContent = 'Not specified';
            }
            console.log('✅ Updated signatory');
        }
        
        // ADDED: Update account numbers in transfer info
        if (accountNumberEl) {
            const accountNumber = selectedAccount === 'business-checking' ? 
                account.checkingAccountNumber : account.savingsAccountNumber;
            accountNumberEl.textContent = accountNumber || 'Not available';
            console.log('✅ Updated transfer account number to:', accountNumber);
        }
        
        if (ibanEl && account.iban) {
            ibanEl.textContent = account.iban;
            console.log('✅ Updated transfer IBAN to:', account.iban);
        }
        
        if (swiftEl && account.swift) {
            swiftEl.textContent = account.swift;
            console.log('✅ Updated transfer SWIFT to:', account.swift);
        }
        
        // Update company name in notice
        const companyNameEl = document.getElementById('transferCompanyName');
        if (companyNameEl) {
            companyNameEl.textContent = account.companyName || 'Unknown Company';
        }
    }

    // ENHANCED: Load recent transactions with delivery status display
    loadRecentTransactions() {
        console.log('📊 Loading recent transactions...');
        console.log('👤 Current user:', this.currentUser);
        console.log('📦 Accounts data:', this.accounts);
        
        const container = document.getElementById('recentTransactionsList');
        if (!container) {
            console.log('❌ Recent transactions container not found');
            return;
        }

        if (!this.currentUser) {
            console.log('❌ No current user');
            container.innerHTML = '<div class="no-transactions"><p>Please log in to view transactions</p></div>';
            return;
        }

        const account = this.accounts[this.currentUser];
        if (!account) {
            console.log('❌ Account not found for user:', this.currentUser);
            console.log('📦 Available accounts:', Object.keys(this.accounts));
            container.innerHTML = '<div class="no-transactions"><p>Account data not available</p></div>';
            return;
        }

        console.log('📊 Account data:', account);

        if (!account.transactions || !Array.isArray(account.transactions)) {
            console.log('❌ No transactions array found');
            console.log('📊 Account transactions:', account.transactions);
            container.innerHTML = '<div class="no-transactions"><p>No recent transactions</p></div>';
            return;
        }

        const recentTxns = account.transactions.slice(-5).reverse();
        console.log('📊 Found', recentTxns.length, 'recent transactions:', recentTxns);

        if (recentTxns.length === 0) {
            container.innerHTML = '<div class="no-transactions"><p>No recent transactions</p></div>';
            return;
        }

        try {
            // FIXED: Include delivery status in recent transactions display
            container.innerHTML = recentTxns.map(txn => `
                <div class="transaction-item">
                    <div class="transaction-icon ${this.getTransactionIconClass(txn.type)}">
                        <i class="${this.getTransactionIcon(txn.type)}"></i>
                    </div>
                    <div class="transaction-details">
                        <div class="transaction-title">${txn.description}</div>
                        <div class="transaction-subtitle">${txn.type} • ${txn.account.replace('business-', '').replace('-', ' ')}</div>
                        ${txn.delivery ? `<div class="transaction-delivery"><i class="fas fa-clock"></i> ${txn.delivery}</div>` : ''}
                    </div>
                    <div class="transaction-amount ${txn.amount >= 0 ? 'incoming' : 'outgoing'}">
                        <div class="amount">${this.formatCurrency(Math.abs(txn.amount))}</div>
                        <div class="transaction-date">${this.formatDate(txn.date)}</div>
                    </div>
                </div>
            `).join('');
            
            console.log('✅ Recent transactions loaded successfully with delivery status');
        } catch (error) {
            console.error('❌ Error rendering transactions:', error);
            container.innerHTML = '<div class="no-transactions"><p>Error loading transactions</p></div>';
        }
    }

    // ENHANCED: Load all transactions with delivery status in table
    loadAllTransactionsForHistory() {
        console.log('📋 Loading transaction history...');
        console.log('👤 Current user:', this.currentUser);
        
        const tableBody = document.getElementById('transactionsTableBody');
        if (!tableBody) {
            console.log('❌ Transaction table body not found');
            return;
        }

        if (!this.currentUser) {
            console.log('❌ No current user');
            tableBody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 40px;">Please log in to view transactions</td></tr>';
            return;
        }

        const account = this.accounts[this.currentUser];
        if (!account) {
            console.log('❌ Account not found for user:', this.currentUser);
            console.log('📦 Available accounts:', Object.keys(this.accounts));
            tableBody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 40px;">Account data not available</td></tr>';
            return;
        }

        console.log('📋 Account data:', account);

        if (!account.transactions || !Array.isArray(account.transactions)) {
            console.log('❌ No transactions array found');
            console.log('📋 Account transactions:', account.transactions);
            tableBody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 40px;">No transactions found</td></tr>';
            return;
        }

        const allTxns = account.transactions.slice().reverse();
        console.log('📋 Found', allTxns.length, 'total transactions:', allTxns);

        if (allTxns.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 40px;">No transactions found</td></tr>';
            return;
        }

        try {
            // FIXED: Include delivery status in transaction history table
            tableBody.innerHTML = allTxns.map(txn => `
                <tr>
                    <td>${this.formatDate(txn.date)}</td>
                    <td>${txn.description}</td>
                    <td><span class="type-badge ${txn.amount >= 0 ? 'incoming' : 'outgoing'}">${txn.type}</span></td>
                    <td>${txn.account.replace('business-', '').replace('-', ' ')}</td>
                    <td class="amount ${txn.amount >= 0 ? 'positive' : 'negative'}">${txn.amount >= 0 ? '+' : ''}${this.formatCurrency(Math.abs(txn.amount))}</td>
                    <td><span class="status-badge completed">${txn.status}</span></td>
                    <td>${txn.delivery || 'N/A'}</td>
                </tr>
            `).join('');
            
            console.log('✅ Transaction history loaded successfully with delivery status');
        } catch (error) {
            console.error('❌ Error rendering transaction history:', error);
            tableBody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 40px;">Error loading transactions</td></tr>';
        }
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

    // ENHANCED: Fraud logging with proper Firebase sync
    async logFraudEvent(event) {
        if (!this.currentUser) return;
        
        const timestamp = new Date().toISOString();
        const logEntry = `[${timestamp}] ${event}`;
        
        // Ensure fraudLog array exists
        if (!this.accounts[this.currentUser].fraudLog) {
            this.accounts[this.currentUser].fraudLog = [];
        }
        
        this.accounts[this.currentUser].fraudLog.push(logEntry);
        
        // Force save to Firebase immediately
        await this.saveData();
        
        console.log(`🚨 FRAUD LOG SAVED: ${logEntry}`);
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

// Make bankApp globally available
window.bankApp = bankApp;

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
