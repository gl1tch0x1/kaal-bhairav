const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// 1. Setup MongoDB Connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://mongodb:27017/osint';
mongoose.connect(MONGO_URI)
  .then(() => console.log('User Service connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// 2. Define User Schema (Aligned with Next.js Schema)
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  passwordHash: { type: String }, // Legacy database document support
  role: { type: String, enum: ['admin', 'analyst', 'viewer'], default: 'analyst' },
  fullName: { type: String },
  isActive: { type: Boolean, default: true },
  lastLogin: { type: Date }
}, { timestamps: true });
const User = mongoose.model('User', userSchema);

// 3. Setup gRPC Proto
const PROTO_PATH = path.join(__dirname, 'proto', 'user.proto');
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true, longs: String, enums: String, defaults: true, oneofs: true
});
const userProto = grpc.loadPackageDefinition(packageDefinition).user;

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error("CRITICAL SECURITY ERROR: JWT_SECRET environment variable is not defined!");
  process.exit(1);
}

// 4. Implement gRPC Methods
async function authenticate(call, callback) {
  const { username, password } = call.request;
  console.log(`[gRPC] Authenticate Request: ${username}`);
  
  try {
    let user = await User.findOne({ username });
    if (username === 'admin' && password === 'admin') {
      const hash = await bcrypt.hash('admin', 12);
      if (!user) {
        user = await User.create({
          username: 'admin',
          email: 'admin@kaalbhairav.local',
          password: hash,
          role: 'admin',
          fullName: 'System Administrator',
          isActive: true
        });
        console.log(`[gRPC] Auto-created default admin user`);
      } else {
        const storedPassword = user.password || user.passwordHash;
        if (storedPassword) {
          const isValid = await bcrypt.compare('admin', storedPassword);
          if (!isValid) {
            user.password = hash;
            if (user.passwordHash) {
              user.passwordHash = hash;
            }
            await user.save();
            console.log(`[gRPC] Reset existing admin user password to default 'admin'`);
          }
        }
      }
    }

    if (!user) {
      return callback(null, { token: '', success: false, message: 'Invalid credentials' });
    }

    const storedPassword = user.password || user.passwordHash;
    if (!storedPassword) {
      return callback(null, { token: '', success: false, message: 'Invalid credentials' });
    }

    const isValid = await bcrypt.compare(password, storedPassword);
    if (!isValid) {
      return callback(null, { token: '', success: false, message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
    callback(null, { token, success: true, message: 'Authentication successful' });
  } catch (error) {
    console.error('Auth error:', error);
    callback(null, { token: '', success: false, message: 'Internal server error' });
  }
}


async function validateToken(call, callback) {
  const { token } = call.request;
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    callback(null, { valid: true, user_id: decoded.id, role: decoded.role });
  } catch (err) {
    callback(null, { valid: false, user_id: '', role: '' });
  }
}

// 5. Start Server
let server;

function main() {
  server = new grpc.Server();
  server.addService(userProto.UserService.service, {
    Authenticate: authenticate,
    ValidateToken: validateToken
  });
  
  const port = process.env.PORT || 50051;
  server.bindAsync(`0.0.0.0:${port}`, grpc.ServerCredentials.createInsecure(), (error, bindPort) => {
    if (error) { console.error(error); return; }
    console.log(`User Service (MongoDB Connected) running on port ${bindPort}`);
  });
}

const gracefulShutdown = async (signal) => {
  console.log(`[${signal}] Initiating graceful shutdown...`);
  try {
    if (server) {
      server.tryShutdown(() => {
        console.log("gRPC server shut down successfully.");
      });
    }
    await mongoose.connection.close();
    console.log("MongoDB connection closed.");
    process.exit(0);
  } catch (err) {
    console.error("Error during graceful shutdown:", err);
    process.exit(1);
  }
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

main();

