const express = require('express');
const router = express.Router();
const Report = require('../models/Report');
const Product = require('../models/Product');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');

router.post('/', protect, async (req, res) => {
  try {
    const { targetType, targetId, reason, details } = req.body;
    const report = await Report.create({
      reporter: req.user._id,
      targetType,
      targetId,
      reason,
      details
    });
    res.status(201).json({ success: true, data: report });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/my', protect, async (req, res) => {
  try {
    const reports = await Report.find({ reporter: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, data: reports });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/admin', protect, authorize('admin'), async (req, res) => {
  try {
    const { status, targetType, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (targetType) filter.targetType = targetType;

    const [reports, total] = await Promise.all([
      Report.find(filter)
        .populate('reporter', 'name email role')
        .populate('reviewedBy', 'name email')
        .sort({ createdAt: -1 })
        .skip((Number(page) - 1) * Number(limit))
        .limit(Number(limit)),
      Report.countDocuments(filter)
    ]);

    res.json({ success: true, data: reports, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/admin/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const { status, adminNotes, resolutionAction, banReason } = req.body;
    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ success: false, message: 'Report not found' });

    report.status = status || report.status;
    report.adminNotes = adminNotes;
    report.resolutionAction = resolutionAction || report.resolutionAction;
    report.reviewedBy = req.user._id;
    report.reviewedAt = new Date();

    if (resolutionAction === 'user_banned' && report.targetType === 'user') {
      await User.findByIdAndUpdate(report.targetId, {
        isBanned: true,
        isActive: false,
        bannedReason: banReason || report.reason,
        bannedAt: new Date()
      });
    }

    if (resolutionAction === 'listing_removed' && report.targetType === 'product') {
      await Product.findByIdAndUpdate(report.targetId, { status: 'expired' });
    }

    await report.save();
    res.json({ success: true, data: report });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
