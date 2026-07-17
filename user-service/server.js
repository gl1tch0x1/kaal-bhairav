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

// 2. Define User Schema
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  role: { type: String, default: 'analyst' }
});
const User = mongoose.model('User', userSchema);

// 3. Setup gRPC Proto
const PROTO_PATH = path.join(__dirname, 'proto', 'user.proto');
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true, longs: String, enums: String, defaults: true, oneofs: true
});
const userProto = grpc.loadPackageDefinition(packageDefinition).user;

const JWT_SECRET = process.env.JWT_SECRET || 'kaal-bhairav-super-secret-key';

// 4. Implement gRPC Methods
async function authenticate(call, callback) {
  const { username, password } = call.request;
  console.log(`[gRPC] Authenticate Request: ${username}`);
  
  try {
    const user = await User.findOne({ username });
    if (!user) {
      // For demo purposes, auto-seed admin if it doesn't exist
      if (username === 'admin' && password === 'admin') {
        const hash = await bcrypt.hash(password, 10);
        const newUser = await User.create({ username, passwordHash: hash, role: 'admin' });
        const token = jwt.sign({ id: newUser._id, role: newUser.role }, JWT_SECRET, { expiresIn: '24h' });
        return callback(null, { token, success: true, message: 'Admin seeded and authenticated' });
      }
      return callback(null, { token: '', success: false, message: 'Invalid credentials' });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
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
function main() {
  const server = new grpc.Server();
  server.addService(userProto.UserService.service, {
    Authenticate: authenticate,
    ValidateToken: validateToken
  });
  
  const port = process.env.PORT || 50051;
  server.bindAsync(`0.0.0.0:${port}`, grpc.ServerCredentials.createInsecure(), (error, port) => {
    if (error) { console.error(error); return; }
    console.log(`User Service (MongoDB Connected) running on port ${port}`);
  });
}

main();
