import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from '../config/database.js';
import User from '../models/User.js';

dotenv.config();

const run = async () => {
  try {
    await connectDB();
    const parent = await User.findOne({ email: 'parent1@shri.com' });
    if (parent) {
      parent.phone = '8174006441';
      await parent.save();
      console.log('✅ Updated parent1@shri.com phone to 8174006441');
    } else {
      console.log('❌ parent1@shri.com not found');
    }
  } catch (error) {
    console.error('Error updating parent phone:', error);
  } finally {
    await mongoose.disconnect();
  }
};

run();
