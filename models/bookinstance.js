var mongoose = require('mongoose');
var moment = require('moment');

var Schema = mongoose.Schema;

var BookInstanceSchema = new Schema(
  {
    book: { type: Schema.ObjectId, ref: 'Book', required: true }, //reference to the associated book
    imprint: {type: String, required: true},
    status: {type: String, required: true, enum: ['Available', 'Maintenance', 'Loaned', 'Reserved'], default: 'Maintenance'}, // enum set allowed values for the strings
    due_back: {type: Date, default: Date.now},
  }
);

// Virtual for bookinstance's URL
BookInstanceSchema
.virtual('url')
.get(function () {
  return '/catalog/bookinstance/' + this._id;
});

BookInstanceSchema
.virtual('due_back_formatted')
.get(function(){
	return moment(this.due_back).format('MMMM Do, YYYY');
})

BookInstanceSchema
.virtual('due_back_autofill')
.get(function(){
	return this.due_back ? moment(this.due_back).format('YYYY-MM-DD') : '';
})

//Export model
module.exports = mongoose.model('BookInstanceSchema', BookInstanceSchema);