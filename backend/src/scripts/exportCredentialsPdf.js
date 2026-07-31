import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';
import dns from 'dns';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import PDFDocument from 'pdfkit';

// Set DNS servers to avoid Atlas SRV resolution issue
dns.setServers(['8.8.8.8', '1.1.1.1']);

// Resolve paths for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from backend/.env
const envPath = path.resolve(__dirname, '../../.env');
dotenv.config({ path: envPath });

// Load models
import User from '../models/User.js';
import Course from '../models/Course.js';

// Setup database connection
const MONGODB_URI = process.env.MONGODB_URI;

// Path to testing data CSV
const csvPath = path.resolve(__dirname, '../../../testing-data/credentials.csv');

// Helper to parse CSV manually without external packages
function parseCSV(csvText) {
  const lines = csvText.split(/\r?\n/);
  const result = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const row = [];
    let inQuotes = false;
    let currentField = '';
    
    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        row.push(currentField.trim());
        currentField = '';
      } else {
        currentField += char;
      }
    }
    row.push(currentField.trim());
    result.push(row);
  }
  return result;
}

// Function to format role colors (for professional look)
function getRoleColor(role) {
  switch (role.toLowerCase()) {
    case 'admin': return '#991b1b'; // Red
    case 'teacher': return '#1e3a8a'; // Blue
    case 'student': return '#065f46'; // Green
    case 'parent': return '#854d0e'; // Yellow/Gold
    default: return '#1e293b'; // Slate
  }
}

