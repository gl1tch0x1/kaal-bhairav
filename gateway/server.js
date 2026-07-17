const fastify = require('fastify')({ logger: true });
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');
const { connect, StringCodec } = require('nats');

fastify.register(require('@fastify/redis'), { host: process.env.REDIS_HOST || '127.0.0.1' });
fastify.register(require('@fastify/rate-limit'), {
  max: 100,
  timeWindow: '1 minute'
});

const sc = StringCodec();

// --- 1. Load gRPC Protos ---
function loadProto(filename, serviceName, envUrl, defaultUrl) {
  const PROTO_PATH = path.join(__dirname, 'proto', filename);
  const packageDef = protoLoader.loadSync(PROTO_PATH, { keepCase: true, longs: String, enums: String, defaults: true, oneofs: true });
  const protoDescriptor = grpc.loadPackageDefinition(packageDef);
  // Get package name from filename (e.g. user.proto -> user)
  const pkg = filename.split('.')[0]; 
  const service = protoDescriptor[pkg][serviceName];
  const url = process.env[envUrl] || defaultUrl;
  return new service(url, grpc.credentials.createInsecure());
}

const userClient = loadProto('user.proto', 'UserService', 'USER_SERVICE_URL', 'user-service:50051');
const cameraClient = loadProto('camera.proto', 'CameraService', 'CAMERA_SERVICE_URL', 'camera-service:50052');
const aiClient = loadProto('ai_copilot.proto', 'AICopilotService', 'AI_SERVICE_URL', 'ai-copilot-service:50053');

let natsConnection = null;

fastify.get('/health', async (request, reply) => {
  return { status: 'ok', service: 'gateway', nats_connected: !!natsConnection };
});

// --- 2. HTTP to gRPC Mappings ---
fastify.post('/api/auth/login', async (request, reply) => {
  const { username, password } = request.body;
  return new Promise((resolve, reject) => {
    userClient.Authenticate({ username, password }, (error, response) => {
      if (error || !response.success) {
        fastify.log.error(error || response.message);
        reply.code(401).send({ error: response?.message || 'Authentication failed' });
        return reject(error);
      }
      
      // Publish NATS Event asynchronously
      if (natsConnection) {
        natsConnection.publish('auth.login_event', sc.encode(JSON.stringify({ username, timestamp: Date.now() })));
        fastify.log.info(`[NATS] Published auth.login_event for ${username}`);
      }
      
      reply.send(response);
      resolve();
    });
  });
});

fastify.get('/api/camera/:id/stream', async (request, reply) => {
  return new Promise((resolve, reject) => {
    cameraClient.GetCameraStream({ camera_id: request.params.id }, (error, response) => {
      if (error) { reply.code(500).send({ error: error.message }); return reject(error); }
      reply.send(response);
      resolve();
    });
  });
});

fastify.post('/api/ai/analyze', async (request, reply) => {
  const { query, query_type } = request.body;
  
  const cacheKey = `ai_analyze:${query}`;
  const cachedResponse = await fastify.redis.get(cacheKey);
  
  if (cachedResponse) {
    fastify.log.info(`[Redis] Cache hit for AI Analyze: ${query}`);
    return reply.send(JSON.parse(cachedResponse));
  }

  return new Promise((resolve, reject) => {
    aiClient.AnalyzeThreat({ query, query_type, investigation_id: 'N/A' }, async (error, response) => {
      if (error) { reply.code(500).send({ error: error.message }); return reject(error); }
      
      await fastify.redis.set(cacheKey, JSON.stringify(response), 'EX', 600); // Cache for 10 minutes
      reply.send(response);
      resolve();
    });
  });
});

// --- 3. Start Gateway ---
const start = async () => {
  try {
    const natsUrl = process.env.NATS_URL || 'nats://nats:4222';
    natsConnection = await connect({ servers: natsUrl });
    fastify.log.info(`Connected to NATS at ${natsUrl}`);
    
    await fastify.listen({ port: 4000, host: '0.0.0.0' });
    fastify.log.info(`API Gateway listening on port 4000`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
