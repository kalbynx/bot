const express = require('express');
const bodyParser = require('body-parser');
const app = express();

// Middleware
app.use(bodyParser.json());
// Add CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, pass-key');
  next();
});

// Mock database
let users = {
    "123456789": {
        _id: "685423aa7e3e1dbe06124b7f",
        username: "Yaba101",
        chatId: "123456789",
        bonus: 0,
        phoneNumber: "0912345678",
        role: false,
        balance: 5000,
        banned: false,
        verified: true,
        invitedBy: null,
        inviteCount: 0,
        createdAt: "2025-06-19T14:50:18.483Z",
        updatedAt: "2025-06-21T14:41:14.631Z",
        __v: 0
    },
    "987654321": {
        _id: "685423aa7e3e1dbe06124b80",
        username: "testuser",
        chatId: "987654321",
        bonus: 0,
        phoneNumber: "0987654321",
        role: false,
        balance: 7000,
        banned: false,
        verified: true,
        invitedBy: null,
        inviteCount: 0,
        createdAt: "2025-06-19T14:50:18.483Z",
        updatedAt: "2025-06-21T14:41:14.631Z",
        __v: 0
    },
    "8164681148": {
        _id: "685423aa7e3e1dbe06124b81",
        username: "kkk",
        chatId: "8164681148",
        bonus: 0,
        phoneNumber: "0987654321",
        role: false,
        balance: 7000,
        banned: false,
        verified: true,
        invitedBy: null,
        inviteCount: 0,
        createdAt: "2025-06-19T14:50:18.483Z",
        updatedAt: "2025-06-21T14:41:14.631Z",
        __v: 0
    },
    "1133538088": {
        _id: "685423aa7e3e1dbe06124b82",
        username: "SonofGod26",
        chatId: "1133538088",
        bonus: 0,
        phoneNumber: "0912345678",
        role: false,
        balance: 1900,
        banned: false,
        verified: true,
        invitedBy: null,
        inviteCount: 0,
        createdAt: "2025-06-19T14:50:18.483Z",
        updatedAt: "2025-06-21T14:41:14.631Z",
        __v: 0
    }
};

// Mock transaction history
let transactions = [];

// Authentication middleware
const authenticate = (req, res, next) => {
    const authHeader = req.headers.authorization;
    const passKey = req.headers['pass-key'];
    
    if (!authHeader || !authHeader.startsWith('Bearer ') || !passKey) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    
    // In a real implementation, you would verify the token and pass-key here
    if (passKey !== 'afdasfdsf78as87t3g4b3whf23847dasd') {
        return res.status(401).json({ error: 'Invalid pass-key' });
    }
    
    next();
};

// 1. Get User Wallet Information
app.get('/api/operator/wallet/get/:chatId', authenticate, (req, res) => {
    const chatId = req.params.chatId;
    const user = users[chatId];
    
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }
    
    // Count withdrawals (mock)
    const withdrawalCount = transactions.filter(tx => 
        tx.user_id === chatId && tx.transaction_type === 'withdrawal'
    ).length;
    
    res.json({
        userData: {
            ...user,
            withdrawals: {
                count: withdrawalCount
            }
        }
    });
});

// 2. Process Debit Transaction
app.post('/api/operator/wallet/debit', authenticate, (req, res) => {
    const { transaction_id, round_id, user_id, username, amount, game = 'Ludo', transaction_type, status } = req.body;
    
    // Validate required fields
    if (!user_id || !username || !amount || !round_id || !transaction_id || transaction_type !== 'debit') {
        return res.status(400).json({ error: 'Missing required fields or invalid transaction type' });
    }
    
    // Validate amount is positive number
    if (isNaN(amount) || amount <= 0) {
        return res.status(400).json({ error: 'Invalid amount' });
    }
    
    const user = users[user_id];
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }
    
    // Check for duplicate round_id
    const existingTx = transactions.find(tx => tx.round_id === round_id && tx.transaction_type === 'debit');
    if (existingTx) {
        return res.status(400).json({ error: 'Duplicate round_id detected' });
    }
    
    // Check sufficient balance
    if (user.balance < amount) {
        return res.status(400).json({ error: 'Insufficient balance' });
    }
    
    // Process debit
    user.balance -= amount;
    user.updatedAt = new Date().toISOString();
    
    // Record transaction
    const newTransaction = {
        transaction_id,
        user_id,
        username,
        transaction_type: 'debit',
        amount,
        status: 'completed',
        game,
        round_id,
        rollback: false,
        newBalance: user.balance,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    transactions.push(newTransaction);
    
    res.json({
        success: true,
        message: "Transaction processed successfully",
        data: newTransaction
    });
});

