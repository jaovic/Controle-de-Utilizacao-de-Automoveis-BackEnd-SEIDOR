import type { PrismaClient } from '@prisma/client';
import request from 'supertest';
import { createApp } from '../src/app';

// Testes da camada HTTP que não chegam ao banco: o PrismaClient é um stub vazio.
const app = createApp({} as PrismaClient);

describe('App (HTTP)', () => {
  it('GET /health responde ok', async () => {
    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
  });

  it('GET /docs.json expõe a especificação OpenAPI', async () => {
    const response = await request(app).get('/docs.json');

    expect(response.status).toBe(200);
    expect(response.body.openapi).toBe('3.0.3');
  });

  it('valida o corpo ao cadastrar automóvel', async () => {
    const response = await request(app).post('/api/cars').send({ plate: 'inválida' });

    expect(response.status).toBe(400);
    expect(response.body.error.message).toBe('Dados inválidos');
    expect(response.body.error.details.body).toHaveProperty('color');
  });

  it('rejeita id que não é UUID', async () => {
    const response = await request(app).get('/api/drivers/123');

    expect(response.status).toBe(400);
  });

  it('valida o filtro active da listagem de utilizações', async () => {
    const response = await request(app).get('/api/usages?active=talvez');

    expect(response.status).toBe(400);
  });

  it('retorna 400 para JSON malformado', async () => {
    const response = await request(app)
      .post('/api/drivers')
      .set('Content-Type', 'application/json')
      .send('{"name":');

    expect(response.status).toBe(400);
  });

  it('retorna 404 para rota inexistente', async () => {
    const response = await request(app).get('/api/nada');

    expect(response.status).toBe(404);
  });
});
