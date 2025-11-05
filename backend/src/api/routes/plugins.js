const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.status(501).json({ message: 'plugins routes - to be implemented' });
});

module.exports = router;
