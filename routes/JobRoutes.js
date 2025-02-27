const express = require('express');
const router = express.Router();
const jobsController = require('../controllers/jobController');

// General job routes
router.get('/', jobsController.getJobs); // Get all jobs (admin/employer view)
router.get('/users', jobsController.getJobsForUsers); // Get jobs for users (with deadline filter)
router.post('/', jobsController.createJob); // Create a new job
router.put('/:id', jobsController.updateJob); // Update a job
router.delete('/:id', jobsController.deleteJob); // Delete a job

// Employer-specific job routes
router.get('/employer/:employer_id', jobsController.getEmployerJobs); // Get jobs for a specific employer

// Job applications routes
router.get('/:job_id/applications', jobsController.getJobApplications); // Get applications for a job

module.exports = router;