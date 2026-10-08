// ============================================================================
// Departmental ERP - Notice Controller
// Canonical Source of Truth: PostgreSQL via Prisma
// ============================================================================

const { prisma } = require('../config/postgres');
const { emitNotification } = require('../sockets/socketHandler');

const path = require('path');
const imageKitService = require('../services/imageKitService');

exports.getNotices = async (req, res, next) => {
  try {
    const role = (req.user?.role || req.user?.roleName || '').toUpperCase();
    const audienceRoles = role === 'TG'
      ? ['TEACHER', 'FACULTY', 'TG', 'ALL']
      : role === 'TEACHER' || role === 'FACULTY'
        ? ['TEACHER', 'FACULTY', 'ALL']
        : [role, 'ALL'];
    const notices = await prisma.notification.findMany({
      where: {
        type: { in: ['NOTICE', 'INFO', 'ALERT'] },
        AND: [
          { recipientRole: { in: audienceRoles } },
          { OR: [{ userId: null }, { userId: req.user.id }] }
        ]
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    const formatted = notices.map((n) => {
      const isUrgent = n.type === 'ALERT' || (n.title && n.title.toLowerCase().includes('urgent')) || (n.message && n.message.toLowerCase().includes('exam'));
      const hasAttachment = Boolean(n.linkUrl);
      let attachmentName = null;
      if (n.linkUrl) {
        try {
          const rawName = n.linkUrl.split('/').pop().split('?')[0];
          attachmentName = decodeURIComponent(rawName);
        } catch (e) {
          attachmentName = 'Attached Circular Document';
        }
      }

      return {
        id: n.id,
        title: n.title || 'Department Circular',
        content: n.message || '',
        message: n.message || '',
        type: n.type || 'NOTICE',
        priority: isUrgent ? 'urgent' : (n.type === 'INFO' ? 'info' : 'normal'),
        targetType: n.recipientRole === 'ALL' ? 'Department' : (n.recipientRole || 'Department'),
        targetValue: n.recipientRole === 'ALL' ? 'All Students & Faculty' : (n.recipientRole || 'Campus'),
        authorName: 'Official Administration',
        authorRole: 'HOD / Admin / Faculty',
        date: new Date(n.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        createdAt: n.createdAt,
        pinned: Boolean(isUrgent),
        isRead: Boolean(n.isRead),
        linkUrl: n.linkUrl,
        attachmentUrl: n.linkUrl,
        attachmentName: attachmentName,
        hasAttachment: hasAttachment
      };
    });

    return res.status(200).json({ success: true, count: formatted.length, data: formatted, notices: formatted });
  } catch (error) {
    next(error);
  }
};

exports.createNotice = async (req, res, next) => {
  try {
    const {
      title,
      content,
      message,
      type = 'NOTICE',
      recipientRole = 'ALL',
      priority,
      targetType,
      targetValue,
      pinned
    } = req.body;

    let attachmentUrl = req.body.attachmentUrl || req.body.linkUrl || null;
    let originalFilename = null;

    if (req.file) {
      originalFilename = req.file.originalname;
      if (imageKitService && imageKitService.isConfigured && imageKitService.isConfigured()) {
        try {
          const ikResult = await imageKitService.uploadFromPath(
            req.file.path,
            req.file.originalname,
            '/notices',
            ['notice', 'circular']
          );
          if (ikResult && ikResult.url) {
            attachmentUrl = ikResult.url;
          }
        } catch (ikErr) {
          attachmentUrl = `/uploads/${req.file.filename}`;
        }
      }
      if (!attachmentUrl) {
        attachmentUrl = `/uploads/${req.file.filename}`;
      }
    }

    const noticeType = (priority === 'urgent' ? 'ALERT' : (type || 'NOTICE')).toUpperCase();

    const notice = await prisma.notification.create({
      data: {
        title: title || 'Department Notice',
        message: content || message || '',
        type: noticeType,
        recipientRole: (targetValue || recipientRole || 'ALL').toUpperCase(),
        linkUrl: attachmentUrl,
        isRead: false
      }
    });

    try {
      emitNotification((recipientRole || 'all').toLowerCase(), notice);
    } catch (e) {}

    const formattedNotice = {
      id: notice.id,
      title: notice.title,
      content: notice.message,
      message: notice.message,
      type: notice.type,
      priority: priority || (notice.type === 'ALERT' ? 'urgent' : 'normal'),
      targetType: targetType || 'Department',
      targetValue: targetValue || notice.recipientRole,
      authorName: req.user?.name || 'Department Authority',
      authorRole: req.user?.role || 'Admin / HOD',
      date: new Date(notice.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      createdAt: notice.createdAt,
      pinned: Boolean(pinned),
      isRead: false,
      linkUrl: notice.linkUrl,
      attachmentUrl: notice.linkUrl,
      attachmentName: originalFilename || (notice.linkUrl ? notice.linkUrl.split('/').pop() : null),
      hasAttachment: Boolean(notice.linkUrl)
    };

    return res.status(201).json({
      success: true,
      message: 'Notice broadcasted successfully.',
      data: formattedNotice,
      notice: formattedNotice
    });
  } catch (error) {
    next(error);
  }
};

exports.markRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const role = (req.user?.role || req.user?.roleName || '').toUpperCase();
    const audienceRoles = role === 'TG'
      ? ['TEACHER', 'FACULTY', 'TG', 'ALL']
      : role === 'TEACHER' || role === 'FACULTY'
        ? ['TEACHER', 'FACULTY', 'ALL']
        : [role, 'ALL'];
    const existing = await prisma.notification.findFirst({
      where: {
        id,
        AND: [
          { OR: [{ recipientRole: { in: audienceRoles } }, { userId: req.user.id }] },
          { OR: [{ userId: null }, { userId: req.user.id }] }
        ]
      }
    });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Notice not found.' });
    }
    const notice = await prisma.notification.update({
      where: { id },
      data: { isRead: true }
    });
    return res.status(200).json({ success: true, message: 'Notice marked as read.', notice });
  } catch (error) {
    next(error);
  }
};

exports.markUnread = async (req, res, next) => {
  try {
    const { id } = req.params;
    const role = (req.user?.role || req.user?.roleName || '').toUpperCase();
    const audienceRoles = role === 'TG'
      ? ['TEACHER', 'FACULTY', 'TG', 'ALL']
      : role === 'TEACHER' || role === 'FACULTY'
        ? ['TEACHER', 'FACULTY', 'ALL']
        : [role, 'ALL'];
    const existing = await prisma.notification.findFirst({
      where: {
        id,
        AND: [
          { OR: [{ recipientRole: { in: audienceRoles } }, { userId: req.user.id }] },
          { OR: [{ userId: null }, { userId: req.user.id }] }
        ]
      }
    });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Notice not found.' });
    }
    const notice = await prisma.notification.update({
      where: { id },
      data: { isRead: false }
    });
    return res.status(200).json({ success: true, message: 'Notice marked as unread.', notice });
  } catch (error) {
    next(error);
  }
};

exports.deleteNotice = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (req.user) {
      const role = (req.user.role || req.user.roleName || '').toUpperCase();
      const isHodOrAdmin = role === 'HOD' || role === 'ADMIN' || req.user.isHOD;
      if (!isHodOrAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Access Denied: Only HOD or Administrator can delete circulars.'
        });
      }
    }

    const existing = await prisma.notification.findUnique({
      where: { id }
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Circular not found or already deleted.'
      });
    }

    await prisma.notification.delete({
      where: { id }
    });

    return res.status(200).json({
      success: true,
      message: 'Notice circular deleted successfully.',
      id
    });
  } catch (error) {
    next(error);
  }
};
