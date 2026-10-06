# TTP: Controle de Utilização de Automóveis

WebAPI em Node.js para controlar o uso dos automóveis de uma empresa: cadastro de **automóveis** e **motoristas** e registro de **utilizações** (início, fim e motivo).

**Regras de negócio:** um automóvel só pode ser usado por um motorista por vez, e um motorista que já está usando um automóvel não pode usar outro ao mesmo tempo.

- **Stack:** Node 20 · TypeScript · Express 5 · Prisma · PostgreSQL · Zod · Jest · Docker

---

## Como rodar

### Com Docker (recomendado)

Pré-requisito: Docker com Docker Compose.

```bash
git clone <url-do-repositorio> ttp-backend
cd ttp-backend
docker compose up --build
```

Esse comando sobe o Postgres, aplica as migrations, cria alguns dados de exemplo e inicia a API. Não é preciso criar `.env`.

- API: http://localhost:3333
- Swagger: http://localhost:3333/docs

Para parar, use `docker compose down`. Para apagar também os dados, use `docker compose down -v`.

### Sem Docker (modo desenvolvimento)

Pré-requisitos: Node 20+ e um Postgres acessível. Para usar só o banco do compose, rode `docker compose up -d db`.

```bash
cp .env.example .env      # ajuste DATABASE_URL se necessário
npm install
npx prisma migrate deploy # cria as tabelas
npm run seed              # opcional: dados de exemplo
npm run dev               # http://localhost:3333
```

### Testes

```bash
npm test                 # testes unitários e de HTTP (não precisam de banco)
npm run test:coverage
```

---

## Variáveis de ambiente

| Variável       | Descrição                                                                            | Exemplo local                                                |
| -------------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------ |
| `PORT`         | Porta HTTP                                                                           | `3333`                                                       |
| `DATABASE_URL` | Conexão usada pela aplicação                                                         | `postgresql://postgres:postgres@localhost:5432/ttp?schema=public` |
| `SEED`         | Só no container: `true` popula o banco com dados de exemplo ao iniciar               | `true`                                                       |
| `RATE_LIMIT_WINDOW_MS` | Janela do rate limit, em ms                                                  | `60000`                                                      |
| `RATE_LIMIT_MAX` | Máximo de requisições por IP dentro da janela                                      | `100`                                                        |
| `TRUST_PROXY`  | Quantidade de proxies à frente da API, para o rate limit usar o IP real (`1` atrás de um proxy reverso) | `0`                                               |

---

## Endpoints

Todos os corpos são JSON. A documentação completa, com exemplos, está no **Swagger (`/docs`)**.

| Método   | Rota                       | Descrição                                                                |
| -------- | -------------------------- | ------------------------------------------------------------------------ |
| `POST`   | `/api/cars`                | Cadastra automóvel `{ plate, color, brand }`                             |
| `GET`    | `/api/cars?color=&brand=`  | Lista automóveis (filtros opcionais, sem diferenciar maiúsculas)         |
| `GET`    | `/api/cars/:id`            | Busca automóvel                                                          |
| `PUT`    | `/api/cars/:id`            | Atualiza automóvel (campos parciais)                                     |
| `DELETE` | `/api/cars/:id`            | Exclui automóvel                                                         |
| `POST`   | `/api/drivers`             | Cadastra motorista `{ name }`                                            |
| `GET`    | `/api/drivers?name=`       | Lista motoristas (filtro por parte do nome)                              |
| `GET`    | `/api/drivers/:id`         | Busca motorista                                                          |
| `PUT`    | `/api/drivers/:id`         | Atualiza motorista                                                       |
| `DELETE` | `/api/drivers/:id`         | Exclui motorista                                                         |
| `POST`   | `/api/usages`              | Inicia utilização `{ carId, driverId, reason, startedAt? }`              |
| `PATCH`  | `/api/usages/:id/finish`   | Finaliza utilização `{ endedAt? }`                                       |
| `GET`    | `/api/usages?active=&carId=&driverId=` | Lista utilizações com o nome do motorista e os dados do automóvel |
| `GET`    | `/health`                  | Health check                                                             |

**Erros** seguem sempre o formato `{ "error": { "message": "...", "details": { ... } } }`:
`400` para dados inválidos, `404` para recurso inexistente, `409` para regra de negócio violada (carro em uso, motorista ocupado, placa duplicada, utilização já finalizada, exclusão de registro com histórico) e `429` para limite de requisições excedido.

### Postman

Importe os arquivos da pasta [`postman/`](postman):

- `TTP.postman_collection.json`: todas as requisições, incluindo os cenários de erro
- `local.postman_environment.json`: define `baseUrl` (`http://localhost:3333`)

Rodando a coleção inteira (**Run collection**), o fluxo completo é executado. Os ids criados ficam salvos em variáveis e as placas são aleatórias, então dá para rodar várias vezes.

---

## Estrutura e decisões

```
src/
  modules/<cars|drivers|usages>/
    *.routes.ts       rotas + validação
    *.controller.ts   camada HTTP
    *.service.ts      regras de negócio
    *.repository.ts   interface + implementação Prisma
    *.schemas.ts      schemas Zod (validação e tipos)
  shared/             erros e middlewares (validação, tratamento de erros)
  docs/openapi.ts     especificação do Swagger
  app.ts              composição das dependências e montagem do Express
prisma/               schema, migrations e seed
tests/                testes unitários (services) e de HTTP
```

- **Camadas com injeção de dependência:** os services dependem de *interfaces* de repositório. Por isso os testes unitários usam mocks e rodam sem banco.
- **Regra de negócio garantida em dois níveis:** o service valida e retorna `409` com uma mensagem clara. Além disso, a migration cria **índices únicos parciais** (`UNIQUE (car_id) WHERE ended_at IS NULL` e o equivalente para `driver_id`). Com isso, nem requisições simultâneas conseguem deixar o mesmo carro ou motorista em duas utilizações ativas.
- **Rate limit por IP em todas as rotas** (padrão: 100 requisições por minuto, configurável). Como a API é pública e não tem login, o IP é a única chave disponível para identificar o cliente. O contador fica em memória, o que basta para uma instância. Com várias réplicas, o próximo passo seria guardar o contador no Redis.
- **Histórico preservado:** automóveis e motoristas que já têm utilizações não podem ser excluídos (`409`).
- **Placas normalizadas:** `abc-1234` vira `ABC1234`. São aceitos o padrão antigo e o Mercosul (`ABC1D23`).
- **Datas:** `startedAt` e `endedAt` são opcionais (padrão: agora). O início não pode estar no futuro, e o término não pode ser anterior ao início.
