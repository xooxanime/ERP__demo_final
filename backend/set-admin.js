import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from './src/models/User.js';

dotenv.config();

/**
 * Utility script to set or update admin credentials.
 * Usage: node set-admin.js <email> <password>
 */

async function setAdmin() {
  const email = process.argv[2];
  const password = process.argv[3];

  if (!email || !password) {
    console.error('Usage: node set-admin.js <email> <password>');
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const hashedPassword = await bcrypt.hash(password, 10);

    const admin = await User.findOneAndUpdate(
      { role: 'admin' }, // Update the first admin found, or create one if none exists
      {
        email,
        password: hashedPassword,
        name: 'Admin',
        role: 'admin',
        isActive: true
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    console.log(`\n✅ Admin credentials updated successfully!`);
    console.log(`Email: ${admin.email}`);
    console.log(`Password: ${password} (stored securely as hash)`);

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating admin credentials:', error.message);
    process.exit(1);
  }
}

setAdmin();
