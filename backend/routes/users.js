const express = require('express');
const { supabase } = require('../database/supabase');
const auth = require('../middleware/auth');

const router = express.Router();

// Get all users (Admin only)
router.get('/', auth, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied' });
    }

    try {
        const { data: users, error } = await supabase
            .from('users')
            .select('id, username, email, phone, role, created_at')
            .neq('id', req.user.id)
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json({ users: users || [] });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ message: 'Database error' });
    }
});

// Update user role
router.put('/:id/role', auth, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied' });
    }

    const { role } = req.body;
    const userId = req.params.id;

    if (!['user', 'admin'].includes(role)) {
        return res.status(400).json({ message: 'Invalid role' });
    }

    try {
        const { data: user, error } = await supabase
            .from('users')
            .update({ role })
            .eq('id', userId)
            .select()
            .single();

        if (error) throw error;

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({ message: 'User role updated successfully' });
    } catch (error) {
        console.error('Error updating user role:', error);
        res.status(500).json({ message: 'Error updating user' });
    }
});

// Delete user
router.delete('/:id', auth, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied' });
    }

    const userId = req.params.id;

    try {
        // Get user details for confirmation
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('username')
            .eq('id', userId)
            .single();

        if (userError) throw userError;
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Delete user (this will cascade to reports due to foreign key constraints)
        const { error: deleteError } = await supabase
            .from('users')
            .delete()
            .eq('id', userId);

        if (deleteError) throw deleteError;

        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ message: 'Error deleting user' });
    }
});

module.exports = router;
