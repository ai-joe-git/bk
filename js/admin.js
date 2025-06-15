// Admin Panel JavaScript - Complete Fixed Version with Enhanced Business Information
class AdminPanel {
    constructor() {
        this.accounts = {};
        this.currentEditingAccount = null;
        this.database = null;
        this.accountsRef = null;
        this.init();
    }

    async init() {
        console.log('🚀 Admin Panel initializing...');
        
        // Wait for Firebase to be available
        await this.waitForFirebase();
        this.database = window.firebaseDatabase;
        this.accountsRef = window.firebaseRef(this.database, 'bankAccounts');
        
        console.log('✅ Firebase connected');
        
        await this.loadAccounts();
        this.setupRealTimeSync();
        this.populateAccountSelector();
        this.setupTransferPreview();
        this.updateStats();
        this.loadFraudLogs();
        
        console.log('✅ Admin Panel initialized');
    }

    async waitForFirebase() {
        let attempts = 0;
        while (!window.firebaseDatabase && attempts < 100) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        if (!window.firebaseDatabase) {
            throw new Error('Firebase not available');
        }
    }

    // Set up real-time sync for admin panel
    setupRealTimeSync() {
        console.log('🔄 Setting up admin real-time sync...');
        
        window.firebaseOnValue(this.accountsRef, (snapshot) => {
            if (snapshot.exists()) {
                const newData = snapshot.val();
                console.log('📡 Admin received Firebase data:', newData);
                this.accounts = newData;
                this.displayAccounts();
                this.updateStats();
                this.loadFraudLogs();
                this.populateAccountSelector();
            }
        }, (error) => {
            console.error('❌ Admin Firebase sync error:', error);
        });
    }

    async loadAccounts() {
        try {
            console.log('📊 Loading accounts...');
            const snapshot = await window.firebaseGet(this.accountsRef);
            if (snapshot.exists()) {
                this.accounts = snapshot.val();
                console.log('✅ Accounts loaded:', this.accounts);
            } else {
                console.log('❌ No accounts found in Firebase');
                this.accounts = {};
            }
        } catch (error) {
            console.error('❌ Error loading accounts:', error);
            this.accounts = {};
        }
        this.displayAccounts();
    }

    displayAccounts() {
        const tableBody = document.getElementById('accountsTableBody');
        if (!tableBody) {
            console.log('❌ Account table body not found');
            return;
        }

        const accountEntries = Object.entries(this.accounts).filter(([key]) => key !== 'lastUpdated');
        console.log('📊 Displaying accounts:', accountEntries);
        
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
                    <button class="action-btn edit" onclick="window.adminPanel.editAccount('${username}')" title="Edit Account">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn balance" onclick="window.adminPanel.editBalances('${username}')" title="Edit Balances">
                        <i class="fas fa-dollar-sign"></i>
                    </button>
                    <button class="action-btn delete" onclick="window.adminPanel.deleteAccount('${username}')" title="Delete Account">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }

    updateStats() {
        const accountEntries = Object.entries(this.accounts).filter(([key]) => key !== 'lastUpdated');
        const totalAccounts = accountEntries.length;
        
        let totalBalance = 0;
        let totalTransactions = 0;
        
        accountEntries.forEach(([username, account]) => {
            totalBalance += (account.businessCheckingBalance || 0) + (account.businessSavingsBalance || 0);
            totalTransactions += account.transactions ? account.transactions.length : 0;
        });

        const totalAccountsEl = document.getElementById('totalAccounts');
        const totalBalanceEl = document.getElementById('totalBalance');
        const totalTransactionsEl = document.getElementById('totalTransactions');

        if (totalAccountsEl) totalAccountsEl.textContent = totalAccounts;
        if (totalBalanceEl) totalBalanceEl.textContent = this.formatCurrency(totalBalance);
        if (totalTransactionsEl) totalTransactionsEl.textContent = totalTransactions;
        
        console.log('📊 Stats updated:', { totalAccounts, totalBalance, totalTransactions });
    }

