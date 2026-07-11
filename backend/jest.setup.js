process.env.JWT_SECRET = 'test-jwt-secret';
process.env.JWT_EXPIRE = '30d';
process.env.WEBHOOK_SECRET = 'test-webhook-secret';

jest.setTimeout(120000);

const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongod;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  await mongoose.connect(uri);
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany();
  }
});

afterAll(async () => {
  // Force close mongoose connection pool
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close(true);
  }

  // Stop in-memory MongoDB instance
  if (mongod) {
    await mongod.stop({ doCleanup: true });
  }

  // Allow any remaining handles to settle
  await new Promise(resolve => setTimeout(resolve, 500));
});



