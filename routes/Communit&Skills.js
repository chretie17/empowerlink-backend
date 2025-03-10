const express = require('express');
const router = express.Router();

// Import controllers
const skillsController = require('../controllers/SkillsController');
const communityController = require('../controllers/CommunityController');
const postLikesController = require('../controllers/PostLikesController');

// Skills routes
router.get('/skills/categories', skillsController.getSkillCategories);
router.get('/skills/user/:user_id', skillsController.getUserSkills);
router.post('/skills/user', skillsController.saveUserSkill);
router.get('/training', skillsController.getTrainingResources);
router.get('/training/recommended/:user_id', skillsController.getRecommendedTraining);

// Community routes
router.get('/forum/topics', communityController.getForumTopics);
router.get('/forum/topics/:id', communityController.getForumTopic);
router.post('/forum/topics', communityController.createForumTopic);
router.post('/forum/posts', communityController.createForumPost);
router.get('/success-stories', communityController.getSuccessStories);
router.post('/success-stories', communityController.submitSuccessStory);
router.put('/success-stories/:id/approve', communityController.approveSuccessStory);

// Post likes routes
router.get('/post-likes/:post_id', postLikesController.getPostLikes);
router.get('/post-likes/user/:user_id', postLikesController.getUserLikes);
router.post('/post-likes', postLikesController.addPostLike);
router.delete('/post-likes', postLikesController.removePostLike);


// Admin Skills Management Routes
router.get('/admin/skills/categories', skillsController.adminGetSkillCategories);
router.post('/admin/skills/categories', skillsController.createSkillCategory);
router.put('/admin/skills/categories/:id', skillsController.updateSkillCategory);
router.delete('/admin/skills/categories/:id', skillsController.deleteSkillCategory);

router.get('/admin/skills', skillsController.adminGetSkills);
router.post('/admin/skills', skillsController.createSkill);
router.put('/admin/skills/:id', skillsController.updateSkill);
router.delete('/admin/skills/:id', skillsController.deleteSkill);

router.get('/admin/training', skillsController.adminGetTrainingResources);
router.post('/admin/training', skillsController.createTrainingResource);
router.put('/admin/training/:id', skillsController.updateTrainingResource);
router.delete('/admin/training/:id', skillsController.deleteTrainingResource);

// Employer Routes for Talent Searching
router.get('/employer/users-by-skill', skillsController.getUsersBySkill);
router.post('/employer/users-by-multiple-skills', skillsController.getUsersByMultipleSkills);
router.get('/employer/user-profile/:user_id', skillsController.getUserProfile);
router.get('/employer/users', skillsController.getAllUsersWithSkillStats);

module.exports = router;