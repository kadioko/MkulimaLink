const express = require('express');
const router = express.Router();
const { CATEGORIES, UNITS, LOCATIONS, CATEGORY_EXPIRY_DAYS } = require('../config/marketplaceMeta');

router.get('/categories', (req, res) => {
  res.json({ categories: CATEGORIES, expiryDays: CATEGORY_EXPIRY_DAYS });
});

router.get('/units', (req, res) => {
  res.json({ units: UNITS });
});

router.get('/locations', (req, res) => {
  res.json({ countries: LOCATIONS });
});

router.get('/', (req, res) => {
  res.json({
    categories: CATEGORIES,
    units: UNITS,
    countries: LOCATIONS,
    expiryDays: CATEGORY_EXPIRY_DAYS
  });
});

module.exports = router;



