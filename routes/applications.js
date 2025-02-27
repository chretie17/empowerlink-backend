const express = require('express');
const router = express.Router();
const applicationController = require('../controllers/JobApplicationController');

// Apply for a job
router.post('/apply', applicationController.applyForJob);

// Get all applications (admin only)
router.get('/', applicationController.getAllApplications);

// Get applications by employer
router.get('/employer/:employer_id', applicationController.getEmployerApplications);

// Get applications for a specific job
router.get('/job/:job_id', applicationController.getJobApplications);

// Get applications for a specific user
router.get('/user/:user_id', applicationController.getUserApplications);

// Update application status
router.put('/:id', applicationController.updateApplicationStatus);

// Delete application
router.delete('/:id', applicationController.deleteApplication);

module.exports = router;