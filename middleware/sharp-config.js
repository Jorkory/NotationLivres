const sharp = require('sharp');

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
                .catch(error => res.status(500).json({ error }));
        } catch {
            const err = new Error("Le fichier téléchargé n'est pas conforme.");
            res.status(400).json({ err });
        }
    } else {
        next();
    }
}