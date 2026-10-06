import { env } from './config/env';
import { createApp } from './app';
import { prisma } from './infra/prisma';

const app = createApp(prisma, {
  rateLimit: { windowMs: env.RATE_LIMIT_WINDOW_MS, max: env.RATE_LIMIT_MAX },
  trustProxy: env.TRUST_PROXY,
});

const server = app.listen(env.PORT, () => {
  console.log(`API rodando em http://localhost:${env.PORT}`);
  console.log(`Documentação em http://localhost:${env.PORT}/docs`);
});

async function shutdown(signal: string) {
  console.log(`${signal} recebido, encerrando...`);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
