const db = require('../config/db');
const nodemailer = require('nodemailer');

// Configure email transporter (update with your email provider details)
const transporter = nodemailer.createTransport({
    service: 'gmail', // Use your email provider or SMTP server
    auth: {
        user: 'turachretien@gmail.com', 
        pass: 'ruix vmny qntx ywos',  
    },
});

// Helper function to send email notifications
const sendEmailNotification = async (recipientEmail, subject, htmlContent) => {
    try {
        await transporter.sendMail({
            from: `"EmpowerLink Platform" <${process.env.EMAIL_USER}>`,
            to: recipientEmail,
            subject: subject,
            html: htmlContent
        });
        console.log(`Email sent to ${recipientEmail}`);
        return true;
    } catch (error) {
        console.error('Error sending email:', error);
        return false;
    }
};

// Apply for a job
exports.applyForJob = (req, res) => {
    const { user_id, job_id } = req.body;
    
    // First check if the user has already applied for this job
    db.query(
        'SELECT * FROM job_applications WHERE user_id = ? AND job_id = ?',
        [user_id, job_id],
        (err, results) => {
            if (err) return res.status(500).json({ error: err.message });
            
            if (results.length > 0) {
                return res.status(400).json({ 
                    error: 'You have already applied for this job.' 
                });
            }
            
            // If not already applied, insert the application
            db.query(
                'INSERT INTO job_applications (user_id, job_id, status, applied_at) VALUES (?, ?, ?, NOW())',
                [user_id, job_id, 'pending'],
                async (err, result) => {
                    if (err) return res.status(500).json({ error: err.message });
                    
                    // Get user details
                    db.query('SELECT * FROM users WHERE id = ?', [user_id], (err, userResults) => {
                        if (err) return; // Don't fail the API response if email fails
                        
                        // Get job details
                        db.query('SELECT jobs.*, users.email as employer_email, users.name as employer_name FROM jobs JOIN users ON jobs.employer_id = users.id WHERE jobs.id = ?', 
                            [job_id], 
                            async (err, jobResults) => {
                                if (err || !jobResults.length || !userResults.length) return;
                                
                                const user = userResults[0];
                                const job = jobResults[0];
                                
                                // Send confirmation email to the applicant
                                await sendEmailNotification(
                                    user.email,
                                    `Application Confirmation: ${job.title}`,
                                    `
                                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
                                        <h2 style="color: #4a86e8;">Application Confirmation</h2>
                                        <p>Dear ${user.name},</p>
                                        <p>Thank you for applying for the <strong>${job.title}</strong> position.</p>
                                        <p>Your application has been received and is currently being reviewed. You will be notified of any updates regarding your application status.</p>
                                        <div style="margin: 25px 0; padding: 15px; background-color: #f5f8ff; border-left: 4px solid #4a86e8; border-radius: 3px;">
                                            <h3 style="margin-top: 0;">Job Details:</h3>
                                            <p><strong>Position:</strong> ${job.title}</p>
                                            <p><strong>Location:</strong> ${job.location}</p>
                                            <p><strong>Type:</strong> ${job.job_type}</p>
                                        </div>
                                        <p>If you have any questions, please don't hesitate to contact us.</p>
                                        <p>Best regards,<br>The EmpowerLink Team</p>
                                    </div>
                                    `
                                );
                                
                                // Send notification to the employer
                                await sendEmailNotification(
                                    job.employer_email,
                                    `New Job Application: ${job.title}`,
                                    `
                                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
                                        <h2 style="color: #4a86e8;">New Job Application</h2>
                                        <p>Dear ${job.employer_name},</p>
                                        <p>You have received a new application for the <strong>${job.title}</strong> position.</p>
                                        <div style="margin: 25px 0; padding: 15px; background-color: #f5f8ff; border-left: 4px solid #4a86e8; border-radius: 3px;">
                                            <h3 style="margin-top: 0;">Applicant Details:</h3>
                                            <p><strong>Name:</strong> ${user.name}</p>
                                            <p><strong>Email:</strong> ${user.email}</p>
                                            <p><strong>Phone:</strong> ${user.phone || 'Not provided'}</p>
                                        </div>
                                        <p>Log in to your employer dashboard to review this application.</p>
                                        <p>Best regards,<br>The EmpowerLink Team</p>
                                    </div>
                                    `
                                );
                            }
                        );
                    });
                    
                    res.json({ 
                        message: 'Application submitted successfully!',
                        applicationId: result.insertId 
                    });
                }
            );
        }
    );
};

