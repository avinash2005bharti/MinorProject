const { Notice, Notification } = require('../models/mysql');
const { emitNotification } = require('../sockets/socketHandler');

exports.getNotices = async (req, res, next) => {
  try {
    const { targetType, targetValue } = req.query;
    const where = {};
    if (targetType) where.targetType = targetType;
    if (targetValue) where.targetValue = targetValue;

    const notices = await Notice.findAll({
      where,
      order: [['pinned', 'DESC'], ['createdAt', 'DESC']]
    });
    res.status(200).json({ success: true, count: notices.length, data: notices });
  } catch (error) {
    next(error);
  }
};

exports.createNotice = async (req, res, next) => {
  try {
    const notice = await Notice.create({
      title: req.body.title,
      content: req.body.content,
      authorRole: req.user?.role === 'hod' ? 'HOD Office' : req.user?.role === 'faculty' ? 'Faculty' : 'TG / Mentor',
      authorName: req.user?.name || req.body.authorName || 'Dr. Alok Verma',
      targetType: req.body.targetType || 'Department',
      targetValue: req.body.targetValue || 'CSE',
      priority: req.body.priority || 'normal',
      pinned: !!req.body.pinned
    });

    const notif = await Notification.create({
      recipient: 'student',
      role: 'student',
      title: `Notice: ${notice.title}`,
      message: notice.content.slice(0, 95) + '...',
      type: notice.priority === 'urgent' ? 'alert' : 'notice'
    });
    emitNotification('student', notif);

    res.status(201).json({ success: true, message: 'Notice broadcasted successfully.', data: notice });
  } catch (error) {
    next(error);
  }
};
