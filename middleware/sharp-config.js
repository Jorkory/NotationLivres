const sharp = require('sharp');

module.exports = (req, res, next) => {
    if (req.file) {
        req.filename = req.file.originalname.replace(/ /g, '_').split('.')[0] + Date.now() + '.webp';

        sharp(req.file.buffer)
            .resize({
                width: 404,
                height: 568,
                fit: sharp.fit.contain,
                background: { r: 255, g: 255, b: 255 }
            })
            .toFile(`./images/` + req.filename)
            .then(() => next())
            .catch(error => res.status(500).json({ error }));
    } else {
        next();
    }
}