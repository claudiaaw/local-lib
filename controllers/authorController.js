// require the model used to update the data
var Author = require('../models/author')
var async = require('async');
var Book = require('../models/book');
const {body, validationResult} = require('express-validator/check');
const {sanitizeBody} = require('express-validator/filter');

// Export functions for each fo the URLs to be handled

exports.author_list = function(req, res, next) {
	Author.find()
	.sort([['family_name', 'ascending']])
	.exec(function(err, list_authors){
		if (err) {return next(err);}
		res.render('author_list', {title: 'Author List', author_list: list_authors});
	})
};
// Display detail page for a specific Author.
exports.author_detail = function(req, res, next) {
    async.parallel({
        author: function(callback){
            Author.findById(req.params.id)
            .exec(callback)
        },
        author_books: function(callback){
            Book.find({'author': req.params.id}, 'title summary')
            .exec(callback)
        },
    }, function(err, results){
        if (err) {return next(err);} //Error n API usage
        if (results.author===null){
            var err = new Error('Author not found');
            err.status = 404;
            return next(err);
        }
        // Successful, so render
        res.render('author_detail', { title: 'Author Detail', author: results.author, author_books: results.author_books });
    });
};

// Display Author create form on GET.
exports.author_create_get = function(req, res) {
    res.render('author_form', {title: 'Create Author'});
};

// Handle Author create on POST.
exports.author_create_post = [
    // Validate fields
    body('first_name').isLength({ min: 1}).trim().withMessage('First name must be specified').isAlphanumeric().withMessage('First name has non-alphanumeric characters.'),
    body('family_name').isLength({ min: 1}).trim().withMessage('Family name must be specified').isAlphanumeric().withMessage('Family name has non-alphanumeric characters.'),
    body('date_of_birth', 'Invalid date of birth').optional({ checkFalsy: true }).isISO8601(), // check if optional date is ISO8601-compliant date
    body('date_of_death', 'Invalid date of death').optional({ checkFalsy: true }).isISO8601(), // checkFalsy flag -> accepts either an empty string or null as an empty value

    // Sanitize fields
    sanitizeBody('first_name').trim().escape(),
    sanitizeBody('family_name').trim().escape(),
    sanitizeBody('date_of_birth').toDate(), // parameters are received from requests as strings, toDate() casts string to proper JavasScript type
    sanitizeBody('date_of_death').toDate(),

    // Process request after validation and sanitization
    (req, res, next) => {

        // Extract the validation errors from a request
        const errors = validationResult(req); // gives a json of results (validation reults object)

        if (!errors.isEmpty()){
            // There are errors. Render the form again with sanitized values/error messages
            res.render('author_form', {title: 'Create Author', author: req.body, errors: errors.array()});
            return;
        }
        else{
            // Data from form is valid
            // Create an Author object with escaped and trimmed data
            var author = new Author(
                {
                    first_name: req.body.first_name,
                    family_name: req.body.family_name,
                    date_of_birth: req.body.date_of_birth,
                    date_of_death: req.body.date_of_death
                }
            );
            author.save(function(err){
                if (err) { return next(err); }
                // Successful - redirect to new author record
                res.redirect(author.url); // Already created virtual from Author model
            });
        }
    }
];

// Display Author delete form on GET.
exports.author_delete_get = function(req, res, next) {
    async.parallel({
        author: function(callback){
            Author.findById(req.params.id).exec(callback);
        },
        authors_books: function(callback){
            Book.find({'author': req.params.id}).exec(callback);
        },
    }, function(err, results){
        if (err){return next(err);}
        if (results.author==null){ //no results --> the author is not in the database
            res.redirect('/catalog/authors');
        }
        // Successful, so render
        res.render('author_delete', {title: 'Delete Author', author: results.author, author_books: results.authors_books});
    });
};

// Handle Author delete on POST.
exports.author_delete_post = function(req, res, next) {
    async.parallel({
        author: function(callback){
            Author.findById(req.params.authorid).exec(callback);
        },
        authors_books: function(callback){
            Book.find({'author': req.params.authorid}).exec(callback);
        },
    }, function(err, results){
        if (err){return next(err);}
        if (results.authors_books.length>0){
            // Author has books. Render
            res.render('author_delete', {title: 'Delete Author', author: results.author, author_books: results.authors_books});
        }
        else{
            // Author has no books. Delete object and redirect to the list of authors
            Author.findByIdAndRemove(req.body.authorid, function deleteAuthor(err){ // id of the author is passed through POST req
                if (err){return next(err);}
                // Success - go to author list
                res.redirect('/catalog/authors');
            })
        }
    });
};

// Display Author update form on GET.
exports.author_update_get = function(req, res) {
    // get Author for form
    Author.findById(req.params.id).exec(function(err, result){
        if (err){return next(err);}
        if (result==null){ //somehow no results from author
            var err = new Error('Author not found');
            err.status = 404;
            return next(err);
        }
        // Success
        // Auto fill up the forms for the author
        res.render('author_form', {title: 'Update Author', author: result})
    });
};

// Handle Author update on POST.
exports.author_update_post = [
    // Validate fields
    body('first_name').isLength({ min: 1}).trim().withMessage('First name must be specified').isAlphanumeric().withMessage('First name has non-alphanumeric characters.'),
    body('family_name').isLength({ min: 1}).trim().withMessage('Family name must be specified').isAlphanumeric().withMessage('Family name has non-alphanumeric characters.'),
    body('date_of_birth', 'Invalid date of birth').optional({ checkFalsy: true }).isISO8601(), // check if optional date is ISO8601-compliant date
    body('date_of_death', 'Invalid date of death').optional({ checkFalsy: true }).isISO8601(), // checkFalsy flag -> accepts either an empty string or null as an empty value

    // Sanitize fields
    sanitizeBody('first_name').trim().escape(),
    sanitizeBody('family_name').trim().escape(),
    sanitizeBody('date_of_birth').toDate(), // parameters are received from requests as strings, toDate() casts string to proper JavasScript type
    sanitizeBody('date_of_death').toDate(),

    // Process request after validation and sanitization
    (req, res, next) => {

        // Extract the validation errors from a request
        const errors = validationResult(req); // gives a json of results (validation reults object)

        if (!errors.isEmpty()){
            // There are errors. Render the form again with sanitized values/error messages
            // errors.array returns an array of validation errors
            res.render('author_form', {title: 'Update Author', author: req.body, errors: errors.array()});
            return;
        }
        else{
            // Data from form is valid
            // Create an Author object with escaped and trimmed data
            var author = new Author(
                {
                    first_name: req.body.first_name,
                    family_name: req.body.family_name,
                    date_of_birth: req.body.date_of_birth,
                    date_of_death: req.body.date_of_death,
                    _id: req.params.id // to ensure new ID will not be assigned to alr exisintg author
                }
            );
            
            Author.findOneAndUpdate({_id: req.params.id}, author, {}, function(err, theauthor){
                if (err) return next(err);
                //Successful update
                res.redirect(theauthor.url);
            });
        }
    }
];