const express = require('express');
const { supabase } = require('../database/supabase');
const auth = require('../middleware/auth');

const router = express.Router();

// Get user notifications
router.get('/', auth, async (req, res) => {
    try {
        const { data: notifications, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', req.user.id)
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json({ notifications: notifications || [] });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ message: 'Database error' });
    }
});

// Mark notifications as read
router.put('/read', auth, async (req, res) => {
    try {
        const { error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('user_id', req.user.id)
            .eq('is_read', false);

        if (error) throw error;
        res.json({ message: 'Notifications marked as read' });
    } catch (error) {
        console.error('Error marking notifications as read:', error);
        res.status(500).json({ message: 'Database error' });
    }
});

module.exports = router;
