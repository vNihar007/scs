require('dotenv').config();
const request  = require('supertest');
const app  = require('../../src/index');
const mongoose  = require('mongoose');
const fs  = require('fs');
const path  = require('path');
const jwt = require('jsonwebtoken');


const testFilePath = path.join(__dirname, '../sample.txt');
const TEST_BUCKET = 'test-bucket';
const JWT_SECRET =  process.env.JWT_SECRET ;


describe('Upload Files Endpoint', ()=>{
    let authToken;
    let userId;
    
    beforeAll(async ()=>{
        // connect to test db 
        if(mongoose.connection.readyState === 0){
            await mongoose.connect('mongodb://localhost:27017/scs_test')
        }

        // Create an dummy userId and JWT_TOKEN;
        userId = new mongoose.Types.ObjectId();
        authToken = jwt.sign({id:userId,email:'test@email.com'},JWT_SECRET,{expiresIn:'2d'});

        // Create an Sample File
        fs.writeFileSync(testFilePath,'This is a test file for upload');
    });

    afterAll(async  ()=>{
        if(fs.existsSync(testFilePath)){
            fs.unlinkSync(testFilePath); 
        }
        await mongoose.disconnect();
    });

    it('Should upload an file and return metadata',async () =>{
        const res = await  request(app)
        .post(`/api/upload/${TEST_BUCKET}/upload`)
        .set('Authorization', `Bearer ${authToken}`)
        .attach('files', testFilePath);


        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('message');
        expect(Array.isArray(res.body.uploaded)).toBe(true);
        expect(res.body.uploaded[0]).toHaveProperty('filename');
        expect(res.body.uploaded[0]).toHaveProperty('url');
    });

    it('should fail without  authentication',async()=>{
        const res  = await request(app)
        .post(`/api/upload/${TEST_BUCKET}/upload`)
        .attach('files',testFilePath);


    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty('message');
    })
})


