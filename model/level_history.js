let mongoose = require('mongoose')

let levelSchema = mongoose.Schema({
    damId:{
        type:Number
    },
    level:{
        type:Number
     },
     updated:{
         type:String
     },
     inflow:{
         type:Number
     },
     outflow:{
         type:Number
     },
     diff:{
         type:Number
     }
});

let LevelHistory = module.exports = mongoose.model('levelHistory', levelSchema,'levelHistory');