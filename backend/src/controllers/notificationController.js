const Notification = require('../models/Notification');
const { emitNotification } = require('../sockets/socketHandler');

exports.getNotifications = async (req, res, next) => {
  try {
    const role = req.query.role || req.user?.role || 'student';
    const userId = req.user?._id;

    const filter = {
      $or: [
        { recipient: role.toLowerCase() },
        { role: role.toLowerCase() },
        ...(userId ? [{ userId }] : [])
      ]
    };

    const notifications = await Notification.find(filter).sort({ createdAt: -1 }).limit(50);
    res.status(200).json({
      success: true,
      count: notifications.length,
      data: notifications
    });
  } catch (error) {
    next(error);
  }
};

exports.createNotification = async (req, res, next) => {
  try {
    const { recipient, role, title, message, type } = req.body;
    const notif = await Notification.create({
      recipient: recipient || 'student',
      role: role || 'student',
      title,
      message,
      type: type || 'info'
    });

    emitNotification(recipient || 'student', notif);

    res.status(201).json({
      success: true,
      message: 'Notification dispatched and stored.',
      data: notif
    });
  } catch (error) {
    next(error);
  }
};

exports.markAsRead = async (req, res, next) => {
  try {
    const notif = await Notification.findByIdAndUpdate(
      req.params.id,
      { read: true },
      { new: true }
    );
    res.status(200).json({ success: true, data: notif });
  } catch (error) {
    next(error);
  }
};

exports.clearAllNotifications = async (req, res, next) => {
  try {
    const role = req.query.role || req.user?.role || 'student';
    await Notification.updateMany({ recipient: role }, { read: true });
    res.status(200).json({ success: true, message: 'All notifications marked as read.' });
  } catch (error) {
    next(error);
  }
};
