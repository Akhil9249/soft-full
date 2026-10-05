const express = require('express');
const router = express.Router();
const { 
    createMonthlyCard, 
    getMonthlyCardsByIntern,
    getMonthlyCardById,
    updateMonthlyCard,
    deleteMonthlyCard
} = require('../controllers/administration/monthlyCardController');
const { checkAuth } = require('../middlewares/checkAuth');
const { checkPermission } = require('../middlewares/checkPermission');

// Create a new Monthly Mentor Card entry
router.post('/create', checkAuth, checkPermission('mentorCard', 'addMentorCard'), createMonthlyCard);

// Get all Monthly Mentor Card entries for logged-in intern
router.get('/my-cards', checkAuth, getMonthlyCardsByIntern);

// Get all Monthly Mentor Card entries for a specific intern
router.get('/intern/:internId', checkAuth, checkPermission('mentorCard', 'viewMentorCard'), getMonthlyCardsByIntern);

// Get single Monthly Mentor Card entry by ID
router.get('/:id', checkAuth, checkPermission('mentorCard', 'viewMentorCard'), getMonthlyCardById);

// Update an existing Monthly Mentor Card entry
router.put('/:id', checkAuth, checkPermission('mentorCard', 'editMentorCard'), updateMonthlyCard);

// Soft delete a Monthly Mentor Card entry
router.delete('/:id', checkAuth, checkPermission('mentorCard', 'deleteMentorCard'), deleteMonthlyCard);

module.exports = router;
