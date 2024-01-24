const Book = require('../models/Book');
const httpStatus = require('http-status');
const fs = require('fs');
const { error } = require('console');

/**
 * Mise à jour la note moyenne d'un livre
 * @param {object} book Objet du livre.
 * @returns {object} Objet du livre avec la note moyenne mise à jour.
 */
function updateAverageRating(book) {
    const arrayRatings = book.ratings.map(rating => rating.grade);
    const globalRating = arrayRatings.reduce(
        (accumulator, currentValue) => accumulator + currentValue
    );
    const averageRating = globalRating / arrayRatings.length;
    return book.averageRating = averageRating.toFixed(1);
}

/**
 * Obtient tous les livres.
 * @param {express.Request} req Objet de requête Express.
 * @param {express.Response} res Objet de réponse Express.
 * @returns {object} Réponse JSON contenant un tableau des livres.
 * @throws {object} Réponse JSON en cas d'erreur.
 */
exports.getAllBooks = async (req, res) => {
    try {
        const books = await Book.find();

        return res.status(httpStatus.OK).json(books);
    } catch (error) {
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: "Erreur interne du serveur" });
    }
}

/**
 * Obtient un livre en fonction de l'ID fourni en paramètre.
 * @param {express.Request} req Objet de requête Express.
 * @param {express.Response} res Objet de réponse Express.
 * @returns {object} Réponse JSON contenant l'objet du livre.
 * @throws {object} Réponse JSON en cas d'erreur.
 */
exports.getOneBook = async (req, res) => {
    try {
        const book = await Book.findById(req.params.id);

        if (!book) {
            return res.status(httpStatus.NOT_FOUND).json({ error: "Livre non trouvé" })
        }

        return res.status(httpStatus.OK).json(book);
    } catch (error) {
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: "Erreur interne du serveur" });
    }
}

/**
 * Ajoute un nouveau livre.
 * @param {express.Request} req Objet de requête Express.
 * @param {express.Response} res Objet de réponse Express.
 * @returns {object} Réponse JSON contenant le message de la confirmation.
 * @throws {object} Réponse JSON en cas d'erreur.
 */
exports.addBook = async (req, res) => {
    try {
        const bookObject = await JSON.parse(req.body.book);

        delete bookObject._id;
        delete bookObject.userId;
        delete bookObject.ratings[0].userId;

        const book = new Book({
            ...bookObject,
            userId: req.auth.userId,
            imageUrl: req.file && `${req.protocol}://${req.get('host')}/images/${req.filename}`,
        });

        book.ratings[0].userId = req.auth.userId;

        const validationError = await book.validateSync();

        if (validationError) {
            req.file && fs.unlinkSync(`images/${req.filename}`);
            return res.status(httpStatus.BAD_REQUEST).json({ error: "Erreur de la validation." })
        }

        await book.save();

        return res.status(httpStatus.CREATED).json({ message: 'Livre enregistré !' });
    } catch (error) {
        req.file && fs.unlinkSync(`images/${req.filename}`);
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: "Erreur interne du serveur" });
    }
}

/**
 * Modifie les informations du livre existant.
 * @param {express.Request} req Objet de requête Express.
 * @param {express.Response} res Objet de réponse Express.
 * @returns {object} Réponse JSON contenant le message de la confirmation.
 * @throws {object} Réponse JSON en cas d'erreur.
 */
