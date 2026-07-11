const express = require('express');
const router = express.Router();
const Delivery = require('../models/Delivery');
const Transaction = require('../models/Transaction');
const { protect, authorize } = require('../middleware/auth');
const { emitToUser } = require('../utils/socket');
const geolib = require('geolib');

router.post('/create', protect, async (req, res) => {
  try {
    const { transactionId, pickup, dropoff, package: packageInfo, urgent, insurance } = req.body;

    const transaction = await Transaction.findById(transactionId)
      .populate('product')
      .populate('seller')
      .populate('buyer');

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    let distance = 50;
    if (pickup.coordinates && dropoff.coordinates) {
      distance = geolib.getDistance(
        { latitude: pickup.coordinates.latitude, longitude: pickup.coordinates.longitude },
        { latitude: dropoff.coordinates.latitude, longitude: dropoff.coordinates.longitude }
      ) / 1000;
    }

    const pricing = Delivery.calculatePrice(distance, packageInfo.weight || 10, {
      urgent,
      insurance,
      insuranceValue: transaction.totalAmount
    });

    const delivery = await Delivery.create({
      transaction: transactionId,
      product: transaction.product._id,
      seller: transaction.seller._id,
      buyer: transaction.buyer._id,
      pickup: {
        ...pickup,
        contactName: transaction.seller.name,
        contactPhone: transaction.seller.phone
      },
      dropoff: {
        ...dropoff,
        contactName: transaction.buyer.name,
        contactPhone: transaction.buyer.phone
      },
      package: packageInfo,
      pricing,
      distance,
      estimatedDelivery: new Date(Date.now() + (urgent ? 24 : 72) * 60 * 60 * 1000)
    });

    await delivery.addTrackingEvent('pending', pickup.coordinates, 'Delivery created');

    res.status(201).json(delivery);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/track/:trackingNumber', async (req, res) => {
  try {
    const delivery = await Delivery.findOne({ trackingNumber: req.params.trackingNumber })
      .populate('product', 'name images')
      .populate('seller', 'name phone')
      .populate('buyer', 'name phone')
      .populate('driver', 'name phone rating');

    if (!delivery) {
      return res.status(404).json({ message: 'Delivery not found' });
    }

    res.json({
      trackingNumber: delivery.trackingNumber,
      status: delivery.status,
      estimatedDelivery: delivery.estimatedDelivery,
      currentLocation: delivery.currentLocation,
      pickup: {
        region: delivery.pickup.region,
        scheduledTime: delivery.pickup.scheduledTime,
        actualTime: delivery.pickup.actualTime
      },
      dropoff: {
        region: delivery.dropoff.region,
        scheduledTime: delivery.dropoff.scheduledTime
      },
      trackingHistory: delivery.trackingHistory,
      driver: delivery.driver ? {
        name: delivery.driver.name,
        phone: delivery.driver.phone,
        rating: delivery.driver.rating
      } : null
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/my-deliveries', protect, async (req, res) => {
  try {
    const { role, status } = req.query;

    const query = {};
    if (role === 'seller') {
      query.seller = req.user._id;
    } else if (role === 'buyer') {
      query.buyer = req.user._id;
    } else if (role === 'driver') {
      query.driver = req.user._id;
    } else {
      query.$or = [
        { seller: req.user._id },
        { buyer: req.user._id },
        { driver: req.user._id }
      ];
    }

    if (status) {
      query.status = status;
    }

    const deliveries = await Delivery.find(query)
      .populate('product', 'name images')
      .populate('seller', 'name')
      .populate('buyer', 'name')
      .sort('-createdAt');

    res.json(deliveries);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/:id/status', protect, async (req, res) => {
  try {
    const { status, location, description } = req.body;
    const delivery = await Delivery.findById(req.params.id);

    if (!delivery) {
      return res.status(404).json({ message: 'Delivery not found' });
    }

    await delivery.addTrackingEvent(status, location, description, req.user._id);

    emitToUser(delivery.buyer.toString(), 'delivery_update', {
      deliveryId: delivery._id,
      trackingNumber: delivery.trackingNumber,
      status,
      location
    });

    emitToUser(delivery.seller.toString(), 'delivery_update', {
      deliveryId: delivery._id,
      trackingNumber: delivery.trackingNumber,
      status,
      location
    });

    res.json(delivery);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/:id/location', protect, async (req, res) => {
  try {
    const { latitude, longitude } = req.body;
    const delivery = await Delivery.findById(req.params.id);

    if (!delivery) {
      return res.status(404).json({ message: 'Delivery not found' });
    }

    delivery.currentLocation = {
      latitude,
      longitude,
      updatedAt: new Date()
    };

    if (delivery.dropoff.coordinates) {
      const distanceToDestination = geolib.getDistance(
        { latitude, longitude },
        delivery.dropoff.coordinates
      );

      if (distanceToDestination < 1000 && delivery.status === 'in_transit') {
        await delivery.addTrackingEvent('near_destination', { latitude, longitude }, 'Driver is nearby');
      }
    }

    await delivery.save();

    res.json({ success: true, currentLocation: delivery.currentLocation });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/:id/assign-driver', protect, authorize('admin'), async (req, res) => {
  try {
    const { driverId } = req.body;
    const delivery = await Delivery.findById(req.params.id);

    if (!delivery) {
      return res.status(404).json({ message: 'Delivery not found' });
    }

    delivery.driver = driverId;
    delivery.status = 'confirmed';
    await delivery.save();

    await delivery.addTrackingEvent('confirmed', null, 'Driver assigned');

    emitToUser(driverId, 'new_delivery_assignment', {
      deliveryId: delivery._id,
      trackingNumber: delivery.trackingNumber
    });

    res.json(delivery);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/:id/proof', protect, async (req, res) => {
  try {
    const { type, value } = req.body;
    const delivery = await Delivery.findById(req.params.id);

    if (!delivery) {
      return res.status(404).json({ message: 'Delivery not found' });
    }

    delivery.proof = {
      type,
      value,
      timestamp: new Date()
    };

    await delivery.addTrackingEvent('delivered', delivery.currentLocation, 'Delivery completed');

    res.json(delivery);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/:id/rate', protect, async (req, res) => {
  try {
    const { score, comment } = req.body;
    const delivery = await Delivery.findById(req.params.id);

    if (!delivery) {
      return res.status(404).json({ message: 'Delivery not found' });
    }

    if (delivery.buyer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only buyer can rate delivery' });
    }

    delivery.rating = {
      score,
      comment,
      ratedAt: new Date()
    };

    await delivery.save();

    res.json({ message: 'Rating submitted', rating: delivery.rating });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/calculate-price', async (req, res) => {
  try {
    const { pickup, dropoff, weight, urgent, insurance, insuranceValue } = req.body;

    let distance = 50;
    if (pickup.coordinates && dropoff.coordinates) {
      distance = geolib.getDistance(
        pickup.coordinates,
        dropoff.coordinates
      ) / 1000;
    }

    const pricing = Delivery.calculatePrice(distance, weight || 10, {
      urgent,
      insurance,
      insuranceValue
    });

    res.json({
      distance: Math.round(distance),
      ...pricing,
      estimatedDelivery: new Date(Date.now() + (urgent ? 24 : 72) * 60 * 60 * 1000)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;



