const request = require('supertest');
const app = require('../../src/index.js');
const mongoose = require('mongoose');
const objectMeta = require('../../src/models/objectMeta.js');
const jwt = require('jsonwebtoken');

describe('Storage Analytics API', () => {
  let token;
  const userId = new mongoose.Types.ObjectId();

  beforeAll(async () => {
    token = jwt.sign({ _id: userId }, process.env.JWT_SECRET || 'testsecret');

    await objectMeta.insertMany([
        {
          owner: userId,
          folder: 'Docs',
          size: 100,
          filename: 'doc1.txt',
          bucket: 'test-bucket',
          sha256: 'dummyhash1',
          url: 'http://localhost/doc1.txt'
        },
        {
          owner: userId,
          folder: 'Docs',
          size: 200,
          filename: 'doc2.txt',
          bucket: 'test-bucket',
          sha256: 'dummyhash2',
          url: 'http://localhost/doc2.txt'
        },
        {
          owner: userId,
          folder: 'Images',
          size: 300,
          filename: 'image.png',
          bucket: 'test-bucket',
          sha256: 'dummyhash3',
          url: 'http://localhost/image.png'
        }
      ]);    
  });

  afterAll(async () => {
    await objectMeta.deleteMany({});
    mongoose.connection.close();
  });

  it('should return storage analytics grouped by folder', async () => {
    const res = await request(app)
      .get('/api/analytics/storage')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.stats).toBeDefined();
    expect(res.body.stats.find(s => s._id === 'Docs')).toBeTruthy();
  });
});
