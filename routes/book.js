// N'oublie pas d'ajouter auth 
const express = require('express');
const router = express.Router();
const multer = require('../middleware/multer-config');
const sharp = require('../middleware/sharp-config');

const auth = require('../middleware/auth');
const bookCtrl = require('../controllers/book');

router.get('/', bookCtrl.getAllBooks);
router.get('/:id', bookCtrl.getOneBook);
router.post('/', auth, multer, sharp, bookCtrl.addBook);
router.put('/:id', auth, multer, sharp, bookCtrl.updateBook);
router.delete('/:id', auth, bookCtrl.deleteBook);
router.post('/:id/rating', auth, bookCtrl.addRating);

module.exports = router;