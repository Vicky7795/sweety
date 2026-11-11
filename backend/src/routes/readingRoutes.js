const express = require('express');
const router = express.Router();
const {
  create,
  list,
  getById,
  update,
  remove
} = require('../controllers/readingController');
const { validateReadingInput } = require('../validators/readingValidator');
const authMiddleware = require('../middleware/authMiddleware');

// All reading endpoints require authentication
router.use(authMiddleware);

router.post('/', validateReadingInput, create);
router.get('/', list);
router.get('/:id', getById);
router.put('/:id', validateReadingInput, update);
router.delete('/:id', remove);

module.exports = router;
