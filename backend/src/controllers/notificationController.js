// ============================================================================
// Departmental ERP - Notification Controller
// Canonical Source of Truth: PostgreSQL via Prisma
// ============================================================================

const { prisma } = require('../config/postgres');
const { emitNotification } = require('../sockets/socketHandler');

exports.getNotifications = async (req, res, next) => {
  try {
    const role = (req.params.role || req.query.role || req.user?.role || 'STUDENT').toUpperCase();
    const userId = req.user?.id;

    const notifications = await prisma.notification.findMany({
      where: {
        OR: [
          { recipientRole: { in: [role, 'ALL'] } },
          ...(userId ? [{ userId }] : [])
        ]
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    const formatted = notifications.map(n => ({
      ...n,
      read: n.isRead,
      recipient: n.recipientRole
    }));

    return res.status(200).json({
      success: true,
      count: formatted.length,
      data: formatted,
      notifications: formatted
    });
  } catch (error) {
    next(error);
  }
};

exports.createNotification = async (req, res, next) => {
  try {
    const { recipient, role, title, message, type = 'INFO', recipientRole, userId, linkUrl } = req.body;
    const finalRole = (recipientRole || role || recipient || 'ALL').toUpperCase();

    const notif = await prisma.notification.create({
      data: {
        userId: userId || null,
        recipientRole: finalRole,
        title: title || 'Department Notification',
        message: message || '',
        type: (type || 'INFO').toUpperCase(),
        linkUrl: linkUrl || null,
        isRead: false
      }
    });

    const formatted = {
      ...notif,
      read: false,
      recipient: notif.recipientRole
    };

    try {
      emitNotification(finalRole.toLowerCase(), formatted);
    } catch (e) {}

    return res.status(201).json({
      success: true,
      message: 'Notification dispatched and recorded in PostgreSQL.',
      data: formatted
    });
  } catch (error) {
    next(error);
  }
};

exports.markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const notif = await prisma.notification.update({
      where: { id },
      data: { isRead: true }
    });

    return res.status(200).json({ success: true, data: { ...notif, read: true } });
  } catch (error) {
    next(error);
  }
};

exports.clearAllNotifications = async (req, res, next) => {
  try {
    const role = (req.query.role || req.user?.role || 'STUDENT').toUpperCase();
    await prisma.notification.updateMany({
      where: { recipientRole: { in: [role, 'ALL'] } },
      data: { isRead: true }
    });

    return res.status(200).json({ success: true, message: 'All notifications marked as read.' });
  } catch (error) {
    next(error);
  }
};
