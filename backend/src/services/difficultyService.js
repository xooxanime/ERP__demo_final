import Result from '../models/Result.js';
import Assessment from '../models/AIAssessment.js';

/**
 * Determines the difficulty, next attempt number, and weak topics for a student's next assessment
 * @param {string} studentId 
 * @param {string} assessmentType
 * @returns {Promise<{nextDifficulty: string, attemptNumber: number, weakTopics: string[]}>}
 */
export async function getNextAssessmentDetails(studentId, assessmentType) {
  // If DSA, only look at DSA results. Otherwise, look at General results.
  const isDSA = assessmentType === 'DSA';
  
  const results = await Result.find({ studentId }).sort({}).exec();
  const filteredResults = isDSA 
    ? results.filter(r => r.type === 'DSA')
    : results.filter(r => r.type !== 'DSA');

  // Sort newest first
  filteredResults.sort((a, b) => new Date(b.date) - new Date(a.date));
  const latestResult = filteredResults[0];

  let nextDifficulty = 'Easy'; // Default start level for DSA is Easy
  let weakTopics = [];

  if (latestResult) {
    const score = latestResult.score;

    if (isDSA) {
      // DSA Adaptive Logic
      // Score >= 80% Next level = increase difficulty
      // Score 50-80% Next level = same difficulty
      // Score <50% Next level = easier difficulty
      const prevDifficulty = latestResult.difficulty || 'Easy'; 
    }
  }

  // To properly implement DSA adaptive, we need the difficulty of the latest assessment
  if (latestResult && isDSA) {
    const score = latestResult.score;
    const latestAssessment = await Assessment.findById(latestResult.assessmentId);
    const prevDiff = latestAssessment ? latestAssessment.difficulty : 'Easy';
    
    if (score >= 80) {
      if (prevDiff === 'Easy') nextDifficulty = 'Medium';
      else if (prevDiff === 'Medium') nextDifficulty = 'Hard';
      else nextDifficulty = 'Hard';
    } else if (score >= 50 && score < 80) {
      nextDifficulty = prevDiff;
    } else {
      if (prevDiff === 'Hard') nextDifficulty = 'Medium';
      else if (prevDiff === 'Medium') nextDifficulty = 'Easy';
      else nextDifficulty = 'Easy';
    }
    
    weakTopics = latestResult.weakTopics || [];
  } else if (latestResult && !isDSA) {
    const score = latestResult.score;
    if (score < 50) nextDifficulty = 'Easy';
    else if (score >= 50 && score <= 80) nextDifficulty = 'Medium';
    else nextDifficulty = 'Hard';
    
    weakTopics = latestResult.weakTopics || [];
  } else {
    // If no previous results, default for Non-DSA is Medium, default for DSA is Easy
    nextDifficulty = isDSA ? 'Easy' : 'Medium';
  }

  // Calculate the next attempt number for this specific topic type
  const attemptNumber = filteredResults.length + 1;

  return {
    nextDifficulty,
    attemptNumber,
    weakTopics
  };
}
