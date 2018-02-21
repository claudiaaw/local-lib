var BookInstance = require('../models/bookinstance');
const {body, validationResult} = require('express-validator/check');
const {sanitizeBody} = require('express-validator/filter');
var Book = require('../models/book');
var async = require('async');

// Display list of all BookInstances.
exports.bookinstance_list = function(req, res, next) {
	BookInstance.find()
	.populate('book')
	.exec(function(err, list_bookinstances){
		if (err) {return next(err);}
		res.render('bookinstance_list', {title: 'Book Instance List', bookinstance_list: list_bookinstances});
	})
};
// Display detail page for a specific BookInstance.
exports.bookinstance_detail = function(req, res, next) {

  BookInstance.findById(req.params.id)
  .populate('book') // get details of associated book
  .exec(function (err, bookinstance) {
    if (err) { return next(err); }
    if (bookinstance==null) { // No results.
        var err = new Error('Book copy not found');
        err.status = 404;
        return next(err);
      }
    // Successful, so render.
    res.render('bookinstance_detail', { title: 'Book:', bookinstance:  bookinstance});
  })
};

// Display BookInstance create form on GET.
exports.bookinstance_create_get = function(req, res, next) {
    Book.find({}, 'title')
    .exec(function(err, books){
        if (err) {return next(err);}
        // Successful, so render
        res.render('bookinstance_form', {title: 'Create BookInstance', book_list: books});
    })
};

// Handle BookInstance create on POST.
exports.bookinstance_create_post = [
    // Validate fields
    body('book', 'Book must be specified.').isLength({ min: 1 }).trim(),
    body('imprint', 'Imprint must be specified').isLength({ min: 1 }).trim(),
    body('due_back', 'Invalid date').optional({ checkFalsy: true }).isISO8601(),

    // Sanitize fields
    sanitizeBody('book').trim().escape(),
    sanitizeBody('imprint').trim().escape(),
    sanitizeBody('due_back').trim().escape(),
    sanitizeBody('status').trim().escape(),

    // Process request after validation and sanitization
    (req, res, next) => {

        // Extract the validation errors from a request
        const errors = validationResult(req); // gives a json of results (validation reults object)

        // Create a BookInstance object with escaped and trimmed data
        var bookinstance = new BookInstance({
            book: req.body.book,
            imprint: req.body.imprint,
            status: req.body.status,
            due_back: req.body.due_back
        });

        if (!errors.isEmpty()){
            // There are errors. Render the form again with sanitized values/error messages
            // errors.array returns an array of validation errors

            Book.find({}, 'title')
            .exec(function(err, books){
                if (err) {return next(err);}
                // Successful, so render
                res.render('bookinstance_form', {title: 'Create BookInstance', book_list: books, selected_book: bookinstance.book._id, errors: errors.array(), bookinstance: bookinstance});
            });
            return;
        }
        else{
            // Data from form is valid
            bookinstance.save(function(err){
                if (err) { return next(err); }
                // Successful - redirect to new bookinstance record
                res.redirect(bookinstance.url);
            });
        }
    }
];

// Display BookInstance delete form on GET.
exports.bookinstance_delete_get = function(req, res, next) {
    BookInstance.findById(req.params.id) // The id passed from url
    .populate('book')
    .exec(function(err, bookinstance){
        if (err) { return next(err); }
        if (bookinstance == null){ // no results
            res.redirect('/catalog/bookinstances');
        }
        res.render('bookinstance_delete', {title: 'Delete BookInstance', bookinstance:bookinstance})
    });
};

// Handle BookInstance delete on POST.
exports.bookinstance_delete_post = function(req, res, next) {
    BookInstance.findByIdAndRemove(req.body.bookinstanceid)
    .exec(function(err){
        if (err) {return next(err);}
        // Successful deletion, redirect to bookinstance page
        res.redirect('/catalog/bookinstances');
    });
};

// Display BookInstance update form on GET.
exports.bookinstance_update_get = function(req, res, next) {
    // Get book, authors and genres for form
    async.parallel({
        books: function(callback){
             Book.find(callback);
        },
        book_instance: function(callback){
            BookInstance.findById(req.params.id).populate('book').exec(callback);
        },
    }, function(err, results){
        if (err) {return next(err);}
        if (results.book_instance==null){ // No results
            var err = new Error('Book instance not found');
            err.status = 404;
            return next(err);
        }
        
        res.render('bookinstance_form', {title: 'Update BookInstance', book_list: results.books, selected_book: results.book_instance.book._id, bookinstance: results.book_instance});
    })
};

// Handle bookinstance update on POST.
exports.bookinstance_update_post = [
    // Validate fields
    body('book', 'Book must be specified.').isLength({ min: 1 }).trim(),
    body('imprint', 'Imprint must be specified').isLength({ min: 1 }).trim(),
    body('due_back', 'Invalid date').optional({ checkFalsy: true }).isISO8601(),

    // Sanitize fields
    sanitizeBody('book').trim().escape(),
    sanitizeBody('imprint').trim().escape(),
    sanitizeBody('due_back').trim().escape(),
    sanitizeBody('status').trim().escape(),

    // Process request after validation and sanitization
    (req, res, next) => {

        // Extract the validation errors from a request
        const errors = validationResult(req); // gives a json of results (validation reults object)

        // Create a BookInstance object with escaped and trimmed data
        var bookinstance = new BookInstance({
            book: req.body.book,
            imprint: req.body.imprint,
            status: req.body.status,
            due_back: req.body.due_back,
            _id: req.params.id
        });

        if (!errors.isEmpty()){
            // There are errors. Render the form again with sanitized values/error messages
            // errors.array returns an array of validation errors

            Book.find({}, 'title')
            .exec(function(err, books){
                if (err) {return next(err);}
                // Successful, so render
                res.render('bookinstance_form', {title: 'Update BookInstance', book_list: books, errors: errors.array(), selected_book: bookinstance.book._id, bookinstance: bookinstance});
            });
            return;
        }
        else{
            // Data from form is valid
            BookInstance.findByIdAndUpdate(req.params.id, bookinstance, {}, function(err, thebookinstance){
                if (err) return next(err);
                // successful update, render the bookinstance
                res.redirect(thebookinstance.url);
            })
        }
    }
];