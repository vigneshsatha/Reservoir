let mongoose = require('mongoose')

let levelSchema = mongoose.Schema({
    level:{
        type:Number
     },
     damId:{
         type:Number
     },
     name:{
         type:String
     },
     nameEn:{
        type:String
    },
     updated:{
         type:String
     },
     inflow:{
         type:Number
     },
     outflow:{
         type:Number
     }
});

let Level = module.exports = mongoose.model('levels', levelSchema,'level');