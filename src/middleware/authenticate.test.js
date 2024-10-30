const jwt = require('jsonwebtoken');
const express = require('express');
const supertest = require('supertest');
const authMiddleware = require('./authenticate');

const app = express();
app.use(authMiddleware);

describe('authMiddleware', () => {
  let app;

  // Set up the Express app and route before all tests
  beforeAll(() => {
    app = express();
    app.use(authMiddleware);

    app.get('/', (req, res) => {
      if (req.user) {
        res.status(200).json({ message: 'Hello World!', user: req.user });
      } else {
        res.status(200).json({ message: 'Hello World!' });
      }
    });
  });

  it('should add user to request object if valid token is provided', async () => {
    // Mock a valid token
    const token = jwt.sign({ userId: '123' }, process.env.JWT_SECRET);

    const response = await supertest(app).get('/').set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.message).toEqual('Hello World!');
    expect(response.body.user).toEqual({ userId: '123' });
  });

  it('should return 401 if no token is provided', async () => {
    await supertest(app)
      .get('/')
      .expect(401)
      .expect((res) => {
        expect(res.body).toEqual({ message: 'Authentication required' });
        expect(res.req.user).toBeUndefined();
      });
  });

  it('should return 401 if an invalid token is provided', async () => {
    // Mock an invalid token
    const token = 'invalid-token';

    await supertest(app)
      .get('/')
      .set('Authorization', `Bearer ${token}`)
      .expect(401)
      .expect((res) => {
        expect(res.body).toEqual({ message: 'Invalid token' });
        expect(res.req.user).toBeUndefined();
      });
  });
});
