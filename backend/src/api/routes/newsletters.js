const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const newsletterController = require('../controllers/newsletterController');
const { validate } = require('../middleware/validator');
const { newsletterSchema } = require('../middleware/schemas');

// All routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/v1/newsletters
 * @desc    Create a new newsletter
 * @access  Private
 */
router.post(
  '/',
  validate(newsletterSchema.create),
  newsletterController.createNewsletter
);

/**
 * @route   GET /api/v1/newsletters
 * @desc    Get all newsletters for authenticated user
 * @access  Private
 */
router.get('/', newsletterController.getNewsletters);

/**
 * @route   GET /api/v1/newsletters/:id
 * @desc    Get newsletter by ID
 * @access  Private
 */
router.get('/:id', newsletterController.getNewsletterById);

/**
 * @route   PATCH /api/v1/newsletters/:id
 * @desc    Update newsletter
 * @access  Private
 */
router.patch(
  '/:id',
  validate(newsletterSchema.update),
  newsletterController.updateNewsletter
);

/**
 * @route   DELETE /api/v1/newsletters/:id
 * @desc    Delete newsletter
 * @access  Private
 */
router.delete('/:id', newsletterController.deleteNewsletter);

/**
 * @route   POST /api/v1/newsletters/:id/duplicate
 * @desc    Duplicate a newsletter
 * @access  Private
 */
router.post('/:id/duplicate', newsletterController.duplicateNewsletter);

/**
 * @route   POST /api/v1/newsletters/:id/schedule
 * @desc    Schedule newsletter for sending
 * @access  Private
 */
router.post(
  '/:id/schedule',
  validate(newsletterSchema.schedule),
  newsletterController.scheduleNewsletter
);

/**
 * @route   POST /api/v1/newsletters/:id/send
 * @desc    Send newsletter immediately
 * @access  Private
 */
router.post('/:id/send', newsletterController.sendNewsletter);

/**
 * @route   GET /api/v1/newsletters/:id/preview
 * @desc    Get rendered preview of newsletter
 * @access  Private
 */
router.get('/:id/preview', newsletterController.previewNewsletter);

/**
 * @route   GET /api/v1/newsletters/:id/analytics
 * @desc    Get analytics for a sent newsletter
 * @access  Private
 */
router.get('/:id/analytics', newsletterController.getNewsletterAnalytics);

/**
 * @route   POST /api/v1/newsletters/:id/test
 * @desc    Send test email
 * @access  Private
 */
router.post('/:id/test', newsletterController.sendTestEmail);

module.exports = router;
