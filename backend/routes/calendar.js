const express = require('express');
const router = express.Router();
const CropCalendar = require('../models/CropCalendar');
const { protect } = require('../middleware/auth');

router.post('/', protect, async (req, res) => {
  try {
    const { name, crop, variety, season, year, farm, timeline } = req.body;

    const calendar = await CropCalendar.create({
      user: req.user._id,
      name,
      crop,
      variety,
      season,
      year: year || new Date().getFullYear(),
      farm,
      timeline,
      status: 'planning'
    });

    res.status(201).json(calendar);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/', protect, async (req, res) => {
  try {
    const { year, status, crop } = req.query;
    const query = { user: req.user._id };

    if (year) query.year = parseInt(year);
    if (status) query.status = status;
    if (crop) query.crop = crop;

    const calendars = await CropCalendar.find(query).sort('-createdAt');

    res.json(calendars);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/:id', protect, async (req, res) => {
  try {
    const calendar = await CropCalendar.findById(req.params.id)
      .populate('linkedProducts');

    if (!calendar) {
      return res.status(404).json({ message: 'Calendar not found' });
    }

    const isOwner = calendar.user.toString() === req.user._id.toString();
    const isShared = calendar.sharedWith.some(s => s.user.toString() === req.user._id.toString());

    if (!isOwner && !isShared) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const upcomingTasks = calendar.getUpcomingTasks(7);
    const overdueTasks = calendar.getOverdueTasks();
    const profitability = calendar.calculateProfitability();

    res.json({
      ...calendar.toObject(),
      upcomingTasks,
      overdueTasks,
      profitability
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/:id', protect, async (req, res) => {
  try {
    const calendar = await CropCalendar.findById(req.params.id);

    if (!calendar) {
      return res.status(404).json({ message: 'Calendar not found' });
    }

    if (calendar.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const updates = req.body;
    Object.keys(updates).forEach(key => {
      calendar[key] = updates[key];
    });

    await calendar.save();

    res.json(calendar);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/:id/tasks', protect, async (req, res) => {
  try {
    const calendar = await CropCalendar.findById(req.params.id);

    if (!calendar) {
      return res.status(404).json({ message: 'Calendar not found' });
    }

    if (calendar.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const task = await calendar.addTask(req.body);

    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/:id/tasks/:taskId', protect, async (req, res) => {
  try {
    const calendar = await CropCalendar.findById(req.params.id);

    if (!calendar) {
      return res.status(404).json({ message: 'Calendar not found' });
    }

    if (calendar.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const task = calendar.tasks.id(req.params.taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    Object.keys(req.body).forEach(key => {
      task[key] = req.body[key];
    });

    if (req.body.status === 'completed' && !task.completedDate) {
      task.completedDate = new Date();
    }

    await calendar.save();

    res.json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/:id/inputs', protect, async (req, res) => {
  try {
    const calendar = await CropCalendar.findById(req.params.id);

    if (!calendar) {
      return res.status(404).json({ message: 'Calendar not found' });
    }

    if (calendar.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    calendar.inputs.push(req.body);
    await calendar.save();

    res.status(201).json(calendar.inputs[calendar.inputs.length - 1]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/:id/expenses', protect, async (req, res) => {
  try {
    const calendar = await CropCalendar.findById(req.params.id);

    if (!calendar) {
      return res.status(404).json({ message: 'Calendar not found' });
    }

    if (calendar.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    calendar.expenses.push({
      ...req.body,
      date: req.body.date || new Date()
    });
    await calendar.save();

    res.status(201).json(calendar.expenses[calendar.expenses.length - 1]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/:id/yields', protect, async (req, res) => {
  try {
    const calendar = await CropCalendar.findById(req.params.id);

    if (!calendar) {
      return res.status(404).json({ message: 'Calendar not found' });
    }

    if (calendar.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    calendar.yields.actual = req.body;
    if (calendar.status !== 'completed') {
      calendar.status = 'harvesting';
    }

    await calendar.save();

    res.json(calendar.yields);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/:id/sales', protect, async (req, res) => {
  try {
    const calendar = await CropCalendar.findById(req.params.id);

    if (!calendar) {
      return res.status(404).json({ message: 'Calendar not found' });
    }

    if (calendar.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (!calendar.revenue.sales) {
      calendar.revenue.sales = [];
    }

    const sale = {
      ...req.body,
      totalAmount: req.body.quantity * req.body.pricePerUnit,
      date: req.body.date || new Date()
    };

    calendar.revenue.sales.push(sale);
    calendar.revenue.actual = calendar.revenue.sales.reduce((sum, s) => sum + s.totalAmount, 0);

    await calendar.save();

    res.status(201).json(sale);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/:id/report', protect, async (req, res) => {
  try {
    const calendar = await CropCalendar.findById(req.params.id);

    if (!calendar) {
      return res.status(404).json({ message: 'Calendar not found' });
    }

    const profitability = calendar.calculateProfitability();
    
    const report = {
      summary: {
        crop: calendar.crop,
        variety: calendar.variety,
        season: calendar.season,
        year: calendar.year,
        farmSize: calendar.farm.size,
        status: calendar.status
      },
      timeline: {
        planted: calendar.timeline.plantingDate,
        harvested: calendar.timeline.actualHarvestDate || calendar.timeline.expectedHarvestDate,
        duration: calendar.timeline.growthDuration
      },
      inputs: {
        items: calendar.inputs,
        totalCost: calendar.inputs.reduce((sum, i) => sum + (i.cost || 0), 0)
      },
      expenses: {
        items: calendar.expenses,
        totalCost: calendar.expenses.reduce((sum, e) => sum + e.amount, 0)
      },
      yields: calendar.yields,
      revenue: calendar.revenue,
      profitability,
      tasks: {
        total: calendar.tasks.length,
        completed: calendar.tasks.filter(t => t.status === 'completed').length,
        pending: calendar.tasks.filter(t => t.status === 'pending').length
      }
    };

    res.json(report);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/:id/share', protect, async (req, res) => {
  try {
    const { userId, permission } = req.body;
    const calendar = await CropCalendar.findById(req.params.id);

    if (!calendar) {
      return res.status(404).json({ message: 'Calendar not found' });
    }

    if (calendar.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const existingShare = calendar.sharedWith.find(s => s.user.toString() === userId);
    if (existingShare) {
      existingShare.permission = permission;
    } else {
      calendar.sharedWith.push({ user: userId, permission });
    }

    await calendar.save();

    res.json({ message: 'Calendar shared successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/templates/:crop', async (req, res) => {
  try {
    const templates = {
      'Maize': {
        tasks: [
          { title: 'Land preparation', type: 'other', daysFromPlanting: -14 },
          { title: 'Apply basal fertilizer', type: 'fertilizing', daysFromPlanting: -7 },
          { title: 'Planting', type: 'planting', daysFromPlanting: 0 },
          { title: 'First weeding', type: 'weeding', daysFromPlanting: 21 },
          { title: 'Apply top dressing', type: 'fertilizing', daysFromPlanting: 35 },
          { title: 'Second weeding', type: 'weeding', daysFromPlanting: 42 },
          { title: 'Pest control', type: 'pest_control', daysFromPlanting: 50 },
          { title: 'Harvest', type: 'harvesting', daysFromPlanting: 120 }
        ],
        growthDuration: 120,
        inputs: ['Seeds', 'DAP Fertilizer', 'UREA', 'Pesticide']
      },
      'Rice': {
        tasks: [
          { title: 'Nursery preparation', type: 'other', daysFromPlanting: -30 },
          { title: 'Land preparation', type: 'other', daysFromPlanting: -7 },
          { title: 'Transplanting', type: 'planting', daysFromPlanting: 0 },
          { title: 'First weeding', type: 'weeding', daysFromPlanting: 21 },
          { title: 'Apply fertilizer', type: 'fertilizing', daysFromPlanting: 30 },
          { title: 'Water management', type: 'watering', daysFromPlanting: 45 },
          { title: 'Pest control', type: 'pest_control', daysFromPlanting: 60 },
          { title: 'Harvest', type: 'harvesting', daysFromPlanting: 150 }
        ],
        growthDuration: 150,
        inputs: ['Seeds', 'Fertilizer', 'Herbicide']
      }
    };

    const template = templates[req.params.crop] || templates['Maize'];

    res.json(template);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;



