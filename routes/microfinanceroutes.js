const express = require('express');
const router = express.Router();
const microfinanceController = require('../controllers/MicrofinanceController');

// LOAN ROUTES
router.post('/loans/apply', microfinanceController.applyForLoan);
router.get('/loans', microfinanceController.getAllLoans);
router.get('/loans/user/:user_id', microfinanceController.getUserLoans);
router.put('/loans/:loan_id/status', microfinanceController.updateLoanStatus);

// SAVINGS ROUTES
router.post('/savings/create', microfinanceController.createSavingsAccount);
router.post('/savings/deposit', microfinanceController.deposit);
router.post('/savings/withdraw', microfinanceController.withdraw);
router.get('/savings/user/:user_id', microfinanceController.getSavingsAccount);
router.get('/savings', microfinanceController.getAllSavingsAccounts);


// TRAINING ROUTES
router.post('/training/create', microfinanceController.createTrainingProgram);
router.post('/training/enroll', microfinanceController.enrollInTraining);
router.get('/training/programs', microfinanceController.getTrainingPrograms);
router.get('/training/user/:user_id', microfinanceController.getUserTrainings);
router.put('/training/complete', microfinanceController.completeTraining);
router.get('/training/enrollments', microfinanceController.getAllTrainingEnrollments);


module.exports = router;