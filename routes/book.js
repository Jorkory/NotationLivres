// N'oublie pas d'ajouter auth 
const express = require('express');
const router = express.Router();

const auth = require('../middleware/auth');
const bookCtrl = require('../controllers/book');

router.get('/', bookCtrl.getAllBooks);
router.post('/', auth, bookCtrl.addBook);

module.exports = router;