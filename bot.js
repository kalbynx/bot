const express = require('express');
const bodyParser = require('body-parser');
const app = express();

// Middleware
app.use(bodyParser.json());
// Add CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  next();
});
// Mock database
let users = {
    "123456789": {
        chatId: "123456789",
        balance: 5000,
        username: "yaba101",
        phoneNumber: "0912345678"
    },
     
    "987654321": {
        chatId: "987654321",
        balance: 7000,
        username: "testuser",
        phoneNumber: "0987654321"
    },

   
    "8164681148": {
        chatId: "8164681148",
        balance: 7000,
        username: "kkk",
        phoneNumber: "0987654321"
    },
        "1133538088": {  // New user from the URL
        chatId: "1133538088",
        balance: 1900,
        username: "SonofGod26",
        firstName: "KB",
        lastName: "",
        phoneNumber: "0912345678" // Adding a mock phone number
    }
};

// Mock transaction history
let transactions = [];

// Authentication middleware (mock)
const authenticate = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    // In a real implementation, you would verify the token here
    next();
};

// 2.1 Get User Details
app.get('/api/userinfo/get/:chatId', authenticate, (req, res) => {
    const chatId = req.params.chatId;
    const user = users[chatId];
    
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({
        userData: {
            chatId: user.chatId,
            balance: user.balance,
            username: user.username,
            phoneNumber: user.phoneNumber
        }
    });
});

// 2.2 Process Debit Transaction
app.post('/api/debit', authenticate, (req, res) => {
    const { user_id, amount, game, round_id, transaction_id } = req.body;
    
    if (!user_id || !amount || !game || !round_id || !transaction_id) {
        return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const user = users[user_id];
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }
    
    if (user.balance < amount) {
        return res.status(400).json({ error: 'Insufficient balance' });
    }
    
    // Process debit
    user.balance -= amount;
    
    // Record transaction
    transactions.push({
        user_id,
        amount,
        game,
        round_id,
        transaction_id,
        type: 'debit',
        timestamp: new Date().toISOString()
    });
    
    res.json({
        success: true,
        new_balance: user.balance,
        transaction_id
    });
});

// 2.3 Process Credit Transaction
app.post('/api/credit', authenticate, (req, res) => {
    const { user_id, amount, game, round_id, transaction_id } = req.body;
    
    if (!user_id || !amount || !game || !round_id || !transaction_id) {
        return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const user = users[user_id];
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }
    
    // Process credit
    user.balance += amount;
    
    // Record transaction
    transactions.push({
        user_id,
        amount,
        game,
        round_id,
        transaction_id,
        type: 'credit',
        timestamp: new Date().toISOString()
    });
    
    res.json({
        success: true,
        new_balance: user.balance,
        transaction_id
    });
});

// 2.4 Process Rollback Transaction
app.post('/api/credit/rollback', authenticate, (req, res) => {
    const { user_id, amount, game, round_id, transaction_id } = req.body;
    
    if (!user_id || !amount || !game || !round_id || !transaction_id) {
        return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const user = users[user_id];
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }
    
    // Find the original transaction to rollback
    const originalTx = transactions.find(tx => 
        tx.round_id === round_id && 
        tx.type === 'debit' && 
        tx.user_id === user_id
    );
    
    if (!originalTx) {
        return res.status(404).json({ error: 'Original transaction not found' });
    }
    
    // Process rollback (credit the amount back)
    user.balance += amount;
    
    // Record rollback transaction
    transactions.push({
        user_id,
        amount,
        game,
        round_id,
        transaction_id,
        type: 'rollback',
        timestamp: new Date().toISOString()
    });
    
    res.json({
        success: true,
        new_balance: user.balance,
        transaction_id
    });
});

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Mock Game Wallet API server running on port ${PORT}`);
    console.log(`Base URL: http://localhost:${PORT}`);
});
