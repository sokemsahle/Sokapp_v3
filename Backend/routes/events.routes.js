const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const eventController = require('../controllers/eventController');
const { validate } = require('../middleware/validationMiddleware');

// Validation rules for creating/updating events
const eventValidation = [
  body('title').trim().notEmpty().withMessage('Event title is required'),
  body('start_time').notEmpty().withMessage('Start time is required').isISO8601().withMessage('Invalid start time format'),
  body('end_time').notEmpty().withMessage('End time is required').isISO8601().withMessage('Invalid end time format'),
  body('location').optional().trim(),
  body('description').optional().trim(),
  body('reminder_time').optional().isISO8601().withMessage('Invalid reminder time format'),
  body('category').optional().trim()
];

// Routes
router.get('/', eventController.getAllEvents);
router.get('/upcoming', eventController.getUpcomingEvents);
router.get('/range', eventController.getEventsByDateRange);
router.get('/:id', eventController.getEventById);
router.post('/', eventValidation, validate, eventController.createEvent);
router.put('/:id', eventValidation, validate, eventController.updateEvent);
router.delete('/:id', eventController.deleteEvent);

module.exports = router;
