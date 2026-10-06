/**
 * Especificação OpenAPI 3 da API, servida em /docs (Swagger UI) e /docs.json.
 */
const ref = (name: string) => ({ $ref: `#/components/schemas/${name}` });
const json = (schema: object) => ({ 'application/json': { schema } });
const response = (description: string, schema?: object) =>
  schema ? { description, content: json(schema) } : { description };

const idParam = {
  name: 'id',
  in: 'path',
  required: true,
  schema: { type: 'string', format: 'uuid' },
};

const errors = {
  400: response('Dados inválidos', ref('Error')),
  404: response('Recurso não encontrado', ref('Error')),
  409: response('Conflito com o estado atual (regra de negócio)', ref('Error')),
};

export const openApiDocument = {
  openapi: '3.0.3',
  info: {
    title: 'TTP - Controle de Utilização de Automóveis',
    version: '1.0.0',
    description:
      'API para cadastro de automóveis e motoristas e controle da utilização dos automóveis.\n\n' +
      '**Regras de negócio:** um automóvel só pode ser utilizado por um motorista por vez, ' +
      'e um motorista que já esteja utilizando um automóvel não pode utilizar outro ao mesmo tempo.\n\n' +
      '**Rate limit:** todas as rotas são limitadas por IP (padrão: 100 requisições por minuto). ' +
      'Ao exceder, a API responde `429` com os headers `RateLimit` e `Retry-After`.',
  },
  servers: [{ url: '/', description: 'Servidor atual' }],
  tags: [
    { name: 'Automóveis' },
    { name: 'Motoristas' },
    { name: 'Utilizações' },
    { name: 'Health' },
  ],
  paths: {
    '/health': {
      get: {
        tags: ['Health'],
        summary: 'Verifica se a API está no ar',
        responses: { 200: response('OK', { type: 'object', properties: { status: { type: 'string', example: 'ok' } } }) },
      },
    },

    '/api/cars': {
      post: {
        tags: ['Automóveis'],
        summary: 'Cadastra um automóvel',
        requestBody: { required: true, content: json(ref('CarInput')) },
        responses: { 201: response('Automóvel criado', ref('Car')), 400: errors[400], 409: errors[409] },
      },
      get: {
        tags: ['Automóveis'],
        summary: 'Lista os automóveis (filtros por cor e marca)',
        parameters: [
          { name: 'color', in: 'query', schema: { type: 'string' }, description: 'Cor exata, sem diferenciar maiúsculas', example: 'Prata' },
          { name: 'brand', in: 'query', schema: { type: 'string' }, description: 'Marca exata, sem diferenciar maiúsculas', example: 'Fiat' },
        ],
        responses: { 200: response('Lista de automóveis', { type: 'array', items: ref('Car') }) },
      },
    },
    '/api/cars/{id}': {
      parameters: [idParam],
      get: {
        tags: ['Automóveis'],
        summary: 'Busca um automóvel pelo id',
        responses: { 200: response('Automóvel', ref('Car')), 400: errors[400], 404: errors[404] },
      },
      put: {
        tags: ['Automóveis'],
        summary: 'Atualiza um automóvel (envie apenas os campos a alterar)',
        requestBody: { required: true, content: json(ref('CarUpdateInput')) },
        responses: { 200: response('Automóvel atualizado', ref('Car')), 400: errors[400], 404: errors[404], 409: errors[409] },
      },
      delete: {
        tags: ['Automóveis'],
        summary: 'Exclui um automóvel',
        description: 'Automóveis com registros de utilização não podem ser excluídos (409), preservando o histórico.',
        responses: { 204: response('Excluído'), 400: errors[400], 404: errors[404], 409: errors[409] },
      },
    },

    '/api/drivers': {
      post: {
        tags: ['Motoristas'],
        summary: 'Cadastra um motorista',
        requestBody: { required: true, content: json(ref('DriverInput')) },
        responses: { 201: response('Motorista criado', ref('Driver')), 400: errors[400] },
      },
      get: {
        tags: ['Motoristas'],
        summary: 'Lista os motoristas (filtro por nome)',
        parameters: [
          { name: 'name', in: 'query', schema: { type: 'string' }, description: 'Parte do nome, sem diferenciar maiúsculas', example: 'maria' },
        ],
        responses: { 200: response('Lista de motoristas', { type: 'array', items: ref('Driver') }) },
      },
    },
    '/api/drivers/{id}': {
      parameters: [idParam],
      get: {
        tags: ['Motoristas'],
        summary: 'Busca um motorista pelo id',
        responses: { 200: response('Motorista', ref('Driver')), 400: errors[400], 404: errors[404] },
      },
      put: {
        tags: ['Motoristas'],
        summary: 'Atualiza um motorista',
        requestBody: { required: true, content: json(ref('DriverInput')) },
        responses: { 200: response('Motorista atualizado', ref('Driver')), 400: errors[400], 404: errors[404] },
      },
      delete: {
        tags: ['Motoristas'],
        summary: 'Exclui um motorista',
        description: 'Motoristas com registros de utilização não podem ser excluídos (409), preservando o histórico.',
        responses: { 204: response('Excluído'), 400: errors[400], 404: errors[404], 409: errors[409] },
      },
    },

    '/api/usages': {
      post: {
        tags: ['Utilizações'],
        summary: 'Inicia a utilização de um automóvel por um motorista',
        description:
          'Retorna 409 se o automóvel já estiver em uso ou se o motorista já estiver utilizando outro automóvel.',
        requestBody: { required: true, content: json(ref('UsageInput')) },
        responses: { 201: response('Utilização iniciada', ref('Usage')), 400: errors[400], 404: errors[404], 409: errors[409] },
      },
      get: {
        tags: ['Utilizações'],
        summary: 'Lista as utilizações com nome do motorista e dados do automóvel',
        parameters: [
          { name: 'active', in: 'query', schema: { type: 'string', enum: ['true', 'false'] }, description: 'true = em andamento, false = finalizadas' },
          { name: 'carId', in: 'query', schema: { type: 'string', format: 'uuid' } },
          { name: 'driverId', in: 'query', schema: { type: 'string', format: 'uuid' } },
        ],
        responses: { 200: response('Lista de utilizações', { type: 'array', items: ref('Usage') }), 400: errors[400] },
      },
    },
    '/api/usages/{id}/finish': {
      parameters: [idParam],
      patch: {
        tags: ['Utilizações'],
        summary: 'Finaliza uma utilização',
        description: 'Registra a data de término (padrão: agora). Não pode ser anterior à data de início.',
        requestBody: { required: false, content: json(ref('FinishUsageInput')) },
        responses: { 200: response('Utilização finalizada', ref('Usage')), 400: errors[400], 404: errors[404], 409: errors[409] },
      },
    },
  },
  components: {
    schemas: {
      Error: {
        type: 'object',
        properties: {
          error: {
            type: 'object',
            properties: {
              message: { type: 'string', example: 'O automóvel ABC1D23 já está em uso por outro motorista' },
              details: { type: 'object', additionalProperties: true },
            },
          },
        },
      },
      CarInput: {
        type: 'object',
        required: ['plate', 'color', 'brand'],
        properties: {
          plate: { type: 'string', example: 'ABC1D23', description: 'Formatos ABC1234 ou ABC1D23 (hífen opcional)' },
          color: { type: 'string', example: 'Prata' },
          brand: { type: 'string', example: 'Fiat' },
        },
      },
      CarUpdateInput: {
        type: 'object',
        minProperties: 1,
        properties: {
          plate: { type: 'string', example: 'ABC1D23' },
          color: { type: 'string', example: 'Preto' },
          brand: { type: 'string', example: 'Fiat' },
        },
      },
      Car: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          plate: { type: 'string', example: 'ABC1D23' },
          color: { type: 'string', example: 'Prata' },
          brand: { type: 'string', example: 'Fiat' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      DriverInput: {
        type: 'object',
        required: ['name'],
        properties: { name: { type: 'string', example: 'Maria Souza' } },
      },
      Driver: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string', example: 'Maria Souza' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      UsageInput: {
        type: 'object',
        required: ['carId', 'driverId', 'reason'],
        properties: {
          carId: { type: 'string', format: 'uuid' },
          driverId: { type: 'string', format: 'uuid' },
          reason: { type: 'string', example: 'Visita a cliente' },
          startedAt: { type: 'string', format: 'date-time', description: 'Opcional, padrão: agora. Não pode estar no futuro.' },
        },
      },
      FinishUsageInput: {
        type: 'object',
        properties: {
          endedAt: { type: 'string', format: 'date-time', description: 'Opcional, padrão: agora' },
        },
      },
      Usage: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          carId: { type: 'string', format: 'uuid' },
          driverId: { type: 'string', format: 'uuid' },
          startedAt: { type: 'string', format: 'date-time' },
          endedAt: { type: 'string', format: 'date-time', nullable: true, description: 'null enquanto em andamento' },
          reason: { type: 'string', example: 'Visita a cliente' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
          car: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              plate: { type: 'string', example: 'ABC1D23' },
              color: { type: 'string', example: 'Prata' },
              brand: { type: 'string', example: 'Fiat' },
            },
          },
          driver: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              name: { type: 'string', example: 'Maria Souza' },
            },
          },
        },
      },
    },
  },
};

// Todas as rotas passam pelo rate limit: adiciona a resposta 429 em cada operação.
const tooManyRequests = response('Limite de requisições excedido para este IP', ref('Error'));
type Operation = { responses?: Record<string, unknown> };
for (const pathItem of Object.values(openApiDocument.paths) as Record<string, Operation>[]) {
  for (const operation of Object.values(pathItem)) {
    if (operation.responses) operation.responses[429] = tooManyRequests;
  }
}
