const db = require('../config/db');

// ORIGINAL USER FUNCTIONS
// ----------------------

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

// ADMIN FUNCTIONS
// --------------

// Get all skill categories for admin
exports.adminGetSkillCategories = (req, res) => {
    const query = `
        SELECT 
            sc.id, 
            sc.name, 
            sc.description,
            (SELECT COUNT(*) FROM skills s WHERE s.category_id = sc.id) as skills_count
        FROM 
            skills_categories sc
        ORDER BY 
            sc.name
    `;
    
    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
};

// Create a new skill category
exports.createSkillCategory = (req, res) => {
    const { name, description } = req.body;
    
    if (!name) {
        return res.status(400).json({ error: 'Category name is required' });
    }
    
    const query = `
        INSERT INTO skills_categories (name, description)
        VALUES (?, ?)
    `;
    
    db.query(query, [name, description || null], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        
        res.status(201).json({
            message: 'Skill category created successfully',
            category_id: result.insertId
        });
    });
};

// Update a skill category
exports.updateSkillCategory = (req, res) => {
    const { id } = req.params;
    const { name, description } = req.body;
    
    if (!name) {
        return res.status(400).json({ error: 'Category name is required' });
    }
    
    const query = `
        UPDATE skills_categories
        SET name = ?, description = ?
        WHERE id = ?
    `;
    
    db.query(query, [name, description || null, id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Category not found' });
        }
        
        res.json({ message: 'Category updated successfully' });
    });
};

// Delete a skill category
exports.deleteSkillCategory = (req, res) => {
    const { id } = req.params;
    
    // Check if category has any skills
    const checkQuery = `
        SELECT COUNT(*) as count FROM skills WHERE category_id = ?
    `;
    
    db.query(checkQuery, [id], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        
        if (results[0].count > 0) {
            return res.status(400).json({ 
                error: 'Cannot delete category with associated skills. Delete or reassign the skills first.' 
            });
        }
        
        // Delete the category
        const deleteQuery = `
            DELETE FROM skills_categories WHERE id = ?
        `;
        
        db.query(deleteQuery, [id], (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            
            if (result.affectedRows === 0) {
                return res.status(404).json({ error: 'Category not found' });
            }
            
            res.json({ message: 'Category deleted successfully' });
        });
    });
};

// Get all skills for admin
exports.adminGetSkills = (req, res) => {
    const query = `
        SELECT 
            s.id, 
            s.name, 
            s.description,
            s.category_id,
            sc.name as category_name,
            (SELECT COUNT(*) FROM user_skills us WHERE us.skill_id = s.id) as users_count
        FROM 
            skills s
        JOIN 
            skills_categories sc ON s.category_id = sc.id
        ORDER BY 
            sc.name, s.name
    `;
    
    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
};

// Create a new skill
exports.createSkill = (req, res) => {
    const { name, description, category_id } = req.body;
    
    if (!name || !category_id) {
        return res.status(400).json({ error: 'Skill name and category ID are required' });
    }
    
    const query = `
        INSERT INTO skills (name, description, category_id)
        VALUES (?, ?, ?)
    `;
    
    db.query(query, [name, description || null, category_id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        
        res.status(201).json({
            message: 'Skill created successfully',
            skill_id: result.insertId
        });
    });
};

// Update a skill
exports.updateSkill = (req, res) => {
    const { id } = req.params;
    const { name, description, category_id } = req.body;
    
    if (!name || !category_id) {
        return res.status(400).json({ error: 'Skill name and category ID are required' });
    }
    
    const query = `
        UPDATE skills
        SET name = ?, description = ?, category_id = ?
        WHERE id = ?
    `;
    
    db.query(query, [name, description || null, category_id, id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Skill not found' });
        }
        
        res.json({ message: 'Skill updated successfully' });
    });
};

// Delete a skill
exports.deleteSkill = (req, res) => {
    const { id } = req.params;
    
    // Check if skill is used in user assessments
    const checkQuery = `
        SELECT COUNT(*) as count FROM user_skills WHERE skill_id = ?
    `;
    
    db.query(checkQuery, [id], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        
        if (results[0].count > 0) {
            return res.status(400).json({ 
                error: 'Cannot delete skill that is used in user assessments.' 
            });
        }
        
        // Delete the skill
        const deleteQuery = `
            DELETE FROM skills WHERE id = ?
        `;
        
        db.query(deleteQuery, [id], (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            
            if (result.affectedRows === 0) {
                return res.status(404).json({ error: 'Skill not found' });
            }
            
            res.json({ message: 'Skill deleted successfully' });
        });
    });
};

