const db = require('../config/db');

// COUNSELING SESSION FUNCTIONS
exports.scheduleSession = async (req, res) => {
    const { user_id, counselor_id, session_type, session_date, duration_minutes } = req.body;
    
    db.query(
        'INSERT INTO counseling_sessions (user_id, counselor_id, session_type, session_date, duration_minutes) VALUES (?, ?, ?, ?, ?)',
        [user_id, counselor_id, session_type, session_date, duration_minutes || 60],
        (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({
                message: 'Counseling session scheduled successfully!',
                session_id: result.insertId
            });
        }
    );
};

exports.getUserSessions = (req, res) => {
    const { user_id } = req.params;
    db.query(
        `SELECT cs.*, u.name as counselor_name, u.email as counselor_email 
         FROM counseling_sessions cs 
         JOIN users u ON cs.counselor_id = u.id 
         WHERE cs.user_id = ? 
         ORDER BY cs.session_date DESC`,
        [user_id],
        (err, results) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(results);
        }
    );
};

exports.getCounselorSessions = (req, res) => {
    const { counselor_id } = req.params;
    db.query(
        `SELECT cs.*, u.name as user_name, u.email as user_email 
         FROM counseling_sessions cs 
         JOIN users u ON cs.user_id = u.id 
         WHERE cs.counselor_id = ? 
         ORDER BY cs.session_date DESC`,
        [counselor_id],
        (err, results) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(results);
        }
    );
};

exports.updateSessionStatus = (req, res) => {
    const { session_id } = req.params;
    const { status, notes, recommendations } = req.body;
    
    db.query(
        'UPDATE counseling_sessions SET status = ?, notes = ?, recommendations = ? WHERE id = ?',
        [status, notes, recommendations, session_id],
        (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: 'Session updated successfully' });
        }
    );
};

// CAREER ASSESSMENT FUNCTIONS
exports.createAssessment = (req, res) => {
    const { user_id, counselor_id, assessment_type, questions, answers, results, score, recommendations } = req.body;
    
    db.query(
        'INSERT INTO career_assessments (user_id, counselor_id, assessment_type, questions, answers, results, score, recommendations) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [user_id, counselor_id, assessment_type, JSON.stringify(questions), JSON.stringify(answers), JSON.stringify(results), score, recommendations],
        (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({
                message: 'Career assessment created successfully!',
                assessment_id: result.insertId
            });
        }
    );
};

exports.getUserAssessments = (req, res) => {
  const { user_id } = req.params;
  db.query(
    `SELECT ca.*, u.name as counselor_name 
     FROM career_assessments ca 
     LEFT JOIN users u ON ca.counselor_id = u.id 
     WHERE ca.user_id = ? 
     ORDER BY ca.completed_at DESC`,
    [user_id],
    (err, results) => {
      if (err) return res.status(500).json({ error: err.message });

      const parsedResults = results.map(row => ({
        ...row,
        questions: typeof row.questions === 'string'
                    ? JSON.parse(row.questions)
                    : [],
        answers:   typeof row.answers   === 'string'
                    ? JSON.parse(row.answers)
                    : [],
        results:   typeof row.results   === 'string'
                    ? JSON.parse(row.results)
                    : {}
      }));

      res.json(parsedResults);
    }
  );
};

// CAREER GOALS FUNCTIONS
exports.createCareerGoal = (req, res) => {
    const { user_id, counselor_id, goal_title, goal_description, target_position, target_industry, timeline_months, priority, milestones } = req.body;
    
    db.query(
        'INSERT INTO career_goals (user_id, counselor_id, goal_title, goal_description, target_position, target_industry, timeline_months, priority, milestones) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [user_id, counselor_id, goal_title, goal_description, target_position, target_industry, timeline_months, priority, JSON.stringify(milestones || [])],
        (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({
                message: 'Career goal created successfully!',
                goal_id: result.insertId
            });
        }
    );
};

exports.getUserGoals = (req, res) => {
  const { user_id } = req.params;
  db.query(
    `SELECT cg.*, u.name as counselor_name 
     FROM career_goals cg 
     LEFT JOIN users u ON cg.counselor_id = u.id 
     WHERE cg.user_id = ? 
     ORDER BY cg.created_at DESC`,
    [user_id],
    (err, results) => {
      if (err) return res.status(500).json({ error: err.message });

      const parsedResults = results.map(row => ({
        ...row,
        milestones: typeof row.milestones === 'string'
                      ? JSON.parse(row.milestones)
                      : []
      }));

      res.json(parsedResults);
    }
  );
};