    // Populate account selector for incoming transfers
    populateAccountSelector() {
        const selector = document.getElementById('targetAccount');
        if (!selector) {
            console.log('❌ Target account selector not found');
            return;
        }

        const accountEntries = Object.entries(this.accounts).filter(([key]) => key !== 'lastUpdated');
        console.log('📊 Populating account selector with:', accountEntries);
        
        selector.innerHTML = '<option value="">Select Account</option>' + 
            accountEntries.map(([username, account]) => 
                `<option value="${username}">${username} - ${account.companyName || 'Unknown Company'}</option>`
            ).join('');
    }

    // Setup transfer preview updates
    setupTransferPreview() {
        const inputs = ['transferAmount', 'targetAccount', 'targetAccountType', 'senderName', 'transferDescription'];
        
        inputs.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('input', () => this.updateTransferPreview());
            }
        });
    }

    // Update transfer preview
    updateTransferPreview() {
        const amount = document.getElementById('transferAmount')?.value;
        const targetAccount = document.getElementById('targetAccount')?.value;
        const accountType = document.getElementById('targetAccountType')?.value;
        const senderName = document.getElementById('senderName')?.value;
        const description = document.getElementById('transferDescription')?.value;

        const previewAmount = document.getElementById('previewAmount');
        const previewTarget = document.getElementById('previewTarget');
        const previewSender = document.getElementById('previewSender');
        const previewDescription = document.getElementById('previewDescription');

        if (previewAmount) previewAmount.textContent = amount ? this.formatCurrency(parseFloat(amount)) : '$0.00';
        
        if (previewTarget) {
            if (targetAccount && accountType) {
                const accountName = accountType.replace('business-', '').replace('-', ' ');
                previewTarget.textContent = `${targetAccount} (${accountName})`;
            } else {
                previewTarget.textContent = 'Select account';
            }
        }
        
        if (previewSender) previewSender.textContent = senderName || 'Enter sender name';
        if (previewDescription) previewDescription.textContent = description || 'Enter description';
    }

    // Simulate incoming transfer
    async simulateIncomingTransfer() {
        console.log('💰 Starting incoming transfer simulation...');
        
        const targetAccount = document.getElementById('targetAccount')?.value;
        const accountType = document.getElementById('targetAccountType')?.value;
        const amount = parseFloat(document.getElementById('transferAmount')?.value);
        const transferType = document.getElementById('transferType')?.value;
        const senderName = document.getElementById('senderName')?.value?.trim();
        const description = document.getElementById('transferDescription')?.value?.trim();
        const senderBank = document.getElementById('senderBank')?.value?.trim();
        let referenceNumber = document.getElementById('referenceNumber')?.value?.trim();

        // Validation
        if (!targetAccount || !accountType || !amount || !senderName || !description) {
            this.showError('Please fill in all required fields');
            return;
        }

        if (amount <= 0) {
            this.showError('Amount must be greater than 0');
            return;
        }

        // Generate reference number if not provided
        if (!referenceNumber) {
            referenceNumber = this.generateReferenceNumber(transferType);
        }

        this.showLoading();

        try {
            const account = this.accounts[targetAccount];
            if (!account) {
                throw new Error('Target account not found');
            }

            // Update balance
            if (accountType === 'business-checking') {
                account.businessCheckingBalance = (account.businessCheckingBalance || 0) + amount;
            } else {
                account.businessSavingsBalance = (account.businessSavingsBalance || 0) + amount;
            }

            // Create transaction record
            const transaction = {
                id: this.generateTransactionId(),
                date: new Date().toISOString().replace('T', ' ').substr(0, 19),
                type: 'Incoming Transfer',
                amount: amount,
                description: `${description} - From: ${senderName}${senderBank ? ` (${senderBank})` : ''}`,
                account: accountType,
                status: 'completed',
                reference: referenceNumber,
                sender: senderName,
                senderBank: senderBank || 'External Bank',
                transferType: transferType,
                simulatedBy: 'Admin'
            };

            // FIXED: Ensure transactions array exists before pushing
            if (!account.transactions || !Array.isArray(account.transactions)) {
                account.transactions = [];
                console.log('✅ Initialized transactions array for:', targetAccount);
            }
            account.transactions.push(transaction);

            // Log admin action
            if (!account.fraudLog) {
                account.fraudLog = [];
            }
            const logEntry = `[${new Date().toISOString()}] ADMIN: Simulated incoming transfer of ${this.formatCurrency(amount)} to ${targetAccount} (${accountType}) from ${senderName}`;
            account.fraudLog.push(logEntry);

            // Save to Firebase
            await this.saveAccounts();

            // Clear form
            this.clearTransferForm();

            setTimeout(() => {
                this.hideLoading();
                this.showSuccess(`Incoming transfer of ${this.formatCurrency(amount)} simulated successfully!`);
            }, 1500);

        } catch (error) {
            console.error('❌ Error simulating transfer:', error);
            this.hideLoading();
            this.showError('Failed to simulate incoming transfer');
        }
    }

    // Generate reference number based on transfer type
    generateReferenceNumber(transferType) {
        const timestamp = Date.now().toString(36).toUpperCase();
        const random = Math.random().toString(36).substr(2, 3).toUpperCase();
        
        const prefixes = {
            'client-payment': 'CP',
            'salary-deposit': 'SAL',
            'investment-return': 'INV',
            'loan-disbursement': 'LOAN',
            'refund': 'REF',
            'government-payment': 'GOV',
            'insurance-claim': 'INS',
            'other': 'TXN'
        };

        return `${prefixes[transferType] || 'TXN'}${timestamp}${random}`;
    }

    // Generate transaction ID
    generateTransactionId() {
        return 'TXN' + Date.now().toString(36).toUpperCase() + 
               Math.random().toString(36).substr(2, 3).toUpperCase();
    }

    // Clear transfer form
    clearTransferForm() {
        const elements = [
            'targetAccount', 'targetAccountType', 'transferAmount', 
            'transferType', 'senderName', 'transferDescription', 
            'senderBank', 'referenceNumber'
        ];
        
        elements.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                if (element.tagName === 'SELECT') {
                    element.selectedIndex = 0;
                } else {
                    element.value = '';
                }
            }
        });
        
        this.updateTransferPreview();
    }

    showAddAccountModal() {
        this.currentEditingAccount = null;
        const modalTitle = document.getElementById('modalTitle');
        if (modalTitle) modalTitle.textContent = 'Add New Account';
        this.clearForm();
        const modal = document.getElementById('accountModal');
        if (modal) modal.classList.add('show');
    }

    // ENHANCED: editAccount function to populate all fields including business information
    editAccount(username) {
        this.currentEditingAccount = username;
        const account = this.accounts[username];
        
        const modalTitle = document.getElementById('modalTitle');
        if (modalTitle) modalTitle.textContent = 'Edit Account';
        
        // Populate ALL form fields including new business information
        const fields = {
            'editUsername': username,
            'editPassword': account.password || '',
            'editCompanyName': account.companyName || '',
            'editBusinessType': account.businessType || 'C-Corporation',
            'editEIN': account.ein || '',
            'editCountryOfIncorporation': account.countryOfIncorporation || 'United States',
            'editIndustry': account.industry || 'Software Development',
            'editWebsite': account.website || '',
            'editAddress': account.address || '',
            'editPhone': account.phone || '',
            'editEmail': account.email || '',
            'editCheckingBalance': account.businessCheckingBalance || 0,
            'editSavingsBalance': account.businessSavingsBalance || 0,
            'editCreditLimit': account.creditLimit || 0,
            'editCreditUsed': account.creditUsed || 0,
            'editAnnualRevenue': account.annualRevenue || 0,
            'editEmployeeCount': account.employeeCount || 1,
            'editYearsInBusiness': account.yearsInBusiness || 0,
            'editCreditRating': account.creditRating || 'A+ (Excellent)',
            // Signatories
            'editPrimaryName': account.signatories?.primary?.name || '',
            'editPrimaryTitle': account.signatories?.primary?.title || '',
            'editPrimaryAuthority': account.signatories?.primary?.authority || 'Unlimited',
            'editSecondaryName': account.signatories?.secondary?.name || '',
            'editSecondaryTitle': account.signatories?.secondary?.title || '',
            'editSecondaryAuthority': account.signatories?.secondary?.authority || 'Up to $50,000',
            'editBackupName': account.signatories?.backup?.name || '',
            'editBackupTitle': account.signatories?.backup?.title || '',
            'editBackupAuthority': account.signatories?.backup?.authority || 'Up to $25,000'
        };

        Object.entries(fields).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) element.value = value;
        });
        
        const modal = document.getElementById('accountModal');
        if (modal) modal.classList.add('show');
    }

    editBalances(username) {
        this.currentEditingAccount = username;
        const account = this.accounts[username];
        
        const fields = {
            'newCheckingBalance': account.businessCheckingBalance || 0,
            'newSavingsBalance': account.businessSavingsBalance || 0,
            'newCreditUsed': account.creditUsed || 0
        };

        Object.entries(fields).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) element.value = value;
        });
        
        const modal = document.getElementById('balanceModal');
        if (modal) modal.classList.add('show');
    }

    // COMPLETELY FIXED: Create accounts EXACTLY like Brown68
    async saveAccount() {
        console.log('💾 Creating account with EXACT Brown68 structure...');
        this.showLoading();
        
        const username = document.getElementById('editUsername')?.value?.trim();
        const password = document.getElementById('editPassword')?.value?.trim();
        
        if (!username || !password) {
            this.hideLoading();
            this.showError('Username and password are required');
            return;
        }

        // Check if this is editing existing account
        const isEditingExisting = this.currentEditingAccount && this.accounts[this.currentEditingAccount];
        
        // FIXED: Create account with EXACT Brown68 structure including initial transaction
        const accountData = {
            password: password,
            companyName: document.getElementById('editCompanyName')?.value?.trim() || 'TechSolutions Inc.',
            businessType: document.getElementById('editBusinessType')?.value || 'C-Corporation',
            businessCheckingBalance: parseFloat(document.getElementById('editCheckingBalance')?.value) || 125847.92,
            businessSavingsBalance: parseFloat(document.getElementById('editSavingsBalance')?.value) || 289234.15,
            creditLimit: parseFloat(document.getElementById('editCreditLimit')?.value) || 250000.00,
            creditUsed: parseFloat(document.getElementById('editCreditUsed')?.value) || 35750.00,
            address: document.getElementById('editAddress')?.value?.trim() || '456 Innovation Drive, Silicon Valley, CA 94025',
            phone: document.getElementById('editPhone')?.value?.trim() || '+1 (555) 987-6543',
            ein: document.getElementById('editEIN')?.value?.trim() || '12-3456789',
            // EXACT Brown68 business fields
            countryOfIncorporation: document.getElementById('editCountryOfIncorporation')?.value || 'United States',
            industry: document.getElementById('editIndustry')?.value || 'Software Development',
            website: document.getElementById('editWebsite')?.value?.trim() || 'www.techsolutions-inc.com',
            email: document.getElementById('editEmail')?.value?.trim() || 'contact@techsolutions-inc.com',
            annualRevenue: parseFloat(document.getElementById('editAnnualRevenue')?.value) || 12500000,
            employeeCount: parseInt(document.getElementById('editEmployeeCount')?.value) || 85,
            yearsInBusiness: parseInt(document.getElementById('editYearsInBusiness')?.value) || 12,
            creditRating: document.getElementById('editCreditRating')?.value || 'A+ (Excellent)',
            // EXACT Brown68 signatories structure
            signatories: {
                primary: {
                    name: document.getElementById('editPrimaryName')?.value?.trim() || 'Robert Brown',
                    title: document.getElementById('editPrimaryTitle')?.value?.trim() || 'CEO',
                    authority: document.getElementById('editPrimaryAuthority')?.value || 'Unlimited'
                },
                secondary: {
                    name: document.getElementById('editSecondaryName')?.value?.trim() || 'Sarah Johnson',
                    title: document.getElementById('editSecondaryTitle')?.value?.trim() || 'CFO',
                    authority: document.getElementById('editSecondaryAuthority')?.value || 'Up to $50,000'
                },
                backup: {
                    name: document.getElementById('editBackupName')?.value?.trim() || 'Michael Chen',
                    title: document.getElementById('editBackupTitle')?.value?.trim() || 'COO',
                    authority: document.getElementById('editBackupAuthority')?.value || 'Up to $25,000'
                }
            }
        };

        // CRITICAL FIX: Create transactions array EXACTLY like Brown68
        if (isEditingExisting && this.accounts[this.currentEditingAccount].transactions) {
            // If editing, preserve existing transactions
            accountData.transactions = this.accounts[this.currentEditingAccount].transactions;
            accountData.fraudLog = this.accounts[this.currentEditingAccount].fraudLog || [];
        } else {
            // NEW ACCOUNT: Create with sample transactions like Brown68
            accountData.transactions = [
                {
                    id: 'TXN001',
                    date: new Date().toISOString().replace('T', ' ').substr(0, 19),
                    type: 'Incoming Transfer',
                    amount: 125000.00,
                    description: `Initial deposit for ${username} - Account Setup`,
                    account: 'business-checking',
                    status: 'completed'
                },
                {
                    id: 'TXN002',
                    date: new Date(Date.now() - 86400000).toISOString().replace('T', ' ').substr(0, 19),
                    type: 'Incoming Transfer',
                    amount: 75000.00,
                    description: `Initial savings deposit for ${username}`,
                    account: 'business-savings',
                    status: 'completed'
                }
            ];
            
            accountData.fraudLog = [
                `[${new Date().toISOString()}] ADMIN: Account created - ${username}`
            ];
        }

        // Add current fraud log entry
        const logEntry = `[${new Date().toISOString()}] ADMIN: Account ${isEditingExisting ? 'updated' : 'created'} - ${username}`;
        accountData.fraudLog.push(logEntry);
        
        console.log('✅ Account created with EXACT Brown68 structure including transactions:', {
            username,
            hasTransactions: Array.isArray(accountData.transactions),
            transactionCount: accountData.transactions.length,
            hasFraudLog: Array.isArray(accountData.fraudLog)
        });
        
        try {
            // If editing and username changed, delete old entry
            if (this.currentEditingAccount && this.currentEditingAccount !== username) {
                delete this.accounts[this.currentEditingAccount];
            }

            // Save account with complete Brown68 structure
            this.accounts[username] = accountData;
            this.accounts.lastUpdated = new Date().toISOString();
            
            // FORCE save to Firebase
            await window.firebaseSet(this.accountsRef, this.accounts);
            console.log('✅ Account saved to Firebase with EXACT Brown68 structure');
            
            setTimeout(async () => {
                await this.loadAccounts();
                this.hideLoading();
                this.closeAccountModal();
                this.showSuccess(`Account ${username} ${isEditingExisting ? 'updated' : 'created'} with complete Brown68 structure - transfers will work!`);
            }, 1000);
            
        } catch (error) {
            console.error('❌ Error saving account:', error);
            this.hideLoading();
            this.showError('Failed to save account');
        }
    }

    // FIXED: Enhanced saveBalances method
    async saveBalances() {
        console.log('💾 Saving balances...');
        this.showLoading();
        
        if (!this.currentEditingAccount) {
            this.hideLoading();
            this.showError('No account selected');
            return;
        }
        
        const account = this.accounts[this.currentEditingAccount];
        const oldChecking = account.businessCheckingBalance || 0;
        const oldSavings = account.businessSavingsBalance || 0;
        const oldCredit = account.creditUsed || 0;
        
        account.businessCheckingBalance = parseFloat(document.getElementById('newCheckingBalance')?.value) || 0;
        account.businessSavingsBalance = parseFloat(document.getElementById('newSavingsBalance')?.value) || 0;
        account.creditUsed = parseFloat(document.getElementById('newCreditUsed')?.value) || 0;
        
        // Log the admin action with details
        if (!account.fraudLog) {
            account.fraudLog = [];
        }
        const logEntry = `[${new Date().toISOString()}] ADMIN: Balance updated for ${this.currentEditingAccount} - Checking: ${this.formatCurrency(oldChecking)} → ${this.formatCurrency(account.businessCheckingBalance)}, Savings: ${this.formatCurrency(oldSavings)} → ${this.formatCurrency(account.businessSavingsBalance)}`;
        account.fraudLog.push(logEntry);
        
        try {
            // FORCE Firebase update
            this.accounts.lastUpdated = new Date().toISOString();
            await window.firebaseSet(this.accountsRef, this.accounts);
            console.log('✅ Balances saved to Firebase successfully');
            
            // Force refresh all data
            setTimeout(async () => {
                await this.loadAccounts();
                this.hideLoading();
                this.closeBalanceModal();
                this.showSuccess('Balances updated successfully');
            }, 1000);
        } catch (error) {
            console.error('❌ Error saving balances:', error);
            this.hideLoading();
            this.showError('Failed to save balances');
        }
    }

    async deleteAccount(username) {
        if (confirm(`Are you sure you want to delete account "${username}"? This action cannot be undone.`)) {
            this.showLoading();
            
            delete this.accounts[username];
            await this.saveAccounts();
            
            setTimeout(() => {
                this.hideLoading();
                this.showSuccess('Account deleted successfully');
            }, 1000);
        }
    }

    loadFraudLogs() {
        const container = document.getElementById('fraudLogsContainer');
        if (!container) {
            console.log('❌ Fraud logs container not found');
            return;
        }

        console.log('📊 Loading fraud logs from accounts:', this.accounts);

        let allLogs = [];
        
        // Get all accounts except lastUpdated
        const accountEntries = Object.entries(this.accounts).filter(([key]) => key !== 'lastUpdated');
        
        accountEntries.forEach(([username, account]) => {
            console.log(`📊 Checking logs for ${username}:`, account.fraudLog);
            
            if (account.fraudLog && Array.isArray(account.fraudLog) && account.fraudLog.length > 0) {
                account.fraudLog.forEach(log => {
                    allLogs.push({ username, log });
                });
            }
        });

        console.log('📊 Total fraud logs found:', allLogs.length);

        if (allLogs.length === 0) {
            container.innerHTML = `
                <div class="no-logs" style="text-align: center; padding: 40px; color: #64748b;">
                    <i class="fas fa-info-circle" style="font-size: 24px; margin-bottom: 12px; display: block;"></i>
                    <p><strong>No activity logs yet</strong></p>
                    <p style="font-size: 14px; opacity: 0.7; margin-top: 8px;">Logs will appear when users:</p>
                    <ul style="font-size: 14px; opacity: 0.7; text-align: left; max-width: 300px; margin: 8px auto;">
                        <li>• Login to accounts</li>
                        <li>• Make transfers</li>
                        <li>• Access different pages</li>
                        <li>• Admin makes changes</li>
                    </ul>
                </div>
            `;
            return;
        }

        // Sort by timestamp (newest first)
        allLogs.sort((a, b) => {
            try {
                const timeA = a.log.split(']')[0]?.substring(1);
                const timeB = b.log.split(']')[0]?.substring(1);
                return new Date(timeB) - new Date(timeA);
            } catch (error) {
                return 0;
            }
        });
        
        // Show only last 50 logs
        allLogs = allLogs.slice(0, 50);

        container.innerHTML = allLogs.map(({ username, log }) => {
            try {
                const timestamp = log.split(']')[0]?.substring(1);
                const message = log.split('] ')[1] || log;
                
                // Determine log type for styling
                let logType = 'info';
                let icon = 'fas fa-info-circle';
                
                if (message.includes('TRANSFER') || message.includes('Transfer')) {
                    logType = 'transfer';
                    icon = 'fas fa-exchange-alt';
                } else if (message.includes('login') || message.includes('Login')) {
                    logType = 'login';
                    icon = 'fas fa-sign-in-alt';
                } else if (message.includes('ADMIN')) {
                    logType = 'admin';
                    icon = 'fas fa-user-shield';
                }
                
                return `
                    <div class="log-entry log-${logType}">
                        <div class="log-header">
                            <span class="log-user">
                                <i class="${icon}" style="margin-right: 6px;"></i>
                                ${username}
                            </span>
                            <span class="log-time">${timestamp ? new Date(timestamp).toLocaleString() : 'Unknown time'}</span>
                        </div>
                        <div class="log-message">${message}</div>
                    </div>
                `;
            } catch (error) {
                console.error('Error rendering log:', error);
                return `
                    <div class="log-entry">
                        <div class="log-message">Error displaying log: ${log}</div>
                    </div>
                `;
            }
        }).join('');
        
        console.log('✅ Fraud logs displayed successfully');
    }

    async clearAllLogs() {
        if (confirm('Are you sure you want to clear all fraud logs?')) {
            Object.values(this.accounts).forEach(account => {
                if (account.fraudLog) {
                    account.fraudLog = [];
                }
            });
            await this.saveAccounts();
            this.loadFraudLogs();
            this.showSuccess('All fraud logs cleared');
        }
    }

    async saveAccounts() {
        this.accounts.lastUpdated = new Date().toISOString();
        
        // Save to Firebase
        try {
            await window.firebaseSet(this.accountsRef, this.accounts);
            console.log('✅ Admin data saved to Firebase');
        } catch (error) {
            console.error('❌ Error saving to Firebase:', error);
            throw error;
        }
    }

    clearForm() {
        const fields = [
            'editUsername', 'editPassword', 'editCompanyName', 'editBusinessType',
            'editEIN', 'editCountryOfIncorporation', 'editIndustry', 'editWebsite',
            'editAddress', 'editPhone', 'editEmail', 'editCheckingBalance', 
            'editSavingsBalance', 'editCreditLimit', 'editCreditUsed',
            'editAnnualRevenue', 'editEmployeeCount', 'editYearsInBusiness', 'editCreditRating',
            'editPrimaryName', 'editPrimaryTitle', 'editPrimaryAuthority',
            'editSecondaryName', 'editSecondaryTitle', 'editSecondaryAuthority',
            'editBackupName', 'editBackupTitle', 'editBackupAuthority'
        ];

        fields.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                if (element.tagName === 'SELECT') {
                    element.selectedIndex = 0;
                } else {
                    element.value = '';
                }
            }
        });
    }

    closeAccountModal() {
        const modal = document.getElementById('accountModal');
        if (modal) modal.classList.remove('show');
    }

    closeBalanceModal() {
        const modal = document.getElementById('balanceModal');
        if (modal) modal.classList.remove('show');
    }

    showLoading() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) overlay.style.display = 'flex';
    }

    hideLoading() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) overlay.style.display = 'none';
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

// Global functions for HTML
function showAddAccountModal() {
    if (window.adminPanel) {
        window.adminPanel.showAddAccountModal();
    }
}

function closeAccountModal() {
    if (window.adminPanel) {
        window.adminPanel.closeAccountModal();
    }
}

function closeBalanceModal() {
    if (window.adminPanel) {
        window.adminPanel.closeBalanceModal();
    }
}

function saveAccount() {
    if (window.adminPanel) {
        window.adminPanel.saveAccount();
    }
}

function saveBalances() {
    if (window.adminPanel) {
        window.adminPanel.saveBalances();
    }
}

function clearAllLogs() {
    if (window.adminPanel) {
        window.adminPanel.clearAllLogs();
    }
}

function simulateIncomingTransfer() {
    if (window.adminPanel) {
        window.adminPanel.simulateIncomingTransfer();
    }
}

function adminLogout() {
    localStorage.removeItem('adminAuth');
    window.location.href = 'admin-login.html';
}

// Initialize admin panel and make it globally available
window.adminPanel = new AdminPanel();
