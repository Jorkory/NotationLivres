const Book = require('../models/Book');

exports.getAllBooks = (req, res, next) => {
    Book.find()
        .then(books => res.status(200).json(books))
        .catch(error => res.status(400).json({ error }));
};

exports.addBook = (req, res, next) => {
    // delete req.body._id;
    const book = new Book({
        ...req.body
    });
    console.log({ book });
    // book.save()
    //     .then(() => res.status(201).json({ message: 'livre enregistré !' }))
    //     .cath(error => res.status(400).json({ error }));
}

