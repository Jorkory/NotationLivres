const express = require('express');
const mongoose = require('mongoose');
const userRoutes = require('./routes/user');
const bookRoutes = require('./routes/book');
const path = require('path');

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
app.use('/images', express.static(path.join(__dirname, 'images')));

module.exports = app;