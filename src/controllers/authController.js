const User = require('../models/users')
const bcrypt = require('bcryptjs')
const jwt  = require("jsonwebtoken")
const {generateToken} = require('../utlis/Token_gen')

const RegisterUser = async(req,res)=>{
    const {username,email,password} = req.body
    try { 
        const UserExist = await User.findOne({email})
        if(UserExist){
            return res.status(400).json({message:"User already exists"})
        }
        const HashedPassword  = await bcrypt.hash(password,12)
        await User.create({
            username,
            email,
            password:HashedPassword
        })
        return res.status(200).json({message:"User Registered Successfully"})
    }catch(err){
        console.log(err)
        return res.status(400).json({error:err.message})
    }
}


const UserLogin = async(req,res)=>{
    const{username,password} = req.body 
    try{
        const FindUser = await User.findOne({username})
        if(!FindUser){
            return res.status(400).json({message:"User Not Found"})
        }
        const isPasswordValid = await bcrypt.compare(password,FindUser.password)
        if(!isPasswordValid){
            return res.status(400).json({message:"Invalid Password"})
        }
        return res.status(200).json({
            id:FindUser.id,
            username:FindUser.username,
            email:FindUser.email,
            token:generateToken(FindUser._id)

        })
    }catch(error){
        console.log(error)
        return res.status(400).json({error:error.message})
    }
}

module.exports = {RegisterUser,UserLogin}