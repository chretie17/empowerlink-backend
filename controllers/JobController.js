const db = require('../config/db');

exports.createJob = (req, res) => {
    const { employer_id, title, description, category, skills_required, location, salary, job_type, experience_required, benefits, application_deadline } = req.body;
    db.query(
        'INSERT INTO jobs (employer_id, title, description, category, skills_required, location, salary, job_type, experience_required, benefits, application_deadline) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [employer_id, title, description, category, skills_required, location, salary, job_type, experience_required, benefits, application_deadline],
        (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: 'Job posted successfully!', jobId: result.insertId });
        }
    );
};

// Get all jobs with employer information
exports.getJobs = (req, res) => {
    const query = `
        SELECT j.*, u.name as employer_name
        FROM jobs j
        LEFT JOIN users u ON j.employer_id = u.id
        ORDER BY j.created_at DESC
    `;
    
    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
};

// Get jobs for a specific employer
exports.getEmployerJobs = (req, res) => {
    const { employer_id } = req.params;
    
    const query = `
        SELECT j.*, u.name as employer_name
        FROM jobs j
        LEFT JOIN users u ON j.employer_id = u.id
        WHERE j.employer_id = ?
        ORDER BY j.created_at DESC
    `;
    
    db.query(query, [employer_id], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
};

// Get jobs for users (filtered by deadline)
exports.getJobsForUsers = (req, res) => {
    // Get the current date in MySQL format (YYYY-MM-DD)
    const currentDate = new Date().toISOString().split('T')[0];
    
    // Query to get only jobs where the deadline is in the future or null
    const query = `
        SELECT j.*, u.name as employer_name
        FROM jobs j
        LEFT JOIN users u ON j.employer_id = u.id
        WHERE (j.application_deadline >= ? OR j.application_deadline IS NULL)
        ORDER BY j.created_at DESC
    `;
    
    db.query(query, [currentDate], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
};

// Update job
exports.updateJob = (req, res) => {
    const { id } = req.params;
    const { title, description, category, skills_required, location, salary, job_type, experience_required, benefits, application_deadline } = req.body;
    db.query(
        'UPDATE jobs SET title = ?, description = ?, category = ?, skills_required = ?, location = ?, salary = ?, job_type = ?, experience_required = ?, benefits = ?, application_deadline = ? WHERE id = ?',
        [title, description, category, skills_required, location, salary, job_type, experience_required, benefits, application_deadline, id],
        (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: 'Job updated successfully' });
        }
    );
};

// Delete job
exports.deleteJob = (req, res) => {
    const { id } = req.params;
    db.query('DELETE FROM jobs WHERE id = ?', [id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Job deleted successfully' });
    });
};

// Get applications for a specific job
exports.getJobApplications = (req, res) => {
    const { job_id } = req.params;
    
    const query = `
        SELECT 
            ja.id, 
            ja.user_id, 
            ja.job_id, 
            ja.status, 
            ja.feedback,
            ja.applied_at,
            u.name AS user_name, 
            u.email AS user_email, 
            u.phone AS user_phone,
            u.address AS user_address,
            u.skills AS user_skills,
            u.experience AS user_experience,
            u.education AS user_education
        FROM 
            job_applications ja
        JOIN 
            users u ON ja.user_id = u.id
        WHERE 
            ja.job_id = ?
        ORDER BY 
            ja.applied_at DESC
    `;
    
    db.query(query, [job_id], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
};