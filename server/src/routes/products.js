const router = require('express').Router();
const c = require('../controllers/productController');
const ebook = require('../controllers/ebookController');
const { protect } = require('../middleware/auth');

// Public: only the 3 featured cards shown on the landing page
router.get('/featured', c.featured);

// Everything else (Explore Products, Product Details) needs an account
router.use(protect);
router.get('/', c.list);
router.get('/:slug/outline', ebook.outline);
router.get('/:slug', c.getBySlug);

module.exports = router;
