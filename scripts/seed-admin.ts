import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import path from "path";

// Load environment variables
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/osint";

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: "analyst" },
  fullName: { type: String },
  isActive: { type: Boolean, default: true },
  lastLogin: { type: Date }
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model("User", UserSchema);

async function seedAdmin() {
  const username = process.env.ADMIN_USERNAME || "admin";
  const password = process.env.ADMIN_PASSWORD;
  const email = process.env.ADMIN_EMAIL || "admin@kaalbhairav.local";
  const fullName = process.env.ADMIN_FULL_NAME || "System Administrator";

  if (!password) {
    console.error("CRITICAL ERROR: ADMIN_PASSWORD environment variable is not defined!");
    console.log("Please define it in your shell or .env file before running this script.");
    process.exit(1);
  }

  console.log(`Connecting to MongoDB at: ${MONGODB_URI}`);
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB.");

    // Check if user already exists
    const existing = await User.findOne({ username });
    if (existing) {
      console.log(`User '${username}' already exists. Updating password and permissions.`);
      const hash = await bcrypt.hash(password, 12);
      existing.password = hash;
      existing.role = "admin";
      existing.isActive = true;
      await existing.save();
      console.log(`Admin account '${username}' updated successfully!`);
    } else {
      const hash = await bcrypt.hash(password, 12);
      await User.create({
        username,
        email,
        password: hash,
        role: "admin",
        fullName,
        isActive: true
      });
      console.log(`Admin account '${username}' created successfully!`);
    }

    await mongoose.connection.close();
    console.log("Database connection closed.");
    process.exit(0);
  } catch (error) {
    console.error("Failed to seed admin user:", error);
    process.exit(1);
  }
}

seedAdmin();
