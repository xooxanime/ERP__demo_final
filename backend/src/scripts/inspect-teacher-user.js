import mongoose from 'mongoose';
import dotenv from 'dotenv';
import dns from 'dns';
import User from '../models/User.js';
import Course from '../models/Course.js';

dns.setServers(['8.8.8.8', '1.1.1.1']);
dotenv.config();

const inspectTeacher = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB.');

    const teacher = await User.findOne({ email: 'teacher@shri.com' });
    console.log('--- Teacher Document ---');
    console.log(JSON.stringify(teacher, null, 2));

    const courses = await Course.find();
    console.log('--- All Courses in DB ---');
    console.log(JSON.stringify(courses, null, 2));

    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
};

inspectTeacher();
