const express = require('express');
const router = express.Router();
const careerController = require('../controllers/CounselorController');

// ==================== COUNSELING SESSION ROUTES ====================

// Schedule a new counseling session
router.post('/sessions/schedule', careerController.scheduleSession);

// Get all sessions for a user
router.get('/sessions/user/:user_id', careerController.getUserSessions);

// Get all sessions for a counselor
router.get('/sessions/counselor/:counselor_id', careerController.getCounselorSessions);

// Update session status with notes
router.put('/sessions/:session_id/status', careerController.updateSessionStatus);

// ==================== CAREER ASSESSMENT ROUTES ====================

// Create a new career assessment
router.post('/assessments/create', careerController.createAssessment);

// Get all assessments for a user
router.get('/assessments/user/:user_id', careerController.getUserAssessments);

// ==================== CAREER GOALS ROUTES ====================

// Create a new career goal
router.post('/goals/create', careerController.createCareerGoal);

// Get all career goals for a user
router.get('/goals/user/:user_id', careerController.getUserGoals);

// Update career goal progress
router.put('/goals/:goal_id/progress', careerController.updateGoalProgress);

// ==================== JOB APPLICATION ROUTES ====================

// Apply for a job
router.post('/applications/apply', careerController.applyForJob);

// Get all job applications for a user
router.get('/applications/user/:user_id', careerController.getUserApplications);

// Update job application status (for employers/counselors)
router.put('/applications/:application_id/status', careerController.updateApplicationStatus);

// ==================== JOB MATCHING ROUTES ====================

// Generate job matches for a user
router.post('/matches/generate/:user_id', careerController.generateJobMatches);

// Get job matches for a user
router.get('/matches/user/:user_id', careerController.getUserJobMatches);

// ==================== COUNSELING RESOURCES ROUTES ====================

// Create a new counseling resource
router.post('/resources/create', careerController.createResource);

// Get all counseling resources (with optional filters)
router.get('/resources', careerController.getAllResources);

// ==================== COUNSELOR ROUTES ====================

// Get all available counselors
router.get('/counselors', careerController.getAllCounselors);

module.exports = router;
