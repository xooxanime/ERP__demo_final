import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/models/User.js';

dotenv.config();

async function promote() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const result = await User.findOneAndUpdate(
      { email: 'abhaypratapmishra5678@gmail.com' },
      { $set: { role: 'admin', isActive: true } },
      { new: true }
    );

    if (result) {
      console.log('✅ Promoted to admin:', result.email, result.name);
    } else {
      console.log('❌ User not found with that email. They need to register first.');
    }

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

promote();
