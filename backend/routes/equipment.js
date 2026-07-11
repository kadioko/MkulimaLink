const express = require('express');
const router = express.Router();
const { Equipment, EquipmentBooking } = require('../models/Equipment');
const { protect } = require('../middleware/auth');

router.post('/', protect, async (req, res) => {
  try {
    const equipment = await Equipment.create({
      ...req.body,
      owner: req.user._id
    });
    res.status(201).json(equipment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const { category, region, minPrice, maxPrice, available, page = 1, limit = 20 } = req.query;
    const query = {};
    if (category) query.category = category;
    if (region) query['location.region'] = region;
    if (available === 'true') query['availability.status'] = 'available';

    const equipment = await Equipment.find(query)
      .populate('owner', 'name location rating')
      .sort({ 'ratings.average': -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Equipment.countDocuments(query);
    res.json({ equipment, totalPages: Math.ceil(count / limit), currentPage: page, total: count });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/categories', (req, res) => {
  res.json([
    { id: 'tractor', name: 'Tractors' },
    { id: 'harvester', name: 'Harvesters' },
    { id: 'planter', name: 'Planters' },
    { id: 'sprayer', name: 'Sprayers' },
    { id: 'irrigation', name: 'Irrigation' },
    { id: 'transport', name: 'Transport' }
  ]);
});

router.get('/:id', async (req, res) => {
  try {
    const equipment = await Equipment.findById(req.params.id)
      .populate('owner', 'name location rating phone');
    if (!equipment) return res.status(404).json({ message: 'Equipment not found' });
    res.json(equipment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/:id/book', protect, async (req, res) => {
  try {
    const { startDate, endDate, delivery, withOperator, purpose } = req.body;
    const equipment = await Equipment.findById(req.params.id);
    if (!equipment) return res.status(404).json({ message: 'Equipment not found' });

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (!equipment.isAvailable(start, end)) {
      return res.status(400).json({ message: 'Equipment not available for selected dates' });
    }

    const pricing = equipment.calculateRentalPrice(start, end, { delivery, withOperator });

    const booking = await EquipmentBooking.create({
      equipment: equipment._id,
      renter: req.user._id,
      owner: equipment.owner,
      period: { startDate: start, endDate: end, duration: pricing.days, durationUnit: 'days' },
      pricing,
      delivery: { required: delivery },
      operator: { required: withOperator },
      purpose
    });

    equipment.availability.calendar.push({ startDate: start, endDate: end, status: 'booked', booking: booking._id });
    await equipment.save();

    res.status(201).json(booking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/my/equipment', protect, async (req, res) => {
  try {
    const equipment = await Equipment.find({ owner: req.user._id }).sort('-createdAt');
    res.json(equipment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/my/bookings', protect, async (req, res) => {
  try {
    const bookings = await EquipmentBooking.find({
      $or: [{ renter: req.user._id }, { owner: req.user._id }]
    })
    .populate('equipment', 'name images category')
    .sort('-createdAt');
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/booking/:id/status', protect, async (req, res) => {
  try {
    const { status } = req.body;
    const booking = await EquipmentBooking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    booking.status = status;
    await booking.save();
    res.json(booking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;



