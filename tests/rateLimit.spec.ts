import type { PrismaClient } from '@prisma/client';
import request from 'supertest';
import { createApp } from '../src/app';

describe('Rate limit', () => {
  it('responde 429 ao exceder o limite de requisições por IP', async () => {
    const app = createApp({} as PrismaClient, { rateLimit: { windowMs: 60_000, max: 2 } });

    const first = await request(app).get('/health');
    await request(app).get('/health');
    const blocked = await request(app).get('/health');

    expect(first.status).toBe(200);
    expect(first.headers).toHaveProperty('ratelimit');
    expect(blocked.status).toBe(429);
    expect(blocked.body.error.message).toMatch(/Muitas requisições/);
    expect(blocked.headers).toHaveProperty('retry-after');
  });

  it('conta o limite separadamente por IP', async () => {
    const app = createApp({} as PrismaClient, { rateLimit: { windowMs: 60_000, max: 1 }, trustProxy: 1 });

    const ipA = await request(app).get('/health').set('X-Forwarded-For', '10.0.0.1');
    const ipB = await request(app).get('/health').set('X-Forwarded-For', '10.0.0.2');
    const ipAAgain = await request(app).get('/health').set('X-Forwarded-For', '10.0.0.1');

    expect(ipA.status).toBe(200);
    expect(ipB.status).toBe(200);
    expect(ipAAgain.status).toBe(429);
  });
});
