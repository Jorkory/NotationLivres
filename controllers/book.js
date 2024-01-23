const Book = require('../models/Book');
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
        .then(books => res.status(200).json(books))
        .catch(error => res.status(400).json({ error }));
};

exports.getOneBook = (req, res, next) => {
    Book.findById(req.params.id)
        .then(book => res.status(200).json(book))
        .catch(error => res.status(400).json({ error }))
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
        .then(() => res.status(201).json({ message: 'Livre enregistré !' }))
        .catch(error => {
            req.file && fs.unlinkSync(`images/${req.filename}`);
            res.status(400).json({ error })
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
                res.status(400).json({ err })
            } else {
                if (book.userId != req.auth.userId) {
                    res.status(403).json({ message: 'Unauthorized request !' })
                } else {
                    Book.updateOne({ _id: req.params.id }, { ...bookObject, _id: req.params.id })
                        .then(() => {
                            if (req.file) {
                                const filename = book.imageUrl.split('/images/')[1];
                                fs.unlinkSync(`images/${filename}`);
                            };
                            res.status(200).json({ message: 'Livre modifié !' })
                        })
                        .catch(error => res.status(401).json({ error }));
                }
            }
        })
        .catch(error => res.status(400).json({ error }))
}

exports.deleteBook = (req, res, next) => {
    Book.findById(req.params.id)
        .then(book => {
            if (book.userId != req.auth.userId) {
                res.status(403).json({ message: 'Unauthorized request !' });
            } else {
                const filename = book.imageUrl.split('/images/')[1];
                fs.unlink(`images/${filename}`, () => {
                    Book.deleteOne({ _id: req.params.id })
                        .then(() => res.status(200).json({ message: 'Livre supprimé !' }))
                        .catch(error => res.status(401).json({ error }))
                })
            }
        })
        .catch(error => res.status(500).json({ error }));
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
                    return res.status(400).json({ error: "L'utilisateur a déjà noté ce livre." });
                }
                const rating = { grade: req.body.rating, userId: req.auth.userId };
                book.ratings.push(rating);
                updateAverageRating(book);
                book.save()
                    .then(() => { res.status(201).json(book) })
                    .catch(error => res.status(400).json({ error }))
            })
            .catch(error => res.status(500).json({ error }));
    } else {
        const err = new Error('Not authorized!');
        res.status(400).json({ message: err });
    }
};

exports.bestRating = (req, res, next) => {
    Book.find()
        .sort({ averageRating: -1 })
        .limit(3)
        .then(books => {
            res.status(200).json(books);
        })
        .catch(error => res.status(500).json({ error }));
}
