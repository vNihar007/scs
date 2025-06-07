require('dotenv').config();
const request = require('supertest');
const app = require('../../src/index');
const mongoose =  require('mongoose');
const objectMeta = require('../../src/models/objectMeta');
const jwt  = require('jsonwebtoken');


describe('File Controller - Downlaod & Delete', ()=>{
    let token ;
    let fileId;
    const userId = new mongoose.Types.ObjectId();

    beforeAll(async ()=>{
        token = jwt.sign({_id:userId},process.env.JWT_SECRET,{expiresIn:'2d'});

        const file = await objectMeta.create({
            owner: userId,
            filename: 'testfile.txt',
            folder: 'test-folder',
            bucket: 'test-bucket',
            url: 'http://localhost:8888/testfile.txt',
            size: 100,
            access: 'private',
            isLatest: true,
            sha256 : 'dummyhash',
            access:'private'
        })
        fileId = file._id;
    });

    afterAll(async ()=>{
        await objectMeta.deleteMany({});
        mongoose.connection.close();
    });

    it ('should prevent download without permisson',async ()=>{
        const res = await request(app)
        .get(`/api/bucket/test-bucket/objects/${fileId}`)
        .set('Authorization', `Bearer ${token}`);

        expect(res.statusCode).toBe(404);
    });

    it('should return 404  on delete if file not found',async ()=>{
        const res  = await request(app)
        .delete(`/api/bucket/test-bucket/objects/000000000000000000000000`)
        .set('Authorization', `Bearer ${token}`);

        expect(res.statusCode).toBe(404);
    });
});