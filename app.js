var express = require('express');
var path = require('path'); //core Node library for parsing file and directory paths.
var favicon = require('serve-favicon'); //Node middleware for serving a favicon (this is the icon used to represent the site inside the browser tab, bookmarks, etc.).
var logger = require('morgan'); //An HTTP request logger middleware for node.
var cookieParser = require('cookie-parser'); //Used to parse the cookie header and populate req.cookies (essentially provides a convenient method for accessing cookie information).
var bodyParser = require('body-parser'); //This parses the body portion of an incoming HTTP request and makes it easier to extract different parts of the contained information. For example, you can use this to read POST parameters.
var helmet = require('helmet');

// require from routes directory
var index = require('./routes/index');
var users = require('./routes/users');
var catalog = require('./routes/catalog');  //Import routes for "catalog" area of site

var app = express();

//Import the mongoose module
var mongoose = require('mongoose');
//Set up default mongoose connection
var mongoDB = 'mongodb://127.0.0.1:27017/locallibrary';
mongoose.connect(mongoDB);
// Get Mongoose to use the global promise library
mongoose.Promise = global.Promise;
//Get the default connection
var db = mongoose.connection;
//Bind connection to error event (to get notification of connection errors)
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
//app.use() to add the middleware libraries into the request handling chain
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public'))); //Express.static middleware to get Express to serve all the static files in the directory /public in the project root.
app.use(helmet());

// after middleware is set up
//add our (previously imported) route-handling code to the request handling chain
app.use('/', index);
app.use('/users', users);
app.use('/catalog', catalog);  // Add catalog routes to middleware chain.

//adds handler methods for errors and HTTP 404 responses.
// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

//add app to the module exports (this is what allows it to be imported by /bin/www).
module.exports = app;
