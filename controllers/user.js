const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const User = require('../models/User')

exports.signup = (req, res, next) => {
    const email = req.body.email.toLowerCase()
    const regex = new RegExp(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,16}$/gm);
    if (!regex.test(req.body.password)) {
        const err = new Error("Ce mot de passe n'est pas un mot de passe valide! Le mot de passe doit contenir au moins une lettre minuscule, une lettre majuscule, un chiffre, un caractère spécial et doit être d'au moins 8 caractères.")
        res.status(400).json({ err });
    } else {
        bcrypt.hash(req.body.password, 10)
            .then(hash => {
                const user = new User({
                    email: email,
                    password: hash
                });
                user.save()
                    .then(() => res.status(201).json({ message: 'compte crée' }))
                    .catch(error => res.status(400).json({ error }));
            })
            .catch(error => res.status(500).json({ error }));
    };
};

exports.login = (req, res, next) => {
    const email = req.body.email.toLowerCase()
    User.findOne({ email: email })
        .then(user => {
            if (user === null) {
                return res.status(401).json({ message: 'Paire login/mot de passe incorrecte' })
            } else {
                bcrypt.compare(req.body.password, user.password)
                    .then(valid => {
                        if (!valid) {
                            return res.status(401).json({ message: 'Paire login/mot de passe incorrecte' })
                        } else {
                            res.status(200).json({
                                userId: user._id,
                                token: jwt.sign(
                                    { userId: user._id },
                                    'RANDOM_TOKEN_SECRET',
                                    { expiresIn: '24h' }
                                )
                            });
                        }
                    })
                    .catch(error => res.status(500).json({ error }));
            }
        })
        .catch(error => res.status(500).json({ error }));
};