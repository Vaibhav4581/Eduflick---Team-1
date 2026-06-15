const express = require('express');
const router = express.Router();
const {
  getSubmissions,
  getSubmissionById,
  createSubmission,
  submitFeedback,
  deleteSubmission,
} = require('../controllers/submissionController');

router.route('/').get(getSubmissions).post(createSubmission);

router.route('/:id').get(getSubmissionById).delete(deleteSubmission);

router.post('/:id/feedback', submitFeedback);

module.exports = router;
