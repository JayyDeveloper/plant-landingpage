const express = require('express');
const router = express.Router();

router.get('/profile', (req, res) => {
  res.status(501).json({ message: 'Get profile - to be implemented' });
});

router.patch('/profile', (req, res) => {
  res.status(501).json({ message: 'Update profile - to be implemented' });
});

module.exports = router;
