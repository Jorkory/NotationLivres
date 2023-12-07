// N'oublie pas d'ajouter auth 
const express = require('express');
const router = express.Router();
const multer = require('../middleware/multer-config');

const auth = require('../middleware/auth');
const bookCtrl = require('../controllers/book');

router.get('/', bookCtrl.getAllBooks);
router.post('/', auth, multer, bookCtrl.addBook);

module.exports = router;