// Get all applications for a specific employer
exports.getEmployerApplications = (req, res) => {
    const { employer_id } = req.params;
    
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
            u.education AS user_education,
            j.title AS job_title,
            j.employer_id
        FROM 
            job_applications ja
        JOIN 
            users u ON ja.user_id = u.id
        JOIN 
            jobs j ON ja.job_id = j.id
        WHERE 
            j.employer_id = ?
        ORDER BY 
            ja.applied_at DESC
    `;
    
    db.query(query, [employer_id], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
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

// Get all applications (for admin)
exports.getAllApplications = (req, res) => {
    db.query(
        `SELECT 
            ja.id, 
            ja.status, 
            ja.applied_at,
            u.name AS applicant, 
            j.title AS job_title,
            e.name AS employer
         FROM 
            job_applications ja
         JOIN 
            users u ON ja.user_id = u.id
         JOIN 
            jobs j ON ja.job_id = j.id
         JOIN 
            users e ON j.employer_id = e.id
         ORDER BY 
            ja.applied_at DESC`,
        (err, results) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(results);
        }
    );
};

// Get user's job applications
exports.getUserApplications = (req, res) => {
    const { user_id } = req.params;
    db.query(
        `SELECT 
            ja.id, 
            ja.status, 
            ja.feedback,
            ja.applied_at,
            j.title,
            j.location,
            j.job_type,
            j.salary,
            u.name AS employer_name
         FROM 
            job_applications ja
         JOIN 
            jobs j ON ja.job_id = j.id
         JOIN 
            users u ON j.employer_id = u.id
         WHERE 
            ja.user_id = ?
         ORDER BY 
            ja.applied_at DESC`,
        [user_id],
        (err, results) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(results);
        }
    );
};

// Update application status (for employer/admin)
exports.updateApplicationStatus = (req, res) => {
    const { id } = req.params;
    const { status, feedback, sendEmail } = req.body;
    
    // Update the application status
    db.query(
        'UPDATE job_applications SET status = ?, feedback = ? WHERE id = ?',
        [status, feedback || null, id],
        (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            
            // If email notification is requested
            if (sendEmail) {
                // Get application details with user and job info
                db.query(
                    `SELECT 
                        ja.*, 
                        u.name AS user_name, 
                        u.email AS user_email,
                        j.title AS job_title,
                        j.location AS job_location,
                        e.name AS employer_name,
                        e.email AS employer_email
                     FROM 
                        job_applications ja
                     JOIN 
                        users u ON ja.user_id = u.id
                     JOIN 
                        jobs j ON ja.job_id = j.id
                     JOIN 
                        users e ON j.employer_id = e.id
                     WHERE 
                        ja.id = ?`,
                    [id],
                    async (err, results) => {
                        if (err || !results.length) return;
                        
                        const application = results[0];
                        let emailSubject = '';
                        let emailContent = '';
                        
                        // Prepare email content based on status
                        switch (status) {
                            case 'accepted':
                                emailSubject = `Congratulations! Your application for ${application.job_title} has been accepted`;
                                emailContent = `
                                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
                                    <h2 style="color: #4caf50;">Application Accepted</h2>
                                    <p>Dear ${application.user_name},</p>
                                    <p>Congratulations! We're pleased to inform you that your application for the <strong>${application.job_title}</strong> position has been accepted.</p>
                                    <div style="margin: 25px 0; padding: 15px; background-color: #f1f8e9; border-left: 4px solid #4caf50; border-radius: 3px;">
                                        <h3 style="margin-top: 0;">Next Steps:</h3>
                                        <p>The employer will be in touch with you shortly to discuss the next steps in the hiring process.</p>
                                        ${feedback ? `<p><strong>Additional Information:</strong> ${feedback}</p>` : ''}
                                    </div>
                                    <p>If you have any questions, please contact <a href="mailto:${application.employer_email}">${application.employer_name}</a>.</p>
                                    <p>Best regards,<br>The EmpowerLink Team</p>
                                </div>
                                `;
                                break;
                                
                            case 'rejected':
                                emailSubject = `Update on your application for ${application.job_title}`;
                                emailContent = `
                                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
                                    <h2 style="color: #f44336;">Application Status Update</h2>
                                    <p>Dear ${application.user_name},</p>
                                    <p>Thank you for your interest in the <strong>${application.job_title}</strong> position.</p>
                                    <p>After careful consideration, we regret to inform you that we have decided to move forward with other candidates whose qualifications better meet our current needs.</p>
                                    ${feedback ? `
                                    <div style="margin: 25px 0; padding: 15px; background-color: #fff8f8; border-left: 4px solid #f44336; border-radius: 3px;">
                                        <h3 style="margin-top: 0;">Feedback from the Employer:</h3>
                                        <p>${feedback}</p>
                                    </div>
                                    ` : ''}
                                    <p>We appreciate your interest in our organization and encourage you to apply for future positions that match your skills and experience.</p>
                                    <p>Best regards,<br>The EmpowerLink Team</p>
                                </div>
                                `;
                                break;
                                
                            case 'interviewing':
                                emailSubject = `Interview Request for ${application.job_title}`;
                                emailContent = `
                                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
                                    <h2 style="color: #9c27b0;">Interview Request</h2>
                                    <p>Dear ${application.user_name},</p>
                                    <p>We're pleased to inform you that your application for the <strong>${application.job_title}</strong> position has progressed to the interview stage.</p>
                                    <div style="margin: 25px 0; padding: 15px; background-color: #f3e5f5; border-left: 4px solid #9c27b0; border-radius: 3px;">
                                        <h3 style="margin-top: 0;">Interview Details:</h3>
                                        ${feedback ? `<p>${feedback}</p>` : '<p>The employer will contact you soon with specific interview details.</p>'}
                                    </div>
                                    <p>If you have any questions or need to reschedule, please contact <a href="mailto:${application.employer_email}">${application.employer_name}</a> directly.</p>
                                    <p>Best regards,<br>The EmpowerLink Team</p>
                                </div>
                                `;
                                break;
                                
                            default:
                                emailSubject = `Update on your application for ${application.job_title}`;
                                emailContent = `
                                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
                                    <h2 style="color: #2196f3;">Application Status Update</h2>
                                    <p>Dear ${application.user_name},</p>
                                    <p>There has been an update to your application for the <strong>${application.job_title}</strong> position.</p>
                                    <div style="margin: 25px 0; padding: 15px; background-color: #e3f2fd; border-left: 4px solid #2196f3; border-radius: 3px;">
                                        <h3 style="margin-top: 0;">Status Update:</h3>
                                        <p>Your application status has been changed to: <strong>${status}</strong></p>
                                        ${feedback ? `<p><strong>Additional Information:</strong> ${feedback}</p>` : ''}
                                    </div>
                                    <p>If you have any questions, please contact <a href="mailto:${application.employer_email}">${application.employer_name}</a>.</p>
                                    <p>Best regards,<br>The EmpowerLink Team</p>
                                </div>
                                `;
                        }
                        
                        // Send the email notification
                        await sendEmailNotification(
                            application.user_email,
                            emailSubject,
                            emailContent
                        );
                    }
                );
            }
            
            res.json({ 
                message: 'Application status updated successfully',
                updated: result.affectedRows > 0
            });
        }
    );
};

// Delete a job application
exports.deleteApplication = (req, res) => {
    const { id } = req.params;
    db.query('DELETE FROM job_applications WHERE id = ?', [id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ 
            message: 'Application deleted successfully',
            deleted: result.affectedRows > 0 
        });
    });
};