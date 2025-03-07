const db = require('../config/db');

// Get all skill categories with their skills
exports.getSkillCategories = (req, res) => {
    const query = `
        SELECT 
            sc.id as category_id, 
            sc.name as category_name, 
            sc.description as category_description,
            s.id as skill_id, 
            s.name as skill_name, 
            s.description as skill_description
        FROM 
            skills_categories sc
        JOIN 
            skills s ON sc.id = s.category_id
        ORDER BY 
            sc.id, s.id
    `;
    
    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        
        // Group the skills by category
        const categories = [];
        let currentCategory = null;
        
        results.forEach(row => {
            if (!currentCategory || currentCategory.id !== row.category_id) {
                currentCategory = {
                    id: row.category_id,
                    name: row.category_name,
                    description: row.category_description,
                    skills: []
                };
                categories.push(currentCategory);
            }
            
            currentCategory.skills.push({
                id: row.skill_id,
                name: row.skill_name,
                description: row.skill_description
            });
        });
        
        res.json(categories);
    });
};

// Get a user's skill assessments
exports.getUserSkills = (req, res) => {
    const { user_id } = req.params;
    
    const query = `
        SELECT 
            us.skill_id, 
            us.proficiency_level, 
            us.notes, 
            us.assessed_at,
            s.name as skill_name,
            s.description as skill_description,
            sc.id as category_id,
            sc.name as category_name
        FROM 
            user_skills us
        JOIN 
            skills s ON us.skill_id = s.id
        JOIN 
            skills_categories sc ON s.category_id = sc.id
        WHERE 
            us.user_id = ?
    `;
    
    db.query(query, [user_id], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
};

// Save a user's skill assessment
exports.saveUserSkill = (req, res) => {
    const { user_id, skill_id, proficiency_level, notes } = req.body;
    
    // Validate inputs
    if (!user_id || !skill_id || !proficiency_level || proficiency_level < 1 || proficiency_level > 5) {
        return res.status(400).json({ error: 'Invalid input. Proficiency level must be between 1 and 5.' });
    }
    
    const query = `
        INSERT INTO user_skills (user_id, skill_id, proficiency_level, notes) 
        VALUES (?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE 
        proficiency_level = VALUES(proficiency_level),
        notes = VALUES(notes),
        assessed_at = CURRENT_TIMESTAMP
    `;
    
    db.query(query, [user_id, skill_id, proficiency_level, notes || null], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Skill assessment saved successfully', id: result.insertId });
    });
};

// Get training resources
exports.getTrainingResources = (req, res) => {
    const query = `
        SELECT 
            tr.*,
            GROUP_CONCAT(s.id) as skill_ids,
            GROUP_CONCAT(s.name) as skill_names
        FROM 
            training_resources tr
        LEFT JOIN 
            training_skills ts ON tr.id = ts.training_id
        LEFT JOIN 
            skills s ON ts.skill_id = s.id
        GROUP BY 
            tr.id
    `;
    
    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        
        // Format the results
        const trainings = results.map(training => ({
            id: training.id,
            title: training.title,
            provider: training.provider,
            description: training.description,
            link: training.link,
            type: training.resource_type,
            duration: training.duration,
            cost: training.cost,
            language: training.language,
            created_at: training.created_at,
            skills: training.skill_ids ? 
                training.skill_ids.split(',').map((id, index) => ({
                    id: parseInt(id),
                    name: training.skill_names.split(',')[index]
                })) : []
        }));
        
        res.json(trainings);
    });
};

// Get recommended training based on user's skill levels
exports.getRecommendedTraining = (req, res) => {
    const { user_id } = req.params;
    
    const query = `
        SELECT DISTINCT
            tr.*,
            GROUP_CONCAT(DISTINCT s.id) as skill_ids,
            GROUP_CONCAT(DISTINCT s.name) as skill_names
        FROM 
            user_skills us
        JOIN 
            skills s ON us.skill_id = s.id
        JOIN 
            training_skills ts ON s.id = ts.skill_id
        JOIN 
            training_resources tr ON ts.training_id = tr.id
        WHERE 
            us.user_id = ? AND
            us.proficiency_level < 3
        GROUP BY
            tr.id
    `;
    
    db.query(query, [user_id], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        
        // Format the results
        const trainings = results.map(training => ({
            id: training.id,
            title: training.title,
            provider: training.provider,
            description: training.description,
            link: training.link,
            type: training.resource_type,
            duration: training.duration,
            cost: training.cost,
            language: training.language,
            created_at: training.created_at,
            skills: training.skill_ids ? 
                training.skill_ids.split(',').map((id, index) => ({
                    id: parseInt(id),
                    name: training.skill_names.split(',')[index]
                })) : []
        }));
        
        res.json(trainings);
    });
};