const express = require('express');
const { 
  createMeeting, 
  getMeetings, 
  getMeetingById, 
  updateMeeting, 
  updateMeetingStatus, 
  deleteMeeting 
} = require('../controllers/meeting.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(authenticateToken);

router.post('/', createMeeting);
router.get('/', getMeetings);
router.get('/:id', getMeetingById);
router.put('/:id', updateMeeting);
router.patch('/:id/status', updateMeetingStatus);
router.delete('/:id', deleteMeeting);

module.exports = router;
