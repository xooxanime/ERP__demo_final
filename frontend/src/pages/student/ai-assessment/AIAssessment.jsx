import React, { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import Assessment from './components/Assessment';
import Result from './components/Result';
import { useAuth } from '../../../context/AuthContext';
import { aiAssessmentAPI } from '../../../services/api';
import './ai-assessment.css'; // We will create this or use global css

export default function AIAssessment() {
  const { user } = useAuth(); // Getting ERP user
  const [currentPage, setCurrentPage] = useState('dashboard');
  
  // We mock the student structure based on ERP user to fit the AI components
  const [student, setStudent] = useState(null);
  const [history, setHistory] = useState([]);
  const [activeAssessment, setActiveAssessment] = useState(null);
  const [activeResult, setActiveResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // DSA Language Selection State
  const [showLangModal, setShowLangModal] = useState(false);
  const [pendingTopic, setPendingTopic] = useState(null);
  
  // Assessment Type State
  const [selectedAssessmentType, setSelectedAssessmentType] = useState(null);

  useEffect(() => {
    if (user) {
      const userId = user.id || user._id;
      // Forcefully assign C++ as the active course for this module
      let assignedCourse = 'C++';
      localStorage.setItem('mockCourse', assignedCourse);
      
      setStudent({
        _id: userId,
        name: user.name,
        email: user.email,
        course: assignedCourse,
        level: 'Intermediate', // Default or fetched level
        xp: 1250 // Default or fetched xp
      });
      fetchHistory(userId);
    }
  }, [user]);

  const fetchHistory = async (studentId) => {
    if (!studentId) return;
    try {
      const historyRes = await aiAssessmentAPI.getHistory(studentId);
      setHistory(historyRes.data);
    } catch (err) {
      console.error('Error fetching history:', err);
    }
  };

  const handleStartAssessment = async (assessmentParams, language = null) => {
    // Parse parameters to lock into the specified course
    const isCustomCourse = typeof assessmentParams === 'object' && assessmentParams.courseName;
    const courseName = isCustomCourse ? assessmentParams.courseName : null;
    const topic = typeof assessmentParams === 'object' ? (assessmentParams.topic || assessmentParams.courseName) : assessmentParams;
    const difficulty = typeof assessmentParams === 'object' ? assessmentParams.difficulty : undefined;
    const numQuestions = typeof assessmentParams === 'object' ? assessmentParams.numQuestions : undefined;
    const questionTypes = typeof assessmentParams === 'object' ? assessmentParams.questionTypes : undefined;
    const timeLimit = typeof assessmentParams === 'object' ? assessmentParams.timeLimit : undefined;
    const type = 'General';

    setSelectedAssessmentType(type);
    
    if (!student) return;
    setIsLoading(true);
    setActiveAssessment(null); // Clear old assessment state
    
    try {
      const payload = {
        studentId: student._id,
        topic,
        language,
        assessmentType: type,
        difficulty,
        numQuestions,
        questionTypes,
        timeLimit
      };
      if (courseName) {
        payload.courseName = courseName;
      }

      const res = await aiAssessmentAPI.generateAssessment(payload);
      
      const generatedData = res.data;
      // Backend now sends correct type, but we ensure frontend state is correct too
      if (type === 'DSA') {
        generatedData.type = 'DSA';
        generatedData.language = language;
      } else {
        generatedData.type = 'Aptitude';
      }
      
      setActiveAssessment(generatedData);
      setCurrentPage('assessment');
    } catch (err) {
      console.error(err);
      alert('API Error: ' + (err.response?.data?.error || 'Failed to reach the backend to generate assessment.'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleLanguageSelect = (lang) => {
    handleStartAssessment(pendingTopic, lang);
  };

  const handleSubmitAnswers = async (answers, timeTaken = "00:00") => {
    if (!student || !activeAssessment) return;
    try {
      const res = await aiAssessmentAPI.submitAssessment({
        studentId: student._id,
        assessmentId: activeAssessment.assessmentId,
        answers
      });
      const resultData = res.data;
      resultData.timeTaken = timeTaken;
      setActiveResult(resultData);
      setCurrentPage('result');
      await fetchHistory(student._id);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="ai-assessment-container">
      {currentPage === 'dashboard' && (
        <Dashboard 
          student={student} 
          history={history} 
          onStartAssessment={handleStartAssessment}
          isLoading={isLoading}
        />
      )}
      
      {currentPage === 'assessment' && activeAssessment && (
        <Assessment 
          assessment={activeAssessment}
          onSubmit={handleSubmitAnswers}
          onBack={() => setCurrentPage('dashboard')}
        />
      )}
      
      {currentPage === 'result' && activeResult && (
        <Result 
          result={activeResult}
          onBack={() => setCurrentPage('dashboard')}
          onNext={() => handleStartAssessment({ courseName: student?.course || 'General Programming' })}
        />
      )}
    </div>
  );
}
