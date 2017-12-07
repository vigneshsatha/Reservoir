let mongoose = require('mongoose')

let UserSchema = mongoose.Schema({
    name:{
        type:String
     },
     email:{
         type:String
     },
     username:{
         type:String
     },
     password:{
        type:String
    }
});

let User = module.exports = mongoose.model('User', UserSchema,'users');