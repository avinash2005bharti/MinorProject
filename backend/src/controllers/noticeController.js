const Notice = require('../models/Notice');
const Notification = require('../models/Notification');
const { emitNotification } = require('../sockets/socketHandler');

exports.getNotices = async (req, res, next) => {
  try {
    const { targetType, targetValue } = req.query;
    const filter = {};
    if (targetType) filter.targetType = targetType;
    if (targetValue) filter.targetValue = targetValue;

    const notices = await Notice.find(filter).sort({ pinned: -1, createdAt: -1 });
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
      authorRole: req.user?.role === 'hod' ? 'HOD Office' : req.user?.role === 'teacher' ? 'Faculty' : 'TG / Mentor',
      authorName: req.user?.name || req.body.authorName || 'CSE Department',
      targetType: req.body.targetType || 'Section',
      targetValue: req.body.targetValue || 'CSE-3A',
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
