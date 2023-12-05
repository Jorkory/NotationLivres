const express = require('express');
const mongoose = require('mongoose')

const app = express();

mongoose.connect('mongodb+srv://jorkory:MLafu6qeMmWUcPdq@atlascluster.z7gp1ht.mongodb.net/?retryWrites=true&w=majority',
    {
        useNewUrlParser: true,
        useUnifiedTopology: true
    })
    .then(() => console.log('Connexion à MongoDB réussie !'))
    .catch(() => console.log('Connexion à MongoDB échoué !'));

app.use((req, res) => {
    res.json({ message: 'Serveur connecté !' })
})

module.exports = app;