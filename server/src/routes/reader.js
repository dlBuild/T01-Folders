const router = require('express').Router();
const c = require('../controllers/ebookController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/:slug', c.read);
router.put('/:slug/tasks/:blockId', c.setTask);
router.post('/:slug/quiz/:blockId', c.answerQuiz);
router.put('/:slug/position', c.setPosition);

module.exports = router;
