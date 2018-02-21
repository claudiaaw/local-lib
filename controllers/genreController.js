var Genre = require('../models/genre');
var Book = require('../models/book');
var async = require('async');

const { body,validationResult } = require('express-validator/check');
const { sanitizeBody } = require('express-validator/filter');

// Display list of all Genre.
exports.genre_list = function(req, res, next) {
	Genre.find()
	.sort([['name', 'ascending']])
	.exec(function(err, list_genres){
		if (err) {return next(err);}
		res.render('genre_list', {title: 'Genre List', genre_list: list_genres});
	})
};

// Display detail page for a specific Genre.
exports.genre_detail = function(req, res, next) {
//async.parallel() to query the genre name and its associated books in parallel, with the callback rendering the page when (if) both requests complete successfully
//ID of the required genre record is encoded at the end of the URL	
    async.parallel({
        genre: function(callback) {
            Genre.findById(req.params.id) //get the current genre
              .exec(callback);
        },

        genre_books: function(callback) {
          Book.find({ 'genre': req.params.id }) //get all the Book objects that have the genre ID in their genre
          .exec(callback);
        },

    }, function(err, results) {
        if (err) { return next(err); }
        if (results.genre==null) { // No results.
            var err = new Error('Genre not found'); // create an error object and pass it to the next middleware function in the chain, propagating to error handling code (app.js)
            err.status = 404;
            return next(err);
        }
        // Successful, so render
        res.render('genre_detail', { title: 'Genre Detail', genre: results.genre, genre_books: results.genre_books } );
    });

};

// Display Genre create form on GET.
exports.genre_create_get = function(req, res) {
    res.render('genre_form', { title: 'Create Genre' });
};

// Handle Genre create on POST.
exports.genre_create_post = [ // an array (This is how express-validator API works)

    // Validate that the name field is not empty
    // Define a validator (body) to check that the name field is not empty and trim to remove trailing/leading whitespace before performaing validation
    body('name', 'Genre name required').isLength({ min: 1 }).trim(),

    // Sanistize (trim and escape) the name field
    // 2nd method in the array (sanitizeBody()) creates a sanitizer to trim() the anme field and escape() any HTML
    sanitizeBody('name').trim().escape(),

    // Procss request after validation and sanitization
    (req, res, next) => {
    	// Extract the validation errors from a request
    	const errors = validationResult(req); // gives a json of results (validation reults object)

    	// Create a genre object with escaped and trimmed data
    	var genre = new Genre(
    		{ name: req.body.name }
    	);

    	if (!errors.isEmpty()){
    		// There are errors. Render the form again with sanitized values/error messages
    		// errors.array returns an array of validation errors
    		res.render('genre_form', {title: 'Create Genre', genre: genre, errors: errors.array()});
    		return;
    	}
    	else{
    		// Data from form is valid
    		// Check if Genre with same name already exists
    		Genre.findOne({'name': req.body.name})
    		.exec(function(err, found_genre){
    			if (err) { return next(err); }
    			if (found_genre){
    				// Genre exists, redirect to its detail page
    				res.redirect(found_genre.url);
    			}else{
    				genre.save(function(err){
    					if (err){ return next(err); }
    					// Genre saved. Redirect to genre detail page
    					res.redirect(genre.url);
    				});
    			}
    		});
    	}
    }
];

// Display Genre delete form on GET.
exports.genre_delete_get = function(req, res, next) {
    async.parallel({
        genre: function(callback) {
            Genre.findById(req.params.id) //get the current genre
              .exec(callback);
        },

        genre_books: function(callback) {
          Book.find({ 'genre': req.params.id }) //get all the Book objects that have the genre ID in their genre
          .exec(callback);
        },

    }, function(err, results) {
        if (err) { return next(err); }
        if (results.genre==null) { // No results.
            res.redirect('/catalog/genres')
        }
        // Successful, so render
        res.render('genre_delete', { title: 'Delete Genre', genre: results.genre, genre_books: results.genre_books } );
    });
};

// Handle Genre delete on POST.
exports.genre_delete_post = function(req, res) {
    async.parallel({
        genre: function(callback) {
            Genre.findById(req.params.id) //get the current genre
              .exec(callback);
        },

        genre_books: function(callback) {
          Book.find({ 'genre': req.params.id }) //get all the Book objects that have the genre ID in their genre
          .exec(callback);
        },

    }, function(err, results){
        if (err){return next(err);}
        if (results.genre_books.length>0){
            // Genre still has books
            res.render('genre_delete', {title: 'Delete Genre', genre: results.genre, genre_books: results.genre_books});
        }
        else{
            // Author has no books. Delete object and redirect to the list of authors
            Genre.findByIdAndRemove(req.body.genreid, function deleteGenre(err){ // id of the author is passed through POST req
                if (err){return next(err);}
                // Success - go to author list
                res.redirect('/catalog/genres');
            })
        }
    });
};

// Display Genre update form on GET.
exports.genre_update_get = function(req, res) {
    Genre.findById(req.params.id).exec((err, result) => {
        if (err) return next(err);
        res.render('genre_form', {title: 'Update Genre', genre: result});
    })
};

// Handle Genre update on POST.
exports.genre_update_post = [

    // Validate that the name field is not empty
    // Define a validator (body) to check that the name field is not empty and trim to remove trailing/leading whitespace before performaing validation
    body('name', 'Genre name required').isLength({ min: 1 }).trim(),

    // Sanistize (trim and escape) the name field
    // 2nd method in the array (sanitizeBody()) creates a sanitizer to trim() the anme field and escape() any HTML
    sanitizeBody('name').trim().escape(),

    // Procss request after validation and sanitization
    (req, res, next) => {
        // Extract the validation errors from a request
        const errors = validationResult(req); // gives a json of results (validation reults object)

        // Create a genre object with escaped and trimmed data
        var genre = new Genre(
            { 
                name: req.body.name,
                _id: req.params.id //what happens if the id is changed in the req?
            }
        );

        if (!errors.isEmpty()){
            // There are errors. Render the form again with sanitized values/error messages
            // errors.array returns an array of validation errors
            res.render('genre_form', {title: 'Update Genre', genre: genre, errors: errors.array()});
            return;
        }
        else{
            // Data from form is valid
            // Check if Genre with same name already exists
            Genre.findOne({'name': req.body.name})
            .exec(function(err, found_genre){
                if (err) { return next(err); }
                if (found_genre){
                    // Genre exists, redirect to its detail page
                    res.redirect(found_genre.url);
                }else{
                    // update the genre
                    Genre.findOneAndUpdate({_id: req.params.id}, genre, {}, (err, thegenre) =>{
                        if (err) return next(err);
                        // Successful, redirect to genre page
                        res.redirect(thegenre.url);
                    })
                }
            });
        }
    }
];