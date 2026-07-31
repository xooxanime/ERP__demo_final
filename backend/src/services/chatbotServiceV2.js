import Course from '../models/Course.js';
import OpenAI from 'openai';
import mammoth from 'mammoth';
import * as xlsx from 'xlsx';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');
import dotenv from 'dotenv';
dotenv.config();

function firstName(context) {
  return context.profile?.name?.split(' ')[0] || 'there';
}

export function buildGreeting(context) {
  return `Hi ${firstName(context)}! I'm your hybrid AI assistant. How can I help you today?`;
}

export function buildScopeResponse(role = 'student') {
  return 'I can help you with your ERP information, answer general knowledge questions, write code, and even analyze uploaded files or images!';
}

export function buildFallbackResponse() {
  return "I'm here to help with anything you need!";
}

async function extractTextFromFile(file) {
  const mime = file.mimetype;
  try {
    if (mime === 'application/pdf') {
      if (typeof pdfParse === 'function') {
        const result = await pdfParse(file.buffer);
        return result.text || '';
      } else if (pdfParse && typeof pdfParse.PDFParse === 'function') {
        const parser = new pdfParse.PDFParse({ data: file.buffer });
        const result = await parser.getText();
        return result.text || '';
      } else if (pdfParse && typeof pdfParse.default === 'function') {
        const result = await pdfParse.default(file.buffer);
        return result.text || '';
      } else if (pdfParse && pdfParse.default && typeof pdfParse.default.PDFParse === 'function') {
        const parser = new pdfParse.default.PDFParse({ data: file.buffer });
        const result = await parser.getText();
        return result.text || '';
      } else {
        throw new Error('Unsupported pdf-parse library structure');
      }
    }
    if (mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || mime === 'application/msword') {
      const result = await mammoth.extractRawText({ buffer: file.buffer });
      return result.value;
    }
    if (mime === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || mime === 'application/vnd.ms-excel' || mime === 'text/csv') {
      const workbook = xlsx.read(file.buffer, { type: 'buffer' });
      let text = '';
      workbook.SheetNames.forEach(sheetName => {
        text += `\n--- Sheet: ${sheetName} ---\n`;
        text += xlsx.utils.sheet_to_csv(workbook.Sheets[sheetName]);
      });
      return text;
    }
    if (mime === 'text/plain') {
      return file.buffer.toString('utf-8');
    }
  } catch (error) {
    console.error("Error extracting text from file:", error);
  }
  return null;
}

function fileToOpenAIImage(file) {
  return {
    type: "image_url",
    image_url: {
      url: `data:${file.mimetype};base64,${file.buffer.toString("base64")}`
    }
  };
}

async function detectIntent(message, hasFiles) {
  if (hasFiles) return 'FILE';

  const apiKey = process.env.OPENROUTER_API_KEY || '';
  if (!apiKey) return 'GENERAL';

  try {
    const client = new OpenAI({ apiKey, baseURL: 'https://openrouter.ai/api/v1' });
    
    const prompt = `You are an intent classifier.
Categorize the following query into exactly one of these intents:
- ERP: Queries about attendance, timetable, fees, courses, faculty, students, assignments, results, reports, notices, library.
- GENERAL: General knowledge, coding, math, translation, casual chat, etc.
- FILE: Queries explicitly asking to summarize or extract text from a file.

Query: "${message}"

Reply with ONLY the word ERP, GENERAL, or FILE.`;

    const response = await client.chat.completions.create({
      model: 'google/gemini-2.5-flash',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0,
      max_tokens: 10
    });
    
    const responseText = response.choices[0].message.content.trim().toUpperCase();
    
    if (responseText.includes('ERP')) return 'ERP';
    if (responseText.includes('FILE')) return 'FILE';
    return 'GENERAL';
  } catch (error) {
    console.error("Intent Detection Error:", error);
    return 'GENERAL';
  }
}