exports.updateBook = async (req, res) => {

    try {
        const bookObject = req.file ? {
            ...JSON.parse(req.body.book),
            imageUrl: `${req.protocol}://${req.get('host')}/images/${req.filename}`
        } : { ...req.body };

        delete bookObject.userId;

        const book = await Book.findById(req.params.id);

        if (book.userId != req.auth.userId) {
            req.file && fs.unlinkSync(`images/${req.filename}`);
            return res.status(httpStatus.FORBIDDEN).json({ message: 'Unauthorized request !' });
        }

        book.title = bookObject.title;  //Vérifier si les nouvelles entrées sont respectées aux critiques du Schema
        book.author = bookObject.author;    //***
        book.year = bookObject.year;    //***
        book.genre = bookObject.genre;  //***

        const validationError = await book.validateSync();

        if (validationError) {
            return res.status(httpStatus.BAD_REQUEST).json({ error: "Erreur de la validation." })
        }

        await Book.updateOne({ _id: req.params.id }, { ...bookObject, _id: req.params.id });

        if (req.file) {
            const filename = book.imageUrl.split('/images/')[1];
            fs.unlinkSync(`images/${filename}`);
        };

        return res.status(httpStatus.OK).json({ message: 'Livre modifié !' });
    } catch {
        req.file && fs.unlinkSync(`images/${req.filename}`);
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: "Erreur interne du serveur" });
    }
}

/**
 * Supprime un livre.
 * @param {express.Request} req Objet de requête Express.
 * @param {express.Response} res Objet de réponse Express.
 * @returns {object} Réponse JSON contenant le message de la confirmation.
 * @throws {object} Réponse JSON en cas d'erreur.
 */
exports.deleteBook = async (req, res) => {
    try {
        const book = await Book.findById(req.params.id);

        if (!book) {
            return res.status(httpStatus.BAD_REQUEST).json({ message: 'Livre non trouvé' });
        }

        if (book.userId != req.auth.userId) {
            return res.status(httpStatus.FORBIDDEN).json({ message: 'Unauthorized request !' });
        }

        const filename = book.imageUrl.split('/images/')[1];

        fs.unlink(`images/${filename}`, async (unlinkError) => {
            if (unlinkError && unlinkError.code !== 'ENOENT') {
                return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: 'Erreur lors de la suppression de l\'image' });
            }
        })

        await Book.deleteOne({ _id: req.params.id });

        return res.status(httpStatus.OK).json({ message: 'Livre supprimé !' })
    } catch (error) {
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: "Erreur interne du serveur" })
    }
}

/**
 * Ajoute une note (autres utilisateurs et max 1 seule fois).
 * @param {express.Request} req Objet de requête Express.
 * @param {express.Response} res Objet de réponse Express.
 * @returns {object} Réponse JSON contenant l'objet du livre'.
 * @throws {object} Réponse JSON en cas d'erreur.
 */
exports.addRating = async (req, res) => {
    try {
        if (!Number.isInteger(req.body.rating) || req.body.rating < 0 || req.body.rating > 5) {
            return res.status(httpStatus.BAD_REQUEST).json({ error: "Le rating doit être compris entre 0 et 5." });
        }

        const book = await Book.findById(req.params.id);

        if (!book) {
            return res.status(httpStatus.BAD_REQUEST).json({ message: "Livre non trouvé" });
        }

        const userAlreadyRated = book.ratings.some(rating => req.auth.userId === rating.userId);

        if (userAlreadyRated) {
            return res.status(httpStatus.FORBIDDEN).json({ error: "L'utilisateur a déjà noté ce livre." });
        }

        const rating = { grade: req.body.rating, userId: req.auth.userId };

        book.ratings.push(rating);

        updateAverageRating(book);

        await book.save();

        return res.status(httpStatus.CREATED).json(book);
    } catch (error) {
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: "Erreur interne du serveur" });
    }
}

/**
 * Selectionne 3 livres contenant les meilleures notes.
 * @param {express.Request} req Objet de requête Express.
 * @param {express.Response} res Objet de réponse Express.
 * @returns {object} Réponse JSON contenant un tableau des 3 livres.
 * @throws {object} Réponse JSON en cas d'erreur.
 */
exports.bestRating = async (req, res) => {
    try {
        const bestBooks = await Book.find()
            .sort({ averageRating: -1 })
            .limit(3)

        return res.status(httpStatus.OK).json(bestBooks);
    } catch (error) {
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: "Erreur interne du serveur" });
    }
}
