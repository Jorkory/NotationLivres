const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv')
const httpStatus = require('http-status');

const User = require('../models/User')

dotenv.config();

const round = Number(process.env.ROUND_NBR);
const tokenSecret = process.env.TOKEN_SECRET;

exports.signup = (req, res, next) => {
    const email = req.body.email.toLowerCase()
    const regex = new RegExp(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/gm);
    if (!regex.test(req.body.password)) {
        const err = new Error("Ce mot de passe n'est pas un mot de passe valide! Le mot de passe doit contenir au moins une lettre minuscule, une lettre majuscule, un chiffre, un caractère spécial et doit être d'au moins 8 caractères.")
        return res.status(httpStatus.BAD_REQUEST).json({ err });
    } else {
        bcrypt.hash(req.body.password, round)
            .then(hash => {
                const user = new User({
                    email: email,
                    password: hash
                });
                user.save()
                    .then(() => { return res.status(httpStatus.CREATED).json({ message: 'compte crée' }) })
                    .catch(error => { return res.status(httpStatus.BAD_REQUEST).json({ error }) });
            })
            .catch(error => { return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error }) });
    };
};

exports.login = (req, res, next) => {
    const email = req.body.email.toLowerCase()
    User.findOne({ email: email })
        .then(user => {
            if (user === null) {
                return res.status(httpStatus.UNAUTHORIZED).json({ message: 'Paire login/mot de passe incorrecte' })
            } else {
                bcrypt.compare(req.body.password, user.password)
                    .then(valid => {
                        if (!valid) {
                            return res.status(httpStatus.UNAUTHORIZED).json({ message: 'Paire login/mot de passe incorrecte' })
                        } else {
                            return res.status(httpStatus.OK).json({
                                userId: user._id,
                                token: jwt.sign(
                                    { userId: user._id },
                                    tokenSecret,
                                    { expiresIn: '24h' }
                                )
                            });
                        }
                    })
                    .catch(error => { return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error }) });
            }
        })
        .catch(error => { return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error }) });
};