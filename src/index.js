require("dotenv").config();
const express = require('express')
const mongoose = require('mongoose')
const{bloomInit} = require('../src/utlis/bloomFilter')
const {startConsumer} = require('../src/utlis/kafka/Consumer'); // Kafka Consumer ; 
const app = express()
app.use(express.json())
bloomInit();

if (process.env.NODE_ENV !== 'test') {
    startConsumer();
}

const PORT = process.env.PORT || 3000;
const MONGOOSE_URI = process.env.MONGOOSE_URI;

app.listen(PORT,()=>{
    console.log(`Server Running on Port ${PORT}`)
})
mongoose.connect(MONGOOSE_URI)
.then(()=>{
    console.log("Mongoose Connection established")
}).catch((err)=>{
    console.error("Mongoose Connection failed",err)
})

if (process.env.NODE_ENV !== 'test') {
    mongoose.connect(MONGOOSE_URI)
      .then(() => console.log("Mongoose connected"))
      .catch(err => console.error("Mongo error", err));
  }


//imports 
const authRoutes = require('../src/routes/auth');
const uploadRoutes = require('../src/routes/upload');
const fileRoutes = require('../src/routes/files');
const LinkRoutes = require('../src/routes/Link');
const bucketRoutes = require('../src/routes/buckets');
const aclRoutes = require('../src/routes/aclRoutes');
const analyticsRoutes = require('../src/routes/analytics');

// Routes 
app.get('/',(req,res)=>{
    res.send("S3 api working !")
})
// HEALTH CHECK PM2 :
app.get('/health', (req,res)=>{
    res.status(200).send('OK')
});
app.use('/api/auth',authRoutes);
app.use('/api/upload',uploadRoutes);
app.use('/api/files',fileRoutes);
app.use('/api/link',LinkRoutes);
app.use('/api/bucket',bucketRoutes);
app.use('/api/acl',aclRoutes);
app.use('/api/analytics',analyticsRoutes);


module.exports = app;
