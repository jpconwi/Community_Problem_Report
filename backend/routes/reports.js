const express = require('express');
const { supabase } = require('../database/supabase'); // ✅ Changed from database to supabase
const auth = require('../middleware/auth');

const router = express.Router();

// Get all reports (Admin only)
router.get('/', auth, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied' });
    }

    try {
        const { data: reports, error } = await supabase
            .from('reports')
            .select(`
                *,
                users:user_id (username, email)
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json({ reports });
    } catch (error) {
        console.error('Error fetching reports:', error);
        res.status(500).json({ message: 'Database error' });
    }
});

// Get user's reports
router.get('/my-reports', auth, async (req, res) => {
    try {
        const { data: reports, error } = await supabase
            .from('reports')
            .select('*')
            .eq('user_id', req.user.id)
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json({ reports });
    } catch (error) {
        console.error('Error fetching user reports:', error);
        res.status(500).json({ message: 'Database error' });
    }
});

// Create new report
router.post('/', auth, async (req, res) => {
    const { problem_type, location, issue, priority, photo_data } = req.body;

    if (!problem_type || !location || !issue) {
        return res.status(400).json({ message: 'Problem type, location, and issue are required' });
    }

    try {
        const { data: report, error } = await supabase
            .from('reports')
            .insert([
                {
                    user_id: req.user.id,
                    name: req.user.username,
                    problem_type,
                    location,
                    issue,
                    date: new Date().toISOString(),
                    priority: priority || 'Medium',
                    photo_data: photo_data || null
                }
            ])
            .select()
            .single();

        if (error) throw error;

        res.status(201).json({
            message: 'Report created successfully',
            reportId: report.id
        });
    } catch (error) {
        console.error('Error creating report:', error);
        res.status(500).json({ message: 'Error creating report' });
    }
});

// Update report status
router.put('/:id/status', auth, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied' });
    }

    const { status } = req.body;
    const reportId = req.params.id;

    if (!['Pending', 'In Progress', 'Resolved'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status' });
    }

    try {
        const { data: report, error } = await supabase
            .from('reports')
            .update({ status })
            .eq('id', reportId)
            .select()
            .single();

        if (error) throw error;

        if (!report) {
            return res.status(404).json({ message: 'Report not found' });
        }

        // Create notification
        await supabase
            .from('notifications')
            .insert([
                {
                    user_id: report.user_id,
                    report_id: reportId,
                    message: `Your report status has been updated to ${status}`,
                    type: 'status_update'
                }
            ]);

        // Add admin log
        await supabase
            .from('admin_logs')
            .insert([
                {
                    admin_id: req.user.id,
                    action: 'UPDATE_STATUS',
                    target_type: 'report',
                    target_id: reportId,
                    details: `Status changed to ${status}`
                }
            ]);

        res.json({ message: 'Report status updated successfully' });
    } catch (error) {
        console.error('Error updating report:', error);
        res.status(500).json({ message: 'Error updating report' });
    }
});

// Delete report
router.delete('/:id', auth, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied' });
    }

    const reportId = req.params.id;

    try {
        // Get report details for log
        const { data: report, error: reportError } = await supabase
            .from('reports')
            .select('problem_type, location')
            .eq('id', reportId)
            .single();

        if (reportError) throw reportError;
        if (!report) {
            return res.status(404).json({ message: 'Report not found' });
        }

        // Delete report
        const { error: deleteError } = await supabase
            .from('reports')
            .delete()
            .eq('id', reportId);

        if (deleteError) throw deleteError;

        // Add admin log
        await supabase
            .from('admin_logs')
            .insert([
                {
                    admin_id: req.user.id,
                    action: 'DELETE',
                    target_type: 'report',
                    target_id: reportId,
                    details: `Deleted: ${report.problem_type} - ${report.location}`
                }
            ]);

        res.json({ message: 'Report deleted successfully' });
    } catch (error) {
        console.error('Error deleting report:', error);
        res.status(500).json({ message: 'Error deleting report' });
    }
});

module.exports = router;