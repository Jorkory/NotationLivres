const sharp = require('sharp');
const httpStatus = require('http-status');

/**
 * Middleware pour compresser et enregistrer l'image dans le dossier images à la racine du projet.
 * @param {Express.Request} req Objet du requête Express.
 * @param {Express.Response} res Objet du réponse Express.
 * @param {function} next Fonction next du middleware. 
 * @returns {function} Middleware suivant si l'image est bien compressé et enregistrée.
 * @throws {object} Réponse JSON en cas d'erreur d'enregistrement de l'image.
 */
module.exports = (req, res, next) => {
    if (req.file) {
        req.filename = req.file.originalname.replace(/ /g, '_').split('.')[0] + Date.now() + '.webp';

        try {
            sharp(req.file.buffer)
                .resize({
                    width: 404,
                    height: 568,
                    fit: sharp.fit.cover,
                })
                .toFile(`./images/` + req.filename)
                .then(() => next())
                .catch(error => { return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error }) });
        } catch {
            const err = new Error("Le fichier téléchargé n'est pas conforme.");
            return res.status(httpStatus.BAD_REQUEST).json({ error: "Mauvais requete" });
        }
    } else {
        next();
    }
}