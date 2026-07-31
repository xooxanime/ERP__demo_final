import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from './src/models/User.js';

dotenv.config();

async function promoteAdmin() {
  const email = process.argv[2];
  const password = process.argv[3];

  if (!email || !password) {
    console.error('Usage: node promote-admin.js <email> <password>');
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Use updateOne to ensure we don't accidentally create duplicates if upsert logic is weird
    const result = await User.updateOne(
      { email: email.toLowerCase() },
      { 
        $set: {
          password: hashedPassword,
          role: 'admin',
          isActive: true
        },
        $setOnInsert: {
          name: 'Krishnam Admin',
          phone: '9999999999' // Dummy phone for validation
        }
      },
      { upsert: true }
    );

    if (result.upsertedCount > 0) {
      console.log(`\n✅ Created NEW admin user: ${email}`);
    } else {
      console.log(`\n✅ Promoted EXISTING user to admin: ${email}`);
    }
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

promoteAdmin();
