const mongoose  = require('mongoose');

const bucketSchema = new  mongoose.Schema({
    name:{
        type:String,
        unique:true,
        required:true,
        lowercase :true,
        trim:true
    },
    owner:{
        type:mongoose.Schema.Types.ObjectId,
        ref :'User',
        required:true,
        lowercase:true
    },
    createdAt:{
        type:Date,
        default:Date.now,
        required:true,
        unique:true
    },
    region:{
        type:String,
        default:'ap-south-1'
    }
},{timestamps:true})

module.exports = mongoose.model('Bucket',bucketSchema);