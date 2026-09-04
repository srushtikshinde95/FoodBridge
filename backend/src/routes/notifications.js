import express from 'express';
import { queryGet, queryRun, queryAll } from '../db/connection.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get current user's notifications
router.get('/', authenticateToken, (req, res) => {
  const notifications = queryAll(`
    SELECT * FROM notifications 
    WHERE user_id = ? 
    ORDER BY created_at DESC 
    LIMIT 30
  `, [req.user.id]);

  const unreadCount = queryGet(`
    SELECT COUNT(*) as c FROM notifications 
    WHERE user_id = ? AND is_read = 0
  `, [req.user.id])?.c || 0;

  res.json({ notifications, unread_count: unreadCount });
});

// Mark single notification as read
router.patch('/:id/read', authenticateToken, (req, res) => {
  queryRun('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
  res.json({ message: 'Notification marked as read' });
});

// Mark all as read
router.patch('/read-all', authenticateToken, (req, res) => {
  queryRun('UPDATE notifications SET is_read = 1 WHERE user_id = ?', [req.user.id]);
  res.json({ message: 'All notifications marked as read' });
});

export default router;
