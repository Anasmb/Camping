const { default: mongoose } = require("mongoose");
const passportLocalMongoose = require('passport-local-mongoose')
const Schema = mongoose.Schema;

const userSchema = new Schema({
    email: {
        type: String,
        required: true,
        unique: true
    }
});

//this plugin will addon to the schema username and password with additional methods
userSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model('User', userSchema);