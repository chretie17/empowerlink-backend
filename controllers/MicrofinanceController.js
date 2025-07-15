const db = require('../config/db');

// LOAN FUNCTIONS
exports.applyForLoan = async (req, res) => {
    const { user_id, amount, purpose, duration_months, income, collateral } = req.body;
    
    // Simple credit scoring (you can make this more complex)
    const creditScore = calculateCreditScore(amount, income);
    const status = creditScore > 600 ? 'approved' : 'pending';
    
    db.query(
        'INSERT INTO loans (user_id, amount, purpose, duration_months, income, collateral, credit_score, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [user_id, amount, purpose, duration_months, income, collateral, creditScore, status],
        (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ 
                message: 'Loan application submitted successfully!',
                loan_id: result.insertId,
                credit_score: creditScore,
                status: status
            });
        }
    );
};

exports.getAllLoans = (req, res) => {
    db.query('SELECT * FROM loans ORDER BY created_at DESC', (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
};

exports.getUserLoans = (req, res) => {
    const { user_id } = req.params;
    db.query('SELECT * FROM loans WHERE user_id = ?', [user_id], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
};

exports.updateLoanStatus = (req, res) => {
    const { loan_id } = req.params;
    const { status } = req.body;
    
    db.query(
        'UPDATE loans SET status = ? WHERE id = ?',
        [status, loan_id],
        (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: 'Loan status updated successfully' });
        }
    );
};

// SAVINGS FUNCTIONS
exports.createSavingsAccount = (req, res) => {
    const { user_id, account_type, initial_deposit } = req.body;
    
    db.query(
        'INSERT INTO savings_accounts (user_id, account_type, balance) VALUES (?, ?, ?)',
        [user_id, account_type, initial_deposit || 0],
        (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ 
                message: 'Savings account created successfully!',
                account_id: result.insertId
            });
        }
    );
};

exports.deposit = (req, res) => {
    const { account_id, amount } = req.body;
    
    db.query(
        'UPDATE savings_accounts SET balance = balance + ? WHERE id = ?',
        [amount, account_id],
        (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            
            // Record transaction
            db.query(
                'INSERT INTO transactions (account_id, type, amount, description) VALUES (?, ?, ?, ?)',
                [account_id, 'deposit', amount, 'Deposit to savings account'],
                (err2, result2) => {
                    if (err2) return res.status(500).json({ error: err2.message });
                    res.json({ message: 'Deposit successful!' });
                }
            );
        }
    );
};

exports.withdraw = (req, res) => {
    const { account_id, amount } = req.body;
    
    // Check balance first
    db.query('SELECT balance FROM savings_accounts WHERE id = ?', [account_id], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0) return res.status(404).json({ message: 'Account not found' });
        
        const currentBalance = results[0].balance;
        if (currentBalance < amount) {
            return res.status(400).json({ message: 'Insufficient funds' });
        }
        
        // Process withdrawal
        db.query(
            'UPDATE savings_accounts SET balance = balance - ? WHERE id = ?',
            [amount, account_id],
            (err, result) => {
                if (err) return res.status(500).json({ error: err.message });
                
                // Record transaction
                db.query(
                    'INSERT INTO transactions (account_id, type, amount, description) VALUES (?, ?, ?, ?)',
                    [account_id, 'withdrawal', amount, 'Withdrawal from savings account'],
                    (err2, result2) => {
                        if (err2) return res.status(500).json({ error: err2.message });
                        res.json({ message: 'Withdrawal successful!' });
                    }
                );
            }
        );
    });
};

exports.getSavingsAccount = (req, res) => {
    const { user_id } = req.params;
    db.query('SELECT * FROM savings_accounts WHERE user_id = ?', [user_id], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
};

// FINANCIAL LITERACY FUNCTIONS
exports.createTrainingProgram = (req, res) => {
    const { title, description, duration, level, topics } = req.body;
    
    db.query(
        'INSERT INTO training_programs (title, description, duration, level, topics) VALUES (?, ?, ?, ?, ?)',
        [title, description, duration, level, JSON.stringify(topics)],
        (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ 
                message: 'Training program created successfully!',
                program_id: result.insertId
            });
        }
    );
};

exports.enrollInTraining = (req, res) => {
    const { user_id, program_id } = req.body;
    
    db.query(
        'INSERT INTO training_enrollments (user_id, program_id, status) VALUES (?, ?, ?)',
        [user_id, program_id, 'enrolled'],
        (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: 'Successfully enrolled in training program!' });
        }
    );
};

exports.getTrainingPrograms = (req, res) => {
    db.query('SELECT * FROM training_programs ORDER BY created_at DESC', (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
};

exports.getUserTrainings = (req, res) => {
    const { user_id } = req.params;
    db.query(
        'SELECT tp.*, te.status, te.enrolled_at FROM training_programs tp JOIN training_enrollments te ON tp.id = te.program_id WHERE te.user_id = ?',
        [user_id],
        (err, results) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(results);
        }
    );
};

exports.completeTraining = (req, res) => {
    const { user_id, program_id } = req.body;
    
    db.query(
        'UPDATE training_enrollments SET status = ?, completed_at = NOW() WHERE user_id = ? AND program_id = ?',
        ['completed', user_id, program_id],
        (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: 'Training completed successfully!' });
        }
    );
};

// UTILITY FUNCTIONS
function calculateCreditScore(amount, income) {
    // Simple credit scoring algorithm
    const incomeRatio = income / amount;
    let score = 500; // Base score
    
    if (incomeRatio >= 3) score += 200;
    else if (incomeRatio >= 2) score += 150;
    else if (incomeRatio >= 1.5) score += 100;
    else if (incomeRatio >= 1) score += 50;
    
    return Math.min(score, 850); // Cap at 850
}
// GET all savings accounts (for admin view)
exports.getAllSavingsAccounts = (req, res) => {
  db.query(
    'SELECT sa.*, u.name AS user_name, u.email FROM savings_accounts sa JOIN users u ON sa.user_id = u.id ORDER BY sa.created_at DESC',
    (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(results);
    }
  );
};

// GET all training enrollments (for admin view)
exports.getAllTrainingEnrollments = (req, res) => {
  db.query(
    `SELECT te.*, u.name AS user_name, p.title AS program_title
     FROM training_enrollments te
     JOIN users u ON te.user_id = u.id
     JOIN training_programs p ON te.program_id = p.id
     ORDER BY te.enrolled_at DESC`,
    (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(results);
    }
  );
};
