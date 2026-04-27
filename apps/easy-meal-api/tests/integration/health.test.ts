import request from 'supertest';
import { app } from '../../src/app.js';

describe('GET /v1/health', () => {
  it('returns health status', async () => {
    const response = await request(app).get('/v1/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      data: {
        status: 'ok',
        service: 'easy-meal-api',
      },
    });
  });
});
