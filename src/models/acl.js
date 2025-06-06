const  mongoose = require('mongoose');

const aclSchema = new mongoose.Schema({
    resourceType:{
        type:String,
        enum:['file','bucket'],
        required:true
    },
    resourceId:{
        type:mongoose.Schema.Types.ObjectId,
        required:true,
        index:true
    },
    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
        required:true,
        index:true
    },
    permission:{
        type:String,
        enum:['read','write','owner'], 
        default :'read',
        required:true
    },
    expiresAt:{
        type:Date,
        default:Date.now
    }
},{timestamps:true})


module.exports = mongoose.model('ACL',aclSchema);