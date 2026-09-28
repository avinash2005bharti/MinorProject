const agentService = require('../services/agentService');

exports.runAttendanceAgent = async (req, res, next) => {
  try {
    const { studentRoll, section, dateRange, requestId } = req.body;
    const result = await agentService.runAttendanceAgent({
      requestId,
      studentRoll: studentRoll || '21CSE084',
      section: section || 'CSE-3A',
      dateRange: dateRange || '10 Sept – 15 Sept'
    });
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.runLeaveAgent = async (req, res, next) => {
  try {
    const { studentRoll, isTgAvailable } = req.body;
    const result = await agentService.runLeaveAgent({
      studentRoll: studentRoll || '21CSE084',
      isTgAvailable: isTgAvailable !== false
    });
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.runTimetableAgent = async (req, res, next) => {
  try {
    const { action } = req.body; // 'analyze' or 'resolve'
    const result = await agentService.runTimetableAgent(action);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.getAgentsStatus = async (req, res, next) => {
  try {
    const status = await agentService.getAgentsStatus();
    res.status(200).json({ success: true, data: status });
  } catch (error) {
    next(error);
  }
};
