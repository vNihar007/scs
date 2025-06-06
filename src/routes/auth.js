const express = require('express')
const router = express.Router()
const{RegisterUser,UserLogin}  = require('../controllers/authController')

router.post('/register',RegisterUser);
router.post('/login',UserLogin) ;

module.exports = router ; 
