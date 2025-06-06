const redis = require('../utlis/redis');

// Redis  Bloom key 
const BLOOM_KEY  = 'file_hash_bloom';

const bloomCheck = async(hash) =>{
    return await redis.call('BF.EXISTS',BLOOM_KEY,hash);
};

const bloomAdd  = async(hash) =>{
    return await redis.call('BF.ADD',BLOOM_KEY,hash);
};

const bloomInit = async() =>{
    // If Bloom filter doesn't exist, initialize it
    const exists = await redis.call('EXISTS',BLOOM_KEY);
    if(!exists){
        await redis.call('BF.RESERVE',BLOOM_KEY,0.01,10000); // 1% error rate, 10k capacity
        console.log(' 😎 Bloom Filter initialized');
    }
};
module.exports = {
    bloomCheck,
    bloomAdd,
    bloomInit
}