export async function generateChatbotResponse(message, context, history = [], files = [], mode = null) {
  const normalizedMessage = message.trim();
  const hasFiles = files && files.length > 0;
  
  if (!normalizedMessage && !hasFiles) return buildGreeting(context);

  const apiKey = process.env.OPENROUTER_API_KEY || '';
  if (!apiKey) {
    return "API Key is missing.";
  }

  const client = new OpenAI({ apiKey, baseURL: 'https://openrouter.ai/api/v1' });
  let intent = mode ? (mode.toUpperCase() === 'ERP' ? 'ERP' : 'GENERAL') : await detectIntent(normalizedMessage, hasFiles);
  if (hasFiles) intent = 'FILE';
  console.log(`[Chatbot] Mode: ${mode || 'auto'} -> Final Intent: ${intent}`);

  try {
    let systemPrompt = "";
    const userMessageContent = [];
    let extractedTextContext = "";

    // Process files
    if (hasFiles) {
      for (const file of files) {
        const mime = file.mimetype;
        if (mime.startsWith('image/')) {
          userMessageContent.push(fileToOpenAIImage(file));
        } else {
          const text = await extractTextFromFile(file);
          if (text) {
            extractedTextContext += `\n\n--- Content of ${file.originalname} ---\n${text}\n--- End of ${file.originalname} ---`;
          }
        }
      }
    }

    if (intent === 'ERP') {
      const availableCourses = await Course.find({ 
        isPublished: true,
        category: { $nin: ['CA Foundation', 'CA Intermediate', 'CA Final'] }
      }).select('title category instructor level price');
      const availableStr = availableCourses.length > 0
        ? availableCourses.map(c => `- ${c.title} (${c.category}) by ${c.instructor}, Level: ${c.level}`).join('\n')
        : 'None available currently';

      let roleSpecificData = '';
      if (context.profile?.role === 'student') {
        const enrolledStr = (context.courses?.enrolled?.length > 0)
          ? context.courses.enrolled.map(c => `- ${c.title} (${c.progress}% complete)`).join('\n') 
          : 'None';
          
        roleSpecificData = `
Student Program: ${context.profile.program || 'N/A'}
Enrolled Courses:
${enrolledStr}

Comprehensive ERP Data (JSON format):
${JSON.stringify({
  attendance: context.attendance,
  pendingFees: context.payments?.filter(p => p.status === 'pending') || [],
  paidFees: context.payments?.filter(p => p.status === 'paid') || [],
  assignments: context.assignments,
  timetable: context.timetable,
  tests: context.tests,
  learningProgress: context.learningProgress,
  library: context.library,
  certificates: context.certificates,
  academicCalendar: context.academicCalendar,
  events: context.events
}, null, 2)}`;
      } else if (context.profile?.role === 'teacher') {
        const assignedCoursesStr = (context.assignedCourses?.length > 0)
          ? context.assignedCourses.map(c => `- ${c.title} (${c.category}) - ${c.studentsEnrolled} students enrolled`).join('\n')
          : 'None';
          
        roleSpecificData = `
Teacher Department: ${context.profile.department || 'N/A'}
Assigned Courses:
${assignedCoursesStr}

Comprehensive ERP Data:
${JSON.stringify({ assignedStudents: context.assignedStudents, schedule: context.schedule }, null, 2)}`;
      } else if (context.profile?.role === 'parent') {
        roleSpecificData = `
Parent Name: ${context.profile.name}
Child Name: ${context.profile.childName}
Child Program: ${context.profile.childProgram}

Comprehensive Child ERP Data (JSON format):
${JSON.stringify({
  attendance: context.childData?.attendance,
  pendingFees: context.childData?.payments?.filter(p => p.status === 'pending') || [],
  paidFees: context.childData?.payments?.filter(p => p.status === 'paid') || [],
  assignments: context.childData?.assignments,
  timetable: context.childData?.timetable,
  tests: context.childData?.tests,
}, null, 2)}`;
      } else {
        roleSpecificData = `Comprehensive ERP Data: ${JSON.stringify({ platformStats: context.platformStats }, null, 2)}`;
      }

      systemPrompt = `You are an intelligent academic and ERP assistant at SHRI Educational World.
User Profile: ${context.profile?.name} (${context.profile?.role?.toUpperCase()})

Available Courses:
${availableStr}

Role-Specific ERP Data:
${roleSpecificData}

Instructions:
1. Answer the user's query accurately using ONLY the provided ERP data.
2. Be specific, dynamic, and helpful. Use markdown.
3. If the user asks something not in the data, politely inform them.`;

    } else if (intent === 'GENERAL') {
      systemPrompt = `You are a highly capable, friendly, and professional general AI assistant.
Answer the user's query intelligently, accurately, and fully.
Use markdown for formatting, including code blocks, bullet points, and tables where appropriate.`;
    } else if (intent === 'FILE') {
      systemPrompt = `You are a highly capable AI assistant with file and image analysis capabilities.
Analyze the provided files and answer the user's question.
If they ask for a summary, extraction, or comparison, do it accurately based on the file contents. Use markdown formatting.`;
    }

    if (extractedTextContext) {
      systemPrompt += `\n\nUser provided the following file contents for analysis:${extractedTextContext}`;
    }

    const formattedHistory = history.map(h => ({
      role: h.role === 'user' ? 'user' : 'assistant',
      content: h.content
    }));

    // Add textual user prompt
    if (normalizedMessage) {
      userMessageContent.push({ type: "text", text: normalizedMessage });
    } else {
      userMessageContent.push({ type: "text", text: "Please analyze the attached files." });
    }

    const response = await client.chat.completions.create({
      model: 'google/gemini-2.5-flash',
      messages: [
        { role: 'system', content: systemPrompt },
        ...formattedHistory,
        { role: 'user', content: userMessageContent }
      ],
      temperature: 0.7,
      max_tokens: 1500
    });

    if (response.choices && response.choices[0] && response.choices[0].message) {
      return response.choices[0].message.content;
    }

  } catch (error) {
    console.error("OpenRouter API Error:", error);
    const status = error.status || error.statusCode || (error.response && error.response.status);
    const errMsg = (error.message || '').toLowerCase();
    
    if (status === 402 || errMsg.includes('402') || errMsg.includes('payment required') || errMsg.includes('credit') || errMsg.includes('insufficient balance')) {
      return "The AI assistant's monthly usage quota or credits have been reached. Please contact your system administrator to top up the OpenRouter credits.";
    }
    if (status === 429 || errMsg.includes('429') || errMsg.includes('rate limit') || errMsg.includes('too many requests')) {
      return "The AI assistant is currently receiving too many requests. Please wait a moment and try again.";
    }
    
    return `[System Message] The AI model encountered an error: ${error.message}`;
  }
}