exports.updateGoalProgress = (req, res) => {
    const { goal_id } = req.params;
    const { progress_percentage, status, milestones } = req.body;
    
    db.query(
        'UPDATE career_goals SET progress_percentage = ?, status = ?, milestones = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [progress_percentage, status, JSON.stringify(milestones), goal_id],
        (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: 'Goal progress updated successfully' });
        }
    );
};

// JOB APPLICATION FUNCTIONS
exports.applyForJob = (req, res) => {
    const { user_id, job_id } = req.body;
    
    // First check if user has already applied for this job
    db.query(
        'SELECT id FROM job_applications WHERE user_id = ? AND job_id = ?',
        [user_id, job_id],
        (err, existingApplication) => {
            if (err) return res.status(500).json({ error: err.message });
            
            if (existingApplication.length > 0) {
                return res.status(400).json({ 
                    error: 'You have already applied for this job',
                    application_id: existingApplication[0].id 
                });
            }
            
            // If no existing application, proceed with insertion
            db.query(
                'INSERT INTO job_applications (user_id, job_id) VALUES (?, ?)',
                [user_id, job_id],
                (err, result) => {
                    if (err) {
                        if (err.code === 'ER_DUP_ENTRY') {
                            return res.status(400).json({ error: 'You have already applied for this job' });
                        }
                        return res.status(500).json({ error: err.message });
                    }
                    res.json({
                        message: 'Job application submitted successfully!',
                        application_id: result.insertId
                    });
                }
            );
        }
    );
};
exports.getUserApplications = (req, res) => {
    const { user_id } = req.params;
    db.query(
        `SELECT ja.*, j.title,j.location, j.salary, j.job_type, u.name as employer_name
         FROM job_applications ja 
         JOIN jobs j ON ja.job_id = j.id 
         JOIN users u ON j.employer_id = u.id 
         WHERE ja.user_id = ? 
         ORDER BY ja.applied_at DESC`,
        [user_id],
        (err, results) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(results);
        }
    );
};

exports.updateApplicationStatus = (req, res) => {
    const { application_id } = req.params;
    const { status, feedback } = req.body;
    
    db.query(
        'UPDATE job_applications SET status = ?, feedback = ? WHERE id = ?',
        [status, feedback, application_id],
        (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: 'Application status updated successfully' });
        }
    );
};

// JOB MATCHING FUNCTIONS (AI-powered)
exports.generateJobMatches = (req, res) => {
    const { user_id } = req.params;
    
    // First get user skills and preferences
    db.query(
        'SELECT skills, experience, education FROM users WHERE id = ?',
        [user_id],
        (err, userResults) => {
            if (err) return res.status(500).json({ error: err.message });
            if (userResults.length === 0) return res.status(404).json({ error: 'User not found' });
            
            const user = userResults[0];
            const userSkills = user.skills ? user.skills.split(',').map(s => s.trim().toLowerCase()) : [];
            
            // Get available jobs
            db.query(
                'SELECT * FROM jobs WHERE application_deadline >= CURDATE() OR application_deadline IS NULL',
                (err, jobResults) => {
                    if (err) return res.status(500).json({ error: err.message });
                    
                    const matches = [];
                    
                    jobResults.forEach(job => {
                        const jobSkills = job.skills_required ? job.skills_required.split(',').map(s => s.trim().toLowerCase()) : [];
                        
                        // Simple matching algorithm
                        const matchingSkills = userSkills.filter(skill => 
                            jobSkills.some(jobSkill => jobSkill.includes(skill) || skill.includes(jobSkill))
                        );
                        
                        const skillGaps = jobSkills.filter(skill => 
                            !userSkills.some(userSkill => userSkill.includes(skill) || skill.includes(userSkill))
                        );
                        
                        const matchScore = jobSkills.length > 0 ? 
                            Math.round((matchingSkills.length / jobSkills.length) * 100) : 50;
                        
                        if (matchScore > 30) { // Only include matches above 30%
                            matches.push({
                                user_id,
                                job_id: job.id,
                                match_score: matchScore,
                                matching_skills: matchingSkills,
                                skill_gaps: skillGaps,
                                recommendations: generateRecommendations(matchingSkills, skillGaps, job)
                            });
                        }
                    });
                    
                    // Save matches to database
                    if (matches.length > 0) {
                        // Clear existing matches for this user
                        db.query('DELETE FROM job_matches WHERE user_id = ?', [user_id], (err) => {
                            if (err) return res.status(500).json({ error: err.message });
                            
                            // Insert new matches
                            const insertPromises = matches.map(match => {
                                return new Promise((resolve, reject) => {
                                    db.query(
                                        'INSERT INTO job_matches (user_id, job_id, match_score, matching_skills, skill_gaps, recommendations) VALUES (?, ?, ?, ?, ?, ?)',
                                        [match.user_id, match.job_id, match.match_score, JSON.stringify(match.matching_skills), JSON.stringify(match.skill_gaps), match.recommendations],
                                        (err, result) => {
                                            if (err) reject(err);
                                            else resolve(result);
                                        }
                                    );
                                });
                            });
                            
                            Promise.all(insertPromises)
                                .then(() => {
                                    res.json({
                                        message: 'Job matches generated successfully!',
                                        matches_count: matches.length
                                    });
                                })
                                .catch(err => {
                                    res.status(500).json({ error: err.message });
                                });
                        });
                    } else {
                        res.json({
                            message: 'No suitable job matches found',
                            matches_count: 0
                        });
                    }
                }
            );
        }
    );
};

