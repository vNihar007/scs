const Redis = require('ioredis');

const redis = new Redis({
    host:'127.0.0.1',
    port:6379,
    // password not configured
})

redis.on('connect',()=>{
    console.log('Connected to Redis 😂 ')
});
redis.on('error',(error)=>{
    console.log('Error Connecting to Redis 😒', error)
});

module.exports = redis;
