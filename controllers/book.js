const Book = require('../models/Book');
const httpStatus = require('http-status');
const fs = require('fs');


function updateAverageRating(book) {
    const arrayRatings = book.ratings.map(rating => rating.grade);
    const globalRating = arrayRatings.reduce(
        (accumulator, currentValue) => accumulator + currentValue
    );
    const averageRating = globalRating / arrayRatings.length;
    return book.averageRating = averageRating.toFixed(1);
}


exports.getAllBooks = (req, res, next) => {
    Book.find()
        .then(books => { return res.status(httpStatus.OK).json(books) })
        .catch(error => { return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error }) });
};

exports.getOneBook = (req, res, next) => {
    Book.findById(req.params.id)
        .then(book => { return res.status(httpStatus.OK).json(book) })
        .catch(error => { return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error }) })
};

exports.addBook = (req, res, next) => {
    const bookObject = JSON.parse(req.body.book);
    delete bookObject._id;
    delete bookObject.userId;
    delete bookObject.ratings[0].userId;
    const book = new Book({
        ...bookObject,
        userId: req.auth.userId,
        imageUrl: req.file && `${req.protocol}://${req.get('host')}/images/${req.filename}`,
    });
    book.ratings[0].userId = req.auth.userId;
    book.save()
        .then(() => { return res.status(httpStatus.CREATED).json({ message: 'Livre enregistré !' }) })
        .catch(error => {
            req.file && fs.unlinkSync(`images/${req.filename}`);
            return res.status(httpStatus.BAD_REQUEST).json({ error })
        });
}

exports.updateBook = (req, res, next) => {
    const bookObject = req.file ? {
        ...JSON.parse(req.body.book),
        imageUrl: `${req.protocol}://${req.get('host')}/images/${req.filename}`
    } : { ...req.body };
    delete bookObject.userId;
    Book.findById(req.params.id)
        .then(book => {
            book.title = bookObject.title;  //Vérifier si les nouvelles entrées sont respectées aux critiques du Schema
            book.author = bookObject.author;    //***
            book.year = bookObject.year;    //***
            book.genre = bookObject.genre;  //***
            if (book.validateSync()) {
                const err = new Error(book.validateSync())
                return res.status(httpStatus.BAD_REQUEST).json({ err })
            } else {
                if (book.userId != req.auth.userId) {
                    req.file && fs.unlinkSync(`images/${req.filename}`);
                    return res.status(httpStatus.FORBIDDEN).json({ message: 'Unauthorized request !' })
                } else {
                    Book.updateOne({ _id: req.params.id }, { ...bookObject, _id: req.params.id })
                        .then(() => {
                            if (req.file) {
                                const filename = book.imageUrl.split('/images/')[1];
                                fs.unlinkSync(`images/${filename}`);
                            };
                            return res.status(httpStatus.OK).json({ message: 'Livre modifié !' })
                        })
                        .catch(error => { return res.status(httpStatus.FORBIDDEN).json({ error }) });
                }
            }
        })
        .catch(error => { return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error }) })
}

exports.deleteBook = (req, res, next) => {
    Book.findById(req.params.id)
        .then(book => {
            if (book.userId != req.auth.userId) {
                return res.status(httpStatus.FORBIDDEN).json({ message: 'Unauthorized request !' });
            } else {
                const filename = book.imageUrl.split('/images/')[1];
                fs.unlink(`images/${filename}`, () => {
                    Book.deleteOne({ _id: req.params.id })
                        .then(() => { return res.status(httpStatus.OK).json({ message: 'Livre supprimé !' }) })
                        .catch(error => { return res.status(httpStatus.FORBIDDEN).json({ error }) })
                })
            }
        })
        .catch(error => { return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error }) });
}

exports.addRating = (req, res, next) => {
    if (req.body.rating >= 0 && req.body.rating <= 5) {
        Book.findById(req.params.id)
            .then((book) => {
                let userAlreadyRated = false;
                book.ratings.map(rating => {
                    if (req.auth.userId === rating.userId) {
                        userAlreadyRated = true;
                    }
                })
                if (userAlreadyRated) {
                    return res.status(httpStatus.FORBIDDEN).json({ error: "L'utilisateur a déjà noté ce livre." });
                }
                const rating = { grade: req.body.rating, userId: req.auth.userId };
                book.ratings.push(rating);
                updateAverageRating(book);
                book.save()
                    .then(() => { return res.status(httpStatus.CREATED).json(book) })
                    .catch(error => { return res.status(httpStatus.BAD_REQUEST).json({ error }) })
            })
            .catch(error => { return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error }) });
    } else {
        const err = new Error('Not authorized!');
        return res.status(httpStatus.BAD_REQUEST).json({ message: err });
    }
};

exports.bestRating = (req, res, next) => {
    Book.find()
        .sort({ averageRating: -1 })
        .limit(3)
        .then(books => {
            return res.status(httpStatus.OK).json(books);
        })
        .catch(error => { return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error }) });
}
