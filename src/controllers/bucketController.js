const Bucket = require('../models/bucket');
const axios = require('axios');
const ObjectMeta = require('../models/objectMeta');
const SEAWEED_FILER = 'http://localhost:8888';

const createBucket = async(req,res)=>{
    try{
        const {name} = req.body;
        const existingBucket = await Bucket.findOne({name});

        if(existingBucket){
            return res.status(400).json({message:"Bucket already Exitsts - Bucket's are unique"})
        }
        const bucket  = new Bucket({
            name,
            owner:req.user._id
        })
        await bucket.save()

        //Create folder in SeaweedFS Filer
        await axios.put(`${SEAWEED_FILER}/${name}/?mkdirs=true`, {}, {
            headers: {
              'Content-Type': 'application/json'
            }
          });
        console.log(`Created bucket folder in SeaweedFS: /${name}`);

        return res.status(201).json({message:"Bucket Created Successfully"})
    }catch(error){
        console.log(error)
        return res.status(500).json({message:"Failed to create bucket",error})
    }
}

// list all users buckets

const listBuckets = async(req,res)=>{
    try{ 
        const buckets = await Bucket.find({
            owner:req.user._id
        })
        if(!buckets || buckets.length === 0){
            return res.status(404).json({message:"Bucket Not Found"})
        }
        return res.status(200).json({message:`${req.user._id}`,buckets})
    }catch(error){
        console.log(error)
        return res.status(500).json({message:"Failed to list buckets"})
    }
}

// list of objects in the Bucket 

const ObjectsInBucket = async(req,res)=>{
    try{
        const {bucketName} = req.params; 
        const {folder='',tags=''} = req.query

        const bucket = await Bucket.findOne({
            owner:req.user._id,
            name:bucketName
        })
        if(!bucket){
            return res.status(404).json({message:"Bucket not Found"});
        }
        const query = {
            owner: req.user._id,
            bucket:bucketName,
            folder,
        };  
        if(tags){
            const tagArray = tags.split(',').map(tag =>tag.trim())
            query.tags = {$in:tagArray}
        }
        const files = await ObjectMeta.find(query).sort({createdAt:-1})
        return res.status(200).json({ bucket: bucketName, total: files.length, files });
    }catch(error){
        console.error(error);
        return res.status(500).json({message:"Unable to retrive files from Bucket"});
    }
}


module.exports = { createBucket, listBuckets, ObjectsInBucket };