exports.getUserJobMatches = (req, res) => {
    const { user_id } = req.params;
    db.query(
        `SELECT jm.*, j.title, j.description, j.location, j.salary, j.job_type,  u.name as employer_name
         FROM job_matches jm 
         JOIN jobs j ON jm.job_id = j.id 
         JOIN users u ON j.employer_id = u.id 
         WHERE jm.user_id = ? 
         ORDER BY jm.match_score DESC`,
        [user_id],
        (err, results) => {
            if (err) return res.status(500).json({ error: err.message });
            
            // Parse JSON fields safely
            const parsedResults = results.map(result => {
                let matching_skills = [];
                let skill_gaps = [];
                
                // Safe parsing for matching_skills
                try {
                    if (result.matching_skills) {
                        if (typeof result.matching_skills === 'string') {
                            matching_skills = JSON.parse(result.matching_skills);
                        } else if (Array.isArray(result.matching_skills)) {
                            matching_skills = result.matching_skills;
                        }
                    }
                } catch (e) {
                    console.error('Error parsing matching_skills:', e);
                    matching_skills = [];
                }
                
                // Safe parsing for skill_gaps
                try {
                    if (result.skill_gaps) {
                        if (typeof result.skill_gaps === 'string') {
                            skill_gaps = JSON.parse(result.skill_gaps);
                        } else if (Array.isArray(result.skill_gaps)) {
                            skill_gaps = result.skill_gaps;
                        }
                    }
                } catch (e) {
                    console.error('Error parsing skill_gaps:', e);
                    skill_gaps = [];
                }
                
                return {
                    ...result,
                    matching_skills,
                    skill_gaps
                };
            });
            
            res.json(parsedResults);
        }
    );
};
// COUNSELING RESOURCES FUNCTIONS
exports.createResource = (req, res) => {
    const { title, description, resource_type, url, file_path, category, target_audience, created_by } = req.body;
    
    db.query(
        'INSERT INTO counseling_resources (title, description, resource_type, url, file_path, category, target_audience, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [title, description, resource_type, url, file_path, category, target_audience, created_by],
        (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({
                message: 'Resource created successfully!',
                resource_id: result.insertId
            });
        }
    );
};

exports.getAllResources = (req, res) => {
    const { category, resource_type, target_audience } = req.query;
    
    let query = 'SELECT * FROM counseling_resources WHERE 1=1';
    const params = [];
    
    if (category) {
        query += ' AND category = ?';
        params.push(category);
    }
    
    if (resource_type) {
        query += ' AND resource_type = ?';
        params.push(resource_type);
    }
    
    if (target_audience) {
        query += ' AND (target_audience = ? OR target_audience = "all")';
        params.push(target_audience);
    }
    
    query += ' ORDER BY created_at DESC';
    
    db.query(query, params, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
};

// HELPER FUNCTIONS
function generateRecommendations(matchingSkills, skillGaps, job) {
    let recommendations = [];
    
    if (matchingSkills.length > 0) {
        recommendations.push(`Strong match! You have ${matchingSkills.length} relevant skills: ${matchingSkills.join(', ')}`);
    }
    
    if (skillGaps.length > 0) {
        recommendations.push(`Consider developing these skills: ${skillGaps.slice(0, 3).join(', ')}`);
    }
    
    if (job.experience_required) {
        recommendations.push(`Required experience: ${job.experience_required}`);
    }
    
    return recommendations.join('. ');
}

// GET ALL COUNSELORS
exports.getAllCounselors = (req, res) => {
    db.query(
        'SELECT id, name, email, phone, skills, experience FROM users WHERE role = "counselor"',
        (err, results) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(results);
        }
    );
};