// 3. Process Credit Transaction
app.post('/api/operator/wallet/credit', authenticate, (req, res) => {
    const { transaction_id, round_id, user_id, username, amount, game = 'Ludo', transaction_type, status } = req.body;
    
    // Validate required fields
    if (!user_id || !username || !amount || !round_id || !transaction_id || transaction_type !== 'credit') {
        return res.status(400).json({ error: 'Missing required fields or invalid transaction type' });
    }
    
    // Validate amount is positive number
    if (isNaN(amount) || amount <= 0) {
        return res.status(400).json({ error: 'Invalid amount' });
    }
    
    const user = users[user_id];
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }
    
    // Check for duplicate round_id for credit
    const existingCreditTx = transactions.find(tx => tx.round_id === round_id && tx.transaction_type === 'credit');
    if (existingCreditTx) {
        return res.status(400).json({ error: 'Duplicate round_id detected for credit transaction' });
    }
    
    // Check if corresponding debit exists
    const correspondingDebit = transactions.find(tx => 
        tx.round_id === round_id && 
        tx.transaction_type === 'debit' && 
        tx.user_id === user_id
    );
    
    if (!correspondingDebit) {
        return res.status(400).json({ error: 'No corresponding debit transaction found' });
    }
    
    // Process credit
    user.balance += amount;
    user.updatedAt = new Date().toISOString();
    
    // Record transaction
    const newTransaction = {
        transaction_id,
        user_id,
        username,
        transaction_type: 'credit',
        amount,
        status: 'completed',
        game,
        round_id,
        rollback: false,
        newBalance: user.balance,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    transactions.push(newTransaction);
    
    res.json({
        success: true,
        message: "Credit transaction processed successfully",
        data: newTransaction
    });
});

// 4. Process Rollback Transaction
app.post('/api/operator/wallet/credit/rollback', authenticate, (req, res) => {
    const { transaction_id, round_id, user_id, username, amount, game = 'Ludo', transaction_type, status } = req.body;
    
    // Validate required fields
    if (!user_id || !username || !amount || !round_id || !transaction_id || transaction_type !== 'rollback') {
        return res.status(400).json({ error: 'Missing required fields or invalid transaction type' });
    }
    
    // Validate amount is positive number
    if (isNaN(amount) || amount <= 0) {
        return res.status(400).json({ error: 'Invalid amount' });
    }
    
    const user = users[user_id];
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }
    
    // Check for duplicate round_id for rollback
   
    
    // Check if corresponding debit exists
    const correspondingDebit = transactions.find(tx => 
        tx.round_id === round_id && 
        tx.transaction_type === 'debit' && 
        tx.user_id === user_id
    );
    
    if (!correspondingDebit) {
        return res.status(400).json({ error: 'No corresponding debit transaction found' });
    }
    
    // Process rollback (credit the amount back)
    user.balance += amount;
    user.updatedAt = new Date().toISOString();
    
    // Record transaction
    const newTransaction = {
        transaction_id,
        user_id,
        username,
        transaction_type: 'rollback',
        amount,
        status: 'completed',
        game,
        round_id,
        rollback: true,
        newBalance: user.balance,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    transactions.push(newTransaction);
    
    res.json({
        success: true,
        message: "Rollback transaction processed successfully",
        data: newTransaction
    });
});

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Mock Game Wallet API server running on port ${PORT}`);
    console.log(`Base URL: http://localhost:${PORT}`);
    console.log('Available endpoints:');
    console.log(`- GET http://localhost:${PORT}/api/operator/wallet/get/:chatId - Get user wallet info`);
    console.log(`- POST http://localhost:${PORT}/api/operator/wallet/debit - Process debit transaction`);
    console.log(`- POST http://localhost:${PORT}/api/operator/wallet/credit - Process credit transaction`);
    console.log(`- POST http://localhost:${PORT}/api/operator/wallet/credit/rollback - Process rollback transaction`);
});
