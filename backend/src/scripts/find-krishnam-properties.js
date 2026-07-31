import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from '../config/database.js';

dotenv.config();

const findRawKrishnam = async () => {
  await connectDB();
  const db = mongoose.connection.db;
  const rawDoc = await db.collection('users').findOne({ name: 'krishnam' });
  console.log('Raw MongoDB Document fields:', Object.keys(rawDoc || {}));
  console.log('Raw MongoDB Document:', rawDoc);
  process.exit(0);
};

findRawKrishnam();
