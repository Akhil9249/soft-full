const express = require('express');
const router = express.Router();
const { 
    createMentorCard, 
    getMentorCardsByIntern,
    updateMentorCard 
} = require('../controllers/administration/mentorCardController');
const { checkAuth } = require('../middlewares/checkAuth');

// Create a new Mentor Card entry
router.post('/create', checkAuth, createMentorCard);

// Get all Mentor Card entries for a specific intern
router.get('/intern/:internId', getMentorCardsByIntern);

// Update an existing Mentor Card entry
router.put('/:id', checkAuth, updateMentorCard);

module.exports = router;
