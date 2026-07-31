import mongoose from 'mongoose';
import dotenv from 'dotenv';
import dns from 'dns';
import Course from '../models/Course.js';
import Batch from '../models/Batch.js';
import User from '../models/User.js';
import Enrollment from '../models/Enrollment.js';
import StudyMaterial from '../models/StudyMaterial.js';
import Assignment from '../models/Assignment.js';
import Quiz from '../models/Quiz.js';
import Attendance from '../models/Attendance.js';

dns.setServers(['8.8.8.8', '1.1.1.1']);
dotenv.config();

const run = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to MongoDB.");
  
  const courses = await Course.find();
  console.log("\n--- COURSES ---");
  for (const c of courses) {
    console.log(`Title: ${c.title}, ID: ${c._id}, Batch field: ${c.batch}`);
  }

  const batches = await Batch.find();
  console.log("\n--- BATCHES ---");
  for (const b of batches) {
    console.log(`Name: ${b.name}, ID: ${b._id}, Courses: ${b.courses}`);
  }

  const enrollments = await Enrollment.find().populate('studentId', 'email');
  console.log("\n--- ENROLLMENTS ---");
  for (const e of enrollments.slice(0, 5)) {
    console.log(`Student: ${e.studentId?.email}, Course: ${e.courseId}, Status: ${e.status}`);
  }

  console.log("\n--- OTHER COLLECTIONS ---");
  console.log(`Study Materials count: ${await StudyMaterial.countDocuments()}`);
  console.log(`Assignments count: ${await Assignment.countDocuments()}`);
  console.log(`Quizzes count: ${await Quiz.countDocuments()}`);
  console.log(`Attendance count: ${await Attendance.countDocuments()}`);

  const sampleSM = await StudyMaterial.findOne();
  if (sampleSM) console.log("Sample Study Material:", { title: sampleSM.title, course: sampleSM.course, batchId: sampleSM.batchId });

  const sampleAss = await Assignment.findOne();
  if (sampleAss) console.log("Sample Assignment:", { title: sampleAss.title, courseId: sampleAss.courseId, batchId: sampleAss.batchId });

  const sampleQuiz = await Quiz.findOne();
  if (sampleQuiz) console.log("Sample Quiz:", { title: sampleQuiz.title, courseId: sampleQuiz.courseId, batchId: sampleQuiz.batchId });

  const sampleAtt = await Attendance.findOne();
  if (sampleAtt) console.log("Sample Attendance:", { studentId: sampleAtt.studentId, courseId: sampleAtt.courseId, batchId: sampleAtt.batchId, status: sampleAtt.status });

  mongoose.disconnect();
};

run();
