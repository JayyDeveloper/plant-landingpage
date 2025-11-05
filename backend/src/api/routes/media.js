const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.status(501).json({ message: 'media routes - to be implemented' });
});

module.exports = router;
