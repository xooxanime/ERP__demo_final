import React, { useState, useEffect } from 'react';
import { ArrowLeft, Clock, CheckCircle2, ChevronRight, Play } from 'lucide-react';

export default function Assessment({ assessment, onSubmit, isSubmitting, onBack }) {
  const progressKey = `assessmentProgress_${assessment.assessmentId}`;

  const getInitialState = () => {
    const saved = sessionStorage.getItem(progressKey);
    if (saved) {
      return JSON.parse(saved);
    }
    
    // Parse timeLimit (e.g., "10 Minutes", "No Limit")
    let parsedTime = 30 * 60; // default 30 mins
    if (assessment.timeLimit === "No Limit") {
      parsedTime = null;
    } else if (assessment.timeLimit) {
      const match = assessment.timeLimit.match(/(\d+)/);
      if (match) parsedTime = parseInt(match[1]) * 60;
    }
    
    return {
      currentIdx: 0,
      answers: {},
      timeLeft: parsedTime,
      isFinished: false,
      startTime: Date.now()
    };
  };

  const initialState = getInitialState();

  const [currentIdx, setCurrentIdx] = useState(initialState.currentIdx);
  const [answers, setAnswers] = useState(initialState.answers);
  const [timeLeft, setTimeLeft] = useState(initialState.timeLeft);
  const [isFinished, setIsFinished] = useState(initialState.isFinished);

  useEffect(() => {
    const progress = { currentIdx, answers, timeLeft, isFinished };
    sessionStorage.setItem(progressKey, JSON.stringify(progress));
  }, [currentIdx, answers, timeLeft, isFinished, progressKey]);

  const questions = assessment.questions || [];
  const currentQ = questions[currentIdx];
  const totalQ = questions.length;

  useEffect(() => {
    if (isFinished || timeLeft === null) return;
    const timerId = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerId);
          setIsFinished(true); // Auto-finish when time is up
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerId);
  }, [isFinished, timeLeft]);

  const formatTime = (seconds) => {
    if (seconds === null) return "No Limit";
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const calculateTimeTaken = () => {
    if (timeLeft === null) {
      const elapsed = Math.floor((Date.now() - (initialState.startTime || Date.now())) / 1000);
      return formatTime(elapsed);
    }
    
    let totalTime = 30 * 60;
    if (assessment.timeLimit && assessment.timeLimit !== "No Limit") {
       const match = assessment.timeLimit.match(/(\d+)/);
       if (match) totalTime = parseInt(match[1]) * 60;
    }
    return formatTime(totalTime - timeLeft);
  };
  
  const timeTakenStr = calculateTimeTaken();

  const handleSelectOption = (opt) => {
    setAnswers({ ...answers, [currentIdx]: opt });
  };

  const handleCodeChange = (e) => {
    setAnswers({ ...answers, [currentIdx]: e.target.value });
  };

  const handleNext = () => {
    if (currentIdx < totalQ - 1) {
      setCurrentIdx(currentIdx + 1);
    } else {
      setIsFinished(true);
    }
  };

  const handleFinalSubmit = () => {
    // Submit array of answers corresponding to questions array
    const answersArray = questions.map((_, i) => answers[i] || "");
    onSubmit(answersArray, timeTakenStr);
  };

  const [selectedLanguage, setSelectedLanguage] = useState(assessment.language || 'Python');
  const languages = ['C++', 'Java', 'Python', 'JavaScript'];

  const getBoilerplate = (lang) => {
    switch(lang) {
      case 'Python': return 'def solution():\n    pass';
      case 'JavaScript': return 'function solution() {\n  \n}';
      case 'Java': return 'class Solution {\n    public void solve() {\n        \n    }\n}';
      case 'C++': return 'class Solution {\npublic:\n    void solve() {\n        \n    }\n};';
      default: return '';
    }
  };

  const handleLanguageChange = (e) => {
    const lang = e.target.value;
    setSelectedLanguage(lang);
    
    const currentCode = answers[currentIdx] || currentQ?.functionSignature || '';
    const isPristine = currentCode === currentQ?.functionSignature || currentCode === getBoilerplate(selectedLanguage) || currentCode.trim() === '';
    
    if (isPristine) {
      setAnswers({ ...answers, [currentIdx]: getBoilerplate(lang) });
    }
  };

  // Submit Confirmation View
  if (isFinished) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '2rem' }}>
        <div className="card" style={{ width: '100%', maxWidth: '500px', textAlign: 'center', padding: '3rem 2rem' }}>
          <CheckCircle2 size={80} color="var(--color-success)" style={{ marginBottom: '1.5rem', filter: 'drop-shadow(0 4px 10px rgba(16, 185, 129, 0.2))' }} />
          <h2 style={{ fontSize: '1.8rem', color: '#111827', marginBottom: '0.5rem' }}>Assessment Submitted!</h2>
          <p style={{ color: 'var(--color-text-muted)', marginBottom: '2.5rem' }}>Your answers have been recorded successfully.</p>
          
          <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: '3rem', borderTop: '1px solid var(--color-border)', paddingTop: '2rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span className="stat-title">Total Questions</span>
              <span className="stat-value" style={{ fontSize: '1.25rem' }}>{totalQ}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span className="stat-title">Attempted</span>
              <span className="stat-value" style={{ fontSize: '1.25rem' }}>{Object.keys(answers).length}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span className="stat-title">Time Taken</span>
              <span className="stat-value" style={{ fontSize: '1.25rem' }}>{timeTakenStr}</span>
            </div>
          </div>

          <button 
            className="btn btn-primary" 
            style={{ width: '100%', padding: '1rem' }} 
            onClick={handleFinalSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Processing Results...' : 'View Results'} <ChevronRight size={18} />
          </button>
        </div>
      </div>
    );
  }

  if (!currentQ) return <div>Loading questions...</div>;

  const qType = currentQ.type?.toUpperCase() || 'MCQ';
  const isCoding = qType === 'CODING';
  const isMCQorTF = qType === 'MCQ' || qType === 'TRUE/FALSE' || qType === 'TRUE/FALSE QUESTION';
  const isFillIn = qType === 'FILL IN THE BLANKS' || qType === 'FILL-IN-THE-BLANK';
  const isShortAnswer = qType === 'SHORT ANSWER';
  const isScenarioBased = qType === 'SCENARIO BASED';
  const isDSA = assessment.type === 'DSA';

  return (
    <div style={{ maxWidth: isDSA ? '1200px' : '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: '600' }}>
          <ArrowLeft size={20} />
          <span>Assessment</span>
        </div>
        <div className="timer-badge">
          <Clock size={16} />
          Time Left: {formatTime(timeLeft)}
        </div>
      </div>

      {/* Main Card */}
      <div className="card" style={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
          <span style={{ fontWeight: '600', color: 'var(--color-text-muted)' }}>Question {currentIdx + 1} of {totalQ}</span>
          {!isDSA && (
            <span className="badge badge-tag" style={{ borderRadius: '50px', fontSize: '0.7rem' }}>
              {currentQ.type || 'MCQ'}
            </span>
          )}
          {isDSA && (
            <span className="badge badge-tag" style={{ borderRadius: '50px', fontSize: '0.7rem', background: '#f5f3ff', color: '#6a4cff' }}>
              {currentQ.difficulty || 'Easy'}
            </span>
          )}
        </div>

        {/* Dynamic Area: MCQ vs Coding vs DSA Split */}
        <div style={{ flexGrow: 1, display: 'flex', flexDirection: isDSA ? 'row' : 'column', gap: isDSA ? '2rem' : '0' }}>
          
          {/* Left Pane for DSA */}
          {isDSA && (
            <div style={{ flex: '1', display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--color-border)', paddingRight: '2rem' }}>
              <h3 style={{ fontSize: '1.25rem', color: '#111827', marginBottom: '1rem', fontWeight: 'bold' }}>
                {currentQ.title || currentQ.question}
              </h3>
              <div style={{ fontSize: '0.95rem', color: 'var(--color-text-muted)', whiteSpace: 'pre-wrap', lineHeight: '1.6', flexGrow: 1 }}>
                {currentQ.problemStatement || currentQ.description || "Given the problem statement, write a solution below."}
                
                {currentQ.examples && (
                  <div style={{ marginTop: '1.5rem' }}>
                    <strong style={{ color: '#111827' }}>Examples:</strong>
                    <pre style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', marginTop: '0.5rem', border: '1px solid #e2e8f0', whiteSpace: 'pre-wrap', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
                      {Array.isArray(currentQ.examples) ? currentQ.examples.join('\n\n') : currentQ.examples}
                    </pre>
                  </div>
                )}
                
                {currentQ.constraints && (
                  <div style={{ marginTop: '1.5rem' }}>
                    <strong style={{ color: '#111827' }}>Constraints:</strong>
                    <ul style={{ marginTop: '0.5rem', marginLeft: '1.5rem', color: '#475569' }}>
                      {Array.isArray(currentQ.constraints) 
                        ? currentQ.constraints.map((c, i) => <li key={i}>{c}</li>) 
                        : <li>{currentQ.constraints}</li>}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Right Pane or Standard Layout */}
          <div style={{ flex: isDSA ? '1' : 'auto', display: 'flex', flexDirection: 'column' }}>
            {!isDSA && (
              <h3 style={{ fontSize: '1.15rem', color: '#111827', marginBottom: '1.5rem', lineHeight: '1.6' }}>
                {currentQ.question}
              </h3>
            )}

            {isMCQorTF && (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {currentQ.options?.map((opt, i) => (
                  <div 
                    key={i} 
                    className={`radio-option ${answers[currentIdx] === opt ? 'selected' : ''}`}
                    onClick={() => handleSelectOption(opt)}
                  >
                    <div style={{ 
                      width: '18px', height: '18px', borderRadius: '50%', 
                      border: `2px solid ${answers[currentIdx] === opt ? 'var(--color-primary)' : 'var(--color-border)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      {answers[currentIdx] === opt && <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--color-primary)' }} />}
                    </div>
                    <span style={{ fontWeight: '500', color: answers[currentIdx] === opt ? '#111827' : 'var(--color-text-muted)' }}>
                      {opt}
                    </span>
                  </div>
                ))}
              </div>
            )}
            
            {isFillIn && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Type your answer below:</p>
                <input 
                  type="text" 
                  value={answers[currentIdx] || ''}
                  onChange={handleCodeChange}
                  placeholder="Your answer..."
                  style={{ width: '100%', padding: '1rem', borderRadius: '10px', border: '2px solid var(--color-border)', outline: 'none', fontSize: '1rem' }}
                />
              </div>
            )}

            {isShortAnswer && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem', flexGrow: 1 }}>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Write a short explanation (1-3 sentences):</p>
                <textarea 
                  value={answers[currentIdx] || ''}
                  onChange={handleCodeChange}
                  placeholder="Explain your reasoning here..."
                  style={{ width: '100%', flexGrow: 1, minHeight: '150px', padding: '1rem', borderRadius: '10px', border: '2px solid var(--color-border)', outline: 'none', fontSize: '1rem', resize: 'vertical' }}
                />
              </div>
            )}

            {isScenarioBased && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem', flexGrow: 1 }}>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Provide your analysis for the scenario:</p>
                <textarea 
                  value={answers[currentIdx] || ''}
                  onChange={handleCodeChange}
                  placeholder="Your analysis..."
                  style={{ width: '100%', flexGrow: 1, minHeight: '200px', padding: '1rem', borderRadius: '10px', border: '2px solid var(--color-border)', outline: 'none', fontSize: '1rem', resize: 'vertical', background: '#f8fafc' }}
                />
              </div>
            )}

            {isCoding && (
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                {!isDSA && (
                  <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>
                    <strong>Constraints:</strong>
                    <ul style={{ marginLeft: '1.5rem', marginTop: '0.5rem' }}>
                      <li>Code must be written in JavaScript.</li>
                      <li>Ensure syntax is correct and logic handles edge cases.</li>
                    </ul>
                  </div>
                )}
                
                <div style={{ 
                  background: '#111827', borderRadius: '8px', border: '1px solid #374151', 
                  overflow: 'hidden', display: 'flex', flexDirection: 'column', flexGrow: 1, minHeight: '400px',
                  marginTop: isDSA ? '0' : '1rem'
                }}>
                  <div style={{ padding: '0.5rem 1rem', background: '#1f2937', color: '#9ca3af', fontSize: '0.75rem', fontWeight: '600', borderBottom: '1px solid #374151', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <select 
                      value={selectedLanguage}
                      onChange={handleLanguageChange}
                      style={{ background: '#111827', color: '#f8f8f2', border: '1px solid #374151', padding: '0.2rem 0.5rem', borderRadius: '4px', outline: 'none', cursor: 'pointer' }}
                    >
                      {languages.map(lang => (
                        <option key={lang} value={lang}>{lang}</option>
                      ))}
                    </select>
                    <span style={{cursor: 'pointer'}}>✕</span>
                  </div>
                  <textarea 
                    value={answers[currentIdx] || currentQ.functionSignature || currentQ.signature || ''}
                    onChange={handleCodeChange}
                    placeholder="// Write your code here..."
                    style={{
                      width: '100%', flexGrow: 1, background: 'transparent', border: 'none', color: '#f8f8f2',
                      fontFamily: 'var(--font-mono)', fontSize: '0.95rem', padding: '1.5rem', resize: 'none',
                      outline: 'none', lineHeight: '1.6'
                    }}
                    spellCheck="false"
                  />
                </div>

                <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                  <input 
                    type="text" 
                    placeholder="Enter custom input" 
                    style={{ flexGrow: 1, padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--color-border)', outline: 'none' }}
                  />
                  <button className="btn btn-outline" style={{ gap: '0.5rem' }}><Play size={16} /> Run Code</button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--color-border)' }}>
          <button className="btn btn-outline">Mark for Review</button>
          
          <button className="btn btn-primary" onClick={handleNext}>
            {currentIdx < totalQ - 1 ? (
              <>Next Question <ChevronRight size={18} /></>
            ) : (
              'Submit Assessment'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
