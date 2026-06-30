const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Livestock = require('../models/Livestock');
const LivestockEvent = require('../models/LivestockEvent');
const LivestockInventory = require('../models/LivestockInventory');
const Reproduction = require('../models/Reproduction');
const BreedsLibrary = require('../models/BreedsLibrary');
const FarmWorkspace = require('../models/FarmWorkspace');

// ============================================================
// ANIMALS
// ============================================================

// GET /api/livestock/animals - list all animals for user
router.get('/animals', protect, async (req, res) => {
  try {
    const { species, healthStatus, group, workspace, search } = req.query;
    const filter = { owner: req.user._id, isActive: true };
    if (species) filter.species = species;
    if (healthStatus) filter.healthStatus = healthStatus;
    if (group) filter.group = group;
    if (workspace) filter.workspace = workspace;

    let query = Livestock.find(filter)
      .populate('breedRef', 'name species')
      .populate('parentage.mother', 'name tagId species')
      .populate('parentage.father', 'name tagId species')
      .sort({ createdAt: -1 });

    const animals = await query;
    res.json({ success: true, data: animals, count: animals.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/livestock/animals/:id
router.get('/animals/:id', protect, async (req, res) => {
  try {
    const animal = await Livestock.findOne({ _id: req.params.id, owner: req.user._id })
      .populate('breedRef')
      .populate('parentage.mother', 'name tagId species photos')
      .populate('parentage.father', 'name tagId species photos')
      .populate('workspace', 'name');
    if (!animal) return res.status(404).json({ success: false, message: 'Animal not found' });
    res.json({ success: true, data: animal });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/livestock/animals
router.post('/animals', protect, async (req, res) => {
  try {
    const animal = await Livestock.create({ ...req.body, owner: req.user._id });
    res.status(201).json({ success: true, data: animal });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// PUT /api/livestock/animals/:id
router.put('/animals/:id', protect, async (req, res) => {
  try {
    const animal = await Livestock.findOneAndUpdate(
      { _id: req.params.id, owner: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!animal) return res.status(404).json({ success: false, message: 'Animal not found' });
    res.json({ success: true, data: animal });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// DELETE /api/livestock/animals/:id - soft delete
router.delete('/animals/:id', protect, async (req, res) => {
  try {
    const animal = await Livestock.findOneAndUpdate(
      { _id: req.params.id, owner: req.user._id },
      { isActive: false },
      { new: true }
    );
    if (!animal) return res.status(404).json({ success: false, message: 'Animal not found' });
    res.json({ success: true, message: 'Animal removed' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/livestock/animals/:id/offspring
router.get('/animals/:id/offspring', protect, async (req, res) => {
  try {
    const offspring = await Livestock.find({
      owner: req.user._id,
      $or: [{ 'parentage.mother': req.params.id }, { 'parentage.father': req.params.id }]
    }).select('name tagId species gender dateOfBirth healthStatus photos');
    res.json({ success: true, data: offspring });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/livestock/stats - herd summary stats
router.get('/stats', protect, async (req, res) => {
  try {
    const baseFilter = { owner: req.user._id, isActive: true };
    const [total, bySpecies, byHealth, pregnantCount, lowStockItems] = await Promise.all([
      Livestock.countDocuments(baseFilter),
      Livestock.aggregate([
        { $match: baseFilter },
        { $group: { _id: '$species', count: { $sum: 1 } } }
      ]),
      Livestock.aggregate([
        { $match: baseFilter },
        { $group: { _id: '$healthStatus', count: { $sum: 1 } } }
      ]),
      Livestock.countDocuments({ ...baseFilter, healthStatus: 'pregnant' }),
      LivestockInventory.countDocuments({
        owner: req.user._id,
        isActive: true,
        reorderPoint: { $gt: 0 },
        $expr: { $lte: ['$currentQuantity', '$reorderPoint'] }
      })
    ]);
    res.json({
      success: true,
      data: {
        total,
        totalAnimals: total,
        activeAnimals: total,
        pregnant: pregnantCount,
        lowStockAlerts: lowStockItems,
        bySpecies,
        byHealth,
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ============================================================
// EVENTS
// ============================================================

// GET /api/livestock/events - list events (filterable)
router.get('/events', protect, async (req, res) => {
  try {
    const { animal, type, from, to, limit = 50, page = 1 } = req.query;
    const filter = { owner: req.user._id };
    if (animal) filter.animal = animal;
    if (type) filter.type = type;
    if (from || to) {
      filter.date = {};
      if (from) filter.date.$gte = new Date(from);
      if (to) filter.date.$lte = new Date(to);
    }
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [events, total] = await Promise.all([
      LivestockEvent.find(filter)
        .populate('animal', 'name tagId species photos')
        .sort({ date: -1 })
        .limit(parseInt(limit))
        .skip(skip),
      LivestockEvent.countDocuments(filter)
    ]);
    res.json({ success: true, data: events, total, page: parseInt(page) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/livestock/events
router.post('/events', protect, async (req, res) => {
  try {
    const event = await LivestockEvent.create({ ...req.body, owner: req.user._id });
    res.status(201).json({ success: true, data: event });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// PUT /api/livestock/events/:id
router.put('/events/:id', protect, async (req, res) => {
  try {
    const event = await LivestockEvent.findOneAndUpdate(
      { _id: req.params.id, owner: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    res.json({ success: true, data: event });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// DELETE /api/livestock/events/:id
router.delete('/events/:id', protect, async (req, res) => {
  try {
    const event = await LivestockEvent.findOneAndDelete({ _id: req.params.id, owner: req.user._id });
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    res.json({ success: true, message: 'Event deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/livestock/reminders - upcoming reminders
router.get('/reminders', protect, async (req, res) => {
  try {
    const upcoming = await LivestockEvent.find({
      owner: req.user._id,
      'reminder.isSet': true,
      'reminder.notified': false,
      'reminder.dueDate': { $gte: new Date() }
    })
      .populate('animal', 'name tagId species')
      .sort({ 'reminder.dueDate': 1 })
      .limit(20);
    res.json({ success: true, data: upcoming });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ============================================================
// INVENTORY
// ============================================================

// GET /api/livestock/inventory
router.get('/inventory', protect, async (req, res) => {
  try {
    const { category, lowStock, workspace } = req.query;
    const filter = { owner: req.user._id, isActive: true };
    if (category) filter.category = category;
    if (workspace) filter.workspace = workspace;

    const items = await LivestockInventory.find(filter).sort({ category: 1, name: 1 });

    let result = items;
    if (lowStock === 'true') {
      result = items.filter(i => i.reorderPoint > 0 && i.currentQuantity <= i.reorderPoint);
    }

    res.json({ success: true, data: result, count: result.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/livestock/inventory
router.post('/inventory', protect, async (req, res) => {
  try {
    const item = await LivestockInventory.create({ ...req.body, owner: req.user._id });
    res.status(201).json({ success: true, data: item });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// PUT /api/livestock/inventory/:id
router.put('/inventory/:id', protect, async (req, res) => {
  try {
    const item = await LivestockInventory.findOneAndUpdate(
      { _id: req.params.id, owner: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!item) return res.status(404).json({ success: false, message: 'Item not found' });
    res.json({ success: true, data: item });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// POST /api/livestock/inventory/:id/movement - log stock movement
router.post('/inventory/:id/movement', protect, async (req, res) => {
  try {
    const { type, quantity, reason, reference } = req.body;
    const item = await LivestockInventory.findOne({ _id: req.params.id, owner: req.user._id });
    if (!item) return res.status(404).json({ success: false, message: 'Item not found' });

    const change = type === 'in' ? quantity : type === 'out' ? -quantity : quantity;
    item.currentQuantity = Math.max(0, item.currentQuantity + change);
    item.movements.push({ type, quantity, reason, reference, performedBy: req.user._id });
    await item.save();
    res.json({ success: true, data: item });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// DELETE /api/livestock/inventory/:id
router.delete('/inventory/:id', protect, async (req, res) => {
  try {
    const item = await LivestockInventory.findOneAndUpdate(
      { _id: req.params.id, owner: req.user._id },
      { isActive: false },
      { new: true }
    );
    if (!item) return res.status(404).json({ success: false, message: 'Item not found' });
    res.json({ success: true, message: 'Item removed' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ============================================================
// REPRODUCTION
// ============================================================

// GET /api/livestock/reproduction
router.get('/reproduction', protect, async (req, res) => {
  try {
    const { animal, recordType } = req.query;
    const filter = { owner: req.user._id };
    if (animal) filter.animal = animal;
    if (recordType) filter.recordType = recordType;
    const records = await Reproduction.find(filter)
      .populate('animal', 'name tagId species breed gender photos')
      .populate('mating.sire', 'name tagId species breed')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: records });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/livestock/reproduction
router.post('/reproduction', protect, async (req, res) => {
  try {
    const record = await Reproduction.create({ ...req.body, owner: req.user._id });
    res.status(201).json({ success: true, data: record });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// GET /api/livestock/reproduction/upcoming-births — MUST be before /:id to avoid param match
router.get('/reproduction/upcoming-births', protect, async (req, res) => {
  try {
    const upcoming = await Reproduction.find({
      owner: req.user._id,
      recordType: 'pregnancy',
      'pregnancy.status': 'confirmed',
      'pregnancy.expectedDueDate': { $gte: new Date() }
    })
      .populate('animal', 'name tagId species breed photos')
      .sort({ 'pregnancy.expectedDueDate': 1 })
      .limit(20);
    res.json({ success: true, data: upcoming });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/livestock/reproduction/:id
router.put('/reproduction/:id', protect, async (req, res) => {
  try {
    const record = await Reproduction.findOneAndUpdate(
      { _id: req.params.id, owner: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!record) return res.status(404).json({ success: false, message: 'Record not found' });
    res.json({ success: true, data: record });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// DELETE /api/livestock/reproduction/:id
router.delete('/reproduction/:id', protect, async (req, res) => {
  try {
    const record = await Reproduction.findOneAndDelete({ _id: req.params.id, owner: req.user._id });
    if (!record) return res.status(404).json({ success: false, message: 'Record not found' });
    res.json({ success: true, message: 'Record deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ============================================================
// BREEDS LIBRARY
// ============================================================

// GET /api/livestock/breeds
router.get('/breeds', async (req, res) => {
  try {
    const { species, search, purpose } = req.query;
    const filter = {};
    if (species) filter.species = species;
    if (purpose) filter.purpose = purpose;
    if (search) filter.$text = { $search: search };

    const breeds = await BreedsLibrary.find(filter)
      .select('-careRequirements.commonDiseases -__v')
      .sort({ species: 1, name: 1 });
    res.json({ success: true, data: breeds, count: breeds.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/livestock/breeds/:id
router.get('/breeds/:id', async (req, res) => {
  try {
    const breed = await BreedsLibrary.findById(req.params.id);
    if (!breed) return res.status(404).json({ success: false, message: 'Breed not found' });
    res.json({ success: true, data: breed });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/livestock/breeds - add custom breed (auth required)
router.post('/breeds', protect, async (req, res) => {
  try {
    const breed = await BreedsLibrary.create({ ...req.body, isCustom: true, createdBy: req.user._id });
    res.status(201).json({ success: true, data: breed });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// ============================================================
// WORKSPACES
// ============================================================

// GET /api/livestock/workspaces
router.get('/workspaces', protect, async (req, res) => {
  try {
    const workspaces = await FarmWorkspace.find({
      $or: [
        { owner: req.user._id },
        { 'members.user': req.user._id, 'members.inviteStatus': 'accepted' }
      ],
      isActive: true
    })
      .populate('owner', 'name email')
      .populate('members.user', 'name email')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: workspaces });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/livestock/workspaces
router.post('/workspaces', protect, async (req, res) => {
  try {
    const workspace = await FarmWorkspace.create({ ...req.body, owner: req.user._id });
    res.status(201).json({ success: true, data: workspace });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// PUT /api/livestock/workspaces/:id
router.put('/workspaces/:id', protect, async (req, res) => {
  try {
    const workspace = await FarmWorkspace.findOneAndUpdate(
      { _id: req.params.id, owner: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!workspace) return res.status(404).json({ success: false, message: 'Workspace not found' });
    res.json({ success: true, data: workspace });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// POST /api/livestock/workspaces/:id/members - invite member
router.post('/workspaces/:id/members', protect, async (req, res) => {
  try {
    const workspace = await FarmWorkspace.findOne({ _id: req.params.id, owner: req.user._id });
    if (!workspace) return res.status(404).json({ success: false, message: 'Workspace not found' });
    const { userId, role } = req.body;
    const existing = workspace.members.find(m => m.user.toString() === userId);
    if (existing) return res.status(400).json({ success: false, message: 'User already a member' });
    workspace.members.push({ user: userId, role: role || 'worker', inviteStatus: 'pending' });
    await workspace.save();
    res.json({ success: true, data: workspace });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// PUT /api/livestock/workspaces/:id/members/:userId/accept - accept workspace invite
router.put('/workspaces/:id/members/:userId/accept', protect, async (req, res) => {
  try {
    const workspace = await FarmWorkspace.findById(req.params.id);
    if (!workspace) return res.status(404).json({ success: false, message: 'Workspace not found' });
    const member = workspace.members.find(
      m => m.user.toString() === req.params.userId && req.params.userId === req.user._id.toString()
    );
    if (!member) return res.status(404).json({ success: false, message: 'Invite not found' });
    if (member.inviteStatus === 'accepted') return res.json({ success: true, message: 'Already accepted' });
    member.inviteStatus = 'accepted';
    member.joinedAt = new Date();
    await workspace.save();
    res.json({ success: true, data: workspace });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/livestock/workspaces/:id/members/:userId
router.delete('/workspaces/:id/members/:userId', protect, async (req, res) => {
  try {
    const workspace = await FarmWorkspace.findOne({ _id: req.params.id, owner: req.user._id });
    if (!workspace) return res.status(404).json({ success: false, message: 'Workspace not found' });
    workspace.members = workspace.members.filter(m => m.user.toString() !== req.params.userId);
    await workspace.save();
    res.json({ success: true, message: 'Member removed' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
