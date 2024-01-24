const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const httpStatus = require('http-status');

dotenv.config();

const tokenSecret = process.env.TOKEN_SECRET;

/**
 * Vérifie si le jeton JWT est toujours validé.
 * @param {Express.Request} req Objet de requête Express.
 * @param {Express.Response} res Objet de réponse Express.
 * @param {function} next La fonction next du middleware.
 * @returns {function} Middleware suivant si le jeton est valide.
 * @throws {object} Réponse JSON en cas de jeton invalide.
 */
module.exports = (req, res, next) => {
    try {
        const token = req.headers.authorization.split(' ')[1];
        const decodedToken = jwt.verify(token, tokenSecret);
        const userId = decodedToken.userId;
        req.auth = {
            userId: userId
        };
        next();
    }
    catch (error) {
        return res.status(httpStatus.UNAUTHORIZED).json({ error: "Non autorisé !" });
    }
};