// Admin training resources management
exports.adminGetTrainingResources = (req, res) => {
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
        ORDER BY 
            tr.created_at DESC
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

// Create a training resource
exports.createTrainingResource = (req, res) => {
    const { 
        title, provider, description, link, 
        resource_type, duration, cost, language, skill_ids 
    } = req.body;
    
    if (!title || !provider || !link) {
        return res.status(400).json({ error: 'Title, provider, and link are required' });
    }
    
    // Start a transaction
    db.beginTransaction(err => {
        if (err) return res.status(500).json({ error: err.message });
        
        // Insert the training resource
        const insertQuery = `
            INSERT INTO training_resources (
                title, provider, description, link, 
                resource_type, duration, cost, language
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        db.query(
            insertQuery, 
            [
                title, provider, description || null, link, 
                resource_type || null, duration || null, cost || null, language || null
            ], 
            (err, result) => {
                if (err) {
                    return db.rollback(() => {
                        res.status(500).json({ error: err.message });
                    });
                }
                
                const trainingId = result.insertId;
                
                // If no skills specified, commit and return
                if (!skill_ids || !Array.isArray(skill_ids) || skill_ids.length === 0) {
                    return db.commit(err => {
                        if (err) {
                            return db.rollback(() => {
                                res.status(500).json({ error: err.message });
                            });
                        }
                        
                        res.status(201).json({
                            message: 'Training resource created successfully',
                            training_id: trainingId
                        });
                    });
                }
                
                // Otherwise, insert skill associations
                const values = skill_ids.map(skill_id => [trainingId, skill_id]);
                
                const skillsQuery = `
                    INSERT INTO training_skills (training_id, skill_id)
                    VALUES ?
                `;
                
                db.query(skillsQuery, [values], (err) => {
                    if (err) {
                        return db.rollback(() => {
                            res.status(500).json({ error: err.message });
                        });
                    }
                    
                    // Commit the transaction
                    db.commit(err => {
                        if (err) {
                            return db.rollback(() => {
                                res.status(500).json({ error: err.message });
                            });
                        }
                        
                        res.status(201).json({
                            message: 'Training resource created successfully',
                            training_id: trainingId
                        });
                    });
                });
            }
        );
    });
};

// Update a training resource
exports.updateTrainingResource = (req, res) => {
    const { id } = req.params;
    const { 
        title, provider, description, link, 
        resource_type, duration, cost, language, skill_ids 
    } = req.body;
    
    if (!title || !provider || !link) {
        return res.status(400).json({ error: 'Title, provider, and link are required' });
    }
    
    // Start a transaction
    db.beginTransaction(err => {
        if (err) return res.status(500).json({ error: err.message });
        
        // Update the training resource
        const updateQuery = `
            UPDATE training_resources
            SET 
                title = ?, 
                provider = ?, 
                description = ?, 
                link = ?, 
                resource_type = ?, 
                duration = ?, 
                cost = ?, 
                language = ?
            WHERE id = ?
        `;
        
        db.query(
            updateQuery, 
            [
                title, provider, description || null, link, 
                resource_type || null, duration || null, cost || null, language || null,
                id
            ], 
            (err, result) => {
                if (err) {
                    return db.rollback(() => {
                        res.status(500).json({ error: err.message });
                    });
                }
                
                if (result.affectedRows === 0) {
                    return db.rollback(() => {
                        res.status(404).json({ error: 'Training resource not found' });
                    });
                }
                
                // Delete existing skill associations
                const deleteSkillsQuery = `
                    DELETE FROM training_skills
                    WHERE training_id = ?
                `;
                
                db.query(deleteSkillsQuery, [id], (err) => {
                    if (err) {
                        return db.rollback(() => {
                            res.status(500).json({ error: err.message });
                        });
                    }
                    
                    // If no skills specified, commit and return
                    if (!skill_ids || !Array.isArray(skill_ids) || skill_ids.length === 0) {
                        return db.commit(err => {
                            if (err) {
                                return db.rollback(() => {
                                    res.status(500).json({ error: err.message });
                                });
                            }
                            
                            res.json({ message: 'Training resource updated successfully' });
                        });
                    }
                    
                    // Otherwise, insert new skill associations
                    const values = skill_ids.map(skill_id => [id, skill_id]);
                    
                    const skillsQuery = `
                        INSERT INTO training_skills (training_id, skill_id)
                        VALUES ?
                    `;
                    
                    db.query(skillsQuery, [values], (err) => {
                        if (err) {
                            return db.rollback(() => {
                                res.status(500).json({ error: err.message });
                            });
                        }
                        
                        // Commit the transaction
                        db.commit(err => {
                            if (err) {
                                return db.rollback(() => {
                                    res.status(500).json({ error: err.message });
                                });
                            }
                            
                            res.json({ message: 'Training resource updated successfully' });
                        });
                    });
                });
            }
        );
    });
};

// Delete a training resource
exports.deleteTrainingResource = (req, res) => {
    const { id } = req.params;
    
    // Start a transaction
    db.beginTransaction(err => {
        if (err) return res.status(500).json({ error: err.message });
        
        // Delete skill associations first
        const deleteSkillsQuery = `
            DELETE FROM training_skills
            WHERE training_id = ?
        `;
        
        db.query(deleteSkillsQuery, [id], (err) => {
            if (err) {
                return db.rollback(() => {
                    res.status(500).json({ error: err.message });
                });
            }
            
            // Then delete the training resource
            const deleteQuery = `
                DELETE FROM training_resources
                WHERE id = ?
            `;
            
            db.query(deleteQuery, [id], (err, result) => {
                if (err) {
                    return db.rollback(() => {
                        res.status(500).json({ error: err.message });
                    });
                }
                
                if (result.affectedRows === 0) {
                    return db.rollback(() => {
                        res.status(404).json({ error: 'Training resource not found' });
                    });
                }
                
                // Commit the transaction
                db.commit(err => {
                    if (err) {
                        return db.rollback(() => {
                            res.status(500).json({ error: err.message });
                        });
                    }
                    
                    res.json({ message: 'Training resource deleted successfully' });
                });
            });
        });
    });
};

// EMPLOYER FUNCTIONS
// ----------------
// Get users by skill
exports.getUsersBySkill = (req, res) => {
    const { skill_id, min_proficiency } = req.query;
    
    if (!skill_id) {
        return res.status(400).json({ error: 'Skill ID is required' });
    }
    
    const minLevel = min_proficiency || 1;
    
    const query = `
        SELECT 
            u.id,
            u.username,
            u.name,
            u.email,
            u.phone,
            u.address,
            u.skills as skills_text,
            u.experience,
            u.education,
            us.proficiency_level,
            us.assessed_at,
            (SELECT COUNT(*) FROM user_skills WHERE user_id = u.id) as skills_count,
            (SELECT AVG(proficiency_level) FROM user_skills WHERE user_id = u.id) as avg_proficiency
        FROM 
            users u
        JOIN 
            user_skills us ON u.id = us.user_id
        WHERE 
            u.role = 'user' AND
            us.skill_id = ? AND
            us.proficiency_level >= ?
        ORDER BY 
            us.proficiency_level DESC,
            u.name
    `;
    
    db.query(query, [skill_id, minLevel], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
};

// Get users by multiple skills (all skills must match)
exports.getUsersByMultipleSkills = (req, res) => {
    const { skill_ids, min_proficiency } = req.body;
    
    if (!skill_ids || !Array.isArray(skill_ids) || skill_ids.length === 0) {
        return res.status(400).json({ error: 'An array of skill IDs is required' });
    }
    
    const minLevel = min_proficiency || 1;
    
    // Create placeholders for IN clause
    const placeholders = skill_ids.map(() => '?').join(',');
    
    // In this query, we select users who have ALL the specified skills
    const query = `
        SELECT 
            u.id,
            u.username,
            u.name,
            u.email,
            u.phone,
            u.address,
            u.skills as skills_text,
            u.experience,
            u.education,
            (SELECT COUNT(*) FROM user_skills WHERE user_id = u.id) as skills_count,
            (SELECT AVG(proficiency_level) FROM user_skills WHERE user_id = u.id) as avg_proficiency,
            COUNT(DISTINCT us.skill_id) as matching_skills
        FROM 
            users u
        JOIN 
            user_skills us ON u.id = us.user_id
        WHERE 
            u.role = 'user' AND
            us.skill_id IN (${placeholders}) AND
            us.proficiency_level >= ?
        GROUP BY 
            u.id
        HAVING 
            COUNT(DISTINCT us.skill_id) = ?
        ORDER BY 
            avg_proficiency DESC,
            u.name
    `;
    
    // Parameters are skill_ids followed by min_proficiency and the count of skill_ids
    const params = [...skill_ids, minLevel, skill_ids.length];
    
    db.query(query, params, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
};

// Get detailed profile for a specific user
exports.getUserProfile = (req, res) => {
    const { user_id } = req.params;
    
    // Get user basic info - matches the database schema
    const userQuery = `
        SELECT 
            u.id,
            u.username,
            u.name,
            u.email,
            u.phone,
            u.address,
            u.skills as skills_text,
            u.experience,
            u.education,
            u.created_at,
            (SELECT COUNT(*) FROM user_skills WHERE user_id = u.id) as skills_count,
            (SELECT AVG(proficiency_level) FROM user_skills WHERE user_id = u.id) as avg_proficiency
        FROM 
            users u
        WHERE 
            u.role = 'user' AND
            u.id = ?
    `;
    
    // Get user skills grouped by category
    const skillsQuery = `
        SELECT 
            sc.id as category_id,
            sc.name as category_name,
            s.id as skill_id,
            s.name as skill_name,
            us.proficiency_level,
            us.notes,
            us.assessed_at
        FROM 
            user_skills us
        JOIN 
            skills s ON us.skill_id = s.id
        JOIN 
            skills_categories sc ON s.category_id = sc.id
        WHERE 
            us.user_id = ?
        ORDER BY 
            sc.name,
            us.proficiency_level DESC,
            s.name
    `;
    
    // Start a transaction to ensure consistent data
    db.beginTransaction(async (err) => {
        if (err) return res.status(500).json({ error: err.message });
        
        try {
            // Get user info
            const userInfo = await new Promise((resolve, reject) => {
                db.query(userQuery, [user_id], (err, results) => {
                    if (err) reject(err);
                    else {
                        if (results.length === 0) {
                            reject(new Error('User not found'));
                        } else {
                            resolve(results[0]);
                        }
                    }
                });
            });
            
            // Get skills
            const skillsResults = await new Promise((resolve, reject) => {
                db.query(skillsQuery, [user_id], (err, results) => {
                    if (err) reject(err);
                    else resolve(results);
                });
            });
            
            // Group skills by category
            const skills = [];
            let currentCategory = null;
            
            skillsResults.forEach(row => {
                if (!currentCategory || currentCategory.id !== row.category_id) {
                    currentCategory = {
                        id: row.category_id,
                        name: row.category_name,
                        skills: []
                    };
                    skills.push(currentCategory);
                }
                
                currentCategory.skills.push({
                    id: row.skill_id,
                    name: row.skill_name,
                    proficiency_level: row.proficiency_level,
                    notes: row.notes,
                    assessed_at: row.assessed_at
                });
            });
            
            // Commit the transaction
            db.commit(err => {
                if (err) {
                    return db.rollback(() => {
                        res.status(500).json({ error: err.message });
                    });
                }
                
                // Return combined result
                res.json({
                    user: userInfo,
                    skills: skills
                });
            });
        } catch (error) {
            db.rollback(() => {
                if (error.message === 'User not found') {
                    res.status(404).json({ error: 'User not found' });
                } else {
                    res.status(500).json({ error: error.message });
                }
            });
        }
    });
};

// Get users with skill statistics - matching the database schema
exports.getAllUsersWithSkillStats = (req, res) => {
    const query = `
        SELECT 
            u.id,
            u.username,
            u.name,
            u.email,
            u.phone,
            u.address,
            u.skills as skills_text,
            u.experience,
            u.education,
            (SELECT COUNT(*) FROM user_skills WHERE user_id = u.id) as skills_count,
            (SELECT AVG(proficiency_level) FROM user_skills WHERE user_id = u.id) as avg_proficiency,
            (SELECT MAX(proficiency_level) FROM user_skills WHERE user_id = u.id) as max_proficiency,
            (SELECT COUNT(*) FROM user_skills WHERE user_id = u.id AND proficiency_level >= 4) as expert_skills_count
        FROM 
            users u
        WHERE
            u.role = 'user'
        ORDER BY 
            skills_count DESC,
            avg_proficiency DESC,
            u.name
    `;
    
    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
};