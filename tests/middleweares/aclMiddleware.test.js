const {authorizeFileAccess} = require('../src/middlewear/aclMiddlewear');
const httpMocks = require('node-mocks-http');
const mongoose  = require('mongoose');
const ACL = require('../../src/models/acl');

jest.mock('../../src/models/acl');

describe('ACL Middleware', ()=>{
    const userId = new mongoose.Types.ObjectId();

    it ('should allow access when ACL is valid', async () =>{
        ACL.findOne.mockResolvedValue({permission:'read',expiresAt:null});

        const req = httpMocks.createRequest({
            method: 'GET',
            url: `/bucket/test-bucket`,
            params: { bucketName: 'test-bucket' },
            user: { _id: userId },
        })

        const res = httpMocks.createResponse();
        const next = jest.fn();

        await authorizeFileAccess('read')(req,res,next);

        expect(next).toHaveBeenCalled();
    });

    it ( 'should  deny access when no ACL is found',async ()=>{
        ACL.findOne.mockResolvedValue(null);

        const req = httpMocks.createRequest({
            method: 'GET',
            url: `/bucket/test-bucket`,
            params: { bucketName: 'test-bucket' },
            user: { _id: userId },
        })

        const res = httpMocks.createResponse();
        const next = jest.fn();

        await authorizeFileAccess('read')(req,res,next);

        expect(res.statusCode).toBe(403);
        expect(res._data).toHaveProperty('message');
    });
});