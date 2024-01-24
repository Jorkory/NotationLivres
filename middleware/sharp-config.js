const sharp = require('sharp');
const httpStatus = require('http-status');

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