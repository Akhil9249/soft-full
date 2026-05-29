const express = require('express');
const router = express.Router();
const { 
    createMentorCard, 
    getMentorCardsByIntern,
    updateMentorCard 
} = require('../controllers/administration/mentorCardController');
const { checkAuth } = require('../middlewares/checkAuth');
const { checkPermission } = require('../middlewares/checkPermission');

// Create a new Mentor Card entry
router.post('/create', checkAuth, checkPermission('mentorCard', 'addMentorCard'), createMentorCard);

// Get all Mentor Card entries for a specific intern
router.get('/intern/:internId', checkAuth, checkPermission('mentorCard', 'viewMentorCard'), getMentorCardsByIntern);

// Update an existing Mentor Card entry
router.put('/:id', checkAuth, checkPermission('mentorCard', 'editMentorCard'), updateMentorCard);

module.exports = router;