async function run() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    if (!MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined in backend/.env file');
    }
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB!');

    // 1. Read and parse CSV credentials
    console.log('📝 Reading credentials CSV from:', csvPath);
    let csvCredentials = new Map();
    if (fs.existsSync(csvPath)) {
      const csvData = fs.readFileSync(csvPath, 'utf8');
      const csvRows = parseCSV(csvData);
      
      // Headers: Name,Role,Email,Password,Assigned Course(s),Relative Mapping
      // Skip header row
      for (let i = 1; i < csvRows.length; i++) {
        const row = csvRows[i];
        if (row.length >= 4) {
          const email = row[2].toLowerCase().trim();
          const password = row[3];
          const csvCourses = row[4];
          const csvMapping = row[5];
          csvCredentials.set(email, { password, csvCourses, csvMapping });
        }
      }
      console.log(`✅ Parsed ${csvCredentials.size} entries from CSV.`);
    } else {
      console.log('⚠️ Credentials CSV not found at default location. Will rely on DB and label all passwords as hashed.');
    }

    // 2. Fetch all users from DB
    console.log('👥 Fetching all users from database...');
    const dbUsers = await User.find({})
      .populate('enrolledCourses')
      .populate({
        path: 'teacherInfo.assignedCourses',
        model: 'Course'
      })
      .lean();

    console.log(`✅ Fetched ${dbUsers.length} users from database.`);

    // 3. Match and compile all user credentials
    const compiledUsers = [];
    
    // Create a lookup map for parents by studentId to resolve student-parent relationship in both directions
    const parentMap = new Map(); // studentId -> parent user
    dbUsers.forEach(u => {
      if (u.role === 'parent' && u.parentInfo && u.parentInfo.studentId) {
        parentMap.set(u.parentInfo.studentId.toString(), u);
      }
    });

    dbUsers.forEach(user => {
      const email = user.email.toLowerCase().trim();
      const csvInfo = csvCredentials.get(email) || {};

      // Determine password
      let password = csvInfo.password || '[Hashed in DB]';

      // Determine assigned courses
      let courses = 'N/A';
      if (user.role === 'student' && user.enrolledCourses && user.enrolledCourses.length > 0) {
        courses = user.enrolledCourses.map(c => c.title).join(', ');
      } else if (user.role === 'teacher' && user.teacherInfo && user.teacherInfo.assignedCourses && user.teacherInfo.assignedCourses.length > 0) {
        courses = user.teacherInfo.assignedCourses.map(c => c.title).join(', ');
      } else if (csvInfo.csvCourses && csvInfo.csvCourses !== 'N/A') {
        courses = csvInfo.csvCourses;
      }

      // Determine relative mapping
      let mapping = 'N/A';
      if (user.role === 'parent' && user.parentInfo) {
        mapping = `Student: ${user.parentInfo.studentName || 'Unknown'}`;
      } else if (user.role === 'student') {
        // Look up parent in DB
        const parent = parentMap.get(user._id.toString());
        if (parent) {
          mapping = `Parent: ${parent.name} (${parent.email})`;
        } else if (csvInfo.csvMapping && csvInfo.csvMapping !== 'N/A') {
          mapping = csvInfo.csvMapping;
        }
      } else if (csvInfo.csvMapping && csvInfo.csvMapping !== 'N/A') {
        mapping = csvInfo.csvMapping;
      }

      compiledUsers.push({
        name: user.name,
        role: user.role.toUpperCase(),
        email: user.email,
        phone: user.phone || 'N/A',
        password,
        courses,
        mapping
      });
    });

    // Also check if any CSV users are missing from DB and include them
    csvCredentials.forEach((csvVal, csvEmail) => {
      const alreadyIncluded = compiledUsers.some(u => u.email.toLowerCase() === csvEmail);
      if (!alreadyIncluded) {
        // Find user details from CSV row
        const csvRows = parseCSV(fs.readFileSync(csvPath, 'utf8'));
        const row = csvRows.find(r => r[2] && r[2].toLowerCase().trim() === csvEmail);
        if (row) {
          compiledUsers.push({
            name: row[0],
            role: row[1].toUpperCase(),
            email: row[2],
            phone: 'N/A',
            password: row[3],
            courses: row[4] || 'N/A',
            mapping: row[5] || 'N/A'
          });
        }
      }
    });

    // Sort by Role, then by Name
    compiledUsers.sort((a, b) => {
      if (a.role !== b.role) return a.role.localeCompare(b.role);
      return a.name.localeCompare(b.name);
    });

    // 4. Generate the PDF
    const downloadsFolder = path.join(os.homedir(), 'Downloads');
    if (!fs.existsSync(downloadsFolder)) {
      fs.mkdirSync(downloadsFolder, { recursive: true });
    }
    const pdfPath = path.join(downloadsFolder, 'ERP_User_Credentials.pdf');
    console.log(`📄 Generating PDF and saving to: ${pdfPath}`);

    const doc = new PDFDocument({
      size: 'A4',
      layout: 'landscape',
      margins: { top: 30, bottom: 40, left: 30, right: 30 },
      bufferPages: true
    });

    const writeStream = fs.createWriteStream(pdfPath);
    doc.pipe(writeStream);

    // Setup column configurations
    // Available width = 841.89 (A4 landscape width) - 60 (margins) = 781.89pt
    const startX = 30;
    const columns = [
      { header: 'Name', width: 115 },
      { header: 'Role', width: 55 },
      { header: 'Email', width: 165 },
      { header: 'Password', width: 95 },
      { header: 'Assigned Course(s)', width: 175 },
      { header: 'Relative Mapping', width: 175 }
    ];
    const totalTableWidth = columns.reduce((sum, col) => sum + col.width, 0); // 780pt

    // Draw header on a page
    function drawPageHeader(pageIndex, totalRecords) {
      // Draw professional header band
      doc.fillColor('#1e293b') // dark slate blue
         .rect(30, 25, totalTableWidth, 40)
         .fill();

      // Title
      doc.fillColor('#ffffff')
         .font('Helvetica-Bold')
         .fontSize(14)
         .text('ERP SYSTEM - USER CREDENTIALS DIRECTORY', 45, 33);

      doc.fillColor('#cbd5e1')
         .font('Helvetica')
         .fontSize(8)
         .text(`Total Records: ${totalRecords}  |  Generated on: ${new Date().toLocaleString()}`, 45, 49);

      // Institution / Platform Label on Right
      doc.fillColor('#ffffff')
         .font('Helvetica-Bold')
         .fontSize(10)
         .text('CA E-LEARNING ERP', startX + totalTableWidth - 165, 36, { width: 150, align: 'right' });
    }

    // Draw table header row
    function drawTableHeaderRow(y) {
      doc.fillColor('#0f172a') // darker navy/slate
         .rect(startX, y, totalTableWidth, 22)
         .fill();

      let currentX = startX;
      columns.forEach(col => {
        doc.fillColor('#ffffff')
           .font('Helvetica-Bold')
           .fontSize(9)
           .text(col.header, currentX + 6, y + 7, { width: col.width - 12, align: 'left' });
        currentX += col.width;
      });

      // Bottom line of header
      doc.strokeColor('#0f172a')
         .lineWidth(1)
         .moveTo(startX, y + 22)
         .lineTo(startX + totalTableWidth, y + 22)
         .stroke();
    }

    // Draw page header and table header for page 1
    drawPageHeader(1, compiledUsers.length);
    let y = 75;
    drawTableHeaderRow(y);
    y += 22;

    let isEvenRow = false;

    for (let i = 0; i < compiledUsers.length; i++) {
      const user = compiledUsers[i];

      // Calculate row height based on text wrapping
      let rowHeight = 20; // default minimum height
      const cellTexts = [
        user.name,
        user.role,
        user.email,
        user.password,
        user.courses,
        user.mapping
      ];

      columns.forEach((col, idx) => {
        const text = cellTexts[idx];
        const height = doc.heightOfString(text, { width: col.width - 12 }) + 10; // plus padding
        if (height > rowHeight) {
          rowHeight = height;
        }
      });

      // Check if we need to wrap to a new page
      // Height boundary is 530 (leaving room for footer at bottom)
      if (y + rowHeight > 530) {
        doc.addPage();
        drawPageHeader(doc.bufferedPageRange().count, compiledUsers.length);
        y = 75;
        drawTableHeaderRow(y);
        y += 22;
      }

      // Draw Row Background
      const rowColor = isEvenRow ? '#f8fafc' : '#ffffff';
      doc.fillColor(rowColor)
         .rect(startX, y, totalTableWidth, rowHeight)
         .fill();

      // Draw Cell Contents
      let currentX = startX;
      columns.forEach((col, idx) => {
        const text = cellTexts[idx];
        
        doc.font('Helvetica').fontSize(8.5);

        // Customize styles based on column
        if (idx === 1) { // Role column
          doc.fillColor(getRoleColor(text))
             .font('Helvetica-Bold');
        } else if (idx === 3) { // Password column
          if (text === '[Hashed in DB]') {
            doc.fillColor('#94a3b8').font('Helvetica-Oblique'); // muted grey italic
          } else {
            doc.fillColor('#0f172a').font('Helvetica-Bold'); // stand out
          }
        } else {
          doc.fillColor('#334155'); // neutral dark
        }

        doc.text(text, currentX + 6, y + 6, { width: col.width - 12, align: 'left' });
        currentX += col.width;
      });

      // Draw Bottom Border
      doc.strokeColor('#e2e8f0')
         .lineWidth(0.5)
         .moveTo(startX, y + rowHeight)
         .lineTo(startX + totalTableWidth, y + rowHeight)
         .stroke();

      y += rowHeight;
      isEvenRow = !isEvenRow;
    }

    // Draw headers, footers on all pages
    const range = doc.bufferedPageRange();
    for (let i = 0; i < range.count; i++) {
      doc.switchToPage(i);
      
      // Draw Footer
      doc.strokeColor('#cbd5e1')
         .lineWidth(0.5)
         .moveTo(startX, 560)
         .lineTo(startX + totalTableWidth, 560)
         .stroke();

      doc.fillColor('#64748b')
         .font('Helvetica')
         .fontSize(8)
         .text('CONFIDENTIAL - ERP INTERNAL ADMINISTRATOR DIRECTORY', startX, 568, { align: 'left', width: 300 });

      doc.text(`Page ${i + 1} of ${range.count}`, startX + totalTableWidth - 100, 568, { align: 'right', width: 100 });
    }

    doc.end();

    writeStream.on('finish', () => {
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`🎉 SUCCESS: Generated credentials PDF!`);
      console.log(`📍 Location: ${pdfPath}`);
      console.log(`📊 Statistics:`);
      console.log(`   - Total Users Exported: ${compiledUsers.length}`);
      console.log(`   - Plaintext passwords found: ${compiledUsers.filter(u => u.password !== '[Hashed in DB]').length}`);
      console.log(`   - Hashed passwords marked: ${compiledUsers.filter(u => u.password === '[Hashed in DB]').length}`);
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      process.exit(0);
    });

  } catch (error) {
    console.error('❌ Error during execution:', error);
    process.exit(1);
  }
}

run();
