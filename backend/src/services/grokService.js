import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.OPENROUTER_API_KEY || '';
const modelName = 'google/gemini-2.5-flash';
const baseURL = 'https://openrouter.ai/api/v1';

let client = null;
const isApiKeyConfigured = apiKey && apiKey.trim() !== '';

if (isApiKeyConfigured) {
  client = new OpenAI({
    apiKey: apiKey,
    baseURL: baseURL,
  });
} else {
  console.warn('WARNING: OPENROUTER_API_KEY is not set or using placeholder. Running in mock mode.');
}

/**
 * Parses JSON response from LLM, removing markdown code blocks if present.
 */
function cleanAndParseJSON(text) {
  let cleanText = text.trim();
  // Remove markdown code blocks if the model wrapped the JSON
  if (cleanText.startsWith('```')) {
    cleanText = cleanText.replace(/^```json\s*/i, '');
    cleanText = cleanText.replace(/^```\s*/i, '');
    cleanText = cleanText.replace(/\s*```$/, '');
  }
  return JSON.parse(cleanText.trim());
}

/**
 * Generates a mock assessment for fallback testing.
 */
function generateMockAssessment(topic, difficulty, weakTopics, language = null, assessmentType = 'General') {
  console.log(`Generating topic-specific assessment for: ${topic}, difficulty: ${difficulty}`);
  const cleanTopic = topic || 'General Programming';
  
  if (assessmentType === 'DSA' || cleanTopic.toLowerCase().includes('dsa') || cleanTopic.toLowerCase().includes('algorithm')) {
    return {
      questions: [
        {
          type: "coding",
          title: `Algorithmic Optimization in ${cleanTopic}`,
          difficulty: difficulty,
          language: language || "Python",
          problemStatement: `Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.\nYou may assume that each input would have exactly one solution.`,
          examples: ["Input: nums = [2,7,11,15], target = 9\nOutput: [0,1]"],
          constraints: "2 <= nums.length <= 10^4",
          functionSignature: language === 'Python' ? "def twoSum(nums, target):" : "function twoSum(nums, target) {"
        }
      ]
    };
  }

  const topicQuestions = [
    {
      question: `What is a core fundamental principle of ${cleanTopic}?`,
      options: [
        `Modular design and robust abstraction in ${cleanTopic}`,
        `Manual un-scoped global variable state`,
        `Unconditional hardware register shifting`,
        `Skipping error boundaries and validation`
      ],
      answer: `Modular design and robust abstraction in ${cleanTopic}`,
      topic: cleanTopic,
      difficulty: difficulty,
      type: "MCQ"
    },
    {
      question: `Which of the following represents an industry best practice when developing with ${cleanTopic}?`,
      options: [
        `Ignoring edge-case error handling`,
        `Writing clean, maintainable, and structured code`,
        `Hardcoding environment configuration values`,
        `Bypassing automated security checks`
      ],
      answer: `Writing clean, maintainable, and structured code`,
      topic: cleanTopic,
      difficulty: difficulty,
      type: "MCQ"
    },
    {
      question: `How does system architecture benefit from implementing ${cleanTopic} correctly?`,
      options: [
        `By minimizing resource overhead and maximizing throughput`,
        `By creating memory leaks and CPU spikes`,
        `By forcing infinite synchronous blocking loops`,
        `By disabling error logging entirely`
      ],
      answer: `By minimizing resource overhead and maximizing throughput`,
      topic: cleanTopic,
      difficulty: difficulty,
      type: "MCQ"
    },
    {
      question: `Which methodology is recommended for managing data flow in ${cleanTopic}?`,
      options: [
        `Structured, type-checked data structures`,
        `Random untyped string mutation`,
        `Direct disk sector manipulation`,
        `Unencrypted global state mutation`
      ],
      answer: `Structured, type-checked data structures`,
      topic: cleanTopic,
      difficulty: difficulty,
      type: "MCQ"
    },
    {
      question: `What is the primary goal of applying ${cleanTopic} in modern software engineering?`,
      options: [
        `Solving complex domain problems with high efficiency and reliability`,
        `Increasing system latency unnecessarily`,
        `Deprecating legacy browser support`,
        `Bypassing standard authentication protocols`
      ],
      answer: `Solving complex domain problems with high efficiency and reliability`,
      topic: cleanTopic,
      difficulty: difficulty,
      type: "MCQ"
    }
  ];

  return { questions: topicQuestions };
}

/**
 * Evaluates a mock assessment response locally without Grok.
 */
function evaluateMockAssessment(questions, studentAnswers) {
  let correctAnswers = 0;
  let wrongAnswers = 0;
  const weakTopicsSet = new Set();
  const strongTopicsSet = new Set();

  questions.forEach((q, idx) => {
    const studentAns = studentAnswers[idx] || '';
    const actualAnswer = q.correctAnswer || q.answer || '';
    const isCorrect = q.type === 'MCQ' || q.options
      ? studentAns.trim().toLowerCase() === actualAnswer.trim().toLowerCase()
      : studentAns.includes('function') && (studentAns.includes('return') || studentAns.includes('.reverse') || studentAns.includes('Math.max') || studentAns.includes('twoSum'));

    const currentTopic = q.topic || "Data Structures and Algorithms";
    if (isCorrect) {
      correctAnswers++;
      strongTopicsSet.add(currentTopic);
    } else {
      wrongAnswers++;
      weakTopicsSet.add(currentTopic);
    }
  });

  const total = questions.length || 1;
  const score = Math.round((correctAnswers / total) * 100);

  const strongTopics = Array.from(strongTopicsSet);
  const weakTopics = Array.from(weakTopicsSet).filter(t => !strongTopics.includes(t));
  
  // Basic improvement suggestions based on score and weak topics
  const suggestions = [];
  
  const isAptitude = questions.some(q => q.topic && (q.topic.includes("Aptitude") || q.topic.includes("Reasoning") || q.topic.includes("English")));
  
  if (isAptitude) {
    if (score < 50) {
      suggestions.push("Focus on building foundational knowledge in logic and math.");
      suggestions.push("Practice basic problem-solving techniques step by step.");
    } else if (score <= 80) {
      suggestions.push("Strengthen your time management and calculation speed.");
      suggestions.push("Try solving a wider variety of reasoning puzzles.");
    } else {
      suggestions.push("Excellent work! You have strong analytical skills.");
      suggestions.push("Focus on the most difficult level of quantitative and logical questions.");
    }
  } else {
    if (score < 50) {
      suggestions.push("Focus on programming basics, syntax, and core concepts.");
      suggestions.push("Review fundamental code structures like loops and standard variable scoping.");
    } else if (score <= 80) {
      suggestions.push("Strengthen data manipulation and intermediate built-in methods.");
      suggestions.push("Practice writing clean functions with standard boundary checks.");
    } else {
      suggestions.push("Excellent work! Explore advanced functional concepts and algorithmic problem solving.");
      suggestions.push("Try optimization problems and study time complexities.");
    }
  }

  if (weakTopics.length > 0) {
    suggestions.push(`Specifically spend time reviewing topics you found challenging: ${weakTopics.join(', ')}.`);
  }

  return {
    score,
    correctAnswers,
    wrongAnswers,
    weakTopics: weakTopics.length > 0 ? weakTopics : ['None'],
    strongTopics: strongTopics.length > 0 ? strongTopics : ['None'],
    suggestions
  };
}

export async function generateAIQuestions(courseName, difficulty, oldQuestions, scoreHistory, language = null, assessmentType = 'General', numQuestions = 10, questionTypes = ['MCQ', 'True/False', 'Short Answer', 'Fill in the Blanks']) {
  if (!isApiKeyConfigured) {
    return generateMockAssessment(courseName, difficulty, oldQuestions, language, assessmentType);
  }

  const oldQuestionsStr = oldQuestions && oldQuestions.length > 0 ? JSON.stringify(oldQuestions) : 'None';
  const scoreHistoryStr = scoreHistory && scoreHistory.length > 0 ? scoreHistory.join('\n') : 'No previous history';

  const randomGenerationSeed = Math.floor(Math.random() * 1000000);
  
  // Format the allowed types
  let allowedTypesStr = '';
  if (questionTypes.includes('MCQ')) allowedTypesStr += '\n- "MCQ": Multiple choice with exactly one correct answer. Must provide an "options" array of strings, and exactly one string as "correctAnswer" that exists in "options".';
  if (questionTypes.includes('True/False')) allowedTypesStr += '\n- "True/False": A boolean question. Must provide an "options" array exactly as ["True", "False"], and "correctAnswer" as either "True" or "False".';
  if (questionTypes.includes('Fill in the Blanks')) allowedTypesStr += '\n- "Fill in the Blanks": A sentence with a missing word or phrase denoted by ____. Provide the exact missing word as "correctAnswer".';
  if (questionTypes.includes('Short Answer')) allowedTypesStr += '\n- "Short Answer": A question requiring a 1-3 sentence explanation. Provide a sample model answer as "correctAnswer".';
  if (questionTypes.includes('Scenario Based')) allowedTypesStr += '\n- "Scenario Based": A real-world scenario requiring analysis. Provide a model analysis as "correctAnswer".';
  if (questionTypes.includes('Coding')) allowedTypesStr += '\n- "Coding": A programming problem statement. Provide the "language", a "functionSignature", and the full "correctAnswer" code block.';

  if (!allowedTypesStr) {
     allowedTypesStr = '\n- "MCQ": Multiple choice with exactly one correct option. Must provide an "options" array.';
  }

  const systemPrompt = `You are a strict AI assessment generator.
Your task is to generate EXACTLY ${numQuestions} questions for the topic: "${courseName}".
You must strictly match the difficulty level: "${difficulty}".

CRITICAL RULE 1 - QUESTION COUNT:
You MUST generate EXACTLY ${numQuestions} questions. Do not generate ${numQuestions - 1} or ${numQuestions + 1}. Exactly ${numQuestions}.

CRITICAL RULE 2 - QUESTION TYPES:
You are ONLY allowed to generate the following question types. DO NOT generate any other types.
Allowed types: ${allowedTypesStr}

For example, if only "MCQ" is allowed, every single question must be an MCQ. 
If multiple are allowed, distribute them evenly, but ONLY use the allowed types. 
Use the exact type strings provided above for the "type" field (e.g. "MCQ", "True/False", "Coding").

CRITICAL RULE 3 - TOPIC & DIFFICULTY:
The questions must strictly be about the topic: "${courseName}".
The questions must match the difficulty: "${difficulty}".
Do not generate generic questions. Generate highly specific and tailored questions.

CRITICAL RULE 4 - UNIQUENESS AND RANDOMIZATION (NO REPETITION):
This is attempt variant ${randomGenerationSeed}. You must generate a COMPLETELY NEW, UNIQUE, AND DIVERSE set of questions.
Randomize the subtopics covered, the question scenarios, and the wording.
You MUST NOT repeat ANY of the following previously asked questions for this student.

PREVIOUSLY ASKED QUESTIONS (DO NOT REPEAT THESE):
${oldQuestionsStr}

If you repeat a question from the list above, the assessment will be rejected. 
Ensure broader learning by exploring different concepts within "${courseName}".

JSON OUTPUT FORMAT:
You MUST return ONLY a valid JSON object. No markdown wrapping, no extra text.
{
 "course": "${courseName}",
 "questions": [
  {
   "type": "...", 
   "question": "...",
   "options": [...], // if applicable
   "correctAnswer": "...",
   "explanation": "...",
   "difficulty": "${difficulty}",
   "topic": "${courseName}"
  }
 ]
}`;

  const userPrompt = `Generate exactly ${numQuestions} questions now, using only the allowed question types. Return only the JSON object.`;

  try {
    // Dynamically load dotenv to catch key without server restart
    dotenv.config();
    const currentApiKey = process.env.OPENROUTER_API_KEY || '';
    if (!currentApiKey) {
      console.warn("No OPENROUTER_API_KEY found. Falling back to mock.");
      return generateMockAssessment(courseName, difficulty, oldQuestions, language, assessmentType);
    }
    
    // Create client dynamically to ensure it picks up the latest key
    const dynamicClient = new OpenAI({
      apiKey: currentApiKey,
      baseURL: 'https://openrouter.ai/api/v1',
    });

    let maxRetries = 3;
    let attempt = 0;
    
    while (attempt < maxRetries) {
      attempt++;
      try {
        const response = await dynamicClient.chat.completions.create({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ],
          temperature: 0.7,
          max_tokens: 2500
        });

        let content = response.choices[0].message.content;
        const assessmentData = cleanAndParseJSON(content);
        
        // Validation Logic
        if (!assessmentData.questions || !Array.isArray(assessmentData.questions)) {
          throw new Error("Invalid JSON structure returned.");
        }
        
        if (assessmentData.questions.length !== numQuestions) {
          throw new Error(`Expected ${numQuestions} questions, got ${assessmentData.questions.length}.`);
        }
        
        // Validate question types
        const invalidTypeFound = assessmentData.questions.find(q => !questionTypes.includes(q.type));
        if (invalidTypeFound) {
           throw new Error(`Model generated an invalid question type: ${invalidTypeFound.type}. Allowed types: ${questionTypes.join(', ')}`);
        }
        
        // Validate uniqueness against old questions
        if (oldQuestions && oldQuestions.length > 0) {
          const oldSet = oldQuestions.map(q => q.toLowerCase().trim());
          const duplicate = assessmentData.questions.find(q => oldSet.includes(q.question?.toLowerCase().trim()));
          if (duplicate) {
             throw new Error(`Model repeated a previous question: "${duplicate.question}". Must generate completely unique questions.`);
          }
        }
        
        // If it passes all validation, return it
        return assessmentData;

      } catch (validationError) {
        console.warn(`Validation failed on attempt ${attempt}: ${validationError.message}`);
        if (attempt >= maxRetries) {
           throw new Error(`Failed to generate valid assessment after ${maxRetries} attempts.`);
        }
      }
    }

  } catch (error) {
    console.error("OpenRouter API Error during question generation:", error);
    console.log("Falling back to local rule-based generation.");
    return generateMockAssessment(courseName, difficulty, oldQuestions, language, assessmentType);
  }
}

/**
 * Uses Grok API to grade student's answers (especially coding responses).
 * @param {Array} questions - original questions array
 * @param {Array} studentAnswers - array of student answers corresponding to each question index
 */
export async function evaluateStudentAnswers(questions, studentAnswers) {
  if (!isApiKeyConfigured) {
    return evaluateMockAssessment(questions, studentAnswers);
  }

  const promptInput = questions.map((q, idx) => {
    return {
      index: idx,
      type: q.type || "MCQ",
      question: q.question || q.problemStatement || q.title || "Coding Problem",
      expectedAnswer: q.correctAnswer || q.answer || "Verify if the code logically solves the problem statement.",
      studentAnswer: studentAnswers[idx] || "",
      topic: q.topic || "Data Structures and Algorithms"
    };
  });

  const systemPrompt = `You are an AI assessment grader. You grade a mix of questions: MCQ, True/False, Fill in the Blanks, Short Answer, Coding, and Scenario Based.
You are given a list of questions, their expected correct answers, and the student's submissions.

Grading Rules:
- MCQ & True/False: Check if the student's answer exactly matches the expected answer.
- Fill in the Blanks: Check if the semantic meaning or exact word matches. Minor typos are acceptable.
- Short Answer & Scenario Based: Grade semantically. If the student conveys the core concept or analysis correctly, mark it correct.
- Coding: Verify if the code logically solves the problem statement.

You MUST analyze the submissions and return a valid JSON object ONLY, with this exact structure:
{
  "score": 85, // Integer from 0 to 100 representing overall percentage
  "correctAnswers": 10, // Count of correct questions
  "wrongAnswers": 2, // Count of wrong questions
  "weakTopics": ["TopicA", "TopicB"],
  "strongTopics": ["TopicC", "TopicD"],
  "suggestions": [
     "Focus on improving problem-solving speed",
     "Review specific concepts based on the weak topics"
  ],
  "questionResults": [
    {
      "isCorrect": true,
      "expected": "CNN",
      "studentAnswer": "CNN",
      "explanation": "CNNs use convolutional layers..."
    },
    {
      "isCorrect": false,
      "expected": "Lists are mutable",
      "studentAnswer": "I don't know",
      "explanation": "Lists can be modified, tuples cannot."
    }
  ]
}

Ensure the "questionResults" array maps exactly 1-to-1 with the questions provided in the same order.
Do not include any extra commentary or markdown wrap outside the JSON.`;

  const userPrompt = `Grade the following student answers:
${JSON.stringify(promptInput, null, 2)}`;

  try {
    const response = await client.chat.completions.create({
      model: modelName,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.2,
      max_tokens: 1500,
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content;
    const evaluation = cleanAndParseJSON(content);
    
    // Ensure all required fields are present in evaluation
    const score = typeof evaluation.score === 'number' ? evaluation.score : 0;
    const correctAnswers = typeof evaluation.correctAnswers === 'number' ? evaluation.correctAnswers : 0;
    const wrongAnswers = typeof evaluation.wrongAnswers === 'number' ? evaluation.wrongAnswers : 0;
    const weakTopics = Array.isArray(evaluation.weakTopics) ? evaluation.weakTopics : [];
    const strongTopics = Array.isArray(evaluation.strongTopics) ? evaluation.strongTopics : [];
    const suggestions = Array.isArray(evaluation.suggestions) ? evaluation.suggestions : [];
    const questionResults = Array.isArray(evaluation.questionResults) ? evaluation.questionResults : [];

    return {
      score,
      correctAnswers,
      wrongAnswers,
      weakTopics,
      strongTopics,
      suggestions,
      questionResults
    };
  } catch (error) {
    console.error("OpenRouter API Error during evaluation:", error);
    console.log("Falling back to local rule-based evaluation.");
    return evaluateMockAssessment(questions, studentAnswers);
  }
}

/**
 * Extracts multiple choice questions (MCQs) from raw text.
 */
export async function extractQuizQuestionsFromText(text) {
  if (!isApiKeyConfigured) {
    console.warn('API Key not configured, throwing error to trigger text extraction fallback.');
    throw new Error('API Key not configured');
  }

  const systemPrompt = `You are an AI assistant designed to extract multiple-choice questions (MCQs) from raw text.
Analyze the input text and extract all multiple-choice questions you find.
For each question, you MUST determine:
1. The question text.
2. Exactly 4 options.
3. The index (0, 1, 2, or 3) of the correct option.
4. Point value for the question (default 1).

You MUST return a JSON object containing a "questions" array with this exact structure:
{
  "questions": [
    {
      "questionText": "What is the capital of France?",
      "options": ["London", "Berlin", "Paris", "Rome"],
      "correctOptionIndex": 2,
      "points": 1
    }
  ]
}

Only return the JSON object. Do not wrap it in anything else. Do not include markdown code block syntax around the JSON (no backticks).`;

  const userPrompt = `Extract multiple choice questions from this text:
${text}`;

  try {
    const response = await client.chat.completions.create({
      model: modelName,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.3,
      max_tokens: 3000,
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content;
    const result = cleanAndParseJSON(content);
    const rawQuestions = result.questions || [];
    
    const normalizedQuestions = rawQuestions.map(q => {
      const questionText = q.questionText || q.question || q.text || q.question_text || '';
      
      let options = q.options || q.choices || [];
      if (!Array.isArray(options)) {
        options = [];
      }
      options = options.map(opt => String(opt).trim());
      
      if (options.length < 4) {
        while (options.length < 4) {
          options.push(`Option ${options.length + 1}`);
        }
      } else if (options.length > 4) {
        options = options.slice(0, 4);
      }
      
      let correctOptionIndex = 0;
      if (q.correctOptionIndex !== undefined) {
        correctOptionIndex = parseInt(q.correctOptionIndex, 10);
      } else if (q.correctIndex !== undefined) {
        correctOptionIndex = parseInt(q.correctIndex, 10);
      } else if (q.answer !== undefined) {
        const idx = options.findIndex(opt => opt.toLowerCase() === String(q.answer).toLowerCase());
        if (idx !== -1) {
          correctOptionIndex = idx;
        } else {
          const parsed = parseInt(q.answer, 10);
          if (!isNaN(parsed) && parsed >= 0 && parsed < 4) {
            correctOptionIndex = parsed;
          }
        }
      }
      
      if (isNaN(correctOptionIndex) || correctOptionIndex < 0 || correctOptionIndex > 3) {
        correctOptionIndex = 0;
      }
      
      const points = typeof q.points === 'number' ? q.points : 1;
      
      return {
        questionText: String(questionText).trim(),
        options,
        correctOptionIndex,
        points
      };
    }).filter(q => q.questionText.length > 0);

    return normalizedQuestions;
  } catch (error) {
    console.error("OpenRouter API Error during question extraction:", error);
    throw error; // Throw error to trigger regex fallback
  }
}

function generateMockParsedQuestions() {
  return [
    {
      questionText: "Sample Question 1: What is the main purpose of double-entry bookkeeping?",
      options: [
        "To record transactions in two different currencies",
        "To ensure every debit has a corresponding credit",
        "To maintain separate copies of financial reports",
        "To report taxes to two separate authorities"
      ],
      correctOptionIndex: 1,
      points: 1
    },
    {
      questionText: "Sample Question 2: Which financial statement shows the financial position of a business at a specific date?",
      options: [
        "Income Statement",
        "Statement of Cash Flows",
        "Balance Sheet",
        "Statement of Retained Earnings"
      ],
      correctOptionIndex: 2,
      points: 1
    },
    {
      questionText: "Sample Question 3: Which asset class has the highest liquidity?",
      options: [
        "Inventory",
        "Accounts Receivable",
        "Cash and Cash Equivalents",
        "Prepaid Expenses"
      ],
      correctOptionIndex: 2,
      points: 1
    }
  ];
}

