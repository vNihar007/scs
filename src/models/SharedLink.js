const mongoose =require('mongoose');

const SharedLinkSchema = new mongoose.Schema({
    file:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'ObjectMeta',
        required:true
    },
    token:{
        type:String,
        required:true,
        unique:true
    },
    expiresAt:{
        type:Date, 
        required:true
    }
},{timestamps:true})

module.exports = mongoose.model('SharedLink',SharedLinkSchema)