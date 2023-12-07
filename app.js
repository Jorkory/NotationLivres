const express = require('express');
const mongoose = require('mongoose');
const Book = require('./models/Book');
const userRoutes = require('./routes/user');
const bookRoutes = require('./routes/book');

const app = express();

app.use(express.json());

mongoose.connect('mongodb+srv://jorkory:MLafu6qeMmWUcPdq@atlascluster.z7gp1ht.mongodb.net/?retryWrites=true&w=majority',
    {
        useNewUrlParser: true,
        useUnifiedTopology: true
    })
    .then(() => console.log('Connexion à MongoDB réussie !'))
    .catch(() => console.log('Connexion à MongoDB échoué !'));

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content, Accept, Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    next();
});

app.use('/api/auth', userRoutes);
app.use('/api/books', bookRoutes);

app.get('/api/books', (req, res, next) => {
    Book.find()
        .then(books => res.status(200).json(books))
        .catch(error => res.status(400).json({ error }));
});

// app.use((req, res) => {
//     res.json({ message: 'Serveur connecté !' })
// })

module.exports = app;