const meetingService = require('../services/meeting.service');
const { createMeetingSchema, updateMeetingSchema, updateMeetingStatusSchema } = require('../validators/meeting.validator');
const ApiError = require('../utils/apiError');

const createMeeting = async (req, res, next) => {
  try {
    const parseResult = createMeetingSchema.safeParse(req.body);
    if (!parseResult.success) {
      const errorMsg = parseResult.error.errors.map(e => e.message).join(', ');
      throw new ApiError(400, errorMsg, true, '', 'VALIDATION_ERROR');
    }

    const result = await meetingService.createMeeting(req.user, parseResult.data, req);
    return res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

const getMeetings = async (req, res, next) => {
  try {
    const result = await meetingService.getMeetings(req.user, req.query);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const getMeetingById = async (req, res, next) => {
  try {
    const result = await meetingService.getMeetingById(req.user, req.params.id);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const updateMeeting = async (req, res, next) => {
  try {
    const parseResult = updateMeetingSchema.safeParse(req.body);
    if (!parseResult.success) {
      const errorMsg = parseResult.error.errors.map(e => e.message).join(', ');
      throw new ApiError(400, errorMsg, true, '', 'VALIDATION_ERROR');
    }

    const result = await meetingService.updateMeeting(req.user, req.params.id, parseResult.data, req);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const updateMeetingStatus = async (req, res, next) => {
  try {
    const parseResult = updateMeetingStatusSchema.safeParse(req.body);
    if (!parseResult.success) {
      const errorMsg = parseResult.error.errors.map(e => e.message).join(', ');
      throw new ApiError(400, errorMsg, true, '', 'VALIDATION_ERROR');
    }

    const result = await meetingService.updateMeetingStatus(req.user, req.params.id, parseResult.data.status, req);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const deleteMeeting = async (req, res, next) => {
  try {
    const result = await meetingService.deleteMeeting(req.user, req.params.id, req);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createMeeting,
  getMeetings,
  getMeetingById,
  updateMeeting,
  updateMeetingStatus,
  deleteMeeting
};
