var mongoose = require('mongoose');
var moment = require('moment');

var Schema = mongoose.Schema;

var AuthorSchema = new Schema(
  {
    first_name: {type: String, required: true, max: 100},
    family_name: {type: String, required: true, max: 100},
    date_of_birth: {type: Date},
    date_of_death: {type: Date},
  }
);

// Virtual for author's full name
AuthorSchema
.virtual('name')
.get(function () {
  return this.family_name + ', ' + this.first_name;
});
//declared a virtual for the AuthorSchema named "url" that returns the absolute URL required to get a particular instance of the model

// Virtual for author's URL
AuthorSchema
.virtual('url')
.get(function () {
  return '/catalog/author/' + this._id;
});

AuthorSchema
.virtual('date_of_birth_formatted')
.get(function(){
	return this.date_of_birth ? moment(this.date_of_birth).format('DD-MMM-YYYY') : '';
})

AuthorSchema
.virtual('date_of_death_formatted')
.get(function(){
	return this.date_of_death ? moment(this.date_of_death).format('DD-MMM-YYYY') : '';
})

AuthorSchema
.virtual('date_of_birth_autofill')
.get(function(){
  return this.date_of_birth? moment(this.date_of_birth).format('YYYY-MM-DD') : '';
})

AuthorSchema
.virtual('date_of_death_autofill')
.get(function(){
  return this.date_of_death? moment(this.date_of_death).format('YYYY-MM-DD') : '';
})

AuthorSchema
.virtual('lifespan')
.get(function(){
  var dob = this.date_of_birth ? moment(this.date_of_birth).format('MMMM Do, YYYY') : '';
  var dod = this.date_of_death ? moment(this.date_of_death).format('MMMM Do, YYYY') : '';
  return dob + " - " + dod;
})

//Export model
module.exports = mongoose.model('Author', AuthorSchema);