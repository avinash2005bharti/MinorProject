const { Op } = require('sequelize');
const { Notification } = require('../models/mysql');
const { emitNotification } = require('../sockets/socketHandler');

exports.getNotifications = async (req, res, next) => {
  try {
    const role = (req.query.role || req.user?.role || 'student').toLowerCase();
    const userId = req.user?.id;

    const orConditions = [
      { recipient: role },
      { role: role }
    ];
    if (userId) {
      orConditions.push({ userId });
    }

    const notifications = await Notification.findAll({
      where: {
        [Op.or]: orConditions
      },
      order: [['createdAt', 'DESC']],
      limit: 50
    });

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
      userId: req.body.userId || req.user?.id || null,
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
    const notif = await Notification.findByPk(req.params.id);
    if (notif) {
      notif.read = true;
      await notif.save();
    }
    res.status(200).json({ success: true, data: notif });
  } catch (error) {
    next(error);
  }
};

exports.clearAllNotifications = async (req, res, next) => {
  try {
    const role = (req.query.role || req.user?.role || 'student').toLowerCase();
    await Notification.update({ read: true }, { where: { recipient: role } });
    res.status(200).json({ success: true, message: 'All notifications marked as read.' });
  } catch (error) {
    next(error);
  }
};
