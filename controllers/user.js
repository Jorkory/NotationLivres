const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv')
const httpStatus = require('http-status');

const User = require('../models/User')

dotenv.config();

const round = Number(process.env.ROUND_NBR);
const tokenSecret = process.env.TOKEN_SECRET;

exports.signup = async (req, res, next) => {
    try {
        const email = req.body.email.toLowerCase()
        const regex = new RegExp(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/gm);

        if (!regex.test(req.body.password)) {
            const err = new Error("Ce mot de passe n'est pas un mot de passe valide! Le mot de passe doit contenir au moins une lettre minuscule, une lettre majuscule, un chiffre, un caractère spécial et doit être d'au moins 8 caractères.")
            return res.status(httpStatus.BAD_REQUEST).json({ err });
        }

        const hash = await bcrypt.hash(req.body.password, round);

        const user = new User({
            email: email,
            password: hash
        });

        const validationError = await user.validateSync();

        if (validationError) {
            return res.status(httpStatus.BAD_REQUEST).json({ error: "Erreur de la validation." })
        }

        await user.save();

        return res.status(httpStatus.CREATED).json({ message: 'compte crée' });
    } catch {
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: 'Erreur lors de la création du compte' });
    }
}

exports.login = async (req, res, next) => {
    try {
        const email = req.body.email.toLowerCase();

        const user = await User.findOne({ email: email });

        if (!user) {
            return res.status(httpStatus.UNAUTHORIZED).json({ message: 'Paire login/mot de passe incorrecte' });
        }

        const valid = await bcrypt.compare(req.body.password, user.password);

        if (!valid) {
            return res.status(httpStatus.UNAUTHORIZED).json({ message: 'Paire login/mot de passe incorrecte' });
        }

        const token = jwt.sign({ userId: user._id }, tokenSecret, { expiresIn: '24h' });

        return res.status(httpStatus.OK).json({
            userId: user.id,
            token: token
        });
    } catch (error) {
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error });
    }
}