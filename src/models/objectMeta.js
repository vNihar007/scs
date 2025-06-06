const mongoose = require('mongoose');

const objectMetaSchema = new mongoose.Schema(
  {
    bucket:{
        type:String,
        required:true,
        index:true
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    filename: {
      type: String,
      required: true,
    },
    path: {
      type: String,
      fid:{
        type:String,
        required:true
      },
      required: false,
    },
    url:{
        type:String,
        required:true
    },
    folder: {
      type: String,
      default: '',
    },
    size: {
      type: Number,
      required: true,
      min: 0,
    },
    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],
    access: {
      type: String,
      enum: ['private', 'public', 'shared'],
      default: 'private',
    },
    sharedWith: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    versionId: {
      type: String,
    },
    sha256: {
      type: String,
      required: true,
      index: true,
    },
    createdAt:{
        type:Date,
        default:Date.now
    },
    // To maintain versioning of files
    isLatest:{
        type:Boolean,
        default:true 
    }, 
    //  file Versioning
    versionLabel: { 
        type:String  
    },
    versionReason:{
        type:String,
        default:''
    }
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('ObjectMeta', objectMetaSchema);
