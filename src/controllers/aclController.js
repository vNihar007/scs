// To register an file(onwer)  as owner in the ACL(LAYER);

const ACL  = require('../models/acl');
const objectMeta =require('../models/objectMeta');
const Bucket  = require('../models/bucket');
const mongoose  = require('mongoose');

const assignOwnerAcl = async(req,res) =>{
    try{
        const {resourceId,resourceType} = req.body;
        if(!['file','bucket'].includes(resourceType)){
            return res.status(400).json({message:"Invalid Resource Type"});
        }

        const Model = resourceType === 'file' ? objectMeta : Bucket ;

        const resource = await Model.findById(resourceId);
        if(!resource ||  !resource.owner.equals(req.user._id)){
            return res.status(403).json({message:" Not authorized. You must be the resource owner"})
        }
        const existing_acl_entry = await ACL.findOne({
            resourceId,
            user: req.user._id,
            permission:'owner',
        });

        if(existing_acl_entry){
            return res.status(200).json({message:"Owner ACL already exists"});
        }

        await ACL.create({
            resourceId,
            resourceType,
            user:req.user._id,
            permission:'owner',
            expiresAt:null
        });
        return res.status(201).json({
            message: "Owner ACL Assigned Succesfully"
        })
    }catch(error){
        console.error(error);
        return res.status(500).json({message:"Failed to assign owner ACL"})
    }
}

module.exports = assignOwnerAcl;